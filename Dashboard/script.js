if(!D||!Array.isArray(D.m)||!Array.isArray(D.meses)||!D.meses.length||["ord","prod","canal","cli","rec","cus"].some(k=>!Array.isArray(D[k])||D[k].length!==D.m.length)){
  document.body.textContent="Dados inválidos ou ausentes. Rode gerar_dashboard.py para regenerar dados.js.";
  throw new Error("dados.js inválido");
}
const N=D.m.length,M=D.meses,MN=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"],META=D.metaMargem;
const $=id=>document.getElementById(id);
const esc=v=>String(v).replace(/[&<>"'`]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","`":"&#96;"}[c]));
const brl=v=>"R$ "+Math.round(v).toLocaleString("pt-BR");
const mi=v=>"R$ "+(v/1e6).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})+" mi";
const pc=(v,d=1)=>(v*100).toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d})+"%";
const sg=v=>(v>=0?"+":"")+pc(v);
const lbl=m=>MN[+m.slice(5)-1]+"/"+m.slice(2,4);
const cPri="#1f5fbf",cPri2="#a9c2ea",cPos="#1e8e3e",cNeg="#d93025",cAmb="#f29900";
const evKeys=Object.keys(D.eventos);

const anos=[...new Set(M.map(m=>m.slice(0,4)))];
$("fAno").innerHTML="<option value=''>Todos</option>"+anos.map(a=>`<option>${esc(a)}</option>`).join("");
$("fCat").innerHTML="<option value='-1'>Todas</option>"+D.cats.map((c,i)=>`<option value='${i}'>${esc(c)}</option>`).join("");
$("fCanal").innerHTML="<option value='-1'>Todos</option>"+D.canais.map((c,i)=>`<option value='${i}'>${esc(c)}</option>`).join("");
function fillMes(){const a=$("fAno").value;const ms=M.filter(m=>!a||m.startsWith(a));
  $("fMes").innerHTML=ms.map(m=>`<option value='${esc(m)}'>${esc(lbl(m))}</option>`).join("");$("fMes").value=ms[ms.length-1]}
$("fAno").onchange=()=>{fillMes();render()};
["fCat","fCanal","fMes"].forEach(id=>$(id).onchange=render);
$("rst").onclick=()=>{$("fAno").value="";$("fCat").value="-1";$("fCanal").value="-1";fillMes();render()};
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("nav button").forEach(x=>x.classList.toggle("on",x===b));
  document.querySelectorAll(".pg").forEach(p=>p.classList.toggle("on",p.id===b.dataset.pg))});
fillMes();

const tip=$("tip");
function tipOn(e,t){tip.style.display="block";tip.textContent=t;tip.style.left=Math.min(e.clientX+12,innerWidth-220)+"px";tip.style.top=(e.clientY+14)+"px"}
document.addEventListener("mouseover",e=>{const t=e.target.closest("[data-t]");if(t)tipOn(e,t.dataset.t)});
document.addEventListener("mousemove",e=>{if(tip.style.display=="block")tipOn(e,tip.textContent)});
document.addEventListener("mouseout",e=>{if(e.target.closest("[data-t]"))tip.style.display="none"});
document.addEventListener("click",e=>{
  const m=e.target.closest("[data-m]");
  if(m){const v=M[+m.dataset.m];if([...$("fMes").options].some(o=>o.value===v)){$("fMes").value=v;render()}return}
  const cf=e.target.closest("[data-cat]");
  if(cf){$("fCat").value=cf.dataset.cat;render();return}
  const tg=e.target.closest("[data-k]");
  if(tg){const k=tg.dataset.k;abertos.has(k)?abertos.delete(k):abertos.add(k);render()}
});
const abertos=new Set();

