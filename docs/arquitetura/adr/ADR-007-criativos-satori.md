# ADR-007: Criativos com Satori e resvg (sem navegador)

## Contexto

O épico P1 gera imagens para o Instagram (feed 1080×1350 e story 1080×1920) com os mais vendidos, usando a identidade visual da vitrine. Não há memória sobrando para um Chromium.

## Decisão

- **Renderização:** Satori converte JSX em SVG, com Nunito e os tokens de `packages/shared/src/brand.ts`, e o `@resvg/resvg-js` converte o SVG em PNG. Tudo roda no `worker`.
- **Arquivos e links:** cada criativo gera PNGs num volume (`/data/criativos`), um registro em `creatives` e um link `PUBLIC_BASE_URL/l/{campanha}?utm_source=instagram&utm_campaign=...&utm_content=...`.
- **Imagens dos produtos:** baixadas no momento da geração para compor o PNG. Não ficam guardadas além do próprio criativo.

## Consequências

- Leve e determinístico (dá para testar com snapshot).
- O Satori não suporta todo o CSS: os layouts dos criativos são escritos com flexbox simples.

## Alternativas descartadas

- **Playwright fazendo screenshot de HTML:** RAM alta.
- **Canva ou Figma via API:** dependência externa e custo.
