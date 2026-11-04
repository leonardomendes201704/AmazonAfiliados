# ADR-005: Preço com data/hora, validade de 24 h e chave `show_price`

## Contexto

O protótipo mostra preço e preço riscado. O Programa de Associados da Amazon tem regras sobre exibir preços que não vêm da API oficial, e o PO aceitou o risco com mitigação.

## Decisão

- O preço aparece sempre com "atualizado em dd/mm às hh:mm" (horário de Brasília).
- **Quem decide se o preço aparece é a API.** Ela devolve `preco: null` quando:
  - `show_price = false`;
  - o preço tem mais de `PRICE_MAX_AGE_HOURS` (24);
  - ou não existe preço.
- `show_price` fica em `settings`, com padrão vindo de `SHOW_PRICE_DEFAULT`, e é alterado no admin sem deploy.
- A US-27 (P0, bloqueia o go-live) valida as regras do programa. O resultado vira um novo ADR, se necessário.

## Consequências

- Desligar o preço é imediato e global; o layout do card aguenta a ausência de preço.
- A web nunca recebe um preço que não pode mostrar.

## Alternativas descartadas

- **Sem preço desde o início:** foge do protótipo aprovado.
- **Esconder o preço só no front:** o preço vazaria pela API.
