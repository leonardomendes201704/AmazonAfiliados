# Contrato da API

O OpenAPI gerado a partir dos schemas zod (`GET /api/docs`, só em dev) é a fonte da verdade. Este documento é o resumo que orienta o desenvolvimento. Se uma tarefa mudar o contrato, ela atualiza este arquivo.

## 1. Convenções

- Prefixo `/api`, JSON com chaves em camelCase (português nos nomes de domínio da vitrine, como já está no contrato abaixo).
- Erros em `application/problem+json` (RFC 7807): `{ type, title, status, detail }`.
- Validação de entrada e de saída com zod (`fastify-type-provider-zod`). Os schemas compartilhados ficam em `packages/shared`.
- **Cache:** respostas públicas com `Cache-Control: public, max-age=300` e `ETag`; admin com `no-store`.
- **Segurança:** `@fastify/helmet`, rate limit em `/api/admin/login` (5 por minuto) e em `/r` (60 por minuto por IP, contado só em memória). Sem CORS, porque a mesma origem é servida pelo Caddy.
- **Logs:** pino em JSON, sem querystring sensível e sem IP persistido.

## 2. Vitrine (pública)

### `GET /api/categorias`

Resposta `200`:

```json
[{ "slug": "eletronicos", "nome": "Eletrônicos", "icone": "monitor", "total": 30 }]
```

### `GET /api/produtos`

**Parâmetros**

| Parâmetro | Tipo | Nota |
|---|---|---|
| `categoria` | slug | opcional; sem ele, todas |
| `busca` | texto | ignora acento e caixa |
| `filtros` | lista separada por vírgula | `mais-vendidos`, `em-oferta`, `bem-avaliados` |
| `precoMin`, `precoMax` | reais inteiros | |
| `pagina` | número | padrão 1 |
| `porPagina` | número | padrão 20, máximo 60 |

**Resposta `200`**

```json
{
  "itens": [{
    "asin": "B09B8V1LZ3", "slug": "echo-dot-5-geracao-b09b8v1lz3",
    "titulo": "Echo Dot (5ª Geração) – Smart Speaker com Alexa",
    "imagemUrl": "https://m.media-amazon.com/images/I/....jpg",
    "nota": 4.8, "avaliacoes": 126340, "ranking": 1,
    "preco": { "centavos": 32900, "listaCentavos": null, "descontoPct": null, "coletadoEm": "2026-11-04T12:00:00Z" },
    "selo": "mais-vendido", "destaque": false,
    "linkSaida": "/r/B09B8V1LZ3"
  }],
  "total": 30, "pagina": 1,
  "facetas": { "maisVendidos": 10, "emOferta": 4, "bemAvaliados": 18 },
  "atualizadoEm": "2026-11-04T12:00:00Z"
}
```

`preco` vem `null` quando o preço não pode ser exibido (`docs/arquitetura/dados.md` §3). `selo` pode ser `mais-vendido`, `desconto` ou `null`.

### `GET /api/config/publica`

Resposta `200`: `{ "mostrarPreco": true, "atualizadoEm": "..." }`, onde `atualizadoEm` é a última coleta `ok`.

### `GET /api/saude`

- `200`: `{ "status": "ok", "db": "ok", "ultimaColeta": "...", "versao": "<sha>" }`.
- `503` se o banco cair.

## 3. Saída para a Amazon

### `GET /r/:asin`

- **Entrada:** query opcional `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `cat` e `criativo`.
- **Validação:** ASIN com `^[A-Z0-9]{10}$`, produto existente e visível. Se não passar, `404` com problem+json.
- **Efeito:** grava em `clicks` de forma assíncrona (não atrasa o redirecionamento) e marca `is_bot` por User-Agent.
- **Resposta:** `302 Location: https://www.amazon.com.br/dp/{ASIN}?tag={AMAZON_AFFILIATE_TAG}`, com `Cache-Control: no-store` e `Referrer-Policy: no-referrer-when-downgrade`.

## 4. Admin (cookie `sid`; todas as rotas exigem sessão, exceto login)

| Método e rota | Função |
|---|---|
| `POST /api/admin/login` `{ email, senha }` | cria a sessão (cookie `httpOnly`, `Secure`, `SameSite=Lax`, 7 dias) |
| `POST /api/admin/logout` | encerra a sessão |
| `GET /api/admin/me` | `{ email }` ou `401` |
| `GET /api/admin/execucoes?pagina=` | lista de `scrape_runs` com erros resumidos |
| `POST /api/admin/coletas` `{ categoria?: slug }` | enfileira a coleta; responde `202 { jobId }`. Recusa com `409` se já houver run `running` ou se estiver em backoff (a menos que venha `forcar: true`) |
| `GET /api/admin/produtos?busca=&categoria=&pagina=` | lista com `isVisible`, `isFeatured` e `displayTitle` |
| `PATCH /api/admin/produtos/:id` `{ isVisible?, isFeatured?, displayTitle? }` | edita o produto |
| `GET/POST/PATCH /api/admin/categorias[/:id]` | CRUD (`slug`, `nome`, `icone`, `amazonUrl`, `ordem`, `ativa`) |
| `GET /api/admin/cliques?de=&ate=&agrupar=produto\|categoria\|campanha\|origem\|dia` | relatório agregado |
| `GET/PATCH /api/admin/config` `{ mostrarPreco?, coletaPausada? }` | lê e altera as configurações |
| `GET/POST /api/admin/criativos` (P1) | lista e gera criativos |
