# Backlog

Índice do backlog. O detalhe de cada história fica em `historias/US-xx.md`, e as sprints em `sprints/Sx.md`.

- **Mudança de status:** sempre por `pnpm backlog ...`. Até a US-01 existir, à mão, aqui e no frontmatter da história.
- **Valores:**
  - Status: `Todo`, `Doing`, `Review`, `Done`, `Blocked`.
  - Prioridade: `P0` (MVP), `P1`, `P2`.
  - Estimativa: `P`, `M`, `G`.
  - `👤` = exige ação do Product Owner.

## Épicos

| Épico | Nome | Prio | Sprint |
|---|---|---|---|
| EP-01 | Fundação | P0 | S1 |
| EP-02 | Dados | P0 | S1 |
| EP-03 | Coleta dos Mais Vendidos | P0 | S2–S3 |
| EP-04 | API pública e saída para a Amazon | P0 | S2–S3 |
| EP-05 | Vitrine | P0 | S3 |
| EP-06 | Painel admin | P0 | S4 |
| EP-07 | Infra e deploy na VPS | P0 | S5 |
| EP-08 | Lançamento | P0 | S6 |
| EP-09 | Criativos para Instagram | P1 | S7 |
| EP-10 | Futuro | P2 | — |

## Histórias

| ID | História | Épico | Prio | Sprint | Est. | Agente(s) | Status |
|---|---|---|---|---|---|---|---|
| US-01 | Monorepo e scripts de processo | EP-01 | P0 | S1 | M | dev-backend | Done |
| US-02 | Ambiente de desenvolvimento com Docker | EP-01 | P0 | S1 | P | devops | Done |
| US-03 | CI no GitHub Actions | EP-01 | P0 | S1 | P | devops 👤 | Done |
| US-04 | Schema, migrações, seed e regras compartilhadas | EP-02 | P0 | S1 | M | dev-backend | Done |
| US-05 | Spike: estrutura da página de Mais Vendidos | EP-03 | P0 | S2 | M | arquiteto | Doing |
| US-06 | Fetcher educado com detecção de bloqueio | EP-03 | P0 | S2 | M | dev-worker | Todo |
| US-07 | Parser da lista de Mais Vendidos | EP-03 | P0 | S2 | M | dev-worker | Todo |
| US-08 | Persistência da coleta | EP-03 | P0 | S2 | M | dev-worker | Todo |
| US-09 | Agendamento, coleta manual e limpeza | EP-03 | P0 | S2 | P | dev-worker | Todo |
| US-10 | Enriquecimento: preço de lista e desconto | EP-03 | P0 | S3 | M | dev-worker | Todo |
| US-11 | API pública do catálogo | EP-04 | P0 | S2 | M | dev-backend | Doing |
| US-12 | Saída para a Amazon com tag e registro de clique | EP-04 | P0 | S3 | P | dev-backend | Todo |
| US-13 | Layout base da vitrine a partir do protótipo | EP-05 | P0 | S3 | M | dev-frontend | Todo |
| US-14 | Card de produto completo | EP-05 | P0 | S3 | M | dev-frontend | Todo |
| US-15 | Filtros, busca e navegação por categoria | EP-05 | P0 | S3 | M | dev-frontend | Todo |
| US-16 | Responsivo, acessibilidade e performance | EP-05 | P0 | S3 | M | dev-frontend | Todo |
| US-17 | Rodapé e páginas legais | EP-05 | P0 | S3 | P | dev-frontend | Todo |
| US-18 | Login do admin | EP-06 | P0 | S4 | M | dev-backend, dev-frontend | Todo |
| US-19 | Execuções da coleta e coleta manual no admin | EP-06 | P0 | S4 | M | dev-backend, dev-frontend | Todo |
| US-20 | Gestão de produtos, categorias e chave de preço | EP-06 | P0 | S4 | M | dev-backend, dev-frontend | Todo |
| US-21 | Relatório de cliques | EP-06 | P0 | S4 | P | dev-backend, dev-frontend | Todo |
| US-22 | Imagens Docker de produção | EP-07 | P0 | S5 | M | devops | Todo |
| US-23 | Compose de produção atrás do proxy existente | EP-07 | P0 | S5 | P | devops 👤 | Todo |
| US-24 | Deploy automatizado e rollback | EP-07 | P0 | S5 | M | devops 👤 | Todo |
| US-25 | Backup e restauração | EP-07 | P0 | S5 | P | devops | Todo |
| US-26 | Logs, saúde e alertas | EP-07 | P0 | S5 | P | dev-worker, devops | Todo |
| US-27 | Validação das regras do Programa de Associados | EP-08 | P0 | S6 | P | 👤, arquiteto | Todo |
| US-28 | Go-live | EP-08 | P0 | S6 | P | devops 👤 | Todo |
| US-29 | Gerador de criativos (feed e story) | EP-09 | P1 | S7 | G | dev-worker | Todo |
| US-30 | Links UTM por criativo e página "link na bio" | EP-09 | P1 | S7 | M | dev-backend, dev-frontend | Todo |
| US-31 | Biblioteca de criativos no admin | EP-09 | P1 | S7 | M | dev-backend, dev-frontend | Todo |

## EP-10: Futuro (P2, ainda sem história detalhada)

| ID | Ideia |
|---|---|
| P2-01 | Página de detalhe do produto com OG dinâmico para compartilhamento |
| P2-02 | Gráfico do histórico de preço e de posição |
| P2-03 | Filtro Prime (precisa de enriquecimento extra) |
| P2-04 | PWA (instalar na tela inicial) |
| P2-05 | SEO: prerender das páginas de categoria e sitemap |
| P2-06 | Adaptador da API oficial da Amazon (`CatalogSource`), quando houver acesso |
| P2-07 | Outras lojas |
| P2-08 | Espelhar o backlog em GitHub Issues |

## Tarefas do Product Owner (👤), em ordem de necessidade

1. Criar o repositório privado no GitHub e informar o remoto (US-03).
2. Passar os nomes de categoria desejados e confirmar as URLs da Amazon depois do spike (US-05).
3. Dar acesso SSH à VPS e informar qual proxy roda nela (US-23).
4. Configurar os segredos `VPS_*` no GitHub e fazer o `docker login ghcr.io` na VPS (US-24).
5. Informar a tag de afiliado, criar o bot do Telegram e passar o chat ID (US-26).
6. Ler as regras do Programa de Associados e decidir com o `arquiteto` (US-27).
7. Configurar o DNS do domínio e a rota no proxy (US-28).
