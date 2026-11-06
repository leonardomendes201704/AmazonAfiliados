export function starsFloorHalf(rating: number | null | undefined): number {
  return rating == null || !Number.isFinite(rating)
    ? 0
    : Math.floor(Math.max(0, Math.min(5, rating)) * 2) / 2;
}
export function discountPct(
  price: number | null | undefined,
  list: number | null | undefined,
  sameMoment = true,
): number | null {
  if (
    !sameMoment ||
    price == null ||
    list == null ||
    !Number.isSafeInteger(price) ||
    !Number.isSafeInteger(list) ||
    price < 0 ||
    list <= 0 ||
    price > list
  )
    return null;
  return Math.floor(((list - price) * 100) / list);
}
export function badge(
  rank: number | null,
  discount: number | null,
): "desconto" | "mais-vendido" | null {
  if (discount != null && discount >= 5) return "desconto";
  return rank != null && rank >= 1 && rank <= 3 ? "mais-vendido" : null;
}
export interface FacetItem {
  rank: number | null;
  rating: number | null;
  reviewsCount: number | null;
  discountPct: number | null;
}
export function facets(items: readonly FacetItem[]) {
  return items.reduce(
    (result, item) => {
      if (item.rank != null && item.rank >= 1 && item.rank <= 10) result.maisVendidos++;
      if (item.discountPct != null && item.discountPct >= 5) result.emOferta++;
      if (
        item.rating != null &&
        item.rating >= 4.5 &&
        item.reviewsCount != null &&
        item.reviewsCount >= 100
      )
        result.bemAvaliados++;
      return result;
    },
    { maisVendidos: 0, emOferta: 0, bemAvaliados: 0 },
  );
}
export function isPriceVisible(
  showPrice: boolean,
  price: number | null,
  collectedAt: Date | string | null,
  now: Date = new Date(),
  maxAgeHours = 24,
): boolean {
  if (
    !showPrice ||
    price == null ||
    !Number.isSafeInteger(price) ||
    price < 0 ||
    collectedAt == null ||
    !Number.isFinite(maxAgeHours) ||
    maxAgeHours < 0
  )
    return false;
  const age = now.getTime() - new Date(collectedAt).getTime();
  return Number.isFinite(age) && age >= 0 && age <= maxAgeHours * 3600000;
}
export function bestRank(ranks: readonly number[]): number | null {
  const valid = ranks.filter((rank) => Number.isInteger(rank) && rank > 0);
  return valid.length ? Math.min(...valid) : null;
}
