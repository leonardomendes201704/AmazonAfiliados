# Worker: coleta dos Mais Vendidos (sem API)

## 1. Objetivo e escopo

O worker mantém o catálogo atualizado a partir das **páginas públicas** de Mais Vendidos da amazon.com.br, uma por categoria cadastrada. Ele não usa a API oficial, não faz login e não acessa áreas restritas. A estrutura de código fica preparada para um adaptador da API oficial no futuro: a interface `CatalogSource` vive em `apps/worker/src/sources/`.

## 2. Fonte

- **URL:** a de cada categoria fica em `categories.amazon_url` e é editada no admin. Padrão: `https://www.amazon.com.br/gp/bestsellers/<no-da-categoria>/`.
- **robots.txt:** na data deste documento, o de amazon.com.br **não** bloqueia `/gp/bestsellers`. O worker confere isso em toda execução (cache de 24 h) e aborta se o caminho passar a ser proibido.
- **Volume:** só a 1ª página (top 30 a 50) atende ao `SCRAPE_TOP_N = 30`. Não pagina além do necessário.
- **Spike:** a estrutura real da página é confirmada no spike US-05. Este documento é atualizado com o resultado (§3 e §7).

## 3. Campos coletados

| Campo | Destino | Obrigatório |
|---|---|---|
| posição (rank) | `category_products.rank`, `rankings` | sim |
| ASIN | `products.asin` | sim |
| título | `products.title` (o `display_title` sai de `shortTitle()`) | sim |
| imagem | `products.image_url` | sim |
| nota (0 a 5) | `products.rating` | não |
| nº de avaliações | `products.reviews_count` | não |
| preço atual | `products.price_cents` + `price_collected_at` | não |
| preço de lista | `products.list_price_cents` (só no enriquecimento, US-10) | não |

Um item sem os campos obrigatórios é descartado e contado em `errors`.

## 4. Ciclo de execução

1. O cron do pg-boss (`SCRAPE_CRON`, padrão a cada 6 h) publica `scrape:all`. O admin e a CLI publicam `scrape:all` ou `scrape:category`.
2. **Guardas:**
   - se `SCRAPE_ENABLED=false` ou `scrape_paused`, sai;
   - se `now < scrape_blocked_until`, sai e registra `skipped`;
   - se já existe um run `running`, sai (a fila tem `singletonKey`).
3. Cria um `scrape_run` com status `running` e lê as categorias ativas em `sort_order`.
4. Para cada categoria, **sequencialmente**:
   1. `fetchPolite(url)`;
   2. `detectBlock(response)` (§6): se bloqueou, aborta o run inteiro;
   3. `parseBestSellers(html)` (§7): se o layout mudou, marca a categoria e segue para a próxima;
   4. grava numa transação: upsert de `products`, troca de `category_products`, insert em `rankings` e, quando o preço mudou, em `price_history`;
   5. atualiza `categories.last_scraped_at` e `last_status`.
5. **Fecha o run:**
   - `ok` se todas as categorias deram certo;
   - `partial` se algumas falharam;
   - `blocked` ou `error` nos outros casos.
6. Se o status for diferente de `ok`, envia alerta no Telegram (§10).

## 5. Política educada (requisito RNF-01, não é otimização)

| Regra | Valor |
|---|---|
| Concorrência | **1** requisição por vez, no worker inteiro |
| Intervalo entre requisições | aleatório entre `SCRAPE_DELAY_MIN_S` e `SCRAPE_DELAY_MAX_S` (20 a 60 s) |
| Frequência | cada categoria no máximo a cada 6 h; enriquecimento 1 vez por dia |
| Teto diário | cerca de 150 requisições; o worker recusa novas coletas acima de 200 por dia |
| Timeout e retentativa | 20 s; **1** retentativa só em erro de rede, nunca em 4xx ou 5xx |
| Cabeçalhos | `User-Agent` fixo (`SCRAPE_USER_AGENT`), `Accept-Language: pt-BR`, `Accept-Encoding: gzip`; cookies só durante o run |
| robots.txt | conferido a cada run (cache de 24 h) |

**Proibido, sem exceção:**

- resolver ou contornar CAPTCHA;
- usar proxies, rotação de IP ou rotação de User-Agent;
- forjar fingerprint ou usar navegador headless para escapar de bloqueio;
- paralelizar requisições;
- ignorar o backoff.

