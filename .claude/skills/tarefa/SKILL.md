---
name: tarefa
description: Executa uma tarefa do backlog de ponta a ponta. Inicia o status, delega ao agente da tarefa, manda para o qa-revisor, faz o commit com o ID e conclui o status. Use como /tarefa T-07.2. Aceita até 3 IDs de apps diferentes para rodar em paralelo, como /tarefa T-07.1 T-11.1.
argument-hint: "T-xx.y [T-xx.y ...]"
---

# /tarefa T-xx.y [...]

Siga `docs/processo/scrum.md` §7 e `docs/processo/economia-tokens.md`. Para cada ID:

1. **Localize.** A história é `docs/backlog/historias/US-xx.md` (o `xx` é o número antes do ponto). Leia só o frontmatter, a linha da tarefa e "Verificação".
2. **Cheque.**
   - Dependências (`depende_de`) diferentes de `Done`: pare e informe.
   - Status `Done`: informe e pare.
   - Mais de um ID: confirme que os arquivos autorizados são disjuntos e de apps diferentes. Se não forem, rode em sequência.
3. **Tarefa `humano` (👤):**
   - explique ao PO em até 5 linhas o que fazer;
   - rode `pnpm backlog bloquear T-xx.y "aguardando PO"` (ou marque à mão);
   - pare.
4. **Inicie.** `pnpm backlog iniciar T-xx.y` (ou à mão, na S1 antes da T-01.3).
5. **Delegue ao agente da tarefa** com o brief de `economia-tokens.md` §3. Com vários IDs, as chamadas vão na mesma mensagem.
6. **Agente devolveu `BLOQUEADO`:** registre com `pnpm backlog bloquear`, informe o PO e pare essa tarefa.
7. **Revise.** Delegue ao `qa-revisor`:
   > Revise T-xx.y de docs/backlog/historias/US-xx.md. Arquivos alterados: <lista da resposta do agente>.
8. **`REPROVADO`:**
   - volte ao agente com os `DEFEITOS` (rodada 2);
   - reprovou de novo: chame o `arquiteto` uma vez para o diagnóstico e depois o agente uma última vez;
   - persistindo: `bloquear` e informe o PO.
9. **`APROVADO`:**
   - `git add <arquivos alterados> docs/backlog/historias/US-xx.md`
   - `git commit -m "<tipo>(T-xx.y): <resumo em pt-BR>"`
   - `pnpm backlog concluir T-xx.y --commit <sha>`, que também completa o SHA na evidência. Sem script: troque `Todo` por `Done` na tabela, o `(sha ...)` pelo SHA e, se todas as tarefas estiverem `Done`, também o status da história no frontmatter e no `BACKLOG.md`.
10. **Responda ao PO** em até 5 linhas por tarefa: o que entrou, a verificação, o SHA e a próxima tarefa pronta.

Não leia código nem diffs você mesmo: isso é do agente e do QA.
