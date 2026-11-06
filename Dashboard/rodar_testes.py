import html
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
PAGINA = (RAIZ / "dashboard.html").read_text(encoding="utf-8")
SCRIPT = (RAIZ / "script.js").read_text(encoding="utf-8")
CHROME = next((p for p in [
    os.environ.get("CHROME_PATH", ""),
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
] if p and Path(p).exists()), None)

SCRIPTS_TESTE = {
    "hook.js": r'''window.__erros=[];
window.__xss=0;
window.addEventListener("error",e=>window.__erros.push("erro: "+e.message));
document.addEventListener("securitypolicyviolation",e=>window.__erros.push("CSP: "+e.violatedDirective));
''',
    "funcional.js": r'''(function(){
  const r=[];
  const ok=(n,c)=>r.push((c?"OK    ":"FALHA ")+n);
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const fire=(el,t)=>el.dispatchEvent(new Event(t,{bubbles:true}));
  const set=(id,v)=>{q(id).value=v;fire(q(id),"change")};
  try{
    ok("5 cards de KPI",qa("#kpis .card").length===5);
    ok("receita de out/26 = R$ 2,22 mi",q("#kpis .big").textContent==="R$ 2,22 mi");
    ok("texto executivo cita R$ 57,95 mi",q("#ins").textContent.includes("R$ 57,95 mi"));
    ok("barras com largura aplicada via CSSOM",qa(".bc i").length>0&&qa(".bc i").every(i=>parseFloat(i.style.width)>0));
    ok("heatmap colorido via CSSOM",qa("#heat td[data-bg]").length>0&&qa("#heat td[data-bg]").every(td=>td.style.background!==""));
    ok("sem atributos style inline no DOM gerado",qa("[style]").every(e=>e.id==="tip"||e.dataset.w!==undefined||e.dataset.bg!==undefined));
    set("#fAno","2025");
    ok("ano 2025 leva mês de referência a dez/25",q("#fMes").value==="2025-12"&&q("#kpis h2").textContent.includes("dez/25"));
    qa("#c1 rect[data-m]")[0].dispatchEvent(new MouseEvent("click",{bubbles:true}));
    ok("clique na coluna define jan/25",q("#fMes").value==="2025-01");
    const antes=q("#kpis .big").textContent;
    set("#fCat","0");
    ok("filtro de categoria altera a receita",q("#kpis .big").textContent!==antes);
    q("#rst").click();
    ok("botão Limpar restaura out/26",q("#fMes").value==="2026-10"&&q("#fAno").value===""&&q("#fCat").value==="-1");
    qa("nav button")[1].click();
    ok("aba Detalhamento abre",q("#pg2").classList.contains("on")&&!q("#pg1").classList.contains("on"));
    q("#matriz tr.l1").click();
    ok("matriz expande categoria",qa("#matriz tr.l2").length>0);
    q("#matriz tr.l2").click();
    ok("matriz expande subcategoria",qa("#matriz tr.l3").length>0);
    ok("heatmap com 4 categorias e 34 meses",qa("#heat tr").length===5&&qa("#heat th").length===35);
    q("[data-t]").dispatchEvent(new MouseEvent("mouseover",{bubbles:true,clientX:60,clientY:60}));
    ok("tooltip aparece com texto",q("#tip").style.display==="block"&&q("#tip").textContent.length>0);
    q("#matriz [data-cat]").click();
    ok("clicar no nome da categoria filtra a página",q("#fCat").value!=="-1");
    q("#rst").click();
    let n=0,bons=0;
    for(const a of ["","2024","2025","2026"])for(const c of ["-1","0","1","2","3"])for(const k of ["-1","0","1","2","3","4"]){
      q("#fAno").value=a;fire(q("#fAno"),"change");
      q("#fCat").value=c;q("#fCanal").value=k;fire(q("#fCat"),"change");
      n++;if(qa("#kpis .card").length===5&&!q("#ins").textContent.includes("NaN")&&!q("#kpis").textContent.includes("NaN"))bons++;
    }
    ok("120 combinações de filtros sem erro e sem NaN ("+bons+"/"+n+")",bons===n);
  }catch(e){ok("exceção: "+e.message,false)}
  ok("sem erros de console nem violações de CSP",window.__erros.length===0);
  const out=document.createElement("pre");
  out.id="resultado";
  out.textContent=r.join("\n")+"\nFALHAS="+r.filter(x=>x.startsWith("FALHA")).length+";";
  document.body.appendChild(out);
})();
''',
    "xss_payload.js": r'''const P='<img src=x onerror="window.__xss++">';
const PA='"><img src=x onerror="window.__xss++">';
D.cats=D.cats.map(()=>P);
D.canais=D.canais.map(()=>PA);
D.subs=D.subs.map(()=>P);
D.prodNome=D.prodNome.map(()=>P);
D.cliNome=D.cliNome.map(()=>P);
D.segs=D.segs.map(()=>PA);
D.regs=D.regs.map(()=>P);
for(const k of Object.keys(D.eventos))D.eventos[k]=P;
''',
    "xss_resultado.js": r'''(function(){
  document.querySelectorAll("nav button")[1].click();
  document.querySelectorAll("#matriz tr.l1").forEach(r=>r.click());
  document.querySelectorAll("#matriz tr.l2").forEach(r=>r.click());
  setTimeout(function(){
    const csp=window.__erros.filter(e=>e.startsWith("CSP")).length;
    const out=document.createElement("pre");
    out.id="resultado";
    out.textContent="XSS_EXECUCOES="+window.__xss+";IMG_INJETADAS="+document.querySelectorAll("img").length+";CSP_VIOLACOES="+csp+";";
    document.body.appendChild(out);
  },800);
})();
''',
}