function filtrar(cat,canal){
  const S=M.map(()=>({rec:0,cus:0,ped:new Set()})),pm=[];
  for(let i=0;i<N;i++){
    if((cat>=0&&D.prodCat[D.prod[i]]!==cat)||(canal>=0&&D.canal[i]!==canal))continue;
    const s=S[D.m[i]];s.rec+=D.rec[i];s.cus+=D.cus[i];s.ped.add(D.ord[i]);pm.push(i);
  }
  return {S,pm};
}
function periodo(pm,ms,key){
  const set=new Set(ms.map(m=>M.indexOf(m))),o={};
  for(const i of pm){if(!set.has(D.m[i]))continue;const k=key(i);
    const r=o[k]||(o[k]={rec:0,cus:0,ped:new Set()});r.rec+=D.rec[i];r.cus+=D.cus[i];r.ped.add(D.ord[i])}
  return o;
}
const marg=s=>s&&s.rec?(s.rec-s.cus)/s.rec:null;
const tkt=s=>s&&s.ped.size?s.rec/s.ped.size:null;
const sum=(a,f)=>a.reduce((x,y)=>x+f(y),0);

function delta(a,b,fmt="pct"){
  if(a==null||b==null||b===0)return `<span class="neu">– n/d</span>`;
  if(fmt=="pp"){const d=(a-b)*100;return `<span class="${d>=0?'pos':'neg'}">${d>=0?'▲ +':'▼ '}${d.toFixed(1).replace('.',',')} p.p.</span>`}
  const d=a/b-1;return `<span class="${d>=0?'pos':'neg'}">${d>=0?'▲':'▼'} ${sg(d)}</span>`;
}
const pill=m=>m==null?"–":`<span class="pill ${m>=META?'g':m>=META-.03?'y':'r'}">${pc(m)}</span>`;
function bar(v,max,txt){return `<div class="bc"><i data-w="${Math.max(2,v/(max||1)*80).toFixed(1)}"></i>${txt}</div>`}
function aplicarEstilos(){
  document.querySelectorAll("[data-w]").forEach(e=>{e.style.width=e.dataset.w+"px"});
  document.querySelectorAll("[data-bg]").forEach(e=>{e.style.background=e.dataset.bg;e.style.color=e.dataset.fg||""});
}
function tbl(h,rs){return `<table><tr>${h.map(x=>`<th>${x}</th>`).join("")}</tr>${rs.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</table>`}
function spark(vals,color){
  const W=84,H=30,mx=Math.max(...vals),mn=Math.min(...vals),r=mx-mn||1;
  const p=vals.map((v,i)=>`${(i/(vals.length-1||1)*W).toFixed(1)},${(H-3-(v-mn)/r*(H-6)).toFixed(1)}`);
  const l=p[p.length-1].split(",");
  return `<svg viewBox="0 0 ${W} ${H}" class="spk"><polyline fill="none" stroke="${color}" stroke-width="2" points="${p.join(" ")}"/><circle cx="${l[0]}" cy="${l[1]}" r="3" fill="${color}"/></svg>`;
}

