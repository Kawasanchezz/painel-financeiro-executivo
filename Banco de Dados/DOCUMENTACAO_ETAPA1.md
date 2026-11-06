# Etapa 1 – Base financeira simulada

## Premissas
- Empresa de varejo/e-commerce brasileira, valores em R$.
- Período: jan/2024 a out/2026 (34 meses, 1.034 dias). Semente fixa (42): reprodutível.
- 110.328 linhas em `fVendas`, 66.056 pedidos, 800 clientes, 24 produtos, 5 centros de custo.
- Receita total ≈ R$ 57,95 mi; margem bruta média ≈ 25,1%.

## Modelo estrela e relacionamentos (todos 1:N, filtro de dimensão → fato)
| Dimensão | Chave | Fato |
|---|---|---|
| dCalendario[data] | 1 → N | fVendas[data] |
| dProduto[id_produto] | 1 → N | fVendas[id_produto] |
| dCliente[id_cliente] | 1 → N | fVendas[id_cliente] |
| dCentroCusto[id_centro_custo] | 1 → N | fVendas[id_centro_custo] |

## Regras de negócio
1. **Granularidade da fato:** uma linha = um produto dentro de um pedido. `id_pedido` se repete; Ticket Médio = Receita ÷ DISTINCTCOUNT(id_pedido).
2. **Receita** é líquida: preço × quantidade − desconto.
3. **Custo** = custo unitário do produto × quantidade + custo operacional do canal (frete/comissão/estrutura, 2% a 10% da receita, varia por centro de custo).
4. **Margem bruta** = (receita − custo) ÷ receita. Alvo por produto de 22% a 58%.
5. **Tendência:** crescimento de ~1,6% ao mês no volume de pedidos.
6. **Sazonalidade:** Dia das Mães (mai), Black Friday (nov), Natal (dez), baixa em jan/fev. Eletrônicos pesam mais em nov/dez.
7. **Canais:** E-commerce 34%, Marketplaces 26%, Lojas 22%, Atacado 12%, Televendas 6%. Atacado dá mais desconto; marketplaces têm o maior custo operacional.
8. **Concentração de clientes:** distribuição de cauda longa (Pareto); clientes Corporativos compram ~3x mais.

## Eventos atípicos embutidos (úteis para a análise executiva)
| Mês | Evento | Efeito observado |
|---|---|---|
| mar/2025 | Ruptura de fornecedor | Receita R$ 0,95 mi (−24,8% MoM) |
| ago/2025 | Alta de dólar/frete | Margem cai de 26,7% para 15,6% |
| nov/2025 | Black Friday recorde | Receita R$ 3,05 mi (+62% MoM), margem 18,9% (mais desconto) |
| abr/2026 | Greve de transportadores | Volume −15%, margem 21,1% |

## Arquivos
- `gerar_base.py` – gera tudo (`py gerar_base.py`; requer pandas, numpy, openpyxl).
- `criar_tabelas.sql` – DDL T-SQL com chaves e índice.
- `saida/` – `fVendas.csv`, `dCalendario.csv`, `dProduto.csv`, `dCliente.csv`, `dCentroCusto.csv` (separador `;`), `base_financeira.xlsx` (todas as abas) e `conferencia_mensal.csv` (totais para validar as medidas DAX).

## Importação no Power BI
Obter dados → Pasta de Trabalho do Excel → `base_financeira.xlsx` (5 abas), ou Texto/CSV com delimitador `;` e origem UTF-8. Na Etapa 2, marque `dCalendario` como tabela de datas.