Se a coleta não funcionar dentro dessas regras, o problema sobe para o Product Owner (o caminho é a API oficial); a regra não é afrouxada.

## 6. Detecção de bloqueio e resposta

**Sinais de bloqueio:**

- HTTP 503, 429 ou 403;
- redirecionamento para `/errors/validateCaptcha`;
- HTML com formulário de CAPTCHA ou com textos como "Digite os caracteres" ou "Enter the characters";
- página `200` sem nenhum item reconhecível **e** com marcador de página de robô (marcadores definidos no spike).

**Resposta:**

1. Aborta o run, que fica com status `blocked`.
2. Incrementa `scrape_backoff_level` e grava `scrape_blocked_until = now + 6 h × 2^(nível-1)`, com teto de 48 h.
3. Envia alerta no Telegram com a categoria, o sinal e o próximo horário de tentativa.
4. **Mantém os dados atuais** (RNF-08).
5. Um run `ok` zera o nível de backoff.

## 7. Parser

- **Seletores** centralizados em `apps/worker/src/scrape/selectors.ts`, com um comentário de origem (fixture e data).
- **Preferências:**
  - atributos estáveis (`data-asin`, JSON embutido na página, se o spike confirmar) a classes CSS geradas;
  - extrair preço de texto `R$ 1.234,56` com `parseBRL()` de `packages/shared`.
- **Validação:** cada item passa por `ScrapedItemSchema` (zod).
- **Mudança de layout:** se menos de 50% dos itens esperados forem válidos, a categoria vira `layout_changed`. Nesse caso **nada é gravado** para ela e o alerta é enviado.
- **Função pura:** `parseBestSellers(html: string): ScrapedItem[]`, sem rede e sem banco, testável só com fixtures.

## 8. Enriquecimento (P1, US-10)

- Uma vez por dia, para o top 10 de cada categoria, o worker abre a página do produto (`/dp/{ASIN}`).
- Extrai o preço de lista ("De:") e o preço atual, e grava `list_price_cents` com o mesmo `price_collected_at`.
- Segue as mesmas regras do §5 e do §6 e cabe no teto diário.

## 9. Testes e fixtures

**Fixtures** em `apps/worker/test/fixtures/`, salvas no spike US-05, com a data no nome:

- `bestsellers-<categoria>-AAAAMMDD.html`
- `produto-<asin>-AAAAMMDD.html`
- `captcha-sintetico.html`, montado com os marcadores conhecidos (não é para provocar CAPTCHA de verdade)
- `layout-quebrado.html`

**Testes:**

- parser com resultado esperado em JSON (golden);
- detector de bloqueio;
- fetcher com `undici` `MockAgent` (intervalos, timeout, retentativa, teto diário);
- persistência contra o Postgres de teste.

**Nenhum teste acessa a Amazon de verdade.**

**Teste manual controlado:** `pnpm --filter worker coletar <slug> --dry-run` faz uma requisição, imprime os itens e não grava nada.

## 10. Alertas e observabilidade

- **Log JSON** por requisição: `{ runId, category, url, status, ms, bytes, blocked }`.
- **Alerta no Telegram** (`TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`) quando:
  - o run termina com status diferente de `ok`;
  - o backup falha;
  - `/api/saude` falha 3 vezes seguidas (o worker checa a cada 5 min);
  - os dados exibidos têm mais de 24 h.

## 11. Imagens

O sistema usa a URL do CDN da Amazon do jeito que foi coletada: não baixa nem armazena a imagem. O tamanho vem do sufixo da URL. Essa prática é revalidada na US-27.

## 12. Estrutura de código

```
apps/worker/src/
  index.ts              boot do pg-boss, registro de jobs
  jobs/                 scrape-all.ts, scrape-category.ts, enrich.ts, cleanup.ts, health.ts, creatives.ts
  scrape/               fetch-polite.ts, detect-block.ts, parse-bestsellers.ts, selectors.ts, robots.ts
  sources/              catalog-source.ts (interface), amazon-public.ts
  persist/              save-category.ts (transação)
  alerts/telegram.ts
  cli.ts                coletar <slug> [--dry-run]
```
