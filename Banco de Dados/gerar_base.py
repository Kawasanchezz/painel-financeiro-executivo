"""
Painel Financeiro Executivo - Etapa 1: geração da base financeira simulada.

Premissa: empresa de varejo/e-commerce brasileira, valores em R$.
Período: jan/2024 a out/2026 (34 meses).
Saída: CSVs (UTF-8 com BOM, separador ';', decimal '.') + Excel consolidado.

Uso:  py gerar_base.py
"""
from pathlib import Path

import numpy as np
import pandas as pd

SEED = 42
rng = np.random.default_rng(SEED)
OUT = Path(__file__).parent / "saida"
OUT.mkdir(exist_ok=True)

INICIO, FIM = "2024-01-01", "2026-10-31"

# ---------------------------------------------------------------- dCalendario
datas = pd.date_range(INICIO, FIM, freq="D")
MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
dCalendario = pd.DataFrame({
    "data": datas,
    "ano": datas.year,
    "trimestre": "T" + datas.quarter.astype(str),
    "mes_num": datas.month,
    "mes_nome": [MESES[m - 1] for m in datas.month],
    "ano_mes": datas.strftime("%Y-%m"),
    "dia_semana": [DIAS[d] for d in datas.day_of_week],
    "dia_util": (datas.day_of_week < 5).astype(int),
})

# ------------------------------------------------------------------- dProduto
# (categoria, subcategoria, nome, preço médio, margem bruta alvo)
catalogo = [
    ("Eletrônicos", "Smartphones", "Smartphone Pro 128GB", 2800, 0.22),
    ("Eletrônicos", "Smartphones", "Smartphone Lite 64GB", 1200, 0.26),
    ("Eletrônicos", "Áudio", "Fone Bluetooth ANC", 450, 0.38),
    ("Eletrônicos", "Áudio", "Caixa de Som Portátil", 320, 0.36),
    ("Eletrônicos", "Acessórios", "Carregador Rápido 65W", 140, 0.52),
    ("Eletrônicos", "Acessórios", "Smartwatch Fit", 690, 0.33),
    ("Casa e Cozinha", "Eletroportáteis", "Air Fryer 5L", 520, 0.34),
    ("Casa e Cozinha", "Eletroportáteis", "Cafeteira Expresso", 780, 0.32),
    ("Casa e Cozinha", "Eletroportáteis", "Liquidificador Turbo", 260, 0.40),
    ("Casa e Cozinha", "Utensílios", "Jogo de Panelas 10pç", 410, 0.45),
    ("Casa e Cozinha", "Utensílios", "Conjunto de Facas", 190, 0.50),
    ("Casa e Cozinha", "Decoração", "Luminária de Mesa LED", 150, 0.55),
    ("Moda", "Vestuário", "Jaqueta Corta-Vento", 330, 0.50),
    ("Moda", "Vestuário", "Camiseta Algodão Premium", 90, 0.58),
    ("Moda", "Calçados", "Tênis Running", 380, 0.46),
    ("Moda", "Calçados", "Sandália Conforto", 140, 0.52),
    ("Moda", "Acessórios", "Mochila Urbana", 210, 0.50),
    ("Moda", "Acessórios", "Relógio Casual", 280, 0.48),
    ("Esporte e Lazer", "Fitness", "Kit Halteres 20kg", 310, 0.40),
    ("Esporte e Lazer", "Fitness", "Esteira Dobrável", 2400, 0.24),
    ("Esporte e Lazer", "Outdoor", "Barraca 4 Pessoas", 560, 0.38),
    ("Esporte e Lazer", "Outdoor", "Bicicleta Aro 29", 1900, 0.26),
    ("Esporte e Lazer", "Suplementos", "Whey Protein 900g", 130, 0.44),
    ("Esporte e Lazer", "Suplementos", "Creatina 300g", 95, 0.47),
]
dProduto = pd.DataFrame(catalogo, columns=["categoria", "subcategoria", "produto", "preco_base", "margem_alvo"])
dProduto.insert(0, "id_produto", np.arange(1, len(dProduto) + 1))
dProduto["custo_unit"] = (dProduto.preco_base * (1 - dProduto.margem_alvo)).round(2)

