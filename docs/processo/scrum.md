# Processo: Scrum com subagentes

## 1. Papéis

| Papel | Quem | Responsabilidade |
|---|---|---|
| Product Owner | usuário | prioriza, aceita as histórias na revisão, executa tarefas `👤` |
| Scrum Master / orquestrador | sessão principal do Claude Code | conduz as cerimônias, delega, faz commits, atualiza o status pelo script, protege o escopo |
| Time | subagentes em `.claude/agents/` | executam as tarefas da sua disciplina |

## 2. Artefatos

| Artefato | Arquivo | Quem edita |
|---|---|---|
| Visão e requisitos | `docs/produto/visao.md` | `po-scrum` (com aceite do PO) |
| Backlog (índice) | `docs/backlog/BACKLOG.md` | script `pnpm backlog`; `po-scrum` na criação de itens |
| Histórias | `docs/backlog/historias/US-xx.md` | `po-scrum` cria; script muda status; `qa-revisor` grava evidências |
| Sprints | `docs/backlog/sprints/Sx.md` | `po-scrum` |
| Decisões | `docs/arquitetura/adr/ADR-xxx.md` | `arquiteto` |
| Rastreabilidade | `docs/rastreabilidade.md` | gerada por `pnpm rastreabilidade` |

## 3. IDs e convenções

| Item | Formato | Exemplo |
|---|---|---|
| Requisito | `RF-xx`, `RNF-xx` | RF-04 |
| Épico | `EP-xx` | EP-03 |
| História | `US-xx` | US-07 |
| Tarefa | `T-<história>.<n>` | T-07.2 |
| Sprint | `Sx` | S2 |
| Decisão | `ADR-xxx` | ADR-004 |

- **Status:** `Todo` → `Doing` → `Review` → `Done`, ou `Blocked` (com motivo).
- **Prioridade:** `P0` (MVP), `P1` (logo depois), `P2` (futuro).
- **Estimativa:** `P` (até 1 sessão curta), `M` (1 sessão), `G` (dividir antes de executar).
- **Commit:** Conventional Commits com a tarefa no escopo: `feat(T-07.2): parser extrai nota e avaliações`. Tipos: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `ci`, `build`.
- **Branch:** trunk-based, um commit por tarefa direto na `main` local. Tarefas em paralelo só quando os arquivos autorizados são disjuntos. Se surgir conflito, usar `git worktree` por tarefa.

## 4. Definition of Ready (DoR): a história só entra na sprint se tiver

- [ ] critérios de aceite verificáveis
- [ ] tarefas com agente, arquivos autorizados e comando de verificação
- [ ] dependências `Done` (ou na mesma sprint, antes dela)
- [ ] seções de contexto citadas (§) existentes
- [ ] estimativa `P` ou `M` (história `G` é dividida antes)

## 5. Definition of Done (DoD): a tarefa só fecha com

- [ ] o comando de verificação da tarefa passando
- [ ] `pnpm lint` e `pnpm typecheck` sem erro nos pacotes tocados
- [ ] testes novos para o comportamento novo (o parser e as regras de `shared` exigem teste)
- [ ] critérios conferidos pelo `qa-revisor`, com a linha de evidência gravada
- [ ] `docs/arquitetura/api.md` ou `dados.md` atualizados, se o contrato ou o schema mudou
- [ ] commit com o ID e o status atualizado por `pnpm backlog concluir`

## 6. Cerimônias (skills)

| Skill | Quando | O que faz |
|---|---|---|
| `/daily` | a qualquer momento (início de toda sessão) | mostra o resumo da sprint atual. Não delega |
| `/sprint-planejar [Sx]` | início da sprint | o `po-scrum` confere a DoR, monta o `Sx.md` e propõe a ordem; o PO aprova |
| `/tarefa T-xx.y` | execução | ciclo do §7 |
| `/sprint-revisar [Sx]` | fim da sprint | checks completos, demo guiada, aceite do PO, retro em 3 tópicos, rastreabilidade |

Sprint = uma meta e de 4 a 8 histórias, sem duração em dias. Ela termina quando todas as histórias estão `Done`, ou quando o PO revê a meta.

## 7. Ciclo de uma tarefa

```
orquestrador: pnpm backlog iniciar T-xx.y
  → agente da tarefa (brief = caminho da história + ID)
      implementa só nos arquivos autorizados e roda o comando de verificação
      responde em ≤ 8 linhas
  → qa-revisor (brief = caminho da história + ID + lista de arquivos alterados)
      roda a verificação + lint + typecheck, confere critério a critério
      grava a evidência e devolve APROVADO, ou REPROVADO com defeitos numerados
  → se REPROVADO: volta ao agente com os defeitos (no máximo 2 rodadas; depois Blocked e aviso ao PO)
  → orquestrador: git add <arquivos> && git commit -m "tipo(T-xx.y): ..."
                  pnpm backlog concluir T-xx.y --commit <sha>
```

Tarefas `👤`: o orquestrador explica em até 5 linhas o que o PO precisa fazer, marca `Blocked` ("aguardando PO") e segue com o resto.

## 8. Rastreabilidade

- O frontmatter de cada história lista `requisitos: [RF-xx, ...]`.
- Cada tarefa tem o seu ID no commit e uma linha de evidência:
  `T-07.2 · 2026-11-10 · pnpm --filter worker test → 18 ✓ · a1b2c3d`
- `pnpm rastreabilidade` gera `docs/rastreabilidade.md` cruzando requisitos, histórias, tarefas, evidências e `git log`. Requisito sem história ou história sem evidência aparece como ⚠.

## 9. Mudanças

- **Escopo novo:** o `po-scrum` cria a história (próximo `US-xx` livre) e a encaixa no `BACKLOG.md`. Só entra na sprint atual se o PO pedir.
- **Decisão técnica nova ou alterada:** o `arquiteto` escreve o ADR. ADR aceito não é editado; ele é substituído por um novo.
- **Bug encontrado na revisão:** vira tarefa `fix` na mesma história (se a história não foi aceita) ou uma história nova.
