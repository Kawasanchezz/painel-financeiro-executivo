# Etapa 2 – Como usar as medidas DAX

1. Power BI Desktop → Obter dados → Excel → `Banco de Dados/saida/base_financeira.xlsx` (5 abas) → Carregar.
2. Modelagem → Gerenciar relacionamentos: confirme os 4 relacionamentos 1:N (filtro único, dimensão → fato).
3. `dCalendario`: Ferramentas de tabela → **Marcar como tabela de datas** (coluna `data`). Classifique `mes_nome` por `mes_num`.
4. Inserir dados → tabela em branco, nome `_Medidas`. Para cada medida de `medidas.dax`: Nova medida → colar. Defina o **Display Folder** (Exibição de modelo) conforme o cabeçalho de cada seção.
5. Formate: Receita/Custo/Lucro/Ticket em moeda (R$), Margem % e variações % em percentual com 1 casa.
6. Formatação condicional: em cards, Formatação → Valor do campo → escolha a medida `Cor ...`.

## Validação (confira antes de seguir)
Compare com `Banco de Dados/saida/conferencia_mensal.csv`:
| Mês | Receita | Margem % | Pedidos | Var. MoM % |
|---|---|---|---|---|
| 2025-03 | 950.983 | 26,2 | 1.114 | −24,8 |
| 2025-08 | 1.609.815 | 15,6 | 1.827 | +3,6 |
| 2025-11 | 3.051.601 | 18,9 | 3.670 | +62,1 |

Total geral: receita ≈ R$ 57.952.037, 110.328 linhas, 66.056 pedidos.

## Contexto de filtro, em resumo
- **Base:** sem alterar filtros; o que o usuário seleciona nos slicers manda.
- **MoM/YoY:** `DATEADD`/`SAMEPERIODLASTYEAR` deslocam o contexto de data; usam o calendário marcado como tabela de datas.
- **Participação:** `ALLSELECTED(dProduto)` remove o filtro do item da linha mas mantém os slicers.
- **Ranking:** `ISINSCOPE` evita ranking nos totais.
- **Média móvel 3M:** use no eixo mensal; no primeiro mês divide só pelos meses existentes.