function render(){
  const ano=$("fAno").value,cat=+$("fCat").value,canal=+$("fCanal").value,ref=M.find(m=>m===$("fMes").value)||M[M.length-1];
  const {S,pm}=filtrar(cat,canal);
  const vis=M.map((_,i)=>i).filter(i=>!ano||M[i].startsWith(ano));
  const msV=vis.map(i=>M[i]),ri=M.indexOf(ref);
  const cur=S[ri],ant=ri>0?S[ri-1]:null,ya=ri>=12?S[ri-12]:null;
  const Y=ref.slice(0,4),mm=+ref.slice(5);
  const ytdIdx=[...Array(mm).keys()].map(k=>M.indexOf(`${Y}-${String(k+1).padStart(2,"0")}`)).filter(i=>i>=0);
  const ytd=sum(ytdIdx,i=>S[i].rec),ytdPy=sum(ytdIdx.filter(i=>i>=12),i=>S[i-12].rec);
  const per=ano?ano:"jan/24 a out/26";
  document.querySelectorAll(".dp").forEach(e=>e.textContent="Período: "+per);

  const win=[...Array(Math.min(12,ri+1)).keys()].map(k=>ri-k).reverse();
  const k=[
    ["Receita",mi(cur.rec),win.map(i=>S[i].rec),delta(cur.rec,ant&&ant.rec),delta(cur.rec,ya&&ya.rec),
      `Acumulado ${esc(Y)}: <b>${mi(ytd)}</b> ${ytdPy?delta(ytd,ytdPy):""}`],
    ["Lucro bruto",mi(cur.rec-cur.cus),win.map(i=>S[i].rec-S[i].cus),delta(cur.rec-cur.cus,ant&&ant.rec-ant.cus),delta(cur.rec-cur.cus,ya&&ya.rec-ya.cus),
      `Custo total: ${mi(cur.cus)}`],
    ["Margem bruta",pc(marg(cur)??0),win.map(i=>marg(S[i])??0),delta(marg(cur),marg(ant),"pp"),delta(marg(cur),marg(ya),"pp"),
      `Meta: ${pc(META,0)} · ${marg(cur)>=META?"dentro da meta":"abaixo da meta"}`],
    ["Ticket médio",brl(tkt(cur)??0),win.map(i=>tkt(S[i])??0),delta(tkt(cur),tkt(ant)),delta(tkt(cur),tkt(ya)),`Receita ÷ pedidos distintos`],
    ["Pedidos",cur.ped.size.toLocaleString("pt-BR"),win.map(i=>S[i].ped.size),delta(cur.ped.size,ant&&ant.ped.size),delta(cur.ped.size,ya&&ya.ped.size),
      `${(cur.ped.size?D_linhas(cur,ri,cat,canal)/cur.ped.size:0).toFixed(1).replace(".",",")} itens por pedido`]];
  $("kpis").innerHTML=k.map(c=>`<div class="card"><h2>${c[0]} · ${lbl(ref)}</h2>
    <div class="kv"><div class="big">${c[1]}</div>${spark(c[2],cPri)}</div>
    <div class="sub">${c[3]} vs. mês anterior<br>${c[4]} vs. ano anterior<br>${c[5]}</div></div>`).join("");

  $("t1").textContent=`Receita ${ano?"em "+ano:"mensal"} e margem bruta`;
  $("c1").innerHTML=timeChart(vis.map(i=>({l:lbl(M[i]),i,rec:S[i].rec,py:i>=12?S[i-12].rec:null,mg:marg(S[i]),ref:i===ri,ev:evKeys.indexOf(M[i])})));
  $("evt").innerHTML=evKeys.filter(e=>msV.includes(e)).map(e=>`<li><b>${evKeys.indexOf(e)+1}</b>${esc(lbl(e))}: ${esc(D.eventos[e])}</li>`).join("");
  $("c2").innerHTML=momChart(vis.map(i=>({l:lbl(M[i]),i,v:i>0&&S[i-1].rec?S[i].rec/S[i-1].rec-1:null,ref:i===ri})));
  $("t3").textContent=`Acumulado no ano: ${Y} vs. ${+Y-1}`;
  $("c3").innerHTML=ytdChart(S,Y,mm);

  const totRec=sum(vis,i=>S[i].rec)||1,totCus=sum(vis,i=>S[i].cus);
  const porCat=periodo(pm,msV,i=>D.prodCat[D.prod[i]]);
  const porCli=periodo(pm,msV,i=>D.cli[i]);
  const top=Object.entries(porCli).sort((a,b)=>b[1].rec-a[1].rec).slice(0,10);
  const vv=vis.filter(i=>i>0&&S[i-1].rec);
  const best=vis.reduce((a,i)=>S[i].rec>S[a].rec?i:a,vis[0]);
  const worst=vv.length?vv.reduce((a,i)=>S[i].rec/S[i-1].rec<S[a].rec/S[a-1].rec?i:a,vv[0]):null;
  const comVenda=vis.filter(i=>S[i].rec);
  const lowMg=comVenda.length?comVenda.reduce((a,i)=>marg(S[i])<marg(S[a])?i:a,comVenda[0]):null;
  const catS=Object.entries(porCat).sort((a,b)=>b[1].rec-a[1].rec);
  const catPior=catS.length?catS.reduce((a,b)=>marg(b[1])<marg(a[1])?b:a):null;
  const mesesAbaixo=vis.filter(i=>S[i].rec&&marg(S[i])<META).length;
  const L=[];
  L.push(`Receita de <b>${mi(totRec)}</b> no período, com margem de <b>${pc((totRec-totCus)/(totRec||1))}</b> (meta ${pc(META,0)}).`);
  L.push(`Melhor mês: <b>${lbl(M[best])}</b> (${mi(S[best].rec)})${evKeys.includes(M[best])?" — "+esc(D.eventos[M[best]]):""}.`);
  if(worst!=null)L.push(`Maior queda: <b>${lbl(M[worst])}</b>, ${sg(S[worst].rec/S[worst-1].rec-1)} sobre o mês anterior${evKeys.includes(M[worst])?" ("+esc(D.eventos[M[worst]])+")":""}.`);
  if(lowMg!=null)L.push(`<span class="neg"><b>Alerta de margem:</b></span> ${mesesAbaixo} de ${vis.length} meses abaixo da meta; pior em <b>${lbl(M[lowMg])}</b> (${pc(marg(S[lowMg]))})${evKeys.includes(M[lowMg])?" — "+esc(D.eventos[M[lowMg]]):""}.`);
  if(catPior&&catS.length>1)L.push(`Categoria de menor margem: <b>${esc(D.cats[catPior[0]])}</b> (${pc(marg(catPior[1]))}), com ${pc(catPior[1].rec/totRec)} da receita.`);
  if(top.length)L.push(`<span class="neg"><b>Risco de concentração:</b></span> os 10 maiores clientes somam <b>${pc(sum(top,t=>t[1].rec)/totRec)}</b> da receita.`);
  $("ins").innerHTML=L.map(l=>`<li>${l}</li>`).join("");

  renderMatriz(pm,msV,totRec);
  renderHeat(S,vis,pm);
  const lista=(obj,nomes,id)=>{const e=Object.entries(obj).sort((a,b)=>b[1].rec-a[1].rec),mx=e.length?e[0][1].rec:1;
    $(id).innerHTML=tbl(["","Receita","Margem"],e.map(([k,s])=>[esc(nomes[k]),bar(s.rec,mx,mi(s.rec)),pill(marg(s))]))};
  lista(periodo(pm,msV,i=>D.canal[i]),D.canais,"cc");
  lista(periodo(pm,msV,i=>D.cliSeg[D.cli[i]]),D.segs,"cs");
  lista(periodo(pm,msV,i=>D.cliReg[D.cli[i]]),D.regs,"cr");
  const mx=top.length?top[0][1].rec:1;
  $("top").innerHTML=tbl(["Cliente","Segmento","Região","Receita","% do total","Margem","Pedidos"],
    top.map(([k,s],i)=>[`${i+1}. ${esc(D.cliNome[k])}`,esc(D.segs[D.cliSeg[k]]),esc(D.regs[D.cliReg[k]]),bar(s.rec,mx,brl(s.rec)),pc(s.rec/totRec),pill(marg(s)),s.ped.size]));
  aplicarEstilos();
}
function D_linhas(cur,ri,cat,canal){let n=0;for(let i=0;i<N;i++){if(D.m[i]!==ri)continue;
  if((cat>=0&&D.prodCat[D.prod[i]]!==cat)||(canal>=0&&D.canal[i]!==canal))continue;n++}return n}

