import json
from pathlib import Path

import pandas as pd

AQUI = Path(__file__).parent
SAIDA = AQUI.parent / "Banco de Dados" / "saida"
rd = lambda n: pd.read_csv(SAIDA / f"{n}.csv", sep=";", encoding="utf-8-sig")

f, dp, dc, dcc = rd("fVendas"), rd("dProduto"), rd("dCliente"), rd("dCentroCusto")
f["data"] = pd.to_datetime(f["data"])
meses = sorted(f.data.dt.strftime("%Y-%m").unique())
cats = sorted(dp.categoria.unique())
dados = {
    "meses": meses,
    "cats": cats,
    "canais": dcc.centro_custo.tolist(),
    "prodNome": dp.produto.tolist(),
    "prodCat": [cats.index(c) for c in dp.categoria],
    "subs": sorted(set(dp.subcategoria)),
    "prodSub": [sorted(set(dp.subcategoria)).index(s) for s in dp.subcategoria],
    "cliNome": dc.cliente.tolist(),
    "segs": sorted(dc.segmento.unique()),
    "cliSeg": [sorted(dc.segmento.unique()).index(s) for s in dc.segmento],
    "regs": sorted(dc.regiao.unique()),
    "cliReg": [sorted(dc.regiao.unique()).index(s) for s in dc.regiao],
    "eventos": {
        "2025-03": "Ruptura de estoque de fornecedor",
        "2025-08": "Alta do dólar e do frete",
        "2025-11": "Black Friday recorde (mais desconto)",
        "2026-04": "Greve de transportadores",
    },
    "metaMargem": 0.25,
    "m": [meses.index(x) for x in f.data.dt.strftime("%Y-%m")],
    "ord": (f.id_pedido - f.id_pedido.min()).tolist(),
    "prod": (f.id_produto - 1).tolist(),
    "canal": (f.id_centro_custo - 1).tolist(),
    "cli": (f.id_cliente - 1).tolist(),
    "rec": f.receita.round(0).astype(int).tolist(),
    "cus": f.custo.round(0).astype(int).tolist(),
}
js = "const D=" + json.dumps(dados, separators=(",", ":"), ensure_ascii=False) + ";\n"
(AQUI / "dados.js").write_text(js, encoding="utf-8")
print("dados.js ok", round(len(js) / 1e6, 2), "MB")
