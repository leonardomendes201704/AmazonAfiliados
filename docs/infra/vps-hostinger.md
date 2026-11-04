# Infra: VPS Hostinger compartilhada

## 1. Visão

- **A VPS já hospeda outros sites** e já tem um proxy reverso que termina o TLS (Caddy, Nginx ou Traefik). A plataforma **não publica portas**.
- **Só o container `web`** entra na rede Docker do proxy (`${PROXY_NETWORK}`), e o proxy encaminha o domínio para ele.
- **Os demais containers** (`db`, `api`, `worker`, `backup`) ficam numa rede interna.

## 2. Pré-requisitos (👤 tarefas do usuário)

- Ubuntu 22.04 ou 24.04 com Docker Engine e o plugin compose (`docker compose version`).
- Usuário `deploy` no grupo `docker`, com acesso por chave SSH (sem senha).
- Registro DNS `A`/`AAAA` do domínio (ex.: `maisvendidos.seudominio.com.br`) apontando para o IP da VPS.
- Livre na VPS: cerca de 1,3 GB de RAM e 10 GB de disco.
- Tag de afiliado da Amazon (`AMAZON_AFFILIATE_TAG`) e, se quiser alertas, um bot do Telegram (`@BotFather`).

## 3. Descobrir o proxy existente (US-23)

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
sudo ss -ltnp | grep -E ':(80|443)\b'
docker network ls
docker inspect <container-do-proxy> --format '{{json .NetworkSettings.Networks}}'
```

| O que aparece | Configuração |
|---|---|
| Proxy **em container** | use a rede dele como `PROXY_NETWORK` e siga o §6 |
| Proxy **instalado no host** (fora do Docker) | use `infra/compose.hostport.yml`: publica `web` só em `127.0.0.1:${WEB_PORT}`, e o proxy aponta para lá |

## 4. Layout na VPS

```
/opt/amazonafiliados/
  compose.yml           cópia de infra/compose.yml
  compose.proxy.yml     ou compose.hostport.yml
  .env                  chmod 600, dono deploy
  backups/              volume do serviço backup
