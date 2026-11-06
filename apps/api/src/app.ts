import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import pino, { type DestinationStream } from "pino";
import { createDatabase } from "../../../packages/db/src/index.js";
import { problemSchema } from "../../../packages/shared/src/schemas/index.js";
import { registerHealthRoute } from "./routes/saude.js";

export interface AppOptions {
  environment?: string;
  logDestination?: DestinationStream;
  databaseUrl?: string;
  version?: string;
  checkHealth?: () => Promise<string | null>;
}

export async function buildApp(options: AppOptions = {}) {
  const app = Fastify({
    loggerInstance: pino(
      {
        serializers: {
          req: (request: { method: string; url: string }) => ({
            method: request.method,
            url: request.url.split("?")[0],
          }),
          err: (error: { name?: string; code?: string }) => ({
            type: error.name,
            code: error.code,
          }),
        },
      },
      options.logDestination,
    ),
  }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler((error, request, reply) => {
    const validation = hasZodFastifySchemaValidationErrors(error);
    const serialization = isResponseSerializationError(error);
    const candidate =
      typeof error === "object" && error !== null && "statusCode" in error
        ? error.statusCode
        : undefined;
    const status =
      !serialization &&
      typeof candidate === "number" &&
      Number.isInteger(candidate) &&
      candidate >= 400 &&
      candidate < 600
        ? candidate
        : 500;
    if (status >= 500) request.log.error({ err: error }, "Falha interna na requisição");
    const title = status >= 500 ? "Erro interno do servidor" : "Requisição inválida";
    return reply
      .code(status)
      .type("application/problem+json")
      .send(
        problemSchema.parse({
          type: "about:blank",
          title,
          status,
          detail: validation ? "Os dados enviados são inválidos." : title,
        }),
      );
  });
  app.setNotFoundHandler((_request, reply) =>
    reply
      .code(404)
      .type("application/problem+json")
      .send(
        problemSchema.parse({
          type: "about:blank",
          title: "Não encontrado",
          status: 404,
          detail: "A rota solicitada não existe.",
        }),
      ),
  );

  await app.register(helmet);
  if ((options.environment ?? process.env.NODE_ENV) === "development") {
    await app.register(swagger, {
      openapi: { info: { title: "Amazon Afiliados API", version: "1.0.0" } },
      transform: jsonSchemaTransform,
    });
    await app.register(swaggerUi, { routePrefix: "/api/docs" });
  }

  let checkHealth = options.checkHealth;
  if (!checkHealth) {
    const url = options.databaseUrl ?? process.env.DATABASE_URL;
    if (!url) {
      await app.close();
      throw new Error("DATABASE_URL não configurada");
    }
    const { client } = createDatabase(url);
    app.addHook("onClose", async () => {
      await client.end({ timeout: 5 });
    });
    checkHealth = async () => {
      const rows = await client<{ ultima_coleta: Date | null }[]>`
        SELECT max(finished_at) AS ultima_coleta FROM scrape_runs WHERE status = 'ok'
      `;
      return rows[0]?.ultima_coleta?.toISOString() ?? null;
    };
  }
  await app.register(registerHealthRoute, {
    checkHealth,
    version: options.version ?? process.env.GIT_SHA ?? "desconhecida",
  });
  return app;
}
