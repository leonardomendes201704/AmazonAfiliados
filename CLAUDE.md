# Amazon Afiliados: vitrine dos mais vendidos

Vitrine web (SPA React) com os produtos mais vendidos da Amazon Brasil. Um worker coleta as páginas públicas de "Mais Vendidos", sem API, e alimenta o PostgreSQL. Cada clique em "Ver na Amazon" passa pela API: ela registra a origem (UTM) e redireciona com a tag de afiliado. O tráfego vem de criativos publicados no Instagram.

**Estado atual:** o repositório só tem documentação. O código nasce das tarefas do backlog, a partir da sprint S1 (`docs/backlog/sprints/S1.md`).

## Stack (o porquê está nos ADRs em `docs/arquitetura/adr/`)

- Monorepo pnpm, TypeScript estrito, Biome e Vitest (ADR-001)
- `apps/api`: Fastify 5, zod, Drizzle ORM, PostgreSQL 16 (ADR-002)
- `apps/web`: React 19, Vite, Tailwind v4, React Router, TanStack Query (ADR-003)
- `apps/worker`: undici, cheerio e pg-boss para a coleta (ADR-004); Satori e resvg para os criativos (ADR-007)
- Docker Compose numa VPS Hostinger compartilhada, atrás do proxy reverso que já existe nela (ADR-006)

## Mapa do repositório

```
apps/web         vitrine + painel admin (/admin)
apps/api         API REST + redirecionamento /r/:asin
apps/worker      coleta, agendamento, alertas, criativos
packages/db      schema Drizzle, migrações, seed
packages/shared  schemas zod, tipos, formatação pt-BR
infra/           compose (dev e prod), Caddyfile, backup
scripts/         backlog.ts, rastreabilidade.ts, deploy
docs/            produto, arquitetura, worker, frontend, infra, processo, backlog
```

## Comandos (existem a partir da US-01 e da US-02)

```bash
pnpm i
docker compose -f infra/compose.dev.yml up -d   # Postgres local
pnpm db:migrate && pnpm db:seed
pnpm dev                                         # api + worker + web
pnpm test        # Vitest, reporter dot
pnpm lint        # Biome
pnpm typecheck
pnpm backlog status | iniciar T-xx.y | concluir T-xx.y --commit <sha> | bloquear T-xx.y "motivo"
pnpm rastreabilidade                             # regenera docs/rastreabilidade.md
```

## Regras de ouro

1. **Nenhum código sem tarefa.** Todo commit cita a tarefa: `feat(T-07.2): ...`.
2. **Cada tarefa toca só os seus arquivos autorizados.** Se precisar mexer em outro arquivo, registre como pendência e não edite.
3. **Coleta educada** (RNF-01, `docs/worker/coleta.md` §5 e §6):
   - Proibido resolver CAPTCHA, alternar proxy, IP ou User-Agent, ou disfarçar tráfego.
   - Se houver bloqueio, a coleta para, entra em backoff e envia alerta.
4. **Segredos ficam só no `.env`**, que nunca é commitado. O `.env.example` documenta todas as variáveis.
5. **Preço sempre com data e hora.** Quem decide se o preço aparece é a API, conforme a chave `show_price` e o limite de 24 h (ADR-005).
6. **A referência visual é `docs/design/prototipo.html`.** Os tokens ficam em `apps/web/src/styles/tokens.css`.
7. **Se o contrato da API mudar**, atualize `docs/arquitetura/api.md` na mesma tarefa.
8. **Idioma:** código e identificadores em inglês; interface, documentação e mensagens de commit em pt-BR.
9. **Migrações só aditivas** (expandir antes de contrair), para o rollback ser só voltar a tag da imagem.

## Fluxo Scrum (detalhes em `docs/processo/scrum.md`)

- **Papéis:** a sessão principal é o Scrum Master e orquestrador. O usuário é o Product Owner. Os subagentes de `.claude/agents/` são o time.
- **Ciclo:** `/daily` → `/sprint-planejar` → `/tarefa T-xx.y` (uma por vez, ou até 3 em paralelo se forem de apps diferentes) → `/sprint-revisar`.
- **Uma sessão nova por sprint.** O estado vive em `docs/backlog/` e nada depende do histórico do chat.
- **Tarefas `👤`** são do usuário: tag de afiliado, DNS, segredos, repositório no GitHub. O orquestrador só explica o que fazer e espera.

## Time

| Agente | Modelo | Escopo |
|---|---|---|
| `po-scrum` | sonnet | backlog, histórias, sprints (só `docs/backlog/`) |
| `arquiteto` | opus | ADRs, spikes, revisão transversal (uso raro) |
| `dev-backend` | sonnet | `apps/api`, `packages/db`, `packages/shared` |
| `dev-worker` | sonnet | `apps/worker` |
| `dev-frontend` | sonnet | `apps/web` |
| `devops` | sonnet | `infra/`, `.github/`, Dockerfiles, `scripts/deploy*` |
| `qa-revisor` | haiku | verifica critérios, roda os checks e grava a evidência (não edita código de produto) |

## Economia de tokens (obrigatório; regras completas em `docs/processo/economia-tokens.md`)

- **Leitura mínima.** Leia só a história da tarefa e as seções que ela cita. Não explore o repositório "para entender".
- **Delegue por caminho.** Ao delegar, passe o caminho e o ID; nunca cole o conteúdo de arquivos no brief.
- **Respostas curtas.** Subagente responde em até 8 linhas, no formato de `economia-tokens.md` §4.
- **Saídas enxutas:**
  - testes com `--reporter=dot`, mostrando só as falhas;
  - logs com `tail -n 50`;
  - `rg` sempre com caminho;
  - arquivos lidos por faixa de linhas.
- **Status só pelo script.** Use `pnpm backlog`, nunca edite tabelas de status à mão. A exceção é a S1, antes de a US-01 criar o script: aí atualize o frontmatter da história e a linha no `BACKLOG.md`.
- **Arquivos fora da leitura:** `node_modules`, `dist`, `coverage`, lockfile e `.env`.

## Onde está cada coisa

Índice completo em `docs/README.md`.
