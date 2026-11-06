# Painel Financeiro Executivo

Projeto de portfólio: acompanhamento de receita, custos, margem, ticket médio e variação mensal de uma empresa de varejo/e-commerce. **Todos os dados são simulados.**

## Estrutura
| Pasta | Conteúdo |
|---|---|
| `Banco de Dados/` | `gerar_base.py` (gera a base), `criar_tabelas.sql` (modelo estrela em T-SQL), documentação e `saida/` (CSVs e XLSX) |
| `Medida Dax/` | `medidas.dax` e guia para usar no Power BI |
| `Dashboard/` | Dashboard web (`dashboard.html`, `style.css`, `script.js`, `dados.js`) e `gerar_dashboard.py` |

## Como usar
```bash
python -m venv .venv
.venv\Scripts\activate            # Windows
pip install -r requirements.txt
cd "Banco de Dados" && python gerar_base.py
cd "../Dashboard" && python gerar_dashboard.py
```
Abra `Dashboard/dashboard.html` no navegador. Mantenha os quatro arquivos da pasta juntos.

## Testes
```bash
python Dashboard/rodar_testes.py
```
Usa Chrome ou Edge em modo headless (defina `CHROME_PATH` se necessário).

## Licença
[MIT](LICENSE) © 2026 Sanchez.

## Limitações
Dados fictícios (semente fixa 42), sem backend. Veja [SECURITY.md](SECURITY.md).
