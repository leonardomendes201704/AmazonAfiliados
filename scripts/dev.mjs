import concurrently from "concurrently";

const { result } = concurrently([
  { command: "pnpm --filter api dev", name: "api", prefixColor: "blue" },
  { command: "pnpm --filter worker dev", name: "worker", prefixColor: "green" },
  { command: "pnpm --filter web dev", name: "web", prefixColor: "yellow" },
]);

result.catch(() => process.exit(1));
