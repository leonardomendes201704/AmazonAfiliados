---
name: daily
description: Daily do projeto. Mostra o andamento da sprint atual (histórias e tarefas por status, bloqueios e próximas tarefas prontas) lendo só os arquivos do backlog, sem delegar a subagentes. Use no início de toda sessão.
---

# /daily

1. Se `scripts/backlog.ts` existir, rode `pnpm backlog status` e use a saída.
2. Se não existir:
   - leia `docs/backlog/BACKLOG.md` (só a tabela "Histórias");
   - descubra a sprint atual: a de menor número com alguma história diferente de `Done`;
   - leia apenas o frontmatter e a tabela de tarefas das histórias dessa sprint.
3. Responda em até 15 linhas:
   - sprint atual e meta (primeira linha de `docs/backlog/sprints/Sx.md`);
   - contagem de tarefas por status;
   - `Blocked`, com o motivo e se depende do PO (👤);
   - as próximas 3 tarefas prontas: dependências `Done` e status `Todo`, com agente e se podem rodar em paralelo;
   - sugestão do próximo comando (`/tarefa T-xx.y`, `/sprint-planejar` ou `/sprint-revisar`).

Não leia código nem outros documentos.
