import { buildApp } from "./app.js";

export async function startServer() {
  const app = await buildApp();
  const port = Number.parseInt(process.env.API_PORT ?? process.env.PORT ?? "3000", 10);
  try {
    await app.listen({ port, host: "0.0.0.0" });
  } catch (error) {
    await app.close();
    throw error;
  }
  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  return app;
}
