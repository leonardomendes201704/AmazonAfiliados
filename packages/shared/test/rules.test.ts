import { expect, it } from "vitest";
import {
  badge,
  bestRank,
  discountPct,
  facets,
  isPriceVisible,
  starsFloorHalf,
} from "../src/index.js";

it.each([
  [4.7, 4.5],
  [4.8, 4.5],
  [4.9, 4.5],
  [5, 5],
  [0, 0],
  [null, 0],
  [-1, 0],
  [6, 5],
] as const)("arredonda estrelas %s", (input, output) => expect(starsFloorHalf(input)).toBe(output));
it("calcula desconto inteiro e valida preços", () => {
  expect(discountPct(15900, 21990)).toBe(27);
  expect(discountPct(0, 100)).toBe(100);
  expect(discountPct(100, 100)).toBe(0);
  expect(discountPct(null, 100)).toBeNull();
  expect(discountPct(100, 0)).toBeNull();
  expect(discountPct(200, 100)).toBeNull();
  expect(discountPct(50, 100, false)).toBeNull();
  expect(discountPct(1.5, 100)).toBeNull();
});
it("prioriza desconto, usa ranking válido e encontra menor rank", () => {
  expect(badge(1, 5)).toBe("desconto");
  expect(badge(3, 4)).toBe("mais-vendido");
  expect(badge(4, null)).toBeNull();
  expect(badge(0, null)).toBeNull();
  expect(bestRank([10, 3, 5])).toBe(3);
  expect(bestRank([])).toBeNull();
});
it("conta facetas com limites e nulos", () => {
  expect(
    facets([
      { rank: 10, rating: 4.5, reviewsCount: 100, discountPct: 5 },
      { rank: 11, rating: 4.4, reviewsCount: 99, discountPct: 4 },
      { rank: null, rating: null, reviewsCount: null, discountPct: null },
    ]),
  ).toEqual({ maisVendidos: 1, emOferta: 1, bemAvaliados: 1 });
  expect(facets([])).toEqual({ maisVendidos: 0, emOferta: 0, bemAvaliados: 0 });
});
it("oculta preço vencido, futuro ou desligado, mas mantém zero e limite de 24h", () => {
  const now = new Date("2026-11-05T12:00:00Z");
  const date = "2026-11-04T12:00:00Z";
  expect(isPriceVisible(true, 0, date, now)).toBe(true);
  expect(isPriceVisible(true, 1, "2026-11-04T11:59:59Z", now)).toBe(false);
  expect(isPriceVisible(false, 1, date, now)).toBe(false);
  expect(isPriceVisible(true, null, date, now)).toBe(false);
  expect(isPriceVisible(true, 1, null, now)).toBe(false);
  expect(isPriceVisible(true, 1, "2027-01-01T00:00:00Z", now)).toBe(false);
  expect(isPriceVisible(true, 1, "invalid", now)).toBe(false);
});
