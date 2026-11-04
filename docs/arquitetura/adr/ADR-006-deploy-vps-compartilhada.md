# ADR-006: Deploy na VPS compartilhada via rede do proxy, GHCR e SSH

## Contexto

A VPS Hostinger já hospeda outros sites, com um proxy reverso que termina o TLS. Compilar na VPS disputaria CPU e RAM com eles.

## Decisão

- **Imagens:** multi-stage, usuário não-root e healthchecks. Publicadas no GHCR pelo GitHub Actions; o deploy é feito por SSH (`docs/infra/vps-hostinger.md` §7).
- **Rede:** sem portas publicadas. Só o `web` entra na rede externa `${PROXY_NETWORK}`, e há trechos de configuração para Caddy, Nginx e Traefik.
  - Alternativa para proxy instalado no host: `compose.hostport.yml` com `127.0.0.1:${WEB_PORT}`.
- **Recursos:** `mem_limit` por serviço, somando cerca de 1,3 GB.
- **Rollback:** voltar o `IMAGE_TAG`. As migrações são só aditivas.
- **Sem GHCR:** existe um deploy manual (`docker save | ssh docker load`).

## Consequências

- Deploy reprodutível e sem build na VPS.
- Exige um repositório no GitHub e segredos SSH (tarefas `👤`).

## Alternativas descartadas

- **Coolify, Dokploy ou Portainer:** mais uma camada numa VPS compartilhada.
- **Build na VPS:** consome recursos dos outros sites.