```

`COMPOSE_FILE=compose.yml:compose.proxy.yml` no `.env`, para que `docker compose` sem `-f` funcione.

## 5. Compose de produção (US-22, US-23)

- **Imagens:** `ghcr.io/<owner>/amazonafiliados-{api,worker,web}:${IMAGE_TAG}`.
- **Containers:** `restart: unless-stopped`, `user` não-root, `read_only: true` com `tmpfs: /tmp` quando a imagem permitir.
- **Logs:** `logging: { driver: json-file, options: { max-size: 10m, max-file: "3" } }`.
- **Healthchecks:**
  - `db`: `pg_isready`;
  - `api`: `wget -qO- localhost:3000/api/saude`;
  - `web`: `wget -qO- localhost/`;
  - `worker`: checa um arquivo de heartbeat com menos de 2 min.
- **Ordem de subida:** `api` e `worker` esperam o `db` ficar `healthy`. As migrações rodam num passo separado do deploy (§7).
- **Memória (`mem_limit`):** db 512m · api 256m · worker 384m · web 64m · backup 64m.
- **`compose.proxy.yml`:** adiciona ao `web` `container_name: ${WEB_CONTAINER_NAME}` e a rede `proxy` (`external: true`, `name: ${PROXY_NETWORK}`).

## 6. Configuração no proxy existente (👤 com ajuda do `devops`)

**Caddy (Caddyfile do host):**

```
maisvendidos.seudominio.com.br {
  encode zstd gzip
  reverse_proxy amazonafiliados-web:80
}
```

**Nginx (server block):**

```nginx
server {
  server_name maisvendidos.seudominio.com.br;
  location / {
    proxy_pass http://amazonafiliados-web:80;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
  # TLS: certbot ou a configuração que o proxy já usa
}
```

**Traefik (labels no `web`, em `compose.proxy.yml`):**

```yaml
labels:
  - traefik.enable=true
  - traefik.http.routers.amzaf.rule=Host(`maisvendidos.seudominio.com.br`)
  - traefik.http.routers.amzaf.entrypoints=websecure
  - traefik.http.routers.amzaf.tls.certresolver=<resolver-existente>
  - traefik.http.services.amzaf.loadbalancer.server.port=80
```

O Caddy interno do `web` (`infra/Caddyfile`) serve a SPA (fallback para `index.html`), repassa `/api/*` e `/r/*` para `api:3000`, aplica cabeçalhos de segurança e confia nos IPs privados do proxy (`trusted_proxies private_ranges`).

## 7. Deploy automatizado (US-24)

`.github/workflows/deploy.yml` roda num push para `main` com a CI verde, ou manualmente (`workflow_dispatch`):

1. Build multi-stage das 3 imagens e push no GHCR com a tag `${{ github.sha }}` e `latest`.
2. Acessa a VPS por SSH (`appleboy/ssh-action` ou `ssh` puro) e executa:

```bash
cd /opt/amazonafiliados
export IMAGE_TAG=<sha>
docker compose pull
docker compose run --rm api node dist/migrate.js
docker compose up -d --remove-orphans
sleep 10 && docker compose exec -T web wget -qO- localhost/api/saude
echo <sha> >> deploys.log
```

**Segredos do repositório (👤):** `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT`.

**Na VPS (👤, uma vez):** `docker login ghcr.io` com um token de leitura de pacotes.

## 8. Rollback

```bash
cd /opt/amazonafiliados
IMAGE_TAG=$(tail -n 2 deploys.log | head -n 1) docker compose up -d
```

Funciona porque as migrações são só aditivas. Meta: menos de 5 min (RNF-07).

## 9. Deploy manual (alternativa sem GHCR)

`scripts/deploy-manual.sh <ssh-destino>`:

1. faz o build local das imagens;
2. envia com `docker save | gzip | ssh destino 'gunzip | docker load'`;
3. roda os mesmos passos do §7.

## 10. Backup e restauração (US-25)

- **Rotina:** o serviço `backup` (imagem postgres:16-alpine com um loop que dorme até 03:30 em America/Sao_Paulo) roda `pg_dump -Fc` em `/backups/diario/AAAA-MM-DD.dump`. Aos domingos, também copia para `semanal/`.
- **Retenção:** 7 diários e 4 semanais.
- **Alerta de falha:** o backup grava `/backups/ultimo-status` e o worker lê esse arquivo por um volume compartilhado, só leitura.
- **Restaurar:**

```bash
docker compose exec -T db pg_restore --clean --if-exists -U app -d amazonafiliados < backups/diario/AAAA-MM-DD.dump
```

- **Teste de restauração:** `scripts/testar-restauracao.sh` restaura o último dump num container temporário e confere a contagem de `products`. Roda na US-25 e depois uma vez por mês (lembrete no `/sprint-revisar`).
- **Cópia fora da VPS (opcional, 👤):** rclone para um storage S3 compatível.

## 11. Logs, saúde e alertas (US-26)

- **Logs:** em JSON no stdout. `docker compose logs -f --tail=100 api worker`.
- **Saúde:** `/api/saude`.
- **Alertas no Telegram:** vêm do worker (`docs/worker/coleta.md` §10).

## 12. Segurança

- **Isolamento:** sem portas publicadas, containers não-root, `.env` com `chmod 600`, `db` sem acesso externo.
- **Manutenção da VPS (👤):** atualizações do sistema e `ufw` ficam com o dono, porque a VPS é compartilhada. A plataforma não mexe no firewall.
- **Cabeçalhos HTTP:** `Strict-Transport-Security` (no proxy), `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy` (imagens só de `self` e `m.media-amazon.com`).

## 13. Checklist de go-live (US-28)

- [ ] DNS propagado e HTTPS válido
- [ ] `/api/saude` responde 200
- [ ] coleta manual `ok` em todas as categorias
- [ ] clique em `/r/ASIN` leva à Amazon com a tag certa
- [ ] alerta de teste chega no Telegram
- [ ] backup gerado e restauração testada
- [ ] US-27 concluída (regras do Programa de Associados validadas)
- [ ] rollback ensaiado
