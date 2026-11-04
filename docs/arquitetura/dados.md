# Modelo de dados (PostgreSQL 16 + Drizzle)

## 1. Convenções

- Tabelas e colunas em inglês, `snake_case`, no plural. Chaves `id` são `serial` ou `bigserial`.
- Datas sempre em `timestamptz`, gravadas em UTC; a conversão para `America/Sao_Paulo` acontece só na exibição.
- Dinheiro em **centavos** (`integer`). Nunca usar `float`.
- O schema fica em `packages/db/src/schema.ts` e as migrações geradas pelo `drizzle-kit` em `packages/db/migrations/`.
- Migrações só aditivas (ver `CLAUDE.md`, regra 9).

## 2. Tabelas

**categories**: categorias exibidas na vitrine.

| Coluna | Tipo | Nota |
|---|---|---|
| id | serial PK | |
| slug | text unique | `eletronicos`, `casa`, ... |
| name | text | "Eletrônicos" |
| icon | text | nome do ícone Lucide (`monitor`) |
| amazon_url | text | URL da página de Mais Vendidos da categoria |
| sort_order | int | ordem na sidebar |
| is_active | bool default true | |
| last_scraped_at | timestamptz null | |
| last_status | text null | `ok`, `blocked`, `error`, `layout_changed` |

"Todas as categorias" é virtual e não tem linha na tabela.

**products**

| Coluna | Tipo | Nota |
|---|---|---|
| id | serial PK | |
| asin | varchar(10) unique | `^[A-Z0-9]{10}$` |
| title | text | título completo coletado |
| display_title | text | título curto do card, com até 60 caracteres e editável no admin. O padrão vem de `shortTitle()` em `packages/shared` |
| slug | text unique | a partir de `display_title` + asin |
| image_url | text | URL do CDN da Amazon, como foi coletada |
| rating | numeric(2,1) null | 0,0 a 5,0 |
| reviews_count | int null | |
| price_cents | int null | |
| list_price_cents | int null | preço "de"; vem do enriquecimento (US-10) |
| price_collected_at | timestamptz null | quando o preço foi visto |
| is_visible | bool default true | ocultado pelo admin |
| is_featured | bool default false | destacado pelo admin (aparece primeiro) |
| first_seen_at, last_seen_at, updated_at | timestamptz | |

**category_products**: lista atual de cada categoria. É trocada inteira a cada coleta bem-sucedida da categoria.

| Coluna | Tipo |
|---|---|
| category_id | FK |
| product_id | FK |
| rank | int |
| updated_at | timestamptz |

PK `(category_id, product_id)`; índice `(category_id, rank)`.

**rankings**: histórico das posições, com as colunas `id bigserial`, `run_id FK`, `category_id`, `product_id`, `rank` e `collected_at`. Índice `(product_id, collected_at)`.

**price_history**: colunas `id bigserial`, `product_id`, `price_cents`, `list_price_cents` e `collected_at`. Uma linha nova só quando o preço muda.

**scrape_runs**

| Coluna | Tipo | Nota |
|---|---|---|
| id | serial PK | |
| trigger | text | `cron`, `manual` ou `cli` |
| status | text | `running`, `ok`, `partial`, `blocked`, `error` |
| started_at, finished_at | timestamptz | |
| categories_total, categories_ok, items_found, http_requests | int | |
| errors | jsonb | `[{ category, kind, message }]` |

**clicks**: sem IP e sem dado pessoal (RNF-06).

| Coluna | Tipo |
|---|---|
| id | bigserial PK |
| product_id | FK |
| category_slug | text null |
| utm_source, utm_medium, utm_campaign, utm_content | text null |
| creative_id | int null (P1) |
| referrer_host | text null |
| is_bot | bool |
| created_at | timestamptz |

Índices `(created_at)` e `(product_id, created_at)`.

**settings**: pares chave-valor, com as colunas `key text PK`, `value jsonb` e `updated_at`.

| Chave | Tipo | Significado |
|---|---|---|
| `show_price` | bool | mostra ou esconde o preço |
| `scrape_paused` | bool | pausa manual da coleta |
| `scrape_blocked_until` | timestamptz | backoff depois de um bloqueio |
| `scrape_backoff_level` | int | nível atual do backoff exponencial |

**admin_sessions**: colunas `id` (hash SHA-256 do token), `created_at`, `expires_at` (7 dias) e `last_seen_at`.

**creatives** (P1, US-29): colunas `id`, `format` (`feed` ou `story`), `title`, `product_ids int[]`, `file_path`, `utm_campaign`, `utm_content`, `created_at`.

## 3. Regras de exibição (implementadas em `packages/shared`, usadas por API e criativos)

- **Desconto:** `discountPct = floor((list - price) / list * 100)`. Só vale quando os dois preços existem e são do mesmo momento.
- **Selo do card:** se `discountPct ≥ 5`, o selo é `-{discountPct}%` (vermelho). Senão, se `rank ≤ 3` na categoria em exibição, o selo é "Mais Vendido" (laranja). Senão, sem selo.
  - Na visão "Todas", vale o menor rank do produto entre as categorias.
- **Estrelas:** a nota arredondada **para baixo** em meia estrela (4,7, 4,8 e 4,9 mostram 4,5 estrelas).
- **Filtros (facetas):**
  - "Mais Vendidos": `rank ≤ 10`.
  - "Em Oferta": `discountPct ≥ 5`.
  - "Bem Avaliados": `rating ≥ 4,5` e `reviews_count ≥ 100`.
  - A API devolve a contagem de cada um.
- **Preço visível** (decidido **só** na API, ADR-005): `show_price = true`, `price_cents` presente e `now - price_collected_at ≤ PRICE_MAX_AGE_HOURS`. Fora disso, a API devolve `preco: null`.
- **Ordem:** `is_featured desc`, depois o rank da categoria (ou o menor rank em "Todas").

## 4. Retenção (job diário `maintenance:cleanup`)

| Tabela | Mantém |
|---|---|
| rankings | 180 dias |
| scrape_runs | 90 dias |
| clicks | 24 meses |
| price_history | sem limite (é pequena) |
| admin_sessions | só as que não expiraram |

## 5. Seed (US-04)

- As 7 categorias do protótipo: Eletrônicos, Casa e Decoração, Cozinha, Acessórios, Cuidados Pessoais, Esporte e Lazer e Livros. `amazon_url` fica como placeholder até o spike US-05.
- Os 10 produtos do protótipo, com ASINs fictícios marcados como `SEED…`, para desenvolver a vitrine sem coleta.
- `settings` com `show_price = SHOW_PRICE_DEFAULT`.
