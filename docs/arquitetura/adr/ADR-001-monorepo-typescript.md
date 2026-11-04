# ADR-001: Monorepo pnpm em TypeScript

## Contexto

O projeto tem 3 aplicações (web, api e worker) que compartilham tipos, schemas e regras de exibição. Uma linguagem só reduz o número de contextos e de ferramentas que os agentes precisam carregar.

## Decisão

- **Workspaces:** pnpm, com `apps/web`, `apps/api`, `apps/worker`, `packages/db` e `packages/shared`.
- **TypeScript:** `strict`, ESM e Node 22 LTS.
- **Biome:** lint e formatação numa ferramenta só, sem ESLint nem Prettier.
- **Testes:** Vitest em todos os pacotes.
- **Git hooks** (simple-git-hooks):
  - `pre-commit` roda `biome check --staged`;
  - `pre-push` roda `pnpm typecheck`.
- **Scripts na raiz:** `dev`, `test`, `lint`, `typecheck`, `build`, `db:migrate`, `db:seed`, `backlog` e `rastreabilidade`.

## Consequências

- **Ganhos:** tipos compartilhados de ponta a ponta e uma configuração só, o que dá menos tokens por tarefa.
- **Custo:** o build das imagens Docker precisa de `pnpm deploy` ou `--filter` para não copiar o monorepo inteiro.

## Alternativas descartadas

- **Python no worker:** obrigaria duas linguagens e tipos duplicados.
- **Turborepo e Nx:** configuração extra sem ganho nessa escala.
