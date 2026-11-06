import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { healthSchema, problemSchema } from "../../../../packages/shared/src/schemas/index.js";

export const registerHealthRoute: FastifyPluginAsyncZod<{
  checkHealth: () => Promise<string | null>;
  version: string;
}> = async (app, { checkHealth, version }) => {
  app.get(
    "/api/saude",
    { schema: { response: { 200: healthSchema, 503: problemSchema } } },
    async (request, reply) => {
      reply.header("Cache-Control", "no-store");
      let ultimaColeta: string | null;
      try {
        ultimaColeta = await checkHealth();
      } catch (error) {
        request.log.error({ err: error }, "Falha na verificação do banco");
        return reply.code(503).type("application/problem+json").send({
          type: "about:blank",
          title: "Serviço indisponível",
          status: 503,
          detail: "O banco de dados está indisponível.",
        });
      }
      return reply.code(200).send({ status: "ok", db: "ok", ultimaColeta, versao: version });
    },
  );
};
