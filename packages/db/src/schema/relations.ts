import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { categories, products } from "./schema.js";

export const category_products = pgTable(
  "category_products",
  {
    category_id: integer("category_id")
      .references(() => categories.id)
      .notNull(),
    product_id: integer("product_id")
      .references(() => products.id)
      .notNull(),
    rank: integer("rank").notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.category_id, table.product_id] }),
    rankIndex: index("category_products_category_rank_idx").on(table.category_id, table.rank),
  }),
);

export const price_history = pgTable("price_history", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  product_id: integer("product_id")
    .references(() => products.id)
    .notNull(),
  price_cents: integer("price_cents").notNull(),
  list_price_cents: integer("list_price_cents"),
  collected_at: timestamp("collected_at", { withTimezone: true }).notNull(),
});

export const scrape_runs = pgTable("scrape_runs", {
  id: serial("id").primaryKey(),
  trigger: text("trigger").notNull(),
  status: text("status").notNull(),
  started_at: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finished_at: timestamp("finished_at", { withTimezone: true }),
  categories_total: integer("categories_total"),
  categories_ok: integer("categories_ok"),
  items_found: integer("items_found"),
  http_requests: integer("http_requests"),
  errors: jsonb("errors")
    .$type<Array<{ category: string; kind: string; message: string }>>()
    .notNull()
    .default([]),
});

export const clicks = pgTable(
  "clicks",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    product_id: integer("product_id")
      .references(() => products.id)
      .notNull(),
    category_slug: text("category_slug"),
    utm_source: text("utm_source"),
    utm_medium: text("utm_medium"),
    utm_campaign: text("utm_campaign"),
    utm_content: text("utm_content"),
    creative_id: integer("creative_id"),
    referrer_host: text("referrer_host"),
    is_bot: boolean("is_bot").notNull().default(false),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("clicks_created_at_idx").on(table.created_at),
    index("clicks_product_created_at_idx").on(table.product_id, table.created_at),
  ],
);

export const rankings = pgTable(
  "rankings",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    run_id: integer("run_id")
      .notNull()
      .references(() => scrape_runs.id),
    category_id: integer("category_id")
      .notNull()
      .references(() => categories.id),
    product_id: integer("product_id")
      .notNull()
      .references(() => products.id),
    rank: integer("rank").notNull(),
    collected_at: timestamp("collected_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("rankings_product_collected_at_idx").on(table.product_id, table.collected_at)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const admin_sessions = pgTable("admin_sessions", {
  id: text("id").primaryKey(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  last_seen_at: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
});

export const creatives = pgTable("creatives", {
  id: serial("id").primaryKey(),
  format: text("format", { enum: ["feed", "story"] }).notNull(),
  title: text("title").notNull(),
  product_ids: integer("product_ids").array().notNull(),
  file_path: text("file_path").notNull(),
  utm_campaign: text("utm_campaign").notNull(),
  utm_content: text("utm_content").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
