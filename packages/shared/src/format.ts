const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR");
const datetime = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
  timeStyle: "short",
});
export function brl(cents: number | null | undefined): string {
  return cents == null || !Number.isFinite(cents) ? "—" : money.format(cents / 100);
}
export function num(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "—" : number.format(value);
}
export function dataHora(value: Date | string | null | undefined): string {
  if (value == null) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : datetime.format(date);
}
export function parseBRL(value: string | null | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/^\s*R\$\s*/, "").trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(normalized)) return null;
  const [whole = "", fraction = ""] = normalized.replaceAll(".", "").split(",");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(result) ? result : null;
}
export function shortTitle(value: string | null | undefined, maxLength = 60): string {
  if (!Number.isInteger(maxLength) || maxLength < 1)
    throw new RangeError("Limite de título inválido");
  const chars = Array.from((value ?? "").replace(/\s+/g, " ").trim());
  return chars.length <= maxLength
    ? chars.join("")
    : `${chars
        .slice(0, maxLength - 1)
        .join("")
        .trimEnd()}…`;
}
