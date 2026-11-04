---
name: sprint-planejar
description: Planejamento de sprint. Delega ao subagente po-scrum a checagem da Definition of Ready e a montagem do arquivo da sprint, e apresenta o plano ao Product Owner para aprovar. Use com o número da sprint, como /sprint-planejar S2, ou sem argumento para a próxima sprint.
argument-hint: "[Sx]"
---

# /sprint-planejar [Sx]

1. **Sprint alvo:** o argumento, ou a próxima sprint com histórias `Todo` (veja em `docs/backlog/BACKLOG.md`).
2. **Delegue ao `po-scrum`** com o brief:
   > Planeje a sprint {Sx}. Arquivo: docs/backlog/sprints/{Sx}.md. Histórias: as da sprint em docs/backlog/BACKLOG.md. Cheque a DoR (docs/processo/scrum.md §4) de cada uma, divida as que forem G, ajuste dependências e arquivos autorizados e preencha "Ordem sugerida e paralelismo" e "Tarefas do PO". Responda no formato de economia-tokens §4.
3. **Mostre ao PO** em até 12 linhas:
   - meta;
   - histórias (e o que mudou no refinamento);
   - ordem e paralelismo;
   - tarefas 👤 que ele precisa fazer;
   - riscos.
4. **Peça a aprovação** (sim/ajustar). Se o PO pedir ajustes, volte ao `po-scrum` com eles.
5. **Aprovado:**
   - sem script: marque as histórias como `Todo` → mantém, e registre "Planejada em AAAA-MM-DD" no topo do `Sx.md`;
   - com script: rode `pnpm backlog status`;
   - sugira `/tarefa` com a primeira tarefa da ordem.
