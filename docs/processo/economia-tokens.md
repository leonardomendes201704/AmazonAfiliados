# Economia de tokens

O objetivo é gastar o mínimo de contexto por tarefa, sem perder qualidade. As regras valem para o orquestrador e para todos os subagentes.

## 1. Princípios

1. **Os arquivos são a memória.** Nada importante fica só no chat: status, decisões e evidências vão para `docs/`. Por isso dá para começar uma sessão nova a cada sprint sem perder nada.
2. **A história é o contexto.** Cada `US-xx.md` é autocontida e cita as seções (`§`) que precisam ser lidas. O agente lê **só** isso e os arquivos que vai editar.
3. **Delegar custa contexto duplo.** Só delegue tarefa de código, revisão ou planejamento. Consultas de 1 ou 2 comandos ficam com o orquestrador.
4. **Trabalho mecânico vai para script, não para LLM.** Status, matriz de rastreabilidade, formatação (Biome) e lint (git hooks) não passam por modelo.

## 2. Modelo por papel

| Papel | Modelo | Por quê |
|---|---|---|
| `qa-revisor` | haiku | roda comandos e compara com critérios explícitos |
| `po-scrum`, `dev-*`, `devops` | sonnet | qualidade suficiente para código e escrita com custo médio |
| `arquiteto` | opus | só em spike, ADR e revisão de risco (poucas vezes por projeto) |
| orquestrador | o da sessão | coordena; não implementa |

Se o `qa-revisor` reprovar duas vezes a mesma tarefa, o orquestrador chama o `arquiteto` uma vez para diagnosticar, em vez de insistir.

## 3. Formato do brief (orquestrador → subagente)

```
Tarefa T-07.2 de docs/backlog/historias/US-07.md.
Leia a história e só as seções citadas nela. Arquivos autorizados: os da linha T-07.2.
Pendências da rodada anterior (se houver): 1) ... 2) ...
Responda no formato de docs/processo/economia-tokens.md §4.
```

Nunca cole no brief conteúdo de arquivo, diff ou log longo: passe o caminho.

## 4. Formato da resposta (subagente → orquestrador), até 8 linhas

```
STATUS: PRONTO | BLOQUEADO | APROVADO | REPROVADO
TAREFA: T-07.2
ARQUIVOS: apps/worker/src/scrape/parse-bestsellers.ts, apps/worker/test/parse.test.ts
VERIFICAÇÃO: pnpm --filter worker test → 18 ✓ 0 ✗
PENDÊNCIAS: nenhuma | 1) ...
NOTA: (opcional, 1 linha)
```

O `qa-revisor` acrescenta `DEFEITOS: 1) ... 2) ...` quando reprova.

## 5. Leitura e busca

- **Busca:** `rg -n "termo" caminho/` com caminho e `-g` por tipo. Nunca `rg` na raiz sem filtro.
- **Leitura:** arquivos acima de 200 linhas se leem por faixa. Leia de novo só o trecho que mudou.
- **Antes de editar:** no máximo cerca de 5 arquivos lidos por tarefa. Se precisar de mais, a história está mal especificada: devolva `BLOQUEADO` com o motivo.
- **Arquivos que não se leem:** `node_modules`, `dist`, `coverage`, `pnpm-lock.yaml`, `.env` (bloqueados em `.claude/settings.json`).
- **Imagens:** só quando a tarefa pede comparação visual.

## 6. Saída de comandos

| Comando | Como rodar |
|---|---|
| Testes | `vitest run --reporter=dot`; em falha, `--reporter=verbose` só no arquivo que falhou |
| Build | sucesso só como `✓`; em erro, `2>&1 \| tail -n 40` |
| Logs | `docker compose logs --tail=50 <svc>` |
| Git | `git status -s`, `git diff --stat`; diff completo só do arquivo em questão |
| Instalação | `pnpm i --reporter=silent` |

## 7. Paralelismo

- No máximo **3** subagentes ao mesmo tempo, e só em tarefas de apps diferentes (ex.: `dev-worker` na US-07 e `dev-backend` na US-11).
- Nunca dois agentes no mesmo pacote ao mesmo tempo.
- O orquestrador espera as notificações; não fica conferindo o progresso.

## 8. Sessões e compactação

- Uma sessão nova por sprint (`/clear`), que começa com `/daily`.
- Se a sessão ficar longa no meio da sprint, encerre depois de um commit. Como o estado está nos arquivos, a próxima retoma com `/daily`.

## 9. Anti-padrões (não fazer)

- Pedir ao subagente para "entender o projeto" ou "explorar o código".
- Reler o `CLAUDE.md` ou documentos inteiros dentro de subagentes (o `CLAUDE.md` já é carregado).
- Colar resultados completos de testes ou logs na resposta.
- Atualizar tabelas de status à mão quando o script existe.
- Pedir revisão ao `arquiteto` (opus) para coisas que o `qa-revisor` resolve.
- Refatorar fora do escopo "aproveitando que está aberto".
