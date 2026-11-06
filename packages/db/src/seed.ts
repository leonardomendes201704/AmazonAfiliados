import { pathToFileURL } from "node:url";
import { sql } from "drizzle-orm";
import { createDatabase, type Database } from "./index.js";
import { category_products, settings } from "./schema/relations.js";
import { categories, products } from "./schema/schema.js";

const categoryData = [
  ["eletronicos", "Eletrônicos", "monitor"],
  ["casa", "Casa e Decoração", "house"],
  ["cozinha", "Cozinha", "cooking-pot"],
  ["acessorios", "Acessórios", "headphones"],
  ["cuidados", "Cuidados Pessoais", "heart"],
  ["esporte", "Esporte e Lazer", "dumbbell"],
  ["livros", "Livros", "book-open"],
] as const;
const productData = [
  ["Echo Dot (5ª Geração) – Smart Speaker com Alexa", "eletronicos", "4.8", 126340, 32900, null],
  ["Fone de Ouvido JBL Tune 520BT – Bluetooth", "acessorios", "4.7", 83912, 15900, 21990],
  ["Air Fryer Midea 4L – 127V, Preta", "cozinha", "4.8", 62781, 37990, null],
  ["Cafeteira Elétrica Oster Inox – 30 Xícaras", "cozinha", "4.7", 28560, 23990, 29990],
  ["Fire TV Stick HD – Streaming com Alexa", "eletronicos", "4.8", 118436, 29900, null],
  ["Smartband Xiaomi Mi Band 8 – Monitoramento de Saúde", "cuidados", "4.7", 49320, 24990, 30490],
  ["Garrafa Térmica Stanley Classic 950 ml", "esporte", "4.9", 37805, 29900, null],
  ['Ring Light 10" com Tripé – Iluminação para Vídeos', "eletronicos", "4.7", 19430, 11990, 15990],
  ["Kindle 11ª Geração – Leitor Digital de Livros", "livros", "4.8", 71922, 59900, null],
  ["Robô Aspirador WAP Robot W100 – Bivolt", "casa", "4.7", 16208, 69990, 99990],
] as const;

// Dados fictícios só para desenvolvimento: nunca substituem dados coletados ou editados.
export async function seed(db: Database, showPrice = true) {
  await db.transaction(async (tx) => {
    await tx
      .insert(categories)
      .values(
        categoryData.map(([slug, name, icon], i) => ({
          slug,
          name,
          icon,
          amazon_url: `https://example.invalid/amazon/${slug}`,
          sort_order: i + 1,
        })),
      )
      .onConflictDoNothing();
    const categoryMap = new Map((await tx.select().from(categories)).map((c) => [c.slug, c.id]));
    const ranks = new Map<string, number>();
    for (const [i, [title, category, rating, reviews, price, list]] of productData.entries()) {
      const asin = `SEED${String(i + 1).padStart(6, "0")}`;
      const rank = (ranks.get(category) ?? 0) + 1;
      ranks.set(category, rank);
      const [inserted] = await tx
        .insert(products)
        .values({
          asin,
          title,
          display_title: title,
          slug: `seed-${i + 1}-${asin.toLowerCase()}`,
          image_url: `https://example.invalid/seed/${asin}.svg`,
          rating,
          reviews_count: reviews,
          price_cents: price,
          list_price_cents: list,
          price_collected_at: new Date(),
        })
        .onConflictDoNothing()
        .returning({ id: products.id });
      if (inserted) {
        const categoryId = categoryMap.get(category);
        if (!categoryId) throw new Error(`Categoria do seed ausente: ${category}`);
        await tx
          .insert(category_products)
          .values({ category_id: categoryId, product_id: inserted.id, rank });
      }
    }
    await tx
      .insert(settings)
      .values([
        { key: "show_price", value: showPrice },
        { key: "scrape_paused", value: false },
        { key: "scrape_blocked_until", value: sql`'null'::jsonb` },
        { key: "scrape_backoff_level", value: 0 },
      ])
      .onConflictDoNothing();
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Defina DATABASE_URL antes de executar o seed.");
  if (process.env.NODE_ENV === "production")
    throw new Error("Seed fictício não permitido em produção.");
  const value = process.env.SHOW_PRICE_DEFAULT ?? "true";
  if (value !== "true" && value !== "false")
    throw new Error("SHOW_PRICE_DEFAULT deve ser true ou false.");
  const { db, client } = createDatabase(url);
  try {
    await seed(db, value === "true");
    console.log("Seed concluído: 7 categorias e 10 produtos fictícios.");
  } finally {
    await client.end();
  }
}