# --------------------------------------------------------------- dCentroCusto
dCentroCusto = pd.DataFrame({
    "id_centro_custo": [1, 2, 3, 4, 5],
    "centro_custo": ["E-commerce Próprio", "Marketplaces", "Lojas Físicas", "Televendas", "Atacado B2B"],
    "responsavel": ["Camila Prado", "Rafael Moura", "Juliana Teixeira", "Bruno Alves", "Patrícia Lemos"],
})
# peso de cada canal, ajuste de desconto e de custo operacional (variável extra sobre o custo do produto)
canal_peso = np.array([0.34, 0.26, 0.22, 0.06, 0.12])
canal_desc = np.array([0.04, 0.09, 0.03, 0.05, 0.14])
canal_custo_extra = np.array([0.04, 0.10, 0.06, 0.05, 0.02])  # comissão/frete/estrutura sobre a receita

# -------------------------------------------------------------------- dCliente
N_CLI = 800
regioes = ["Sudeste", "Sul", "Nordeste", "Centro-Oeste", "Norte"]
reg_p = [0.45, 0.20, 0.20, 0.10, 0.05]
segmentos = ["Varejo", "Premium", "Corporativo"]
seg_p = [0.72, 0.18, 0.10]
dCliente = pd.DataFrame({
    "id_cliente": np.arange(1, N_CLI + 1),
    "cliente": [f"Cliente {i:04d}" for i in range(1, N_CLI + 1)],
    "segmento": rng.choice(segmentos, N_CLI, p=seg_p),
    "regiao": rng.choice(regioes, N_CLI, p=reg_p),
})
# clientes concentrados: alguns compram muito mais (cauda longa)
cli_peso = rng.pareto(1.6, N_CLI) + 1
cli_peso[dCliente.segmento.eq("Corporativo").values] *= 3
cli_peso /= cli_peso.sum()

# ---------------------------------------------------------------------- fVendas
# Pedidos por mês = base * tendência * sazonalidade * eventos
sazon = {1: 0.88, 2: 0.82, 3: 0.95, 4: 0.97, 5: 1.12, 6: 1.00, 7: 0.98,
         8: 0.96, 9: 1.00, 10: 1.08, 11: 1.45, 12: 1.30}   # Dia das Mães, Black Friday, Natal
meses = pd.period_range(INICIO, FIM, freq="M")

# Eventos atípicos (ano_mes -> (fator volume, fator custo unit., descrição))
eventos = {
    "2025-03": (0.62, 1.00, "Ruptura de estoque de fornecedor: queda de volume"),
    "2025-08": (1.00, 1.14, "Alta do dólar/frete: pico de custos"),
    "2025-11": (1.22, 1.00, "Black Friday recorde"),
    "2026-04": (0.85, 1.07, "Greve de transportadores: menos entregas e frete maior"),
}

linhas, pid = [], 100000
BASE_PEDIDOS = 1500
for i, per in enumerate(meses):
    chave = str(per)
    f_vol, f_custo, _ = eventos.get(chave, (1.0, 1.0, ""))
    tendencia = 1.0 + 0.016 * i                         # ~1,6% a.m.
    n_ped = int(BASE_PEDIDOS * tendencia * sazon[per.month] * f_vol * rng.normal(1, 0.03))
    dias = pd.date_range(per.start_time, per.end_time.normalize(), freq="D")
    # mais vendas em dias úteis e em fim de mês; picos na Black Friday
    pd_dia = np.where(dias.day_of_week < 5, 1.0, 0.75) * np.linspace(0.9, 1.15, len(dias))
    if per.month == 11:
        pd_dia = pd_dia * np.where(dias.day >= 24, 3.0, 1.0)
    pd_dia = pd_dia / pd_dia.sum()
    datas_ped = rng.choice(dias, n_ped, p=pd_dia)
    canais = rng.choice(5, n_ped, p=canal_peso)
    clientes = rng.choice(dCliente.id_cliente.values, n_ped, p=cli_peso)
    n_itens = rng.choice([1, 2, 3, 4], n_ped, p=[0.55, 0.28, 0.12, 0.05])

    # participação de produtos varia por mês (sazonalidade por categoria)
    p_prod = np.ones(len(dProduto))
    cat = dProduto.categoria.values
    if per.month in (11, 12):
        p_prod[cat == "Eletrônicos"] *= 1.7
    if per.month == 5:
        p_prod[cat == "Casa e Cozinha"] *= 1.5
    if per.month in (1, 2):
        p_prod[cat == "Esporte e Lazer"] *= 1.4
    if per.month in (6, 7):
        p_prod[cat == "Moda"] *= 1.3
    # Smartphones/esteiras têm ticket alto e giro menor
    p_prod[dProduto.preco_base.values > 1500] *= 0.35
    p_prod /= p_prod.sum()

    for k in range(n_ped):
        pid += 1
        c = canais[k]
        prods = rng.choice(dProduto.id_produto.values, n_itens[k], replace=False, p=p_prod)
        for pr in prods:
            row = dProduto.iloc[pr - 1]
            qtd = int(rng.choice([1, 2, 3], p=[0.78, 0.17, 0.05])) if row.preco_base < 1000 else 1
            preco = row.preco_base * rng.normal(1.0, 0.04) * (1 + 0.004 * i * 0.5)  # leve reajuste
            bruto = qtd * preco
            desc_pct = max(0, rng.normal(canal_desc[c], 0.02))
            if chave == "2025-11":
                desc_pct += 0.08                       # Black Friday: mais desconto
            desconto = bruto * desc_pct
            receita = bruto - desconto                 # receita líquida
            custo = (qtd * row.custo_unit * f_custo * (1 + 0.003 * i * 0.5)
                     + receita * canal_custo_extra[c] * (f_custo if f_custo > 1 else 1))
            linhas.append((pd.Timestamp(datas_ped[k]), pid, clientes[k], int(pr),
                           int(dCentroCusto.id_centro_custo[c]), qtd,
                           round(receita, 2), round(custo, 2), round(desconto, 2)))

