import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  addBlockReason,
  BacklogError,
  getIndexStatus,
  parseStory,
  type Status,
  setEvidenceSha,
  setIndexStatus,
  setStoryStatus,
  setTaskStatus,
} from "./lib/backlog.ts";

export interface Result {
  code: number;
  out: string;
}

const USAGE =
  'uso: pnpm backlog status | iniciar T-xx.y | concluir T-xx.y --commit <sha> | bloquear T-xx.y "motivo"';

function findStoryFile(root: string, taskId: string): string {
  const m = /^T-(\d+)\.\d+$/.exec(taskId);
  if (!m) throw new BacklogError(`id de tarefa inválido: "${taskId}" (esperado T-xx.y)`);
  const file = join(root, "docs/backlog/historias", `US-${m[1]}.md`);
  if (!existsSync(file)) throw new BacklogError(`história não encontrada: ${file}`);
  return file;
}

function update(
  root: string,
  taskId: string,
  action: "iniciar" | "concluir" | "bloquear",
  extra: string,
): string {
  const file = findStoryFile(root, taskId);
  const indexFile = join(root, "docs/backlog/BACKLOG.md");
  let text = readFileSync(file, "utf8");
  let index = readFileSync(indexFile, "utf8");
  const story = parseStory(text, file);
  if (!story.tasks.some((t) => t.id === taskId)) {
    throw new BacklogError(`tarefa ${taskId} não existe em ${story.id}`);
  }
  const next: Status = action === "iniciar" ? "Doing" : action === "concluir" ? "Done" : "Blocked";
  text = setTaskStatus(text, taskId, next);
  let note = "";
  if (action === "iniciar") text = setStoryStatus(text, "Doing");
  if (action === "concluir") {
    const withSha = setEvidenceSha(text, taskId, extra);
    if (withSha) text = withSha;
    else note = " (sem linha de evidência pendente; sha não gravado)";
    if (parseStory(text, file).tasks.every((t) => t.status === "Done")) {
      text = setStoryStatus(text, "Done");
    }
  }
  if (action === "bloquear") {
    text = addBlockReason(text, taskId, new Date().toISOString().slice(0, 10), extra);
  }
  const final = parseStory(text, file).status;
  index = setIndexStatus(index, story.id, final);
  writeFileSync(file, text);
  writeFileSync(indexFile, index);
  return `${taskId} → ${next}; ${story.id} → ${final}${note}`;
}

function status(root: string): string {
  const dir = join(root, "docs/backlog/historias");
  const index = readFileSync(join(root, "docs/backlog/BACKLOG.md"), "utf8");
  const out: string[] = [];
  for (const f of readdirSync(dir)
    .filter((n) => /^US-\d+\.md$/.test(n))
    .sort()) {
    const s = parseStory(readFileSync(join(dir, f), "utf8"), f);
    const done = s.tasks.filter((t) => t.status === "Done").length;
    const active = s.tasks
      .filter((t) => t.status === "Doing" || t.status === "Blocked")
      .map((t) => `${t.id} ${t.status}`);
    const idx = getIndexStatus(index, s.id);
    const warn = idx === s.status ? "" : `  ! BACKLOG.md diz ${idx ?? "(ausente)"}`;
    const act = active.length ? ` [${active.join(", ")}]` : "";
    out.push(`${s.id} ${s.status} ${done}/${s.tasks.length}${act}${warn}`);
  }
  return out.join("\n");
}

export function run(argv: string[], root: string): Result {
  const [cmd, taskId, ...rest] = argv;
  try {
    if (cmd === "status") return { code: 0, out: status(root) };
    if ((cmd === "iniciar" || cmd === "concluir" || cmd === "bloquear") && taskId) {
      let extra = "";
      if (cmd === "concluir") {
        const i = rest.indexOf("--commit");
        extra = (i >= 0 ? rest[i + 1] : undefined) ?? "";
        if (!/^[0-9a-f]{7,40}$/i.test(extra)) {
          throw new BacklogError("concluir exige --commit <sha> (7 a 40 hex)");
        }
      }
      if (cmd === "bloquear") {
        extra = rest.join(" ").trim();
        if (!extra) throw new BacklogError('bloquear exige o motivo: bloquear T-xx.y "motivo"');
      }
      return { code: 0, out: update(root, taskId, cmd, extra) };
    }
    return { code: 1, out: USAGE };
  } catch (e) {
    if (e instanceof BacklogError) return { code: 1, out: `erro: ${e.message}` };
    throw e;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const r = run(process.argv.slice(2), root);
  (r.code === 0 ? console.log : console.error)(r.out);
  process.exit(r.code);
}
