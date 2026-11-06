import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { buildApp } from "./app.js";

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];
async function createApp(options: Parameters<typeof buildApp>[0] = {}) {
  const app = await buildApp({
    environment: "test",
    version: "test-sha",
    checkHealth: async () => null,
    logDestination: { write: () => true },
    ...options,
  });
  apps.push(app);
  return app;
}
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("bootstrap da API", () => {
  it.each([null, "2026-11-06T12:00:00.000Z"])("saúde com última coleta %s", async (date) => {
    const app = await createApp({ checkHealth: async () => date });
    const response = await app.inject("/api/saude");
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ok",
      db: "ok",
      ultimaColeta: date,
      versao: "test-sha",
    });
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });
  it("banco indisponível retorna 503 sem expor detalhes", async () => {
    const app = await createApp({
      checkHealth: async () => {
        throw new Error("segredo-do-banco");
      },
    });
    const response = await app.inject("/api/saude");
    expect(response.statusCode).toBe(503);
    expect(response.headers["content-type"]).toContain("application/problem+json");
    expect(response.json().status).toBe(503);
    expect(response.body).not.toContain("segredo-do-banco");
  });
  it.each(["production", "test", "development"])("Swagger em %s", async (environment) => {
    const app = await createApp({ environment });
    const response = await app.inject("/api/docs/json");
    expect(response.statusCode).toBe(environment === "development" ? 200 : 404);
    if (environment === "development") {
      expect(response.json().paths["/api/saude"]).toBeDefined();
      const ui = await app.inject("/api/docs/");
      expect(ui.statusCode).toBe(200);
    }
  });
  it("404, validação, serialização e erro interno usam problem+json", async () => {
    const app = await createApp();
    app.post("/validate", { schema: { body: z.object({ count: z.number() }) } }, async () => ({
      ok: true,
    }));
    app.get(
      "/invalid-output",
      { schema: { response: { 200: z.object({ count: z.number() }) } } },
      async () => ({ count: "invalid" as unknown as number }),
    );
    app.get("/failure", async () => {
      throw new Error("segredo-interno");
    });
    for (const [url, status] of [
      ["/missing", 404],
      ["/failure", 500],
      ["/invalid-output", 500],
    ] as const) {
      const response = await app.inject(url);
      expect(response.statusCode).toBe(status);
      expect(response.headers["content-type"]).toContain("application/problem+json");
      expect(response.json().status).toBe(status);
      expect(response.body).not.toContain("segredo-interno");
    }
    const response = await app.inject({
      method: "POST",
      url: "/validate",
      payload: { count: "invalid" },
    });
    expect(response.statusCode).toBe(400);
    expect(response.headers["content-type"]).toContain("application/problem+json");
  });
  it("logs JSON não persistem querystring nem IP", async () => {
    const lines: string[] = [];
    const app = await createApp({
      logDestination: {
        write: (line) => {
          lines.push(line);
          return true;
        },
      },
    });
    await app.inject({ url: "/api/saude?token=segredo-query", remoteAddress: "192.0.2.77" });
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) expect(JSON.parse(line)).toHaveProperty("level");
    expect(lines.join("")).not.toContain("segredo-query");
    expect(lines.join("")).not.toContain("192.0.2.77");
  });
});