CSP = re.compile(r'<meta http-equiv="Content-Security-Policy"[^>]*>\n?')
temporarios = []


def montar(nome, depois_dados="", depois_script="", sem_csp=False, sem_escape=False):
    pagina = PAGINA
    if sem_csp:
        pagina = CSP.sub("", pagina)
    script_src = "script.js"
    if sem_escape:
        script_src = f"_tmp_{nome}.js"
        (RAIZ / script_src).write_text(re.sub(r"const esc=v=>[^\n]*", "const esc=v=>String(v);", SCRIPT), encoding="utf-8")
        temporarios.append(RAIZ / script_src)
    for nome_js, conteudo in SCRIPTS_TESTE.items():
        alvo = RAIZ / f"_tmp_{nome_js}"
        alvo.write_text(conteudo, encoding="utf-8")
        if alvo not in temporarios:
            temporarios.append(alvo)
    tags = lambda f: f'<script src="_tmp_{f}"></script>\n' if f else ""
    pagina = pagina.replace(
        '<script src="dados.js"></script>\n<script src="script.js"></script>',
        '<script src="_tmp_hook.js"></script>\n<script src="dados.js"></script>\n'
        + tags(depois_dados) + f'<script src="{script_src}"></script>\n' + tags(depois_script))
    destino = RAIZ / f"_tmp_{nome}.html"
    destino.write_text(pagina, encoding="utf-8")
    temporarios.append(destino)
    return destino


def executar(arquivo):
    perfil = tempfile.mkdtemp(prefix="dash_test_")
    try:
        saida = subprocess.run(
            [CHROME, "--headless=new", "--disable-gpu", f"--user-data-dir={perfil}",
             "--virtual-time-budget=8000", "--dump-dom", arquivo.as_uri()],
            capture_output=True, text=True, timeout=120).stdout
    finally:
        shutil.rmtree(perfil, ignore_errors=True)
    m = re.search(r'<pre id="resultado">(.*?)</pre>', saida, re.S)
    return html.unescape(m.group(1)) if m else ""


def numero(texto, chave):
    m = re.search(chave + r"=(\d+)", texto)
    return int(m.group(1)) if m else None


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    if not CHROME:
        print("Chrome/Edge não encontrado. Defina CHROME_PATH.")
        return 2
    falhas = 0
    try:
        print("1) Teste funcional (com a CSP da página)")
        res = executar(montar("funcional", depois_script="funcional.js"))
        print("   " + res.replace("\n", "\n   ") if res else "   FALHA: sem resultado")
        if numero(res, "FALHAS") != 0:
            falhas += 1

        print("2) XSS: escape impede execução (sem CSP, para provar o escape)")
        res = executar(montar("xss_esc", "xss_payload.js", "xss_resultado.js", sem_csp=True))
        print("   " + res)
        if numero(res, "XSS_EXECUCOES") != 0 or numero(res, "IMG_INJETADAS") != 0:
            falhas += 1

        print("3) Controle: sem escape o ataque deve funcionar (valida que o teste é sensível)")
        res = executar(montar("xss_ctrl", "xss_payload.js", "xss_resultado.js", sem_csp=True, sem_escape=True))
        print("   " + res)
        if not (numero(res, "XSS_EXECUCOES") or 0) > 0:
            falhas += 1

        print("4) Defesa em profundidade: sem escape, mas com CSP, nada deve executar")
        res = executar(montar("xss_csp", "xss_payload.js", "xss_resultado.js", sem_escape=True))
        print("   " + res)
        if numero(res, "XSS_EXECUCOES") != 0:
            falhas += 1
    finally:
        for t in temporarios:
            t.unlink(missing_ok=True)
    print("RESULTADO FINAL:", "PASSOU" if falhas == 0 else f"{falhas} grupo(s) com falha")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
