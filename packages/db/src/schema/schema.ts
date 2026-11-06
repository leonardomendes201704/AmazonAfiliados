import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  amazon_url: text("amazon_url").notNull(),
  sort_order: integer("sort_order").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  last_scraped_at: timestamp("last_scraped_at", { withTimezone: true }),
  last_status: text("last_status"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  asin: varchar("asin", { length: 10 }).unique().notNull(),
  title: text("title").notNull(),
  display_title: varchar("display_title", { length: 60 }).notNull(),
  slug: text("slug").unique().notNull(),
  image_url: text("image_url").notNull(),
  rating: numeric("rating", { precision: 2, scale: 1 }),
  reviews_count: integer("reviews_count"),
  price_cents: integer("price_cents"),
  list_price_cents: integer("list_price_cents"),
  price_collected_at: timestamp("price_collected_at", { withTimezone: true }),
  is_visible: boolean("is_visible").default(true).notNull(),
  is_featured: boolean("is_featured").default(false).notNull(),
  first_seen_at: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
  last_seen_at: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
