import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseStory } from "./lib/backlog.ts";

export interface Commit {
  sha: string;
  subject: string;
}

interface Evidence {
  date: string;
  /** "sha": sha válido; "pending": (sha pendente); "malformed": linha fora do formato. */
  state: "sha" | "pending" | "malformed";
  sha: string | null;
}

interface Task {
  id: string;
  status: string;
  human: boolean;
  evidence?: Evidence;
  blocked?: { date: string; reason: string };
}

interface StoryInfo {
  id: string;
  title: string;
  requirements: string[];
  tasks: Task[];
}

const GAP = "⚠";
const REQ_ID = /^(RF|RNF)-\d+$/;
const cmp = (a: string, b: string) => a.localeCompare(b, "en", { numeric: true });

/** Lê RF/RNF da tabela de requisitos (`| RF-01 | texto | P0 |`). */
export function parseRequirements(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const c = line
      .trim()
      .replace(/^\|/, "")
      .split("|")
      .map((x) => x.trim());
    if (!REQ_ID.test(c[0] ?? "") || !c[1]) continue;
    const bold = /\*\*(.+?)\*\*/.exec(c[1]);
    // Corta só em ": " ou ". " fora de trechos entre crases.
    const masked = c[1].replace(/`[^`]*`/g, (s) => "x".repeat(s.length));
    const cut = /[.:](\s|$)/.exec(masked);
    const first = cut ? c[1].slice(0, cut.index) : c[1];
    const title = (bold?.[1] ?? first).replace(/:$/, "").trim();
    out.set(c[0] as string, title);
  }
  return out;
}

const PENDING = "(sha pendente)";
const TASK_ID = /^T-\d+\.\d+$/;

/** Linhas de uma seção "## Nome", até o próximo "##". */
function section(lines: string[], name: string): string[] {
  const start = lines.findIndex((l) => new RegExp(`^##\\s+${name}\\s*$`).test(l.trim()));
  if (start < 0) return [];
  const out: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i] as string)) break;
    out.push(lines[i] as string);
  }
  return out;
}

export function parseStoryInfo(raw: string, file: string): StoryInfo {
  const text = raw.replace(/\r\n/g, "\n");
  const story = parseStory(text, file);
  const lines = text.split("\n");
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  const fmMap = new Map<string, string>();
  for (const l of lines.slice(1, end)) {
    const m = /^(\w+):\s*(.*?)\s*$/.exec(l);
    if (m) fmMap.set(m[1] as string, m[2] as string);
  }
  const requirements = (fmMap.get("requisitos") ?? "")
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => REQ_ID.test(s));

  const human = new Set<string>();
  for (const l of section(lines, "Tarefas")) {
    if (!l.trim().startsWith("|")) continue;
    const c = l
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((x) => x.trim());
    if (TASK_ID.test(c[0] ?? "") && (c[3] ?? "").startsWith("(nenhum arquivo")) {
      human.add(c[0] as string);
    }
  }

  const evidence = new Map<string, Evidence>();
  for (const l of section(lines, "Evidências")) {
    const t = l.trim();
    if (t.startsWith("<!--")) continue;
    const parts = t.split(" · ").map((p) => p.trim());
    if (!TASK_ID.test(parts[0] ?? "") || evidence.has(parts[0] as string)) continue;
    const last = parts[parts.length - 1] as string;
    const date = parts[1] ?? "";
    let ev: Evidence;
    if (parts.length < 4 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      ev = { date, state: "malformed", sha: null };
    } else if (/^[0-9a-f]{7,40}$/.test(last)) {
      ev = { date, state: "sha", sha: last.slice(0, 7) };
    } else if (last === PENDING) {
      ev = { date, state: "pending", sha: null };
    } else {
      ev = { date, state: "malformed", sha: null };
    }
    evidence.set(parts[0] as string, ev);
  }

  const blocks = new Map<string, { date: string; reason: string }>();
  for (const l of section(lines, "Bloqueios")) {
    const parts = l.replace(/^\s*-\s*/, "").split(" · ");
    if (!TASK_ID.test(parts[0]?.trim() ?? "") || parts.length < 3) continue;
    blocks.set(parts[0]?.trim() as string, {
      date: (parts[1] as string).trim(),
      reason: parts.slice(2).join(" · ").trim(),
    });
  }

  return {
    id: story.id,
    title: fmMap.get("titulo") ?? "",
    requirements,
    tasks: story.tasks.map((t) => ({
      id: t.id,
      status: t.status,
      human: human.has(t.id),
      evidence: evidence.get(t.id),
      blocked: blocks.get(t.id),
    })),
  };
}

