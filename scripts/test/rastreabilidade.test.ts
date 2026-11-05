import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addBlockReason, setEvidenceSha } from "../lib/backlog.ts";
import { generate, parseGitLog, parseRequirements, run } from "../rastreabilidade.ts";

const story = (id: string, n: string, reqs: string, evidence: string[]) =>
  [
    "---",
    `id: ${id}`,
    `titulo: Hist ${n}`,
    "status: Doing",
    `requisitos: [${reqs}]`,
    "---",
    `# ${id}`,
    "",
    "## Tarefas",
    "",
    "| ID | Tarefa | Agente | Arquivos autorizados | Est. | Status |",
    "|---|---|---|---|---|---|",
    `| T-${n}.1 | Código | dev-backend | \`a.ts\` | P | Done |`,
    `| T-${n}.2 | Outra | dev-backend | \`b.ts\` | P | Todo |`,
    "",
    "## Evidências",
    "",
    ...evidence,
    "",
  ].join("\n");

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "rastro-"));
  mkdirSync(join(root, "docs/produto"), { recursive: true });
  mkdirSync(join(root, "docs/backlog/historias"), { recursive: true });
  writeFileSync(
    join(root, "docs/produto/visao.md"),
    [
      "| ID | Requisito | Prioridade |",
      "|---|---|---|",
      "| RF-01 | Lista de mais vendidos. Detalhe | P0 |",
      "| RNF-01 | **Coleta educada:** 1 por vez | P0 |",
      "| RF-02 | Filtros | P0 |",
      "",
    ].join("\n"),
  );
  const h = (f: string, c: string) => writeFileSync(join(root, "docs/backlog/historias", f), c);
  h(
    "US-01.md",
    story("US-01", "01", "RF-01", ["T-01.1 · 2026-01-01 · pnpm test → 1 ✓ · abc1234def"]),
  );
  h("US-02.md", story("US-02", "02", "RNF-01", []));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const commits = parseGitLog("abc1234 feat(T-01.1): algo\n9999999 chore: sem tarefa\n");

describe("parseRequirements", () => {
  it("não corta o título em ':' dentro de crases", () => {
    const m = parseRequirements(
      [
        '| RF-03 | "Ver" leva ao produto, passando por `/r/:asin` | P0 |',
        "| RF-01 | Lista de mais vendidos. Detalhe | P0 |",
        "| RNF-01 | **Coleta educada:** 1 por vez | P0 |",
      ].join("\n"),
    );
    expect(m.get("RF-03")).toBe('"Ver" leva ao produto, passando por `/r/:asin`');
    expect(m.get("RF-01")).toBe("Lista de mais vendidos");
    expect(m.get("RNF-01")).toBe("Coleta educada");
  });
});

describe("rastreabilidade", () => {
  it("liga requisito, história, tarefa, evidência e commit", () => {
    const out = generate(root, commits);
    expect(out).toContain(
      "| RF-01 Lista de mais vendidos | US-01 | T-01.1 (Done) | 2026-01-01 abc1234 | abc1234 |",
    );
    expect(out).toContain(
      "| RNF-01 Coleta educada | US-02 | T-02.1 (Done) | ⚠ sem evidência | - |",
    );
  });

  it("mostra lacunas: requisito sem história e história sem evidência", () => {
    const out = generate(root, commits);
    expect(out).toContain("- RF-02: requisito sem história");
    expect(out).toContain("- US-02: história sem evidência (2 tarefas)");
    expect(out).toContain("- US-01: tarefas sem evidência: T-01.2");
  });

  it("é determinístico", () => {
    const a = run(root, commits);
    const b = run(root, commits);
    expect(a).toBe(b);
    expect(readFileSync(join(root, "docs/rastreabilidade.md"), "utf8")).toBe(a);
  });
});

