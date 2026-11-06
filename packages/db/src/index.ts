import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as related from "./schema/relations.js";
import * as tables from "./schema/schema.js";

export function createDatabase(url: string) {
  const client = postgres(url, { max: 5 });
  return { client, db: drizzle(client, { schema: { ...tables, ...related } }) };
}
export type Database = ReturnType<typeof createDatabase>["db"];
export * from "./schema/relations.js";
export * from "./schema/schema.js";
