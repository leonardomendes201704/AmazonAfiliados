# Amazon Afiliados

Vitrine web com os produtos mais vendidos da Amazon Brasil. Um worker coleta as páginas públicas de "Mais Vendidos" e alimenta o PostgreSQL. Cada clique em "Ver na Amazon" passa pela API, que registra a origem (UTM) e redireciona com a tag de afiliado. O tráfego vem de criativos publicados no Instagram.

## Quickstart

```bash
pnpm i
cp .env.example .env
docker compose -f infra/compose.dev.yml up -d --wait
pnpm db:migrate && pnpm db:seed
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
```

## Mais informações

- [CLAUDE.md](CLAUDE.md)
- [docs/README.md](docs/README.md)
