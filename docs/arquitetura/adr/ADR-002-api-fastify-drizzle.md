# ADR-002: API em Fastify 5, zod, Drizzle e PostgreSQL 16

## Contexto

A API é pequena: catálogo, redirecionamento e admin. Precisa de validação forte, OpenAPI e consultas SQL legíveis.

## Decisão

- **Framework:** Fastify 5 com `fastify-type-provider-zod`. Os schemas ficam em `packages/shared`.
- **Plugins:** `@fastify/swagger` (só em dev), `@fastify/helmet`, `@fastify/rate-limit` e `@fastify/cookie`.
- **Banco:** Drizzle ORM com schema em `packages/db` e migrações SQL geradas pelo `drizzle-kit`, aplicadas por `migrate.ts` no deploy.
- **Senha do admin:** hash argon2 (`@node-rs/argon2`). A sessão fica no banco, e o cookie guarda só um token aleatório.

## Consequências

- O contrato tipado é compartilhado com a web.
- As migrações são revisáveis em SQL.
- É preciso manter a disciplina de migrações aditivas.

## Alternativas descartadas

- **NestJS:** verboso para o tamanho do projeto.
- **Prisma:** binário pesado e mais memória.
- **Express:** sem validação e tipagem integradas.