export function parseGitLog(raw: string): Commit[] {
  return raw
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => {
      const i = l.indexOf(" ");
      return { sha: l.slice(0, i).slice(0, 7), subject: l.slice(i + 1) };
    });
}

export function gitCommits(root: string): Commit[] {
  try {
    const raw = execFileSync("git", ["-c", "core.abbrev=7", "log", "--reverse", "--format=%h %s"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return parseGitLog(raw);
  } catch {
    return [];
  }
}

function evidenceCell(t: Task): string {
  const e = t.evidence;
  if (e?.state === "sha") return `${e.date} ${e.sha}`;
  if (e?.state === "pending") return `${e.date} ${PENDING}`;
  if (e?.state === "malformed") return `${GAP} evidência malformada`;
  if (t.blocked) {
    return `bloqueada desde ${t.blocked.date}: ${t.blocked.reason.replaceAll("|", "/")}`;
  }
  if (t.human) return "n/a 👤";
  return `${GAP} sem evidência`;
}

export function generate(root: string, commits: Commit[]): string {
  const visaoPath = join(root, "docs/produto/visao.md");
  const reqs = existsSync(visaoPath)
    ? parseRequirements(readFileSync(visaoPath, "utf8"))
    : new Map<string, string>();
  const dir = join(root, "docs/backlog/historias");
  const stories = (existsSync(dir) ? readdirSync(dir) : [])
    .filter((f) => /^US-\d+\.md$/.test(f))
    .sort(cmp)
    .map((f) => parseStoryInfo(readFileSync(join(dir, f), "utf8"), f));

  const byTask = new Map<string, string[]>();
  for (const c of commits) {
    for (const m of c.subject.matchAll(/\((T-\d+\.\d+)\)/g)) {
      const list = byTask.get(m[1] as string) ?? [];
      if (!list.includes(c.sha)) list.push(c.sha);
      byTask.set(m[1] as string, list);
    }
  }

  const ids = [...new Set([...reqs.keys(), ...stories.flatMap((s) => s.requirements)])].sort(cmp);
  const gaps: string[] = [];
  const rows: string[] = [];
  for (const id of ids) {
    const label = reqs.has(id) ? `${id} ${reqs.get(id)}` : id;
    const linked = stories.filter((s) => s.requirements.includes(id));
    if (linked.length === 0) {
      gaps.push(`- ${id}: requisito sem história`);
      rows.push(`| ${label} | ${GAP} sem história | | | |`);
      continue;
    }
    for (const s of linked) {
      for (const t of s.tasks) {
        const ev = evidenceCell(t);
        const commitList = byTask.get(t.id);
        rows.push(
          `| ${label} | ${s.id} | ${t.id} (${t.status}) | ${ev} | ${commitList?.join(", ") ?? "-"} |`,
        );
      }
    }
  }
  for (const s of stories) {
    if (s.requirements.length === 0) gaps.push(`- ${s.id}: história sem requisito`);
    const real = s.tasks.filter((t) => !t.human);
    const bad = real.filter((t) => t.evidence?.state === "malformed").map((t) => t.id);
    const none = real.filter((t) => !t.evidence).map((t) => t.id);
    if (real.length > 0 && none.length === real.length) {
      gaps.push(`- ${s.id}: história sem evidência (${real.length} tarefas)`);
    } else if (none.length > 0) {
      gaps.push(`- ${s.id}: tarefas sem evidência: ${none.join(", ")}`);
    }
    if (bad.length > 0) gaps.push(`- ${s.id}: evidência malformada: ${bad.join(", ")}`);
  }

  return `${[
    "# Matriz de rastreabilidade",
    "",
    "> Gerado por `pnpm rastreabilidade`. Não edite à mão. Fontes: `docs/produto/visao.md`, frontmatter e tabelas das histórias, linhas de evidência e commits com `(T-xx.y)` no assunto.",
    "",
    "## Lacunas",
    "",
    ...(gaps.length ? gaps : ["Nenhuma."]),
    "",
    "## Matriz",
    "",
    "| Requisito | História | Tarefa | Evidência | Commits |",
    "|---|---|---|---|---|",
    ...rows,
  ].join("\n")}\n`;
}

export function run(root: string, commits: Commit[] = gitCommits(root)): string {
  const out = generate(root, commits);
  writeFileSync(join(root, "docs/rastreabilidade.md"), out);
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  run(root);
  console.log("docs/rastreabilidade.md gerado");
}