describe("rastreabilidade: formato real das histórias", () => {
  const MODEL = "<!-- uma linha por tarefa: T-01.1 · AAAA-MM-DD · comando → resultado · <sha> -->";
  const put = (id: string, n: string, reqs: string, ev: string[], human = false) => {
    let t = story(id, n, reqs, [MODEL, ...ev]);
    if (human) {
      t = t.replace(
        `| T-${n}.2 | Outra | dev-backend | \`b.ts\` |`,
        `| T-${n}.2 | 👤 Ação | humano | (nenhum arquivo; GitHub) |`,
      );
    }
    writeFileSync(join(root, "docs/backlog/historias", `${id}.md`), t);
    return t;
  };
  const only = (id: string, n: string, reqs: string, ev: string[], human = false) => {
    rmSync(join(root, "docs/backlog/historias/US-01.md"));
    rmSync(join(root, "docs/backlog/historias/US-02.md"));
    return put(id, n, reqs, ev, human);
  };

  it("(sha pendente) gravado pela lib vira pendente, não lacuna", () => {
    const out0 = only("US-05", "05", "RF-01", [
      "T-05.1 · 2026-01-01 · pnpm test → 1 ✓ · (sha pendente)",
    ]);
    expect(out0).toContain("(sha pendente)");
    const out = generate(root, []);
    expect(out).toContain("| T-05.1 (Done) | 2026-01-01 (sha pendente) | - |");
    expect(out).not.toContain("US-05: evidência malformada");
    const filled = setEvidenceSha(out0, "T-05.1", "abc1234") as string;
    writeFileSync(join(root, "docs/backlog/historias/US-05.md"), filled);
    expect(generate(root, [])).toContain("| 2026-01-01 abc1234 |");
  });

  it("último segmento inválido ou linha curta vira lacuna", () => {
    only("US-05", "05", "RF-01", [
      "T-05.1 · 2026-01-01 · pnpm test → 1 ✓ · -",
      "T-05.2 · 2026-01-01 · sem sha",
    ]);
    const out = generate(root, []);
    expect(out).toContain("- US-05: evidência malformada: T-05.1, T-05.2");
    expect(out).toContain("⚠ evidência malformada");
  });

  it("ignora linha T-.. fora de Evidências, comentário-modelo e usa a primeira duplicada", () => {
    let t = put("US-05", "05", "RF-01", [
      "T-05.1 · 2026-01-01 · a → ok · abc1234",
      "T-05.1 · 2026-02-02 · b → ok · 1111111",
    ]);
    t = t.replace("## Tarefas", "T-05.2 · 2026-03-03 · x → ok · 2222222\n\n## Tarefas");
    writeFileSync(join(root, "docs/backlog/historias/US-05.md"), t);
    rmSync(join(root, "docs/backlog/historias/US-01.md"));
    rmSync(join(root, "docs/backlog/historias/US-02.md"));
    const out = generate(root, []);
    expect(out).toContain("2026-01-01 abc1234");
    expect(out).not.toContain("1111111");
    expect(out).not.toContain("2222222");
    expect(out).toContain("- US-05: tarefas sem evidência: T-05.2");
  });

  it("CRLF gera a mesma saída que LF", () => {
    only("US-05", "05", "RF-01", ["T-05.1 · 2026-01-01 · a → ok · abc1234"]);
    const lf = generate(root, []);
    const p = join(root, "docs/backlog/historias/US-05.md");
    writeFileSync(p, readFileSync(p, "utf8").replace(/\n/g, "\r\n"));
    expect(generate(root, [])).toBe(lf);
  });

  it("Bloqueios não conta como evidência", () => {
    const t = only("US-05", "05", "RF-01", []);
    writeFileSync(
      join(root, "docs/backlog/historias/US-05.md"),
      addBlockReason(t, "T-05.1", "2026-01-05", "falta | segredo"),
    );
    const out = generate(root, []);
    expect(out).toContain("bloqueada desde 2026-01-05: falta / segredo");
    expect(out).toContain("- US-05: história sem evidência");
  });

  it("tarefa humana não vira pendente nem lacuna", () => {
    only("US-05", "05", "RF-01", ["T-05.1 · 2026-01-01 · a → ok · abc1234"], true);
    const out = generate(root, []);
    expect(out).toContain("| T-05.2 (Todo) | n/a 👤 | - |");
    expect(out).not.toContain("US-05: tarefas sem evidência");
  });

  it("requisitos só no corpo gera história sem requisito", () => {
    const t = only("US-05", "05", "RF-01", []);
    const body = `${t.replace("requisitos: [RF-01]\n", "")}\nrequisitos: [RF-01]\n`;
    writeFileSync(join(root, "docs/backlog/historias/US-05.md"), body);
    expect(generate(root, [])).toContain("- US-05: história sem requisito");
  });
});
