# ADR-003: Vitrine SPA em React 19 e Vite (sem SSR)

## Contexto

O tráfego vem de criativos no Instagram (link na bio, stories, anúncios), não de busca orgânica. A vitrine precisa ser rápida no celular e fiel ao protótipo `docs/design/prototipo.html`.

## Decisão

- **Stack:** React 19, Vite, Tailwind v4 (tokens copiados do `@theme` do protótipo), React Router e TanStack Query.
- **Entrega:** build estático servido pelo Caddy do container `web`. O admin é um chunk carregado sob demanda.
- **Meta OG:** estática no `index.html`. OG dinâmico por produto fica no EP-10 (P2).

## Consequências

- Infra simples (arquivos estáticos) e pouca memória.
- SEO limitado. Se o Google virar canal, avaliar prerender das páginas de categoria (EP-10).

## Alternativas descartadas

- **Next.js e React Router em modo framework (SSR):** mais um runtime Node e mais complexidade, sem necessidade para tráfego vindo do Instagram.
