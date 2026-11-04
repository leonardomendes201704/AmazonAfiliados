import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    test: {
      name: "scripts",
      include: ["scripts/test/**/*.test.ts"],
    },
  },
  {
    test: {
      name: "pacotes",
      include: [
        "apps/*/src/**/*.test.ts",
        "packages/*/src/**/*.test.ts",
        "apps/*/test/**/*.test.ts",
        "packages/*/test/**/*.test.ts",
      ],
    },
  },
]);
