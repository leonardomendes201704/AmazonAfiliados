# Índice da documentação

Cada documento é dividido em seções numeradas (`§n`). As histórias do backlog citam só as seções necessárias: leia apenas essas.

| Documento | Conteúdo |
|---|---|
| [produto/visao.md](produto/visao.md) | Problema, público, requisitos RF/RNF, métricas, fora de escopo |
| [arquitetura/visao-geral.md](arquitetura/visao-geral.md) | Containers, fluxos, ambientes, variáveis de ambiente |
| [arquitetura/dados.md](arquitetura/dados.md) | Tabelas, índices, regras de selo e filtro, retenção |
| [arquitetura/api.md](arquitetura/api.md) | Contrato da API pública, do redirecionamento e do admin |
| [arquitetura/adr/](arquitetura/adr/) | Decisões de arquitetura ADR-001 a ADR-008 |
| [worker/coleta.md](worker/coleta.md) | Coleta dos Mais Vendidos: fonte, campos, ciclo, política educada, bloqueio, testes |
| [frontend/vitrine.md](frontend/vitrine.md) | Do protótipo aos componentes React: tokens, rotas, estados, responsivo, admin |
| [design/prototipo.html](design/prototipo.html) | Protótipo visual (1600×900) e [referencia.png](design/referencia.png) |
| [infra/vps-hostinger.md](infra/vps-hostinger.md) | VPS compartilhada: proxy existente, deploy, rollback, backup, alertas |
| [processo/scrum.md](processo/scrum.md) | Papéis, cerimônias, DoR/DoD, IDs, commits, rastreabilidade |
| [processo/economia-tokens.md](processo/economia-tokens.md) | Regras de contexto, modelo por papel, formato de brief e de resposta |
| [backlog/BACKLOG.md](backlog/BACKLOG.md) | Índice de épicos, histórias e status |
| [backlog/historias/](backlog/historias/) | Uma história por arquivo (US-01 a US-31) |
| [backlog/sprints/](backlog/sprints/) | Meta, escopo, revisão e retrospectiva de cada sprint |
| [rastreabilidade.md](rastreabilidade.md) | Matriz RF → US → T → teste → commit (gerada por `pnpm rastreabilidade`) |
