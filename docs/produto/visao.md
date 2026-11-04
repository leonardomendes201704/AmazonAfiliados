# Visão do produto

## 1. Problema e proposta

Quem chega por um criativo no Instagram quer ver, num só lugar e rápido, os produtos que mais vendem na Amazon. A vitrine reúne os mais vendidos por categoria, com nota, avaliações e preço datado. Um clique leva ao produto na Amazon com o link de afiliado, e o dono ganha comissão nas compras qualificadas.

## 2. Público e jornada

- **Visitante:** vem do Instagram, quase sempre pelo celular (link na bio, story ou anúncio). Abre a vitrine, filtra por categoria ou busca, toca em "Ver na Amazon" e compra lá.
- **Dono (Product Owner):** cria os criativos, acompanha os cliques por produto e por campanha (UTM), cuida das categorias e das coletas no painel admin.

## 3. Requisitos funcionais

| ID | Requisito | Prio |
|---|---|---|
| RF-01 | A vitrine lista os mais vendidos de cada categoria. Cada item mostra posição, nome em até 2 linhas, imagem, nota, avaliações, preço (quando permitido) e selo | P0 |
| RF-02 | A vitrine filtra por categoria, busca por nome, aplica os filtros Mais Vendidos, Em Oferta e Bem Avaliados e a faixa de preço. O estado fica na URL e pode ser compartilhado | P0 |
| RF-03 | "Ver na Amazon" leva ao produto com a tag de afiliado, passando por `/r/:asin` | P0 |
| RF-04 | Um worker coleta as páginas públicas de Mais Vendidos por categoria, sem API, numa agenda configurável | P0 |
| RF-05 | Cada coleta guarda o histórico de posição e de preço | P0 |
| RF-06 | O preço aparece com a data e a hora da coleta. Fica oculto se tiver mais de 24 h ou se a chave `show_price` estiver desligada | P0 |
| RF-07 | Painel admin com login único: execuções da coleta, forçar coleta, ocultar ou destacar produto, editar o título exibido, categorias (com a URL da Amazon) e chave de preço | P0 |
| RF-08 | Relatório de cliques por produto, categoria, UTM e período | P0 |
| RF-09 | Todas as páginas mostram o aviso de Associado Amazon e os avisos legais | P0 |
| RF-10 | O dono recebe alerta (Telegram) quando a coleta falha ou é bloqueada, quando o backup falha ou quando a saúde do sistema cai | P0 |
| RF-11 | Gerador de criativos para Instagram (feed 1080×1350 e story 1080×1920) com link UTM próprio | P1 |
| RF-12 | Página "link na bio" por campanha ou criativo, com os produtos do criativo | P1 |
| RF-13 | Favoritos no navegador (coração no card), guardados no `localStorage` | P0 |

## 4. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | **Coleta educada:** no máximo 1 requisição por vez, intervalo aleatório de 20 a 60 s, até cerca de 150 requisições por dia, respeito ao `robots.txt`. Se bloqueada, para, entra em backoff e alerta. Sem nenhuma técnica de evasão |
| RNF-02 | **Desempenho:** LCP abaixo de 2,5 s em 4G no celular, JS inicial da vitrine abaixo de 150 kB gzip, imagens com carregamento preguiçoso |
| RNF-03 | **Fidelidade visual:** igual ao protótipo em 1600×900 e responsivo em 390, 768 e 1024 px |
| RNF-04 | **Acessibilidade:** WCAG 2.1 AA básico (contraste, foco visível, rótulos, navegação por teclado) |
| RNF-05 | **Segurança:** segredos só em env; senha do admin com argon2; cookie `httpOnly`, `Secure` e `SameSite=Lax`; rate limit no login; containers não-root; cabeçalhos de segurança |
| RNF-06 | **LGPD:** cliques sem IP e sem dado pessoal, sem cookies de terceiros, fontes servidas pelo próprio site, política de privacidade publicada |
| RNF-07 | **Operação:** backup diário (7 diários e 4 semanais) com restauração testada, rollback em menos de 5 min, até cerca de 1,3 GB de RAM somando todos os containers |
| RNF-08 | **Resiliência:** se a coleta falhar, o site continua mostrando os últimos dados válidos. A vitrine nunca fica vazia por causa de falha de coleta |
| RNF-09 | **Desenvolvimento rastreável e econômico:** toda mudança ligada a uma tarefa, e o processo de `docs/processo/` seguido |

## 5. Métricas de sucesso

- Cliques para a Amazon por dia e por visitante.
- CTR da vitrine (cliques ÷ visitas com UTM).
- Cliques por campanha e por criativo.
- Percentual de coletas com status `ok` nos últimos 7 dias.
- Idade média dos dados exibidos (meta: menos de 8 h).

## 6. Fora de escopo no MVP

- API oficial da Amazon (fica como adaptador futuro).
- Outras lojas.
- Contas de usuário.
- Comentários.
- SSR/SEO avançado.
- Página de detalhe do produto.
- Filtro Prime (precisa de coleta extra).
- App móvel.

Esses itens estão no EP-10 do `BACKLOG.md`.

## 7. Riscos

| Risco | Mitigação |
|---|---|
| O Programa de Associados restringe preços e conteúdo que não vêm da API oficial | US-27 valida antes do go-live; a chave `show_price` desliga o preço sem deploy (ADR-005) |
| A Amazon bloqueia ou muda o layout | Política educada, detecção de bloqueio, fixtures, alerta e o site seguindo com os últimos dados (RNF-08) |
| VPS compartilhada com pouca memória | `mem_limit` por container e worker sem navegador headless (ADR-004, ADR-006) |
