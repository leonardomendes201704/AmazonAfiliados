import { describe, expect, it } from "vitest";
import { brl, dataHora, num, parseBRL, shortTitle } from "../src/index.js";

describe("formatadores pt-BR", () => {
  it("formata centavos sem perder o zero", () => {
    expect(brl(123456)).toMatch(/1\.234,56/);
    expect(brl(0)).toMatch(/0,00/);
    expect(brl(null)).toBe("—");
    expect(brl(Number.NaN)).toBe("—");
  });
  it("formata números e ausências", () => {
    expect(num(1234)).toBe("1.234");
    expect(num(0)).toBe("0");
    expect(num(null)).toBe("—");
  });
  it("usa horário de São Paulo e trata datas inválidas", () => {
    expect(dataHora("2026-11-04T12:00:00Z")).toContain("09:00");
    expect(dataHora(null)).toBe("—");
    expect(dataHora("inválida")).toBe("—");
  });
  it.each([
    ["R$ 1.234,56", 123456],
    ["0", 0],
    ["0,01", 1],
    ["12,3", 1230],
    ["R$\u00a0329,00", 32900],
    [null, null],
    ["", null],
    ["1.23", null],
    ["-1,00", null],
    ["1,234", null],
    ["abc", null],
  ] as const)("converte %s em centavos", (input, expected) =>
    expect(parseBRL(input)).toBe(expected),
  );
  it("encurta título sem ultrapassar limite", () => {
    expect(shortTitle("  Olá   mundo ")).toBe("Olá mundo");
    expect(shortTitle(null)).toBe("");
    expect(Array.from(shortTitle("a".repeat(80)))).toHaveLength(60);
    expect(shortTitle("abcdef", 3)).toBe("ab…");
    expect(() => shortTitle("x", 0)).toThrow();
  });
});
