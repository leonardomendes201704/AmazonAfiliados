# ADR-004: Coleta das páginas públicas de Mais Vendidos (sem API)

## Contexto

O produto precisa dos mais vendidos por categoria sem depender da API oficial da Amazon. A VPS é compartilhada e tem pouca memória. Bloqueios e mudanças de layout vão acontecer.

## Decisão

- **Tecnologia:** HTTP com `undici` e parse com `cheerio`. Navegador headless não é padrão.
- **Agenda e fila:** pg-boss, que roda no próprio PostgreSQL e dispensa Redis. Cron em `SCRAPE_CRON` e jobs `singleton`.
- **Política educada obrigatória** (`docs/worker/coleta.md` §5):
  - 1 requisição por vez;
  - intervalo de 20 a 60 s;
  - cada categoria no máximo a cada 6 h;
  - teto de cerca de 150 requisições por dia;
  - respeito ao `robots.txt`.
- **Bloqueio** (CAPTCHA, 503, 429 ou 403): aborta, aplica backoff exponencial (de 6 a 48 h) e alerta.
  - **Proibido** contornar: nada de resolver CAPTCHA, usar proxy, alternar IP ou User-Agent, ou disfarçar fingerprint.
- **Parser:** função pura testada com fixtures. A mudança de layout é detectada por validação zod (menos de 50% de itens válidos significa que mudou).
- **Fonte trocável:** a interface `CatalogSource` permite um adaptador da API oficial no futuro.

## Consequências

- Baixo consumo e testes sem rede.
- A fonte pode falhar por dias: o site continua com os últimos dados (RNF-08).
- Se a Amazon bloquear de forma persistente, a saída é a API oficial, não a evasão.

## Alternativas descartadas

- **Playwright como padrão:** cerca de 400 MB a mais de RAM e risco de virar ferramenta de evasão.
- **Serviços de scraping com proxies rotativos:** violam a política educada.
