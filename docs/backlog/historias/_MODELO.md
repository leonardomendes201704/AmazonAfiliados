---
id: US-00
titulo: Título curto da história
epico: EP-00
prioridade: P0
sprint: S0
estimativa: M
status: Todo
agentes: [dev-backend]
depende_de: []
requisitos: [RF-00]
---
# US-00 · Título curto da história

**Como** <papel>, **quero** <capacidade> **para** <benefício>.

## Contexto mínimo (ler só isto)

- `docs/arquitetura/dados.md` §2 (tabela X)
- `docs/arquitetura/api.md` §2

## Critérios de aceite

- [ ] **CA1:** dado <situação>, quando <ação>, então <resultado verificável>.
- [ ] **CA2:** ...

## Tarefas

| ID | Tarefa | Agente | Arquivos autorizados | Est. | Status |
|---|---|---|---|---|---|
| T-00.1 | Descrição objetiva do que fazer | dev-backend | `apps/api/src/routes/x.ts`, `apps/api/test/x.test.ts` | P | Todo |

## Verificação

```bash
pnpm --filter api test -- --reporter=dot
```

## Evidências

<!-- uma linha por tarefa, gravada pelo qa-revisor: T-00.1 · AAAA-MM-DD · comando → resultado · <sha> -->
