import { expect, it } from "vitest";
import * as s from "../src/index.js";

const date = "2026-11-04T12:00:00Z";
const product = {
  asin: "B09B8V1LZ3",
  slug: "echo-dot",
  titulo: "Echo Dot",
  imagemUrl: "https://example.invalid/a.png",
  nota: 4.8,
  avaliacoes: 100,
  ranking: 1,
  preco: null,
  selo: "mais-vendido",
  destaque: false,
  linkSaida: "/r/B09B8V1LZ3",
};
it("valida respostas públicas e preço nulo/zero", () => {
  expect(
    s.productsSchema.safeParse({
      itens: [product],
      total: 1,
      pagina: 1,
      facetas: { maisVendidos: 1, emOferta: 0, bemAvaliados: 1 },
      atualizadoEm: date,
    }).success,
  ).toBe(true);
  expect(
    s.priceSchema.safeParse({
      centavos: 0,
      listaCentavos: null,
      descontoPct: null,
      coletadoEm: date,
    }).success,
  ).toBe(true);
  expect(
    s.categoriesSchema.parse([{ slug: "casa", nome: "Casa", icone: "house", total: 0 }]),
  ).toHaveLength(1);
  expect(s.publicConfigSchema.parse({ mostrarPreco: false, atualizadoEm: null }).mostrarPreco).toBe(
    false,
  );
  expect(
    s.healthSchema.safeParse({ status: "ok", db: "ok", ultimaColeta: null, versao: "dev" }).success,
  ).toBe(true);
});
it("rejeita ASIN, preço, rating e paginação inválidos", () => {
  expect(s.productSchema.safeParse({ ...product, asin: "bad" }).success).toBe(false);
  expect(s.productSchema.safeParse({ ...product, nota: 5.1 }).success).toBe(false);
  expect(
    s.priceSchema.safeParse({
      centavos: -1,
      listaCentavos: null,
      descontoPct: null,
      coletadoEm: date,
    }).success,
  ).toBe(false);
  expect(s.productQuerySchema.parse({})).toMatchObject({ pagina: 1, porPagina: 20 });
  expect(s.productQuerySchema.safeParse({ porPagina: 61 }).success).toBe(false);
  expect(s.productQuerySchema.safeParse({ precoMin: 100, precoMax: 1 }).success).toBe(false);
  expect(s.productQuerySchema.parse({ filtros: "mais-vendidos,em-oferta" }).filtros).toHaveLength(
    2,
  );
});
it("valida contratos admin e rejeita patches vazios/desconhecidos", () => {
  expect(s.loginSchema.safeParse({ email: "admin@example.com", senha: "secret" }).success).toBe(
    true,
  );
  expect(s.adminMeSchema.parse({ email: "a@example.com" }).email).toBe("a@example.com");
  expect(s.logoutSchema.safeParse(undefined).success).toBe(true);
  expect(s.productPatchSchema.safeParse({}).success).toBe(false);
  expect(s.productPatchSchema.safeParse({ price: 0 }).success).toBe(false);
  expect(s.productPatchSchema.parse({ isVisible: false }).isVisible).toBe(false);
  expect(
    s.adminProductsSchema.safeParse({
      itens: [{ ...product, id: 1, isVisible: true, isFeatured: false, displayTitle: "Echo" }],
      total: 1,
      pagina: 1,
    }).success,
  ).toBe(true);
  expect(
    s.adminCategoriesSchema.safeParse([
      {
        id: 1,
        slug: "casa",
        nome: "Casa",
        icone: "house",
        amazonUrl: "https://example.invalid",
        ordem: 1,
        ativa: true,
      },
    ]).success,
  ).toBe(true);
  expect(s.adminCategoryPatchSchema.safeParse({ ativa: false }).success).toBe(true);
  expect(
    s.scrapeRunsSchema.safeParse({
      itens: [
        {
          id: 1,
          trigger: "cli",
          status: "ok",
          startedAt: date,
          finishedAt: date,
          categoriesTotal: 1,
          categoriesOk: 1,
          itemsFound: 10,
          httpRequests: 1,
          errors: [],
        },
      ],
      total: 1,
      pagina: 1,
    }).success,
  ).toBe(true);
  expect(s.scrapeRequestSchema.parse({ forcar: true }).forcar).toBe(true);
  expect(s.scrapeAcceptedSchema.parse({ jobId: "job-1" }).jobId).toBe("job-1");
  expect(s.adminConfigSchema.safeParse({ mostrarPreco: true, coletaPausada: false }).success).toBe(
    true,
  );
  expect(s.adminConfigPatchSchema.safeParse({}).success).toBe(false);
  expect(
    s.clickQuerySchema.safeParse({ de: "2026-11-05", ate: "2026-11-01", agrupar: "dia" }).success,
  ).toBe(false);
  expect(s.clickReportSchema.parse([{ chave: null, total: 0 }])).toHaveLength(1);
  expect(
    s.creativesSchema.safeParse([
      {
        id: 1,
        format: "feed",
        title: "Teste",
        productIds: [1],
        filePath: "test.png",
        utmCampaign: "teste",
        utmContent: "a",
        createdAt: date,
      },
    ]).success,
  ).toBe(true);
  expect(
    s.problemSchema.safeParse({
      type: "about:blank",
      title: "Inválido",
      status: 400,
      detail: "Campo inválido",
    }).success,
  ).toBe(true);
});
