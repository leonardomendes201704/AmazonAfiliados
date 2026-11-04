# ADR-008: Backlog em Markdown com scripts de status e rastreabilidade

## Contexto

O desenvolvimento é feito por subagentes, com economia máxima de tokens, e precisa de rastreabilidade de requisito até commit.

## Decisão

- **Backlog no repositório:** `docs/backlog/BACKLOG.md` (índice) e uma história por arquivo, com frontmatter YAML (`id`, `status`, `sprint`, `agente`, `requisitos`, `depende_de`).
- **`scripts/backlog.ts`** (`pnpm backlog status|iniciar|concluir|bloquear`) atualiza o frontmatter, a tabela de tarefas da história e a linha do `BACKLOG.md` de forma determinística.
- **`scripts/rastreabilidade.ts`** gera `docs/rastreabilidade.md` a partir dos frontmatters, das linhas de evidência e do `git log` (commits `tipo(T-xx.y)`).

## Consequências

- Status e matriz não custam tokens de LLM.
- O formato dos arquivos de história precisa ser respeitado: o script valida e acusa erro.
- Até a US-01 ficar pronta, o status é atualizado à mão.

## Alternativas descartadas

- **GitHub Issues e Projects:** cada atualização custa chamadas de ferramenta e tokens; fica como espelho opcional no futuro.
