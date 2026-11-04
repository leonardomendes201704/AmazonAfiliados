# Frontend: vitrine e painel admin (`apps/web`)

## 1. Fonte visual

- **Referência:** `docs/design/prototipo.html` (Tailwind v4 + Alpine). Abra no navegador em 1600×900 e compare com `docs/design/referencia.png`.
- **Fidelidade:** o React reproduz o protótipo em 1600×900. As medidas, cores, raios e sombras estão nas classes e nos tokens dele.
- **Ilustrações SVG dos produtos:** eram placeholders; na vitrine real entram as imagens coletadas. A ilustração da sacola do hero continua.

## 2. Tokens e fonte

- **Tokens:** copiar o bloco `@theme static { ... }` do protótipo para `apps/web/src/styles/tokens.css` sem renomear (`background`, `surface`, `primary`, `primary-light`, `primary-deep`, `danger`, `rating`, `text-hero`, `text-card`, `text-meta`, `text-section`, `radius-card`...).
  - Toda cor sai de um token; nada de `bg-[#hex]`.
- **Fonte:** Nunito (400 a 800) servida pelo próprio site, via `@fontsource-variable/nunito`. Sem Google Fonts (RNF-06).
- **Ícones:** `lucide-react`, com os mesmos nomes do protótipo:
  - `house`, `layout-grid`, `star`, `tag`, `search`;
  - `shield-check`, `truck`, `zap`;
  - `monitor`, `cooking-pot`, `headphones`, `heart`, `dumbbell`, `book-open`;
  - `sliders-horizontal`, `crown`, `shopping-bag`, `chevron-right`, `search-x`.

## 3. Componentes (protótipo → React)

| Componente | Origem no protótipo | Observação |
|---|---|---|
| `Header` | `<header>` | logo, nav (2xl+), busca (lg+), menu hambúrguer (<2xl), busca em linha própria (<lg) |
| `Hero` | `<section>` destaque | título com sublinhado e "raios", subtítulo, `BarraSelos`, `SacolaIlustracao` (xl+) |
| `SidebarCategorias` | `<aside>` | lista vinda de `/api/categorias`; item ativo `bg-primary/15`; gaveta abaixo de lg |
| `PainelFiltros` | "Filtrar por" | faixa de preço e checkboxes com as contagens das facetas |
| `GradeProdutos` | grid | 1, 2, 3, 4 e 5 colunas (ver §7) |
| `CardProduto` | `<article>` | `@container`; título em 2 linhas (`line-clamp-2`); altura fixa |
| `Estrelas` | duas camadas de estrelas | largura = estrelas/5 (meia estrela para baixo) |
| `Selo` | "Mais Vendido" / "-27%" | regra em `dados.md` §3 |
| `Preco` | preço + preço riscado | mostra "atualizado em dd/mm às hh:mm"; some quando `preco = null` |
| `BotaoVerNaAmazon` | botão laranja | `<a href="/r/ASIN?...">` com `rel="sponsored noopener"` e `target="_blank"` |
| `EstadoVazio`, `EstadoErro`, `SkeletonCard` | estado vazio do protótipo | |
| `Rodape` | (novo) | aviso de Associado e avisos legais (US-17) |

## 4. Rotas (React Router)

| Rota | Tela |
|---|---|
| `/` | todas as categorias |
| `/c/:slug` | categoria |
| `?q=&f=mais-vendidos,em-oferta&min=&max=` | estado dos filtros, válido em qualquer rota da vitrine |
| `/privacidade`, `/sobre` | páginas estáticas |
| `/l/:campanha` | página "link na bio" de uma campanha ou criativo (P1, US-30) |
| `/admin/login`, `/admin`, `/admin/execucoes`, `/admin/produtos`, `/admin/categorias`, `/admin/cliques`, `/admin/config` | admin, carregado sob demanda (`lazy`) |
| `*` | 404 |

## 5. Dados

- **Busca de dados:** TanStack Query (`staleTime` de 5 min) contra `/api/*`. Os tipos vêm de `packages/shared`.
- **UTM:** no carregamento, os `utm_*` da URL vão para o `sessionStorage` e entram em todo `linkSaida` (`/r/ASIN?utm_...&cat=slug`).
- **Favoritos (RF-13):** ficam no `localStorage` (`favoritos: string[]` de ASINs). Leitura e escrita protegidas por `try/catch`.

## 6. Estados

- **Carregando:** 10 `SkeletonCard`s com as dimensões do card.
- **Erro:** mensagem e botão "Tentar de novo".
- **Vazio:** igual ao do protótipo, com "Ver todos os produtos".
- **Dados antigos:** se `atualizadoEm` tiver mais de 24 h, aparece uma faixa discreta "Lista atualizada em ...".

## 7. Responsivo (breakpoints do protótipo)

| Elemento | Comportamento |
|---|---|
| Grade | 1 coluna abaixo de 440 px · 2 colunas a partir de 440 px · 3 em `md` · 4 em `xl` · 5 em `2xl` |
| Sidebar | fixa a partir de `lg`; abaixo disso vira gaveta com o botão "Categorias e filtros" |
| Nav do header | só a partir de `2xl`; abaixo disso fica no menu hambúrguer |
| Busca | no header a partir de `lg`; abaixo disso em linha própria |
| Barra de selos | em linha única a partir de `lg`; abaixo disso em grade 2×2 |
| Geral | nenhum overflow horizontal em 390 px; nomes curtos com `whitespace-nowrap` |

## 8. Acessibilidade

- HTML semântico (`header`, `nav`, `aside`, `main`, `article`, `button`, `a`).
- `aria-label` em botões que têm só ícone, `aria-pressed` no favorito, `aria-current` na categoria ativa.
- Foco visível com o token `primary`; navegação completa por teclado.

## 9. Performance (RNF-02)

- Imagens com `loading="lazy"`, `decoding="async"` e `width`/`height` fixos. As 5 primeiras usam `fetchpriority="high"`.
- Admin num chunk separado; JS inicial da vitrine abaixo de 150 kB gzip (conferido no build).
- Sem bibliotecas de UI pesadas: só Tailwind, componentes próprios e lucide-react com import por ícone.

## 10. Admin (US-18 a US-21)

- Usa os mesmos tokens da vitrine, com layout simples: sidebar de navegação, tabelas e formulários.
- **Telas:**
  - **Execuções:** tabela com status colorido, duração, itens e erros, mais o botão "Coletar agora".
  - **Produtos:** busca, ocultar, destacar e editar o título exibido.
  - **Categorias:** CRUD com a URL da Amazon.
  - **Cliques:** período e agrupamento; gráfico simples por dia em SVG próprio, sem biblioteca.
  - **Config:** chave de preço e pausa da coleta.

## 11. Validação visual

Teste Playwright em `apps/web/e2e/visual.spec.ts`:

- captura em 1600×900 com o seed carregado e compara com `docs/design/referencia.png`. É um guia de revisão, não um gate de pixel: as fotos e os textos reais diferem;
- capturas de controle em 390×844 e 768×1024, verificando que não há overflow horizontal.
