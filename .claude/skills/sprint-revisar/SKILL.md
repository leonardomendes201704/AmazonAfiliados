---
name: sprint-revisar
description: Revisão e retrospectiva da sprint. Roda os checks completos do monorepo, guia a demo para o Product Owner, registra o aceite por história, a retro em 3 tópicos e regenera a matriz de rastreabilidade. Use como /sprint-revisar S2, ou sem argumento para a sprint atual.
argument-hint: "[Sx]"
---

# /sprint-revisar [Sx]

1. **Confira o status.** Leia o `docs/backlog/sprints/Sx.md` e o status das histórias da sprint. Se houver história diferente de `Done`, liste e pergunte ao PO se ela vai para a próxima sprint.
2. **Rode os checks completos:**

   ```bash
   pnpm lint && pnpm typecheck && pnpm test -- --reporter=dot && pnpm build
   ```

   Se falhar, mostre o resumo (`tail -n 40`) e proponha uma tarefa `fix`. Não corrija aqui.
3. **Guie a demo.** Mostre os passos de "Demo da revisão" do `Sx.md`. Se dá para conferir sozinho (`curl`, `docker compose`, navegador do app), confira e mostre a prova. Os passos visuais ficam com o PO.
4. **Colha o aceite.** Pergunte ao PO, por história: aceita ou não, e o motivo.
5. **Registre.** Delegue ao `po-scrum`:
   > Registre a revisão de {Sx}: aceites <lista>, resultados dos checks <resumo>. Preencha "Revisão" e "Retro" (manter, melhorar, experimentar) em docs/backlog/sprints/{Sx}.md. Crie histórias para o que não foi aceito.
6. **Gere a matriz.** `pnpm rastreabilidade`, se existir, e informe os ⚠ (requisito sem história, tarefa sem evidência).
7. **Lembretes:**
   - a partir da S5: teste mensal de restauração do backup (`scripts/testar-restauracao.sh`);
   - recomende `/clear` e uma sessão nova para a próxima sprint, começando com `/daily`.