function renderMatriz(pm,msV,totRec){
  const msC=msV.filter(m=>M.indexOf(m)>=12),prev=msC.map(m=>M[M.indexOf(m)-12]);
  const ys=prev.length>0;
  const A=[i=>D.prodCat[D.prod[i]],i=>D.prodCat[D.prod[i]]*100+D.prodSub[D.prod[i]],i=>D.prod[i]];
  const cur=A.map(f=>periodo(pm,msV,f)),curY=A.map(f=>ys?periodo(pm,msC,f):{}),old=A.map(f=>ys?periodo(pm,prev,f):{});
  const yoy=(l,k)=>{const a=curY[l][k],b=old[l][k];return ys&&a&&b?delta(a.rec,b.rec):"<span class='neu'>–</span>"};
  const row=(cls,l,key,nome,k,extra="")=>{const s=cur[l][k];if(!s)return"";nome=esc(nome);
    const ab=abertos.has(key);const has=l<2;
    return `<tr class="${cls}" ${has?`data-k="${key}"`:""}><td>${has?`<span class="car">${ab?"▼":"▶"}</span>`:'<span class="car"></span>'}${l==0?`<span data-cat="${k}" class="lk" title="Filtrar por esta categoria">${nome}</span>`:nome}</td>
      <td>${mi(s.rec)}</td><td>${pc(s.rec/totRec)}</td><td>${pill(marg(s))}</td><td>${brl(tkt(s))}</td><td>${yoy(l,k)}</td></tr>`};
  let h=`<table><tr><th>Categoria</th><th>Receita</th><th>% total</th><th>Margem</th><th>Ticket</th><th>Var. YoY</th></tr>`;
  const cs=Object.keys(cur[0]).sort((a,b)=>cur[0][b].rec-cur[0][a].rec);
  for(const c of cs){h+=row("l1",0,"c"+c,D.cats[c],c);
    if(!abertos.has("c"+c))continue;
    const ss=Object.keys(cur[1]).filter(k=>Math.floor(k/100)==c).sort((a,b)=>cur[1][b].rec-cur[1][a].rec);
    for(const sk of ss){h+=row("l2",1,"s"+sk,D.subs[sk%100],sk);
      if(!abertos.has("s"+sk))continue;
      Object.keys(cur[2]).filter(p=>D.prodCat[p]==c&&D.prodSub[p]==sk%100).sort((a,b)=>cur[2][b].rec-cur[2][a].rec)
        .forEach(p=>h+=row("l3",2,"p"+p,D.prodNome[p],p))}}
  $("matriz").innerHTML=h+"</table>";
}
function renderHeat(S,vis,pm){
  const cats=[...new Set(D.prodCat)],cm={};
  for(const i of pm){const c=D.prodCat[D.prod[i]],m=D.m[i];const k=c+"|"+m;const r=cm[k]||(cm[k]={rec:0,cus:0});r.rec+=D.rec[i];r.cus+=D.cus[i]}
  const showTxt=vis.length<=12;
  let h=`<table class="hm"><tr><th></th>${vis.map(i=>`<th>${lbl(M[i])}</th>`).join("")}</tr>`;
  for(const c of cats){h+=`<tr><td>${esc(D.cats[c])}</td>`;
    for(const i of vis){const r=cm[c+"|"+i],m=r?marg(r):null;
      if(m==null){h+="<td></td>";continue}
      const d=m-META,a=Math.min(1,Math.abs(d)/.12)*.8+.08;
      const bg=d>=0?`rgba(30,142,62,${a})`:`rgba(217,48,37,${a})`;
      h+=`<td data-bg="${bg}" data-fg="${a>.5?"#fff":"#1c2430"}" data-t="${esc(D.cats[c])} · ${esc(lbl(M[i]))}\nMargem: ${pc(m)}\nReceita: ${brl(r.rec)}">${showTxt?(m*100).toFixed(0)+"%":""}</td>`}
    h+="</tr>"}
  $("heat").innerHTML=h+"</table>";
}

