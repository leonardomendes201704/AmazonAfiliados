import { z } from "zod";

export const asinSchema = z.string().regex(/^[A-Z0-9]{10}$/);
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const count = z.number().int().nonnegative();
const id = z.number().int().positive();
const date = z.iso.datetime({ offset: true });
const text = z.string().min(1);
export const problemSchema = z.object({
  type: text,
  title: text,
  status: z.number().int().min(400).max(599),
  detail: z.string(),
});
export const categorySchema = z.object({ slug: slugSchema, nome: text, icone: text, total: count });
export const categoriesSchema = z.array(categorySchema);
export const priceSchema = z.object({
  centavos: count,
  listaCentavos: count.nullable(),
  descontoPct: z.number().int().min(0).max(100).nullable(),
  coletadoEm: date,
});
export const productSchema = z.object({
  asin: asinSchema,
  slug: slugSchema,
  titulo: text.max(60),
  imagemUrl: z.url(),
  nota: z.number().min(0).max(5).nullable(),
  avaliacoes: count.nullable(),
  ranking: id,
  preco: priceSchema.nullable(),
  selo: z.enum(["mais-vendido", "desconto"]).nullable(),
  destaque: z.boolean(),
  linkSaida: z.string().regex(/^\/r\/[A-Z0-9]{10}$/),
});
export const facetsSchema = z.object({ maisVendidos: count, emOferta: count, bemAvaliados: count });
export const productsSchema = z.object({
  itens: z.array(productSchema),
  total: count,
  pagina: id,
  facetas: facetsSchema,
  atualizadoEm: date.nullable(),
});
export const publicConfigSchema = z.object({
  mostrarPreco: z.boolean(),
  atualizadoEm: date.nullable(),
});
export const healthSchema = z.object({
  status: z.literal("ok"),
  db: z.literal("ok"),
  ultimaColeta: date.nullable(),
  versao: text,
});
export const filterSchema = z.enum(["mais-vendidos", "em-oferta", "bem-avaliados"]);
export const productQuerySchema = z
  .object({
    categoria: slugSchema.optional(),
    busca: z.string().optional(),
    filtros: z
      .string()
      .transform((value) => (value === "" ? [] : value.split(",")))
      .pipe(z.array(filterSchema))
      .optional(),
    precoMin: z.coerce.number().int().nonnegative().optional(),
    precoMax: z.coerce.number().int().nonnegative().optional(),
    pagina: z.coerce.number().int().positive().default(1),
    porPagina: z.coerce.number().int().min(1).max(60).default(20),
  })
  .refine((v) => v.precoMin === undefined || v.precoMax === undefined || v.precoMin <= v.precoMax, {
    message: "Faixa de preço inválida",
  });

export const loginSchema = z.object({ email: z.email(), senha: text });
export const adminMeSchema = z.object({ email: z.email() });
export const logoutSchema = z.void();
export const paginationSchema = z.object({ pagina: z.coerce.number().int().positive().default(1) });
export const adminProductQuerySchema = paginationSchema.extend({
  busca: z.string().optional(),
  categoria: slugSchema.optional(),
});
export const productPatchSchema = z
  .object({
    isVisible: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    displayTitle: text.max(60).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0);
export const adminProductSchema = productSchema.extend({
  id,
  isVisible: z.boolean(),
  isFeatured: z.boolean(),
  displayTitle: text.max(60),
});
export const adminProductsSchema = z.object({
  itens: z.array(adminProductSchema),
  total: count,
  pagina: id,
});
export const adminCategoryInputSchema = z.object({
  slug: slugSchema,
  nome: text,
  icone: text,
  amazonUrl: z.url(),
  ordem: z.number().int(),
  ativa: z.boolean(),
});
export const adminCategoryPatchSchema = adminCategoryInputSchema
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0);
export const adminCategorySchema = adminCategoryInputSchema.extend({ id });
export const adminCategoriesSchema = z.array(adminCategorySchema);
export const scrapeErrorSchema = z.object({ category: text, kind: text, message: text });
export const scrapeRunSchema = z.object({
  id,
  trigger: z.enum(["cron", "manual", "cli"]),
  status: z.enum(["running", "ok", "partial", "blocked", "error"]),
  startedAt: date,
  finishedAt: date.nullable(),
  categoriesTotal: count,
  categoriesOk: count,
  itemsFound: count,
  httpRequests: count,
  errors: z.array(scrapeErrorSchema),
});
export const scrapeRunsSchema = z.object({
  itens: z.array(scrapeRunSchema),
  total: count,
  pagina: id,
});
export const scrapeRequestSchema = z
  .object({ categoria: slugSchema.optional(), forcar: z.boolean().optional() })
  .strict();
export const scrapeAcceptedSchema = z.object({ jobId: text });
export const adminConfigSchema = z.object({
  mostrarPreco: z.boolean(),
  coletaPausada: z.boolean(),
});
export const adminConfigPatchSchema = adminConfigSchema
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0);
export const clickQuerySchema = z
  .object({
    de: z.iso.date(),
    ate: z.iso.date(),
    agrupar: z.enum(["produto", "categoria", "campanha", "origem", "dia"]),
  })
  .refine((v) => v.de <= v.ate);
export const clickReportSchema = z.array(z.object({ chave: z.string().nullable(), total: count }));
export const creativeRequestSchema = z.object({
  format: z.enum(["feed", "story"]),
  title: text,
  productIds: z.array(id).min(1),
  utmCampaign: text,
  utmContent: text,
});
export const creativeSchema = creativeRequestSchema.extend({ id, filePath: text, createdAt: date });
export const creativesSchema = z.array(creativeSchema);

export type Product = z.infer<typeof productSchema>;
export type ProductsResponse = z.infer<typeof productsSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Price = z.infer<typeof priceSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
export type AdminProduct = z.infer<typeof adminProductSchema>;
export type AdminCategory = z.infer<typeof adminCategorySchema>;
export type ScrapeRun = z.infer<typeof scrapeRunSchema>;
export type Creative = z.infer<typeof creativeSchema>;