fVendas = pd.DataFrame(linhas, columns=[
    "data", "id_pedido", "id_cliente", "id_produto", "id_centro_custo",
    "quantidade", "receita", "custo", "desconto"])
fVendas = fVendas.sort_values(["data", "id_pedido"]).reset_index(drop=True)
fVendas.insert(0, "id_linha", np.arange(1, len(fVendas) + 1))

# ------------------------------------------------------------- validações
assert fVendas.id_cliente.isin(dCliente.id_cliente).all()
assert fVendas.id_produto.isin(dProduto.id_produto).all()
assert fVendas.id_centro_custo.isin(dCentroCusto.id_centro_custo).all()
assert fVendas.data.between(dCalendario.data.min(), dCalendario.data.max()).all()
assert (fVendas.receita > 0).all() and (fVendas.custo > 0).all()

# ------------------------------------------------------------------ exportar
for _df in (dCalendario, dProduto, dCliente, dCentroCusto):
    for _col in _df.select_dtypes(include=["object", "string"]).columns:
        assert not _df[_col].astype(str).str.match(r"^[=+\-@\t\r]").any(), f"texto iniciando com caractere de fórmula em {_col}"

tabelas = {"fVendas": fVendas, "dCalendario": dCalendario, "dProduto": dProduto.drop(columns=["margem_alvo"]),
           "dCliente": dCliente, "dCentroCusto": dCentroCusto}
for nome, df in tabelas.items():
    df.to_csv(OUT / f"{nome}.csv", index=False, sep=";", encoding="utf-8-sig", date_format="%Y-%m-%d")
with pd.ExcelWriter(OUT / "base_financeira.xlsx", engine="openpyxl", datetime_format="yyyy-mm-dd") as xw:
    for nome, df in tabelas.items():
        df.to_excel(xw, sheet_name=nome, index=False)

# --------------------------------------------------------- resumo de conferência
m = fVendas.assign(ano_mes=fVendas.data.dt.strftime("%Y-%m")).groupby("ano_mes").agg(
    receita=("receita", "sum"), custo=("custo", "sum"), pedidos=("id_pedido", "nunique"))
m["margem_pct"] = (1 - m.custo / m.receita) * 100
m["ticket_medio"] = m.receita / m.pedidos
m["var_mom_pct"] = m.receita.pct_change() * 100
m.round(1).to_csv(OUT / "conferencia_mensal.csv", sep=";", encoding="utf-8-sig")
pd.set_option("display.width", 200)
print(f"Linhas em fVendas: {len(fVendas):,} | Pedidos: {fVendas.id_pedido.nunique():,}")
print(f"Receita total: R$ {fVendas.receita.sum():,.0f} | Margem: {(1 - fVendas.custo.sum() / fVendas.receita.sum()):.1%}")
print(m.round(1).to_string())

