import fastify from "fastify";

const server = fastify({ logger: true });

server.get("/health", async () => {
  return { status: "ok" };
});

const start = async () => {
  try {
    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
