export const STATUSES = ["Todo", "Doing", "Review", "Done", "Blocked"] as const;
export type Status = (typeof STATUSES)[number];

export class BacklogError extends Error {}

export interface Task {
  id: string;
  status: Status;
  line: number;
}

export interface Story {
  id: string;
  status: Status;
  tasks: Task[];
}

const TASK_ID = /^T-\d+\.\d+$/;
const isStatus = (s: string): s is Status => (STATUSES as readonly string[]).includes(s);
const cells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

/** Troca a última célula de uma linha de tabela, preservando o fim de linha. */
function replaceLastCell(line: string, value: string): string {
  return line.replace(/\|[^|]*\|(\s*)$/, `| ${value} |$1`);
}

export function parseStory(text: string, file = "história"): Story {
  const lines = text.split("\n");
  if (lines[0]?.trim() !== "---") {
    throw new BacklogError(`${file}: frontmatter ausente (esperado "---" na linha 1)`);
  }
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (end < 0) throw new BacklogError(`${file}: frontmatter sem fechamento "---"`);
  const fm = new Map<string, string>();
  for (const l of lines.slice(1, end)) {
    const m = /^(\w+):\s*(.*?)\s*$/.exec(l);
    if (m) fm.set(m[1] as string, m[2] as string);
  }
  const id = fm.get("id");
  const status = fm.get("status");
  if (!id || !/^US-\d+$/.test(id)) {
    throw new BacklogError(`${file}: frontmatter com "id" inválido ou ausente`);
  }
  if (!status || !isStatus(status)) {
    throw new BacklogError(
      `${file}: status "${status ?? ""}" inválido (use ${STATUSES.join(", ")})`,
    );
  }

  const start = lines.findIndex((l) => /^##\s+Tarefas\s*$/.test(l.trim()));
  if (start < 0) throw new BacklogError(`${file}: seção "## Tarefas" ausente`);
  const tasks: Task[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i] as string;
    if (/^##\s/.test(l)) break;
    if (!l.trim().startsWith("|")) continue;
    const c = cells(l);
    if (!TASK_ID.test(c[0] ?? "")) continue;
    if (c.length !== 6) {
      throw new BacklogError(
        `${file}: linha ${i + 1}: tarefa ${c[0]} deve ter 6 colunas, tem ${c.length}`,
      );
    }
    const st = c[5] as string;
    if (!isStatus(st)) {
      throw new BacklogError(`${file}: linha ${i + 1}: status "${st}" inválido na tarefa ${c[0]}`);
    }
    if (!c[3])
      throw new BacklogError(`${file}: linha ${i + 1}: tarefa ${c[0]} sem arquivos autorizados`);
    if (tasks.some((t) => t.id === c[0]))
      throw new BacklogError(`${file}: tarefa ${c[0]} duplicada`);
    tasks.push({ id: c[0] as string, status: st, line: i });
  }
  if (tasks.length === 0) throw new BacklogError(`${file}: nenhuma tarefa na tabela`);
  return { id, status, tasks };
}

export function setStoryStatus(text: string, status: Status): string {
  const lines = text.split("\n");
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  for (let i = 1; i < end; i++) {
    if (/^status:/.test(lines[i] as string)) {
      lines[i] = (lines[i] as string).replace(/^status:.*?(\r?)$/, `status: ${status}$1`);
      return lines.join("\n");
    }
  }
  throw new BacklogError("frontmatter sem campo status");
}

export function setTaskStatus(text: string, taskId: string, status: Status): string {
  const task = parseStory(text).tasks.find((t) => t.id === taskId);
  if (!task) throw new BacklogError(`tarefa ${taskId} não encontrada`);
  const lines = text.split("\n");
  lines[task.line] = replaceLastCell(lines[task.line] as string, status);
  return lines.join("\n");
}

export function getIndexStatus(index: string, storyId: string): Status | undefined {
  for (const l of index.split("\n")) {
    if (!l.trim().startsWith("|")) continue;
    const c = cells(l);
    if (c[0] === storyId) {
      const st = c[c.length - 1] as string;
      return isStatus(st) ? st : undefined;
    }
  }
  return undefined;
}

export function setIndexStatus(index: string, storyId: string, status: Status): string {
  const lines = index.split("\n");
  const i = lines.findIndex((l) => l.trim().startsWith("|") && cells(l)[0] === storyId);
  if (i < 0) throw new BacklogError(`${storyId} não encontrada na tabela do BACKLOG.md`);
  lines[i] = replaceLastCell(lines[i] as string, status);
  return lines.join("\n");
}

/** Troca "(sha pendente)" pelo sha na linha de evidência da tarefa. Devolve null se não há linha pendente. */
export function setEvidenceSha(text: string, taskId: string, sha: string): string | null {
  const lines = text.split("\n");
  const i = lines.findIndex((l) => l.startsWith(`${taskId} ·`) && l.includes("(sha pendente)"));
  if (i < 0) return null;
  lines[i] = (lines[i] as string).replace("(sha pendente)", sha);
  return lines.join("\n");
}

/** Registra o motivo numa seção "## Bloqueios" (criada antes de "## Evidências", ou ao fim). */
export function addBlockReason(text: string, taskId: string, date: string, reason: string): string {
  const cr = text.includes("\r\n") ? "\r" : "";
  const entry = `- ${taskId} · ${date} · ${reason}${cr}`;
  const lines = text.split("\n");
  const h = lines.findIndex((l) => /^##\s+Bloqueios\s*$/.test(l.trim()));
  if (h >= 0) {
    let at = h + 1;
    while (at < lines.length && !/^##\s/.test(lines[at] as string)) at++;
    while (at > h + 1 && (lines[at - 1] as string).trim() === "") at--;
    lines.splice(at, 0, entry);
    return lines.join("\n");
  }
  const ev = lines.findIndex((l) => /^##\s+Evidências\s*$/.test(l.trim()));
  const block = ["## Bloqueios", "", entry.slice(0, entry.length - cr.length), ""].map(
    (l) => l + cr,
  );
  if (ev >= 0) lines.splice(ev, 0, ...block);
  else lines.push(...block);
  return lines.join("\n");
}