function timeChart(d){
  const W=780,L=46,R=14,w=W-L-R,TA=12,HA=190,GAP=34,TB=TA+HA+GAP,HB=100,H=TB+HB+26,bw=w/d.length;
  const mx=Math.max(...d.map(x=>Math.max(x.rec,x.py||0)))*1.08;
  const mgs=d.map(x=>x.mg).filter(x=>x!=null),lo=Math.min(...mgs,META)-.025,hi=Math.max(...mgs,META)+.025;
  const yA=v=>TA+HA-v/mx*HA,yB=v=>TB+HB-(v-lo)/(hi-lo)*HB,xc=i=>L+i*bw+bw/2;
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Receita mensal e margem">`;
  for(let k=0;k<=4;k++){const y=TA+HA-HA*k/4;s+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="#eef1f6"/><text x="${L-6}" y="${y+4}" text-anchor="end">${(mx*k/4/1e6).toFixed(1)}</text>`}
  d.forEach((x,i)=>{const bh=x.rec/mx*HA;
    s+=`<rect data-m="${x.i}" data-t="${x.l}\nReceita: ${brl(x.rec)}\nAno anterior: ${x.py==null?'n/d':brl(x.py)}\nYoY: ${x.py?sg(x.rec/x.py-1):'n/d'}\nMargem: ${x.mg==null?'-':pc(x.mg)}" x="${L+i*bw+bw*.14}" y="${yA(x.rec)}" width="${bw*.72}" height="${bh}" fill="${x.ref?cPri:cPri2}" rx="2"/>`;
    if(d.length<=14||i%3==0)s+=`<text x="${xc(i)}" y="${H-6}" text-anchor="middle">${x.l}</text>`});
  const py=d.map((x,i)=>x.py!=null?[xc(i),yA(x.py)]:null).filter(Boolean);
  if(py.length)s+=`<polyline fill="none" stroke="#475467" stroke-width="1.6" stroke-dasharray="4 3" points="${py.map(p=>p.join(",")).join(" ")}"/>`;
  s+=`<text x="${L-6}" y="${TB-8}" text-anchor="end" class="tb">Margem</text>`;
  for(const v of [lo+.012,(lo+hi)/2,hi-.012])s+=`<text x="${L-6}" y="${yB(v)+4}" text-anchor="end">${(v*100).toFixed(0)}%</text>`;
  s+=`<rect x="${L}" y="${TB}" width="${w}" height="${HB}" fill="#fafbfd"/>`;
  s+=`<line x1="${L}" x2="${W-R}" y1="${yB(META)}" y2="${yB(META)}" stroke="#667085" stroke-dasharray="5 4"/><text x="${L+4}" y="${TB+HB-4}" class="t10">- - meta ${pc(META,0)}</text>`;
  const pts=d.map((x,i)=>x.mg!=null?[xc(i),yB(x.mg),x]:null).filter(Boolean);
  s+=`<polyline fill="none" stroke="${cAmb}" stroke-width="2.4" points="${pts.map(p=>p[0]+","+p[1]).join(" ")}"/>`;
  pts.forEach(p=>s+=`<circle data-m="${p[2].i}" data-t="${p[2].l}\nMargem: ${pc(p[2].mg)}\nvs. meta: ${((p[2].mg-META)*100>=0?"+":"")+((p[2].mg-META)*100).toFixed(1).replace(".",",")} p.p." cx="${p[0]}" cy="${p[1]}" r="${p[2].ref?5:3.5}" fill="${p[2].mg<META?cNeg:cAmb}" stroke="#fff"/>`);
  d.forEach((x,i)=>{if(x.ev>=0)s+=`<circle cx="${xc(i)}" cy="${TB-12}" r="8" fill="#14213d" data-t="${esc(x.l)}: ${esc(D.eventos[M[x.i]])}"/><text x="${xc(i)}" y="${TB-8}" text-anchor="middle" class="evn">${x.ev+1}</text>`});
  return `<div class="leg"><span><b class="k-pri2"></b>Receita (R$ mi)</span><span><b class="k-pri"></b>Mês de referência</span><span><b class="k-prev"></b>Ano anterior</span><span><b class="k-amb"></b>Margem %</span><span><b class="k-neg"></b>Abaixo da meta</span></div>`+s+"</svg>";
}
function momChart(d){
  const W=360,L=8,R=8,T=10,B=26,H=330,h=H-T-B,w=W-L-R;
  const vals=d.map(x=>x.v).filter(x=>x!=null),ext=Math.max(Math.abs(Math.min(...vals,0)),Math.max(...vals,0),.1);
  const y0=T+h/2,bw=w/d.length;
  let s=`<svg viewBox="0 0 ${W} ${H}"><line x1="${L}" x2="${W-R}" y1="${y0}" y2="${y0}" stroke="#98a2b3"/><text x="${L}" y="${T+8}">+${(ext*100).toFixed(0)}%</text><text x="${L}" y="${H-B-2}">−${(ext*100).toFixed(0)}%</text>`;
  d.forEach((x,i)=>{if(x.v==null)return;const bh=Math.abs(x.v)/ext*(h/2),xx=L+i*bw;
    s+=`<rect data-m="${x.i}" data-t="${x.l}: ${sg(x.v)}" x="${xx+bw*.12}" y="${x.v>=0?y0-bh:y0}" width="${bw*.76}" height="${Math.max(bh,1)}" fill="${x.v>=0?cPos:cNeg}" opacity="${x.ref?1:.78}" rx="1.5"/>`;
    if(d.length<=14||i%4==0)s+=`<text x="${xx+bw/2}" y="${H-8}" text-anchor="middle" class="t9">${x.l}</text>`});
  return s+"</svg>";
}
function ytdChart(S,Y,mm){
  const W=520,L=40,R=14,T=10,B=26,H=230,h=H-T-B,w=W-L-R;
  const get=(y,k)=>{const i=M.indexOf(`${y}-${String(k).padStart(2,"0")}`);return i>=0?S[i].rec:null};
  const acc=y=>{let a=0;return [...Array(12).keys()].map(k=>{const v=get(y,k+1);if(v==null)return null;a+=v;return a})};
  const cur=acc(Y),prv=acc(+Y-1);
  const mx=Math.max(...cur.filter(Boolean),...prv.filter(Boolean),1)*1.05;
  const x=k=>L+k/11*w,y=v=>T+h-v/mx*h;
  let s=`<svg viewBox="0 0 ${W} ${H}">`;
  for(let k=0;k<=4;k++){const yy=T+h-h*k/4;s+=`<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" stroke="#eef1f6"/><text x="${L-6}" y="${yy+4}" text-anchor="end">${(mx*k/4/1e6).toFixed(0)}</text>`}
  MN.forEach((m,k)=>s+=`<text x="${x(k)}" y="${H-6}" text-anchor="middle">${m}</text>`);
  const line=(arr,c,dash,lab)=>{const p=arr.map((v,k)=>v==null?null:[x(k),y(v),k,v]).filter(Boolean);if(!p.length)return"";
    return `<polyline fill="none" stroke="${c}" stroke-width="2.4" ${dash?'stroke-dasharray="5 4"':""} points="${p.map(q=>q[0]+","+q[1]).join(" ")}"/>`+
      p.map(q=>`<circle data-t="${lab} · ${MN[q[2]]}\nAcumulado: ${mi(q[3])}" cx="${q[0]}" cy="${q[1]}" r="3" fill="${c}"/>`).join("")}
  s+=line(prv,"#98a2b3",true,+Y-1)+line(cur,cPri,false,Y);
  return `<div class="leg"><span><b class="k-pri"></b>${esc(Y)}</span><span><b class="k-gray"></b>${+Y-1}</span></div>`+s+"</svg>";
}
render();
if(location.hash=='#detalhamento')document.querySelectorAll('nav button')[1].click();
