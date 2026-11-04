import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { run } from "../backlog.ts";

const story = (eol: string) =>
  [
    "---",
    "id: US-09",
    "titulo: Teste",
    "status: Todo",
    "---",
    "# US-09",
    "",
    "## Tarefas",
    "",
    "| ID | Tarefa | Agente | Arquivos autorizados | Est. | Status |",
    "|---|---|---|---|---|---|",
    "| T-09.1 | Código | dev-backend | `a.ts` | P | Todo |",
    "| T-09.2 | 👤 Ação | humano | (nenhum arquivo; ação no GitHub) | P | Todo |",
    "",
    "## Evidências",
    "",
    "T-09.1 · 2026-01-01 · pnpm test → 1 ✓ · (sha pendente)",
    "",
  ].join(eol);

const index = (eol: string) =>
  ["| ID | História | Status |", "|---|---|---|", "| US-09 | Teste | Todo |", ""].join(eol);

let root: string;
const hist = () => join(root, "docs/backlog/historias/US-09.md");
const idx = () => join(root, "docs/backlog/BACKLOG.md");

function setup(eol = "\n") {
  mkdirSync(join(root, "docs/backlog/historias"), { recursive: true });
  writeFileSync(hist(), story(eol));
  writeFileSync(idx(), index(eol));
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "backlog-"));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("backlog", () => {
  it("status lista histórias e progresso", () => {
    setup();
    const r = run(["status"], root);
    expect(r.code).toBe(0);
    expect(r.out).toContain("US-09 Todo 0/2");
  });

  it("iniciar muda tarefa, história e índice", () => {
    setup();
    expect(run(["iniciar", "T-09.1"], root).code).toBe(0);
    expect(readFileSync(hist(), "utf8")).toContain("status: Doing");
    expect(readFileSync(hist(), "utf8")).toContain("| P | Doing |");
    expect(readFileSync(idx(), "utf8")).toContain("| US-09 | Teste | Doing |");
  });

  it("concluir grava o sha e fecha a história quando tudo está Done", () => {
    setup();
    run(["iniciar", "T-09.1"], root);
    expect(run(["concluir", "T-09.1", "--commit", "abc1234"], root).code).toBe(0);
    let h = readFileSync(hist(), "utf8");
    expect(h).toContain("→ 1 ✓ · abc1234");
    expect(h).not.toContain("(sha pendente)");
    expect(h).toContain("status: Doing");
    run(["concluir", "T-09.2", "--commit", "abc1234"], root);
    h = readFileSync(hist(), "utf8");
    expect(h).toContain("status: Done");
    expect(readFileSync(idx(), "utf8")).toContain("| US-09 | Teste | Done |");
  });

  it("concluir sem --commit falha", () => {
    setup();
    const r = run(["concluir", "T-09.1"], root);
    expect(r.code).toBe(1);
    expect(r.out).toContain("--commit");
  });

  it("bloquear grava o motivo na seção Bloqueios", () => {
    setup();
    const r = run(["bloquear", "T-09.2", "aguardando", "DNS"], root);
    expect(r.code).toBe(0);
    const h = readFileSync(hist(), "utf8");
    expect(h).toContain("| P | Blocked |");
    expect(h).toMatch(/## Bloqueios\n\n- T-09\.2 · \d{4}-\d{2}-\d{2} · aguardando DNS/);
    expect(h.indexOf("## Bloqueios")).toBeLessThan(h.indexOf("## Evidências"));
  });

  it("preserva CRLF", () => {
    setup("\r\n");
    run(["iniciar", "T-09.1"], root);
    const h = readFileSync(hist(), "utf8");
    expect(h.replace(/\r\n/g, "")).not.toContain("\n");
    expect(h).toContain("status: Doing\r\n");
    expect(readFileSync(idx(), "utf8")).toContain("| Doing |\r\n");
  });

  it("formato inválido falha com mensagem", () => {
    setup();
    writeFileSync(hist(), story("\n").replace("| P | Todo |\n| T-09.2", "| P | Feito |\n| T-09.2"));
    const r = run(["status"], root);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/status "Feito" inválido/);
  });

  it("frontmatter ausente e tarefa inexistente falham", () => {
    setup();
    expect(run(["iniciar", "T-09.7"], root).out).toContain("não existe");
    writeFileSync(hist(), "# sem frontmatter\n");
    expect(run(["iniciar", "T-09.1"], root).out).toContain("frontmatter ausente");
    expect(run(["iniciar", "xx"], root).code).toBe(1);
  });
});
