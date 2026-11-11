import { fileURLToPath } from "node:url";
import { eq, like, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, expect, it } from "vitest";
import {
  categories,
  category_products,
  createDatabase,
  type Database,
  products,
  settings,
} from "../src/index.js";
import { seed } from "../src/seed.js";

const url = process.env.DATABASE_URL_TEST;
if (!url) throw new Error("DATABASE_URL_TEST requisitada para os testes de integração.");
if (!new URL(url).pathname.endsWith("/amazonafiliados_test"))
  throw new Error("Use somente o banco amazonafiliados_test.");
const { db, client } = createDatabase(url);
beforeAll(async () => {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)),
  });
}, 60_000);
afterAll(async () => {
  await client.end();
});
it("seed transacional repetível preserva edições, vínculos e configuração", async () => {
  const rollback = new Error("rollback de teste");
  try {
    await db.transaction(async (tx) => {
      const database = tx as unknown as Database;
      await seed(database, false);
      expect(await tx.select().from(categories)).toHaveLength(7);
      const initial = await tx.select().from(products).where(like(products.asin, "SEED%"));
      expect(initial).toHaveLength(10);
      expect(
        initial.every((p) => p.price_collected_at !== null && p.display_title.length <= 60),
      ).toBe(true);
      expect(await tx.select().from(category_products)).toHaveLength(10);
      await tx
        .update(products)
        .set({ display_title: "Editado pelo admin", is_visible: false })
        .where(eq(products.asin, "SEED000001"));
      await tx.update(settings).set({ value: true }).where(eq(settings.key, "show_price"));
      await seed(database, false);
      expect(await tx.select().from(products).where(like(products.asin, "SEED%"))).toHaveLength(10);
      expect(await tx.select().from(category_products)).toHaveLength(10);
      const [edited] = await tx.select().from(products).where(eq(products.asin, "SEED000001"));
      expect(edited?.display_title).toBe("Editado pelo admin");
      expect(edited?.is_visible).toBe(false);
      const [setting] = await tx.select().from(settings).where(eq(settings.key, "show_price"));
      expect(setting?.value).toBe(true);
      const result = await tx.execute(
        sql`select count(*)::int as total from information_schema.tables where table_schema = 'public'`,
      );
      expect(result[0]?.total).toBe(10);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}, 20000);
