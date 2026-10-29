(function(){
"use strict";
const SB_URL="https://hzkmhtfwulxvysorvcjb.supabase.co";
const SB_KEY="sb_publishable_7MOAsg_uX2o-oAXiqPEhUQ_dXlNhTu4";
const BUCKET="carro", TABLE="carro_registros";
const sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:"controle-tracker-auth"}});

const RENT=1200, PAN_V=2934.64, MULTA=58.69, MORA_DIA=3.45, FAB="2020-11-24";
const $=id=>document.getElementById(id);
const fmt=v=>(v<0?"−":"")+"R$ "+Math.abs(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmt0=v=>(v<0?"−":"")+"R$ "+Math.abs(Math.round(v)).toLocaleString("pt-BR");
const nf=v=>Number(v).toLocaleString("pt-BR");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const D=s=>{const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
const br=s=>{const [y,m,d]=s.split("-");return d+"/"+m+"/"+y};
const brShort=s=>{const [y,m,d]=s.split("-");return d+"/"+m};
const addDays=(s,n)=>{const d=D(s);d.setDate(d.getDate()+n);return iso(d)};
const addMonths=(s,n)=>{const d=D(s);d.setMonth(d.getMonth()+n);return iso(d)};
const diff=(a,b)=>Math.round((D(a)-D(b))/864e5);
const WD=["dom","seg","ter","qua","qui","sex","sáb"];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let TODAY=iso(new Date());

/* ---------- Agenda fixa ---------- */
let PAN=[],OBR=[];
function buildPan(){
  const mods=st.amort.filter(a=>a.modo==="parcela"&&Number(a.novaParcela)>0).sort((a,b)=>a.data<b.data?-1:1);
  PAN=[];for(let i=0;i<60;i++){const due=iso(new Date(2026,10+i,20));let amt=PAN_V;mods.forEach(a=>{if(due>a.data)amt=Number(a.novaParcela)});
    PAN.push({key:"pan-"+String(i+1).padStart(2,"0"),n:i+1,due,amt,env:"fin",t:"Banco Pan · parcela "+(i+1)+"/60"})}
}
function buildObr(){
  const ip=Number(st.cfg.ipva)||0,sr=Number(st.cfg.seguroRenov)||0;OBR=[];
  for(let y=2027;y<=2031;y++){
    if(ip>0)[1,2,3].forEach(m=>OBR.push({key:`ipva-${y}-${m}`,due:`${y}-0${m}-15`,amt:Math.round(ip/3*100)/100,env:"obr",t:`IPVA ${y} · cota ${m}/3`}));
    if(sr>0&&y<=2030)OBR.push({key:`renov-${y}`,due:`${y}-10-22`,amt:sr,env:"obr",t:`Renovação do seguro ${y}`});
  }
  OBR.sort((a,b)=>a.due<b.due?-1:1);
}
const SEG_RAW=[["2026-10-29",702.95],["2026-11-23",703.02],["2026-12-21",703.02],["2027-01-21",703.03],["2027-02-22",703.03],["2027-03-22",703.03],["2027-04-21",703.03],["2027-05-21",703.03],["2027-06-21",703.03],["2027-07-21",703.03],["2027-08-23",703.03],["2027-09-21",703.03]];
const faturaDe=s=>{const d=D(s);let f=new Date(d.getFullYear(),d.getMonth(),10);if(f<=d)f=new Date(d.getFullYear(),d.getMonth()+1,10);return iso(f)};
const SEG=SEG_RAW.map(([c,a],i)=>({key:"seg-"+String(i+1).padStart(2,"0"),n:i+1,charge:c,due:faturaDe(c),amt:a,env:"seg",t:"Seguro Suhai · parcela "+(i+1)+"/12"}));
const MONS=[];{let s="2026-11-02";while(s<="2031-10-20"){MONS.push(s);s=addDays(s,7)}}

/* ---------- Plano de manutenção (manual GM Tracker 2021, págs. 211–214) ---------- */
const MT=()=>[
  {id:"oleo",n:"Óleo do motor + filtro de óleo",km:Number(st.cfg.oleoKm)||7500,mes:6,tipo:"Troca de óleo",d:"dexos1 Gen 2 · SAE 5W30 sintético · 3,75 L (compre 4 L)"},
  {id:"comb",n:"Filtro de combustível",km:10000,mes:12,tipo:"Filtro de combustível",d:"Manual: troca a cada revisão"},
  {id:"revisao",n:"Revisão geral (inspeções do plano)",km:10000,mes:12,tipo:"Revisão",d:"Freios, suspensão, vazamentos, elétrica, faróis"},
  {id:"pneus",n:"Rodízio de pneus",km:10000,mes:12,tipo:"Rodízio de pneus",d:"Manual: inspeção e rodízio a cada revisão · 35 psi"},
  {id:"ar",n:"Filtro de ar do motor",km:30000,mes:null,tipo:"Filtro de ar",d:"Manual: troca aos 30 e 70 mil km"},
  {id:"cambio",n:"Óleo do câmbio automático",km:80000,mes:null,tipo:"Óleo do câmbio",d:"Dexron VI ACDelco · 8,1 L · uso severo"},
  {id:"velas",n:"Velas de ignição",km:100000,mes:null,tipo:"Velas",d:"Folga 0,6–0,7 mm"},
  {id:"correiaA",n:"Correia de acessórios",km:120000,mes:60,tipo:"Correia de acessórios",d:"120.000 km ou 5 anos"},
  {id:"arref",n:"Líquido de arrefecimento",km:150000,mes:60,tipo:"Arrefecimento",d:"Aditivo ACDelco laranja + água · 5,4 L"},
  {id:"freio",n:"Fluido de freio",km:null,mes:24,tipo:"Fluido de freio",d:"DOT 4 LV · 0,57 L · a cada 2 anos"},
  {id:"correiaS",n:"Correia sincronizadora, tensor e correia da bomba de óleo",km:240000,mes:180,tipo:"Correia sincronizadora",d:"240.000 km ou 15 anos"}
];
const OUTROS_TIPOS=["Pastilhas de freio","Pneus novos","Bateria","Alinhamento","Mecânica","Funilaria","Lavagem","IPVA","Licenciamento","Franquia","Outro"];

/* ---------- Estado ---------- */
const CFG0={man:150,res:100,kmLim:0,kmEx:0,oleoKm:5000,oleoPct:15,taxa:2.5,taxaOk:false,colchao:4000,planoDez:6000,ipva:4000,seguroRenov:7000};
const st={status:{},gastos:[],km:[],multas:[],docs:[],amort:[],aportes:[],mot:{},cfg:Object.assign({},CFG0),ficha:null,linhas:{}};
let user=null, PLAN={};

/* ---------- Dados ---------- */
async function loadAll(){
  const {data,error}=await sb.from(TABLE).select("colecao,id,dados").limit(5000);
  if(error)throw error;
  st.status={};st.gastos=[];st.km=[];st.multas=[];st.docs=[];st.amort=[];st.aportes=[];st.mot={};
  for(const r of data){
    const o=Object.assign({id:r.id},r.dados);
    if(r.colecao==="status")st.status[r.id]=o;
    else if(r.colecao==="gastos")st.gastos.push(o);
    else if(r.colecao==="km")st.km.push(o);
    else if(r.colecao==="multas")st.multas.push(o);
    else if(r.colecao==="docs")st.docs.push(o);
    else if(r.colecao==="amort")st.amort.push(o);
    else if(r.colecao==="aportes")st.aportes.push(o);
    else if(r.colecao==="config"&&r.id==="motorista")st.mot=r.dados||{};
    else if(r.colecao==="config"&&r.id==="geral")st.cfg=Object.assign({},CFG0,r.dados);
    else if(r.colecao==="ficha"&&r.id==="carro")st.ficha=r.dados;
    else if(r.colecao==="ficha"&&r.id==="linhas")st.linhas=r.dados;
  }
}
async function put(col,id,dados){
  const {error}=await sb.from(TABLE).upsert({user_id:user.id,colecao:col,id,dados},{onConflict:"user_id,colecao,id"});
  if(error)throw error;
}
async function del(col,id){
  const {error}=await sb.from(TABLE).delete().match({colecao:col,id});
  if(error)throw error;
}
const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
let busy=false;
async function act(fn,okMsg){
  if(busy)return;busy=true;
  try{await fn();await loadAll();render();if(okMsg)toast(okMsg)}
  catch(e){msg("Não salvou: "+(e&&e.message?e.message:"sem conexão")+". Tente de novo.")}
  finally{busy=false}
}

/* ---------- Arquivos (bucket privado) ---------- */
const urlCache={};
async function signed(paths){
  const need=paths.filter(p=>!urlCache[p]||urlCache[p].exp<Date.now());
  if(need.length){
    const {data}=await sb.storage.from(BUCKET).createSignedUrls(need,3600);
    (data||[]).forEach(x=>{if(x.signedUrl)urlCache[x.path]={u:x.signedUrl,exp:Date.now()+3300e3}});
  }
  const out={};paths.forEach(p=>{if(urlCache[p])out[p]=urlCache[p].u});return out;
}
async function openFile(path){
  const w=window.open("about:blank","_blank");
  const u=(await signed([path]))[path];
  if(!u){if(w)w.close();toast("Esse arquivo ainda não está no app: toque em Enviar no cartão dele.");missingSet=null;checkImport();return}
  if(w)w.location.href=u;else location.href=u;
}
async function compress(file,max=1600){
  if(!file.type.startsWith("image/"))return file;
  try{
    const img=await createImageBitmap(file);const k=Math.min(1,max/Math.max(img.width,img.height));
    const c=document.createElement("canvas");c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height);
    return await new Promise(r=>c.toBlob(b=>r(b||file),"image/jpeg",0.8));
  }catch(_){return file}
}
async function upload(path,blob,type){
  const {error}=await sb.storage.from(BUCKET).upload(path,blob,{upsert:true,contentType:type||blob.type||"application/octet-stream"});
  if(error)throw error;
}

/* ---------- Divisão por semana ---------- */
function plan(){
  PLAN={};let bf=0,bs=0,bo=0;const PANF=PAN.filter(p=>!isAnt(p.key));
  const need=(m,bal,list)=>{const f=list.find(x=>x.due>=m);if(!f)return 0;const n=MONS.filter(x=>x>=m&&x<=f.due).length||1;return Math.max(0,(f.amt-bal)/n)};
  for(const m of MONS){
    let a=need(m,bf,PANF),b=need(m,bs,SEG);
    if(a+b>RENT){const k=RENT/(a+b);a*=k;b*=k}
    let rest=RENT-a-b;const o=Math.min(need(m,bo,OBR),rest);rest-=o;const man=Math.min(Number(st.cfg.man)||0,rest);rest-=man;const res=Math.min(Number(st.cfg.res)||0,rest);rest-=res;
    PLAN[m]={fin:a,seg:b,obr:o,man,res,luc:rest};
    bf+=a;bs+=b;bo+=o;const nx=addDays(m,7);
    PANF.forEach(p=>{if(p.due>=m&&p.due<nx)bf-=p.amt});SEG.forEach(p=>{if(p.due>=m&&p.due<nx)bs-=p.amt});OBR.forEach(p=>{if(p.due>=m&&p.due<nx)bo-=p.amt});
  }
}
const isDone=k=>!!(st.status[k]&&st.status[k].done);
const isAnt=k=>!!(st.status[k]&&st.status[k].antecipada);
function envelopes(){
  const e={fin:0,seg:0,obr:0,man:0,res:0,luc:0};
  MONS.forEach(m=>{if(isDone("w-"+m)){const p=PLAN[m];for(const k in e)e[k]+=p[k]}});
  PAN.forEach(p=>{if(isDone(p.key)&&!isAnt(p.key))e.fin-=p.amt});
  OBR.forEach(p=>{if(isDone(p.key))e.obr-=p.amt});
  SEG.forEach(p=>{if(isDone(p.key))e.seg-=p.amt});
  st.gastos.forEach(g=>{if(e[g.env]!==undefined)e[g.env]-=Number(g.valor)||0});
  st.aportes.forEach(a=>{if(e[a.env]!==undefined)e[a.env]+=Number(a.valor)||0});
  /* sem lucro até quitar: enquanto a Reserva não bate o fundo mínimo, a sobra vai para a Reserva */
  const meta=Number(st.cfg.colchao)||0;
  if(e.res<meta&&e.luc>0){const t=Math.min(e.luc,meta-e.res);e.luc-=t;e.res+=t}
  st.amort.forEach(a=>{const f=a.fonte||{};e.luc-=Number(f.luc)||0;e.res-=Number(f.res)||0});
  return e;
}
const ENV_META=[["fin","Financiamento","Boleto Banco Pan · dia 20","--env-fin"],["seg","Seguro","Fatura do cartão · dia 10","--env-seg"],["obr","IPVA e seguro novo","IPVA (jan–mar) e renovação do seguro (out)","--env-obr"],["man","Manutenção","Óleo, pneus, freios, revisão","--env-man"],["res","Reserva (fundo de emergência)","Mínimo antes de amortizar · franquia, imprevistos","--env-res"],["luc","Caixa de amortização","Sem lucro até quitar: tudo vai para antecipar parcelas","--env-luc"]];

/* ---------- KM e manutenção ---------- */
function kmSorted(){return [...st.km].filter(k=>Number(k.km)>0).sort((a,b)=>a.data<b.data?1:a.data>b.data?-1:Number(b.km)-Number(a.km))}
function kmNow(){const k=kmSorted();return k[0]||null}
function kmRate(){ // km por dia
  const k=kmSorted();if(k.length<2)return null;
  const last=k[0];const ref=k.find(x=>diff(last.data,x.data)>=5&&Number(x.km)<Number(last.km));
  if(!ref)return null;return (Number(last.km)-Number(ref.km))/diff(last.data,ref.data);
}
function oleoPctNow(){const k=kmSorted().find(x=>x.oleo!==undefined&&x.oleo!==null&&x.oleo!=="");return k?{pct:Number(k.oleo),data:k.data}:null}
function mtStatus(){
  const cur=kmNow(),rate=kmRate(),curKm=cur?Number(cur.km):null;
  return MT().map(it=>{
    const feitos=st.gastos.filter(g=>g.tipo===it.tipo).sort((a,b)=>a.data<b.data?1:-1);
    const last=feitos[0]?{data:feitos[0].data,km:Number(feitos[0].km)||null,base:false}:{data:FAB,km:0,base:true};
    let restKm=null,dueKm=null,usedKm=0,dueDate=null,predDate=null;
    if(it.km&&last.km!==null&&curKm!==null){dueKm=last.km+it.km;restKm=dueKm-curKm;usedKm=Math.min(1,Math.max(0,(curKm-last.km)/it.km))}
    if(it.mes)dueDate=addMonths(last.data,it.mes);
    if(restKm!==null&&rate&&rate>0)predDate=addDays(TODAY,Math.max(0,Math.round(restKm/rate)));
    const usedT=it.mes?Math.min(1,Math.max(0,diff(TODAY,last.data)/(diff(dueDate,last.data)||1))):0;
    let sev="ok";
    const daysLeft=dueDate?diff(dueDate,TODAY):null;
    if((restKm!==null&&restKm<=0)||(daysLeft!==null&&daysLeft<0))sev="bad";
    else if((restKm!==null&&it.km&&restKm<=Math.max(1000,it.km*0.15))||(daysLeft!==null&&daysLeft<=30))sev="warn";
    let extra="";
    if(it.id==="oleo"){const o=oleoPctNow();if(o){extra=" · painel: "+o.pct+"% em "+brShort(o.data);if(o.pct<=Number(st.cfg.oleoPct||15))sev="bad";else if(o.pct<=Number(st.cfg.oleoPct||15)+10&&sev==="ok")sev="warn"}}
    let when=[];
    if(restKm!==null)when.push(restKm<=0?"passou "+nf(-restKm)+" km":"faltam "+nf(restKm)+" km");
    if(dueDate)when.push((daysLeft<0?"venceu em ":"até ")+br(dueDate));
    if(predDate&&restKm>0)when.push("previsão "+br(predDate));
    if(curKm===null&&it.km)when.push("anote o KM atual");
    if(last.base&&((it.km&&it.km<=30000)||(!it.km&&it.mes<=24))){
      return Object.assign({},it,{last,sev:"bad",when:"Sem registro: não sabemos quando foi feito. Faça e registre em Fiz"+extra,used:1,unk:true});
    }
    return Object.assign({},it,{last,sev,when:when.join(" · ")+extra,used:Math.max(usedKm,usedT)});
  });
}

/* ---------- Render ---------- */
function rentWeekState(m){
  if(isDone("w-"+m))return["ok","Recebido"];
  if(m>TODAY)return["neu","Futuro"];
  const late=diff(TODAY,m);
  if(late<=1)return["warn","Aguardando"];
  return["bad",late+" dias atrasado"];
}
function billState(b,e){
  if(isAnt(b.key))return["ok","Antecipada"];
  if(isDone(b.key))return["ok","Pago"];
  const d=diff(TODAY,b.due);
  if(d>0)return["bad",d+" dias vencido"];
  const first=(b.env==="fin"?PAN:b.env==="seg"?SEG:OBR).find(x=>!isDone(x.key));
  if(first&&first.key===b.key)return e[b.env]>=b.amt-0.005?["ok","Dinheiro separado"]:["warn","Faltam "+fmt0(b.amt-e[b.env])];
  return["neu",d===0?"Vence hoje":"Em "+(-d)+" dias"];
}
const lateCost=b=>{const d=diff(TODAY,b.due);return b.env==="fin"&&d>0?MULTA+MORA_DIA*d:0};

function renderPainel(){
  const e=envelopes(),al=[];
  const lateRent=MONS.filter(m=>m<TODAY&&diff(TODAY,m)>1&&!isDone("w-"+m));
  if(lateRent.length)al.push(["bad",`<b>Aluguel atrasado:</b> ${lateRent.length} semana(s), ${fmt(lateRent.length*RENT)} (desde ${br(lateRent[0])})`]);
  const thisMon=MONS.find(m=>m<=TODAY&&diff(TODAY,m)<=1&&!isDone("w-"+m));
  if(thisMon)al.push(["warn",`<b>Aluguel desta segunda (${brShort(thisMon)}) ainda não marcado.</b> Caiu os R$ 1.200? Peça também a foto do painel.`]);
  [...PAN,...SEG,...OBR].filter(b=>!isDone(b.key)&&b.due<TODAY).forEach(b=>{const c=lateCost(b);al.push(["bad",`<b>${esc(b.t)} vencida em ${br(b.due)}.</b> ${c?"Multa e mora até hoje: "+fmt(c)+".":"Pague a fatura do cartão."}`])});
  [...PAN,...SEG,...OBR].filter(b=>!isDone(b.key)&&b.due>=TODAY&&diff(b.due,TODAY)<=5).forEach(b=>{const s=billState(b,e);al.push([s[0]==="ok"?"ok":"warn",`<b>${esc(b.t)}</b> vence ${diff(b.due,TODAY)===0?"HOJE":"em "+diff(b.due,TODAY)+" dia(s)"} (${br(b.due)}) · ${fmt(b.amt)} · ${s[1]}`])});
  const mt=mtStatus(),unk=mt.filter(x=>x.unk),bad=mt.filter(x=>x.sev==="bad"&&!x.unk),warn=mt.filter(x=>x.sev==="warn");
  if(bad.length)al.push(["bad",bad.length===1?`<b>Manutenção vencida:</b> ${esc(bad[0].n)}. <a class="go" data-go="carro">Ver na aba Carro</a>`:`<b>${bad.length} manutenções vencidas pelo tempo/KM:</b> ${bad.map(x=>esc(x.n)).join(", ")}. <a class="go" data-go="carro">Ver na aba Carro</a>`]);
  if(unk.length)al.push(["warn",`<b>${unk.length} ${unk.length===1?"item":"itens"} de manutenção sem registro</b> (${unk.slice(0,3).map(x=>esc(x.n).split(" ")[0].toLowerCase()).join(", ")}${unk.length>3?"…":""}): não sabemos quando foram feitos. Faça uma revisão e marque "Fiz". <a class="go" data-go="carro">Ver na aba Carro</a>`]);
  if(warn.length)al.push(["warn",`<b>Manutenção chegando:</b> ${warn.map(x=>esc(x.n)).join(", ")}.`]);
  if(TODAY>="2027-08-01"&&TODAY<="2027-10-22")al.push(["warn","<b>Renovação do seguro em 22/10/2027.</b> Cote agora e, se der, pague à vista: o parcelamento atual custou R$ 1.466,23 a mais."]);
  if(!al.length)al.push(["ok","<b>Tudo em dia.</b> Nenhuma pendência nos próximos 5 dias."]);
  $("alertas").innerHTML=al.map(a=>`<div class="alert ${a[0]}"><span class="dot"></span><span>${a[1]}</span></div>`).join("");

  const rec=MONS.filter(m=>isDone("w-"+m)).length,panPaid=PAN.filter(p=>isDone(p.key)).length;
  const yr=TODAY.slice(0,4),recYr=MONS.filter(m=>m.startsWith(yr)&&isDone("w-"+m)).length*RENT;
  const cur=kmNow();
  const kpis=[["Total recebido",fmt0(rec*RENT),rec+" semana(s)"],["Recebido em "+yr,fmt0(recYr),"aluguel no ano"],["Saldo devedor Pan",fmt0(PAN.filter(p=>!isDone(p.key)).reduce((a,p)=>a+p.amt,0)),(60-panPaid)+" parcelas restantes"],["KM atual",cur?nf(cur.km):"—",cur?"em "+br(cur.data):"anote o KM"]];
  $("kpis").innerHTML=kpis.map(k=>`<div class="panel kpi"><div class="label">${k[0]}</div><div class="v num">${k[1]}</div><div class="s">${k[2]}</div></div>`).join("");

  const envHtml=ENV_META.map(([k,n,d,c])=>`<div class="env"><span class="sw" style="background:var(${c})"></span><div><div class="n">${n}</div><div class="d">${d}</div></div><div class="val num" style="color:${e[k]<-0.005?"var(--bad)":"var(--fg)"}">${fmt(e[k])}</div></div>`).join("");
  $("envs").innerHTML=envHtml;
  $("envs2").innerHTML=envHtml+`<div class="env" style="border-top:1px solid var(--line);padding-top:10px"><span></span><div class="n">Total guardado</div><div class="val num">${fmt(Object.values(e).reduce((a,b)=>a+b,0))}</div></div>`;

  const lim=addDays(TODAY,30),items=[];
  MONS.filter(m=>m>=addDays(TODAY,-1)&&m<=lim).forEach(m=>items.push({d:m,t:"Aluguel da semana",amt:RENT,in:true,s:rentWeekState(m)}));
  [...PAN,...SEG,...OBR].filter(b=>b.due<=lim&&!isDone(b.key)).forEach(b=>items.push({d:b.due,t:b.t,amt:b.amt,s:billState(b,e)}));
  items.sort((a,b)=>a.d<b.d?-1:1);
  $("prox").innerHTML=items.map(i=>`<div class="row"><div><div class="t">${esc(i.t)}</div><div class="m num">${WD[D(i.d).getDay()]}, ${br(i.d)}</div></div><div class="r"><span class="amt num" style="color:${i.in?"var(--ok)":"var(--fg)"}">${i.in?"+":"−"}${fmt(i.amt)}</span><span class="pill ${i.s[0]}">${i.s[1]}</span></div></div>`).join("")||`<div class="empty">Nada nos próximos 30 dias.</div>`;

  const nAnt=PAN.filter(p=>isAnt(p.key)).length;
  $("finTxt").textContent=`${panPaid} de 60 quitadas${nAnt?" ("+nAnt+" antecipadas)":""} · quitação prevista ${br(([...PAN].reverse().find(p=>!isDone(p.key))||PAN[59]).due)}`;
  $("finPct").textContent=Math.round(panPaid/60*100)+"% quitado";
  $("finBar").style.width=(panPaid/60*100)+"%";
}

let semFilter="ano";
function renderMot(){
  const mo=st.mot||{},tel=String(mo.tel||"").replace(/\D/g,"");
  $("motView").innerHTML=`<dl class="kv"><dt>Nome</dt><dd>${esc(mo.nome||"—")}</dd><dt>WhatsApp</dt><dd>${tel?`<a href="https://wa.me/55${tel}" target="_blank" rel="noopener">${esc(mo.tel)}</a>`:"—"}</dd><dt>Contrato</dt><dd>${mo.contrato?"Assinado de boa-fé":"Não assinado"}</dd><dt>Caução</dt><dd>${Number(mo.caucao)>0?fmt(Number(mo.caucao)):"Sem caução (combinado)"}</dd><dt>1º pagamento</dt><dd>02/11/2026</dd></dl>`;
  if(document.activeElement&&document.activeElement.closest&&document.activeElement.closest("#fMot"))return;
  $("moNome").value=mo.nome||"";$("moTel").value=mo.tel||"";$("moCont").value=mo.contrato?"sim":"nao";$("moCau").value=mo.caucao||"";
}
function renderSemanas(){
  renderMot();
  const lim=semFilter==="ano"?addDays(TODAY,365):"9999";
  const kmW={};st.km.forEach(k=>{if(k.id&&k.id.startsWith("w-"))kmW[k.id.slice(2)]=k});
  $("semList").innerHTML=MONS.filter(m=>m<=lim).map((m,i)=>{
    const p=PLAN[m],s=rentWeekState(m),done=isDone("w-"+m),kw=kmW[m];
    const canForm=m<=addDays(TODAY,1)&&diff(TODAY,m)<=70;
    const form=canForm?`<div class="wk">
        <label>KM no painel<input type="number" min="0" inputmode="numeric" id="wk-km-${m}" value="${kw?esc(kw.km):""}"></label>
        <label>Vida útil óleo %<input type="number" min="0" max="100" inputmode="numeric" id="wk-ol-${m}" value="${kw&&kw.oleo!=null?esc(kw.oleo):""}"></label>
        <label>Foto do painel<input type="file" accept="image/*" id="wk-ft-${m}"></label>
        <button class="btn sm" type="button" data-wk="${m}">Salvar KM</button>
        ${kw&&kw.foto?`<img class="thumb" alt="Foto do painel" data-foto-path="${esc(kw.foto)}" data-cap="Painel ${br(m)}">`:""}
      </div>`:"";
    return `<div class="row" style="grid-template-columns:1fr"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">
      <div><div class="t">Semana ${i+1} · segunda ${br(m)}</div><div class="m">${done&&st.status["w-"+m].at?"Recebido marcado em "+br(st.status["w-"+m].at):"R$ 1.200,00"}${kw?" · "+nf(kw.km)+" km"+(kw.oleo!=null&&kw.oleo!==""?" · óleo "+kw.oleo+"%":""):""}</div></div>
      <div class="r"><span class="pill ${s[0]}">${s[1]}</span>${done?`<label class="btn sm" style="cursor:pointer">${st.status["w-"+m].comp?"Trocar Pix":"Comprovante Pix"}<input type="file" accept="image/*,application/pdf" data-comp="${m}" hidden></label>${st.status["w-"+m].comp?`<button class="btn sm" type="button" data-open="${esc(st.status["w-"+m].comp)}">Ver</button>`:""}`:""}<button class="btn sm ${done?"":"pri"}" data-tog="w-${m}">${done?"Desfazer":"Recebi"}</button></div></div>
      <div class="split num"><div>Pan<b>${fmt0(p.fin)}</b></div><div>Seguro<b>${fmt0(p.seg)}</b></div><div>IPVA/Seg.<b>${fmt0(p.obr)}</b></div><div>Manut.<b>${fmt0(p.man)}</b></div><div>Reserva<b>${fmt0(p.res)}</b></div><div>Amortizar<b>${fmt0(p.luc)}</b></div></div>${form}</div>`}).join("");
  loadThumbs();
}

let contaFilter="abertas";
function renderContas(){
  const e=envelopes();let list=[...PAN,...SEG,...OBR].sort((a,b)=>a.due<b.due?-1:a.due>b.due?1:0);
  if(contaFilter==="abertas")list=list.filter(b=>!isDone(b.key)).slice(0,14);
  if(contaFilter==="pan")list=PAN;if(contaFilter==="seg")list=SEG;if(contaFilter==="obr")list=OBR;
  if(contaFilter==="pagas")list=list.filter(b=>isDone(b.key));
  $("contasList").innerHTML=list.map(b=>{const s=billState(b,e),done=isDone(b.key),c=lateCost(b),L=st.linhas[b.key];
    return `<div class="row"><div style="min-width:0"><div class="t">${esc(b.t)}</div><div class="m num">${b.env==="seg"?"Lançada no cartão "+br(b.charge)+" · fatura ":"Boleto · vence "}${br(b.due)}${c&&!done?" · com atraso: "+fmt(b.amt+c):""}${done&&st.status[b.key].at?" · pago em "+br(st.status[b.key].at):""}</div>${L&&!done?`<div class="m mono" style="margin-top:4px;overflow-wrap:anywhere">${esc(L[0])} <button class="copy" type="button" data-copy="${esc(L[0])}">Copiar código</button></div>`:""}</div>
    <div class="r"><span class="amt num">${fmt(b.amt)}</span><span class="pill ${s[0]}">${s[1]}</span><button class="btn sm ${done?"":"pri"}" data-tog="${b.key}">${done?"Desfazer":"Paguei"}</button></div></div>`}).join("")||`<div class="empty">Nenhuma conta aqui.</div>`;
}

const ENV_NAME={man:"Manutenção",res:"Reserva",luc:"Caixa de amortização",bolso:"Do meu bolso",fin:"Financiamento",seg:"Seguro",obr:"IPVA e seguro novo"};
function bolsoInfo(){const fundo=st.aportes.reduce((a,g)=>a+(Number(g.valor)||0),0),gas=st.gastos.filter(g=>g.env==="bolso").reduce((a,g)=>a+(Number(g.valor)||0),0),compl=st.amort.reduce((a,x)=>a+(Number((x.fonte||{}).bolso)||0),0);return{fundo,gas,compl,total:fundo+gas+compl}}
let extFilter="mes";
function ledger(){
  const L=[];
  MONS.forEach(m=>{if(isDone("w-"+m)){const x=st.status["w-"+m];L.push({d:x.at||m,t:"Aluguel da semana "+br(m),c:RENT,b:0,comp:x.comp})}});
  PAN.forEach(p=>{if(isDone(p.key)&&!isAnt(p.key))L.push({d:st.status[p.key].at||p.due,t:p.t,c:-p.amt,b:0})});
  [...SEG,...OBR].forEach(p=>{if(isDone(p.key))L.push({d:st.status[p.key].at||p.due,t:p.t,c:-p.amt,b:0})});
  st.gastos.forEach(g=>{const v=Number(g.valor)||0,t=g.tipo+(g.desc?" · "+g.desc:"");L.push(g.env==="bolso"?{d:g.data,t,c:0,b:v,del:"gastos/"+g.id,nota:"pago do seu bolso"}:{d:g.data,t,c:-v,b:0,del:"gastos/"+g.id,nota:"saiu de "+(ENV_NAME[g.env]||g.env)})});
  st.aportes.forEach(a=>{const v=Number(a.valor)||0;L.push({d:a.data,t:"Aporte do bolso"+(a.desc?" · "+a.desc:""),c:v,b:v,del:"aportes/"+a.id,nota:"entrou em "+(ENV_NAME[a.env]||a.env)})});
  st.amort.forEach(a=>{const f=a.fonte||{},cx=(Number(f.luc)||0)+(Number(f.res)||0),bo=Number(f.bolso)||0;L.push({d:a.data,t:"Amortização Pan · "+(a.modo==="parcela"?"reduziu a parcela":(a.parcelas||[]).length+" parcela(s) antecipada(s)"),c:-cx,b:bo,nota:"pago "+fmt(Number(a.valor))+(bo?" · "+fmt(bo)+" do bolso":"")})});
  L.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);let saldo=0;L.forEach(x=>{saldo+=x.c;x.s=saldo});return L;
}
function renderGastos(){
  const B=bolsoInfo();
  $("bolsoBox").innerHTML=[["Fundo de emergência",B.fundo],["Gastos pagos por você",B.gas],["Complementos de amortização",B.compl]].map(x=>`<div class="env"><span></span><div class="n">${x[0]}</div><div class="val num" style="font-size:1.15rem">${fmt(x[1])}</div></div>`).join("")+`<div class="env" style="border-top:1px solid var(--line);padding-top:10px"><span></span><div class="n">Total do seu bolso</div><div class="val num">${fmt(B.total)}</div></div>`;
  const all=ledger(),ym=TODAY.slice(0,7),pm=addMonths(TODAY.slice(0,8)+"01",-1).slice(0,7);
  const L=extFilter==="tudo"?all:all.filter(x=>x.d.slice(0,7)===(extFilter==="mes"?ym:pm));
  const ent=L.filter(x=>x.c>0).reduce((a,x)=>a+x.c,0),sai=L.filter(x=>x.c<0).reduce((a,x)=>a-x.c,0),bo=L.reduce((a,x)=>a+x.b,0);
  $("extTot").innerHTML=[["Entrou no caixa",fmt(ent),"var(--ok)"],["Saiu do caixa",fmt(sai),"var(--bad)"],["Saiu do seu bolso",fmt(bo),"var(--warn)"],["Saldo do caixa hoje",fmt(all.length?all[all.length-1].s:0),"var(--fg)"]].map(k=>`<div class="kpi"><div class="label">${k[0]}</div><div class="v num" style="font-size:1.3rem;color:${k[2]}">${k[1]}</div></div>`).join("");
  $("extTbl").innerHTML=L.length?`<thead><tr><th>Data</th><th>Movimento</th><th class="n">Caixa</th><th class="n">Saldo</th><th class="n">Bolso</th><th></th></tr></thead><tbody>${[...L].reverse().map(x=>`<tr><td class="num" style="white-space:nowrap">${br(x.d)}</td><td>${esc(x.t)}${x.nota?`<div class="note">${esc(x.nota)}</div>`:""}${x.comp?` <a href="#" data-open="${esc(x.comp)}">comprovante</a>`:""}</td><td class="n" style="color:${x.c>0?"var(--ok)":x.c<0?"var(--bad)":"var(--muted)"}">${x.c?(x.c>0?"+":"−")+fmt(Math.abs(x.c)):"—"}</td><td class="n">${fmt(x.s)}</td><td class="n" style="color:${x.b?"var(--warn)":"var(--muted)"}">${x.b?fmt(x.b):"—"}</td><td>${x.del?`<button class="btn sm" data-del="${esc(x.del)}">Excluir</button>`:""}</td></tr>`).join("")}</tbody>`:`<tbody><tr><td class="empty">Nada neste período.</td></tr></tbody>`;
}

function excesso(dl,dias){const lim=Number(st.cfg.kmLim)||0;if(!lim||dias<1)return"";const ex=dl-Math.round(lim*dias/7);if(ex<=0)return` <span class="pill ok">dentro da franquia</span>`;return` <span class="pill bad">+${nf(ex)} km acima${Number(st.cfg.kmEx)?" · cobrar "+fmt(ex*Number(st.cfg.kmEx)):""}</span>`}
function renderCarro(){
  const cur=kmNow(),rate=kmRate(),o=oleoPctNow();
  $("kmKpis").innerHTML=[
    ["KM atual",cur?nf(cur.km):"—",cur?"em "+br(cur.data):"anote o KM"],
    ["Ritmo",rate?nf(Math.round(rate*7))+" km":"—","por semana"],
    ["Vida útil do óleo",o?o.pct+"%":"—",o?"no painel em "+br(o.data):"lance pela foto do painel"]
  ].map(x=>`<div class="kpi"><div class="label">${x[0]}</div><div class="v num" style="font-size:1.5rem">${x[1]}</div><div class="s">${x[2]}</div></div>`).join("");
  const lbl={ok:"Em dia",warn:"Chegando",bad:"Vencido"};
  $("mtList").innerHTML=mtStatus().map(x=>`<div class="it"><div style="min-width:0"><div class="t">${esc(x.n)}</div>
     <div class="m">${esc(x.d)}</div>
     <div class="m">${x.unk?"":x.last.base?"Sem registro (calculado desde a fabricação) · ":"Última: "+br(x.last.data)+(x.last.km?" · "+nf(x.last.km)+" km":"")+" · "}${x.when?esc(x.when):"—"}</div>
     <div class="bar"><i class="${x.sev}" style="width:${Math.round(x.used*100)}%"></i></div></div>
     <div class="r"><span class="pill ${x.sev}">${lbl[x.sev]}</span><button class="btn sm" data-fiz="${esc(x.tipo)}">Fiz</button></div></div>`).join("");
  const k=kmSorted();
  $("kmList").innerHTML=k.slice(0,10).map((x,i)=>{const p=k[i+1],dl=p?Number(x.km)-Number(p.km):null,dd=p?diff(x.data,p.data):0;return `<div class="row"><div><div class="t num">${nf(x.km)} km${x.oleo!=null&&x.oleo!==""?" · óleo "+esc(x.oleo)+"%":""}${dl!==null&&dd>0?` <span class="pill neu">+${nf(dl)} km em ${dd} dia(s)</span>`+excesso(dl,dd):""}</div><div class="m">${br(x.data)}${x.obs?" · "+esc(x.obs):""}</div></div><div class="r">${x.foto?`<img class="thumb" alt="Foto do painel" data-foto-path="${esc(x.foto)}" data-cap="Painel ${br(x.data)}">`:""}<button class="btn sm" data-del="km/${esc(x.id)}">Excluir</button></div></div>`}).join("")||`<div class="empty">Sem anotações.</div>`;
  const ms=[...st.multas].sort((a,b)=>a.data<b.data?1:-1);
  $("multaList").innerHTML=ms.map(x=>`<div class="row"><div><div class="t">${esc(x.desc)}</div><div class="m num">${br(x.data)} · ${fmt(Number(x.valor))}</div></div><div class="r"><span class="pill ${x.status==="pago"?"ok":"warn"}">${x.status==="pago"?"Motorista pagou":"Repassar ao motorista"}</span><button class="btn sm" data-multa="${esc(x.id)}">${x.status==="pago"?"Reabrir":"Pago"}</button><button class="btn sm" data-del="multas/${esc(x.id)}">Excluir</button></div></div>`).join("")||`<div class="empty">Nenhuma multa registrada.</div>`;
  $("cMan").value=st.cfg.man;$("cRes").value=st.cfg.res;$("cKmLim").value=st.cfg.kmLim||0;$("cKmEx").value=st.cfg.kmEx||0;$("cOleoKm").value=st.cfg.oleoKm||7500;$("cOleoPct").value=st.cfg.oleoPct??15;
  loadThumbs();
}

const SPECS=[["Óleo do motor","dexos1 Gen 2 · 5W30","100% sintético, com selo dexos1 APPROVED GEN 2 · 3,75 L com filtro"],["Câmbio automático","Dexron VI · 8,1 L","ACDelco · troca a cada 80.000 km em uso severo"],["Fluido de freio","DOT 4 LV · 0,57 L","Troca a cada 2 anos"],["Arrefecimento","Aditivo laranja · 5,4 L","ACDelco longa vida, 35% aditivo · 150.000 km ou 5 anos"],["Pneus","215/60 R16 ou 215/55 R17","35 psi frente e trás · estepe T115/70 R16 a 60 psi"],["Velas","Folga 0,6–0,7 mm","Troca aos 100.000 km"],["Bateria","12 V 60 Ah EFB","Com Stop/Start · alternador 130 A"],["Motor","1.2 Turbo · 3 cilindros","132/133 cv · 190/210 Nm · marcha lenta 900 rpm"],["Tanque","44 L","Flex: etanol ou gasolina"],["Ar-condicionado","R134a · 480 g","Inspeção semanal"],["Revisões","10.000 km ou 1 ano","O que vier primeiro · uso severo: siga a vida útil do óleo no painel"],["Óleo no painel","Vida útil do óleo","Menu do painel: VIDA ÚTIL REMANESCENTE DO ÓLEO · zere após cada troca (SET/CLR)"]];
function kv(id,rows){$(id).innerHTML=(rows||[]).map(r=>`<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join("")}
let missingSet=null;
function renderFiles(){
  const f=st.ficha||{};
  const docs=[...(f.docs||[]).map(d=>({path:d[0],nome:d[1],desc:d[2]})),...st.docs.map(d=>({path:d.path,nome:d.nome,desc:br(d.data),id:d.id}))];
  $("files").innerHTML=docs.map(d=>{const pdf=/\.pdf$/i.test(d.path),miss=missingSet?missingSet.has(d.path):false,chk=!missingSet;
    const head=`<span class="ic"${pdf?"":' style="background:var(--accent)"'}>${pdf?"PDF":"IMG"}</span><span style="min-width:0;flex:1"><span class="fn">${esc(d.nome)}</span><br><span class="fs">${esc(d.desc||"")}</span></span>`;
    if(miss)return `<label class="file miss">${head}<span class="pill warn">Enviar</span><input type="file" accept="${pdf?".pdf,application/pdf":"image/*"}" data-upfile="${esc(d.path)}" hidden></label>`;
    return `<div class="file" role="button" tabindex="0" data-open="${esc(d.path)}">${head}<span class="pill ${chk?"neu":"ok"}">${chk?"…":"Abrir"}</span></div>`}).join("");
  const n=missingSet?missingSet.size:0;
  const fot=(f.fotos||[]).map(x=>x[0]),fm=missingSet?fot.filter(p=>missingSet.has(p)).length:0;
  if($("galSt"))$("galSt").innerHTML=missingSet&&fm?`<div class="alert warn" style="margin-bottom:10px"><span class="dot"></span><span><b>${fm} de ${fot.length} fotos da vistoria ainda não estão no app.</b> Use "Enviar todos de uma vez" lá em cima, pelo computador.</span></div>`:"";
  $("filesSt").innerHTML=missingSet?(n?`<span class="pill warn">${n} arquivo(s) ainda não estão no app</span>`:`<span class="pill ok">Todos os documentos estão no app</span>`):"";
}
async function renderFicha(){
  $("specs").innerHTML=SPECS.map(s=>`<div class="s"><div class="k">${esc(s[0])}</div><div class="v">${esc(s[1])}</div><div class="d">${esc(s[2])}</div></div>`).join("");
  const f=st.ficha;if(!f)return;
  const placa=(f.veiculo||[]).find(r=>r[0]==="Placa");if(placa)$("placa").textContent=placa[1];
  kv("kvVeic",f.veiculo);kv("kvApol",f.apolice);kv("kvFin",f.financiamento);kv("kvLaudo",f.laudo&&f.laudo.dados);
  $("tels").innerHTML=(f.telefones||[]).map(t=>`<div class="row"><div><div class="t">${esc(t[0])}</div><div class="m num" style="font-size:1rem;user-select:all">${esc(t[1])}</div></div><div class="r"><a class="btn sm" href="tel:${esc(t[1].replace(/\D/g,""))}">Ligar</a></div></div>`).join("");
  $("tCob").innerHTML=`<thead><tr><th>Cobertura</th><th>Importância segurada</th><th class="n">Franquia</th><th class="n">Prêmio</th></tr></thead><tbody>${(f.coberturas||[]).map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td class="n">${esc(r[2])}</td><td class="n">${esc(r[3])}</td></tr>`).join("")}</tbody>`;
  $("premio").innerHTML=(f.premio||[]).map(p=>`<div class="kpi"><div class="label">${esc(p[0])}</div><div class="v num" style="font-size:1.25rem">${esc(p[1])}</div></div>`).join("");
  $("laudoStatus").innerHTML=((f.laudo&&f.laudo.status)||[]).map(x=>`<div class="row"><div><div class="t">${esc(x[0])}</div><div class="m">${esc(x[1])}</div></div><div class="r"><span class="pill ok">OK</span></div></div>`).join("");
  $("laudoAt").innerHTML=`<span class="dot"></span><span><b>Atenção:</b> ${esc(f.laudo&&f.laudo.atencao)}</span>`;
  renderFiles();
  const fotos=f.fotos||[];
  $("gal").innerHTML=fotos.map((x,i)=>`<button type="button" data-gal="${i}"><img alt="${esc(x[1])}" data-foto-path="${esc(x[0])}" loading="lazy"><span>${esc(x[1])}</span></button>`).join("");
  loadThumbs();
  checkImport();
}
function renderTimeline(){
  const ev=[
    {d:"2020-11-24",t:"Fabricação",x:"Data gravada no cinto de segurança · ano/modelo 2020/2021"},
    {d:"2026-08-06",t:"Vistoria cautelar APROVADA",x:"Super Visão · 98.050 km"},
    {d:"2026-10-21",t:"Financiamento Banco Pan",x:"60 × R$ 2.934,64"},
    {d:"2026-10-22",t:"Seguro Suhai contratado",x:"Uso aplicativo · condutor indeterminado"},
    {d:"2026-11-02",t:"1º pagamento do aluguel",x:"R$ 1.200 por semana, toda segunda · motorista Jhonatan · contrato de boa-fé"},
    {d:"2027-10-22",t:"Renovação do seguro",x:"Fim da vigência da apólice atual",fut:1},
    {d:"2031-10-20",t:"Última parcela do Pan",x:"Carro quitado",fut:1}
  ];
  st.gastos.forEach(g=>ev.push({d:g.data,t:g.tipo+" · "+fmt(Number(g.valor)),x:(g.desc||"")+(g.km?" · "+nf(g.km)+" km":"")}));
  st.amort.forEach(a=>ev.push({d:a.data,t:"Amortização Pan · "+fmt(Number(a.valor)),x:(a.modo==="parcela"?"Reduziu a parcela":"Antecipou "+(a.parcelas||[]).length+" parcela(s)")+" · economia estimada "+fmt0(Number(a.economia)||0)}));
  st.multas.forEach(m=>ev.push({d:m.data,t:"Multa · "+fmt(Number(m.valor)),x:m.desc+(m.status==="pago"?" · paga pelo motorista":" · a repassar")}));
  ev.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
  $("timeline").innerHTML=ev.map(e=>`<div class="ev" style="${e.fut?"opacity:.6":""}"><div class="dt">${br(e.d)}</div><div class="mk"><i style="${e.fut?"background:var(--surface);border-color:var(--accent)":""}"></i></div><div><div class="tt">${esc(e.t)}</div><div class="dd">${esc(e.x)}</div></div></div>`).join("");
}
async function loadThumbs(){
  const imgs=[...document.querySelectorAll("img[data-foto-path]:not([src])")];
  if(!imgs.length)return;
  const urls=await signed([...new Set(imgs.map(i=>i.dataset.fotoPath))]);
  imgs.forEach(i=>{const u=urls[i.dataset.fotoPath];if(u)i.src=u;else{i.alt="";i.classList.add("nofoto")}});
}
function render(){
  TODAY=iso(new Date());buildPan();buildObr();plan();renderPainel();renderSemanas();renderContas();renderGastos();renderCarro();renderTimeline();renderFicha();renderAmort();
  const sel=$("gTipo"),cur=sel.value;sel.innerHTML=[...MT().map(x=>x.tipo),...OUTROS_TIPOS].map(t=>`<option>${esc(t)}</option>`).join("");if(cur)sel.value=cur;
}

/* ---------- Amortização ---------- */
let amModo="prazo", amSel=null;
const taxaM=()=>Math.max(0,Number(st.cfg.taxa)||0)/100;
const pvAt=(p,date,i)=>p.due<=date?p.amt:p.amt/Math.pow(1+i,diff(p.due,date)/30.4375);
function splitFor(v){const e=envelopes(),meta=Number(st.cfg.colchao)||0,ok=e.res>=meta-0.005;const luc=ok?Math.min(v,Math.max(0,e.luc)):0,res=ok?Math.min(v-luc,Math.max(0,e.res-meta)):0;return{luc,res,bolso:Math.max(0,v-luc-res),ok}}
function amRegPrev(){const v=Number($("amRegValor").value)||0,o=$("amRegPrev");if(!v){o.innerHTML="";return}const sp=splitFor(v);o.innerHTML=`<b>Da caixa:</b> ${fmt(sp.luc+sp.res)} · <b>Do seu bolso:</b> <span style="color:${sp.bolso?"var(--warn)":"inherit"}">${fmt(sp.bolso)}</span>${sp.ok?"":" · fundo de emergência ainda abaixo de "+fmt0(Number(st.cfg.colchao)||0)+", então a caixa fica travada"}`}
function disponivel(){const e=envelopes();return Math.max(0,e.luc)+Math.max(0,e.res-(Number(st.cfg.colchao)||0))}
function simPrazo(valor,date,i){
  const abertas=PAN.filter(p=>!isDone(p.key)&&p.due>date).sort((a,b)=>a.due<b.due?1:-1);
  let bud=valor,sel=[],pago=0,face=0;
  for(const p of abertas.slice(0,abertas.length-1)){const v=pvAt(p,date,i);if(v>bud)break;bud-=v;pago+=v;face+=p.amt;sel.push({key:p.key,t:p.t,due:p.due,amt:p.amt,v})}
  const rest=PAN.filter(p=>!isDone(p.key)&&!sel.find(s=>s.key===p.key));
  const quit=rest.length?rest[rest.length-1].due:date;
  return {sel,pago,face,eco:face-pago,quit};
}
function simParcela(valor,date,i){
  const ab=PAN.filter(p=>!isDone(p.key)&&p.due>date);if(!ab.length)return null;
  const pv=ab.reduce((a,p)=>a+pvAt(p,date,i),0);const use=Math.min(valor,pv);const f=(pv-use)/pv;
  const nova=ab[0].amt*f;const eco=ab.reduce((a,p)=>a+p.amt,0)*(1-f)-use;
  return {nova,eco,pago:use,n:ab.length};
}
function saldoPV(date,i,skip){return PAN.filter(p=>!isDone(p.key)&&p.due>date&&!(skip&&skip.has(p.key))).reduce((a,p)=>a+pvAt(p,date,i),0)}
function projecao(i,B){
  // passo mensal (dia 21 de cada mês) até a última parcela; amortiza B em todo dezembro a partir de 2027 (modo prazo)
  const out=[];const skip=new Set();let d0=TODAY.slice(0,8)+"21";if(d0<TODAY)d0=addMonths(d0,1);
  let ecoTot=0,quitPlano=null;const decs=[];
  for(let d=d0;d<="2031-10-21";d=addMonths(d,1)){
    if(B>0&&d.slice(5,7)==="12"&&d>="2027-12-01"){
      const ab=PAN.filter(p=>!isDone(p.key)&&p.due>d&&!skip.has(p.key)).sort((a,b)=>a.due<b.due?1:-1);
      let bud=B,n=0,eco=0;for(const p of ab.slice(0,ab.length-1)){const v=pvAt(p,d,i);if(v>bud)break;bud-=v;skip.add(p.key);n++;eco+=p.amt-v}
      ecoTot+=eco;decs.push({ano:d.slice(0,4),n,eco,usado:B-bud});
    }
    out.push({d,sem:saldoPV(d,i),com:saldoPV(d,i,skip)});
  }
  const rest=PAN.filter(p=>!isDone(p.key)&&!skip.has(p.key));quitPlano=rest.length?rest[rest.length-1].due:TODAY;
  return {out,ecoTot,quitPlano,decs};
}
function chartSVG(pts){
  if(!pts.length)return "";
  const W=640,H=220,L=56,Rr=12,T=12,Bm=28,max=Math.max(...pts.map(p=>p.sem))||1;
  const x=k=>L+(W-L-Rr)*k/(pts.length-1||1),y=v=>T+(H-T-Bm)*(1-v/max);
  const line=key=>pts.map((p,k)=>(k?"L":"M")+x(k).toFixed(1)+","+y(p[key]).toFixed(1)).join("");
  let grid="";for(let g=0;g<=4;g++){const v=max*g/4;grid+=`<line x1="${L}" x2="${W-Rr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${v>=1000?Math.round(v/1000)+" mil":Math.round(v)}</text>`}
  let xt="";pts.forEach((p,k)=>{if(p.d.slice(5,7)==="01")xt+=`<text x="${x(k)}" y="${H-8}" text-anchor="middle" font-size="11" fill="var(--muted)">${p.d.slice(0,4)}</text>`});
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Saldo devedor com e sem amortização">${grid}${xt}<path d="${line("sem")}" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="5 4"/><path d="${line("com")}" fill="none" stroke="var(--ok)" stroke-width="3"/></svg>`;
}
function renderAmort(){
  const i=taxaM(),disp=disponivel(),pv=saldoPV(TODAY,i),face=PAN.filter(p=>!isDone(p.key)).reduce((a,p)=>a+p.amt,0);
  $("amKpis").innerHTML=[
    ["Na caixa para amortizar",fmt0(disp),(envelopes().res>=(Number(st.cfg.colchao)||0)-0.005)?"caixa de amortização + reserva acima do fundo":"TRAVADO: fundo de emergência abaixo de "+fmt0(Number(st.cfg.colchao)||0)],
    ["Taxa usada",(Number(st.cfg.taxa)||0).toLocaleString("pt-BR")+"% a.m.",st.cfg.taxaOk?"confirmada no contrato":"ESTIMATIVA · confirme na CCB"],
    ["Para quitar hoje",fmt0(pv),"saldo sem os juros futuros"],
    ["Juros ainda embutidos",fmt0(face-pv),"o que dá para economizar"]
  ].map((k,n)=>`<div class="panel kpi"><div class="label">${k[0]}</div><div class="v num" style="${n===1&&!st.cfg.taxaOk?"color:var(--warn)":""}">${k[1]}</div><div class="s">${k[2]}</div></div>`).join("");
  ["amTaxa","amColchao","amPlano","amIpva","amRenov"].forEach(id=>{const k={amTaxa:"taxa",amColchao:"colchao",amPlano:"planoDez",amIpva:"ipva",amRenov:"seguroRenov"}[id];if(document.activeElement!==$(id))$(id).value=st.cfg[k]});
  $("amTaxaOk").checked=!!st.cfg.taxaOk;
  if(!$("amValor").value)$("amValor").value=Math.floor(disp/100)*100||"";
  renderSim();
  const pr=projecao(i,Number(st.cfg.planoDez)||0);
  $("amChart").innerHTML=chartSVG(pr.out);
  $("amResumo").innerHTML=`Com <b>${fmt0(Number(st.cfg.planoDez)||0)}</b> todo dezembro (a partir de 2027): economia de <b>${fmt0(pr.ecoTot)}</b> em juros e carro quitado em <b>${br(pr.quitPlano)}</b> em vez de ${br(([...PAN].reverse().find(p=>!isDone(p.key))||PAN[59]).due)}.`;
  $("amDecs").innerHTML=`<thead><tr><th>Dezembro</th><th class="n">Usar</th><th class="n">Parcelas quitadas</th><th class="n">Economia</th></tr></thead><tbody>${pr.decs.map(d=>`<tr><td>${d.ano}</td><td class="n">${fmt0(d.usado)}</td><td class="n">${d.n}</td><td class="n">${fmt0(d.eco)}</td></tr>`).join("")||`<tr><td colspan="4" class="note">Defina um valor por dezembro.</td></tr>`}</tbody>`;
  const hs=[...st.amort].sort((a,b)=>a.data<b.data?1:-1);
  $("amHist").innerHTML=hs.map(a=>`<div class="row"><div><div class="t">${br(a.data)} · ${fmt(Number(a.valor))}</div><div class="m">${a.modo==="parcela"?"Reduziu a parcela para "+fmt(Number(a.novaParcela)):"Antecipou "+(a.parcelas||[]).length+" parcela(s) do fim"} · economia estimada ${fmt0(Number(a.economia)||0)} · saiu ${fmt0((Number((a.fonte||{}).luc)||0)+(Number((a.fonte||{}).res)||0))} da caixa${Number((a.fonte||{}).bolso)?" + "+fmt0(Number(a.fonte.bolso))+" do seu bolso":""}</div></div><div class="r"><button class="btn sm" data-amdel="${esc(a.id)}">Desfazer</button></div></div>`).join("")||`<div class="empty">Nenhuma amortização registrada ainda.</div>`;
}
function renderSim(){
  const i=taxaM(),v=Number($("amValor").value)||0,date=$("amData").value||TODAY;
  $("amNova").hidden=amModo!=="parcela";
  if(amModo==="prazo"){
    const r=simPrazo(v,date,i);amSel=r;
    $("amSim").innerHTML=r.sel.length?`<div class="alert ok"><span class="dot"></span><span><b>Quita ${r.sel.length} parcela(s) do fim</b> pagando ${fmt(r.pago)} no lugar de ${fmt(r.face)}. <b>Economia de ${fmt(r.eco)}</b> em juros. Nova quitação: <b>${br(r.quit)}</b>.</span></div>
      <div class="scroll" style="margin-top:8px"><table class="tbl"><thead><tr><th>Parcela</th><th>Vencimento</th><th class="n">Valor cheio</th><th class="n">Com desconto</th></tr></thead><tbody>${r.sel.map(p=>`<tr><td>${esc(p.t.replace("Banco Pan · ",""))}</td><td>${br(p.due)}</td><td class="n">${fmt(p.amt)}</td><td class="n">${fmt(p.v)}</td></tr>`).join("")}</tbody></table></div>`
      :`<div class="empty">Com esse valor não dá para quitar nem uma parcela do fim. Aumente o valor.</div>`;
    $("amRegValor").value=r.sel.length?r.pago.toFixed(2):"";amRegPrev();
  }else{
    const r=simParcela(v,date,i);amSel=r;
    $("amSim").innerHTML=r?`<div class="alert ok"><span class="dot"></span><span>A parcela cai de ${fmt(PAN.find(p=>!isDone(p.key)).amt)} para cerca de <b>${fmt(r.nova)}</b> nas ${r.n} restantes. Economia de juros: <b>${fmt(r.eco)}</b>. O valor exato vem no boleto do Pan.</span></div>`:`<div class="empty">Nada a amortizar.</div>`;
    $("amRegValor").value=r?r.pago.toFixed(2):"";amRegPrev();if(r&&!$("amNovaParcela").value)$("amNovaParcela").value=r.nova.toFixed(2);
  }
  // comparação
  const a=simPrazo(v,date,i),b=simParcela(v,date,i);
  $("amComp").textContent=b?`Com ${fmt0(v)}: reduzir PRAZO economiza ${fmt0(a.eco)} · reduzir PARCELA economiza ${fmt0(b.eco)}.`:"";
}

/* ---------- Importação inicial dos arquivos ---------- */
let missing=[];
async function checkImport(){
  const f=st.ficha;if(!f||!user)return;
  const expected=[...(f.docs||[]).map(d=>d[0]),...(f.fotos||[]).map(x=>x[0])];
  const have=new Set();
  for(const dir of ["docs","laudo"]){
    const {data}=await sb.storage.from(BUCKET).list(user.id+"/"+dir,{limit:500});
    (data||[]).forEach(o=>have.add(user.id+"/"+dir+"/"+o.name));
  }
  for(const d of st.docs){const dir=d.path.split("/").slice(1,-1).join("/");if(dir&&!["docs","laudo"].includes(dir)){const {data}=await sb.storage.from(BUCKET).list(user.id+"/"+dir,{limit:500});(data||[]).forEach(o=>have.add(user.id+"/"+dir+"/"+o.name))}}
  missing=expected.filter(p=>!have.has(p));
  missingSet=new Set([...missing,...st.docs.map(d=>d.path).filter(p=>!have.has(p))]);
  renderFiles();
  $("importBox").hidden=!missing.length;
  $("importTxt").textContent=missing.length?`Faltam ${missing.length} arquivo(s): ${missing.filter(p=>/\.pdf$/i.test(p)).length} documento(s) e ${missing.filter(p=>!/\.pdf$/i.test(p)).length} foto(s) da vistoria.`:"";
}
document.addEventListener("change",ev=>{const u=ev.target.closest("[data-upfile]");if(!u||!u.files[0]||!user)return;const p=u.dataset.upfile,file=u.files[0];
  const card=u.closest(".file");if(card)card.querySelector(".pill").textContent="Enviando…";
  act(async()=>{const pdf=/\.pdf$/i.test(p);if(pdf&&!/pdf/i.test(file.type)&&!/\.pdf$/i.test(file.name))throw new Error("escolha o arquivo PDF");await upload(p,pdf?file:await compress(file,2200),pdf?"application/pdf":"image/jpeg")},"Documento enviado").then(()=>{missingSet=null;checkImport()})});
$("importIn").addEventListener("change",async ev=>{
  const files=[...ev.target.files];if(!files.length)return;
  const byName={};missing.forEach(p=>byName[p.split("/").pop().toLowerCase()]=p);
  let ok=0,skip=0;
  for(const file of files){
    const nm=file.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const alias=/carteirinha/.test(nm)?"carteirinha-suhai.pdf":/ap.?lice/.test(nm)?"apolice-suhai.pdf":/boleto|carne/.test(nm)?"boletos-banco-pan.pdf":/manual/.test(nm)?"manual-tracker-2021.pdf":/laudo|qmn3f41|cautelar|rei.?car/.test(nm)&&/\.pdf$/.test(nm)?"laudo-cautelar.pdf":null;
    const p=byName[nm]||(alias&&byName[alias]);
    if(!p){skip++;continue}
    try{$("importTxt").textContent=`Enviando ${ok+1} de ${files.length}: ${file.name}…`;await upload(p,file,file.type||(/\.pdf$/i.test(file.name)?"application/pdf":"image/jpeg"));ok++}
    catch(e){msg("Falhou "+file.name+": "+e.message)}
  }
  ev.target.value="";toast(`${ok} arquivo(s) enviados${skip?` · ${skip} já estavam no app ou não são da lista`:""}`);
  missingSet=null;renderFiles();checkImport();
});

/* ---------- UI ---------- */
const tabs=[...document.querySelectorAll("nav.tabs button")];
const VIEWS=["painel","semanas","contas","amort","caixinha","carro","ficha"];
function show(v){tabs.forEach(b=>b.setAttribute("aria-selected",String(b.dataset.v===v)));VIEWS.forEach(x=>$("v-"+x).hidden=x!==v);try{localStorage.setItem("tab",v)}catch(e){}}
tabs.forEach(b=>b.addEventListener("click",()=>{show(b.dataset.v);window.scrollTo(0,0)}));
document.addEventListener("click",ev=>{const g=ev.target.closest("[data-go]");if(!g||!VIEWS.includes(g.dataset.go))return;ev.preventDefault();show(g.dataset.go);window.scrollTo(0,0)});
const segBind=(id,fn)=>$(id).addEventListener("click",ev=>{const b=ev.target.closest("button");if(!b)return;[...b.parentNode.children].forEach(x=>x.setAttribute("aria-pressed",String(x===b)));fn(b.dataset.f)});
segBind("segSem",f=>{semFilter=f;renderSemanas()});segBind("segContas",f=>{contaFilter=f;renderContas()});
function msg(t){const b=$("banner");b.textContent=t;b.hidden=!t;if(t)window.scrollTo(0,0)}
let tt;function toast(t){const e=$("toast");e.textContent=t;e.hidden=false;clearTimeout(tt);tt=setTimeout(()=>e.hidden=true,2500)}

let LB=[],lbI=0;const lb=$("lb");
async function lbShow(i){lbI=(i+LB.length)%LB.length;const [p,c]=LB[lbI];const u=(await signed([p]))[p];$("lbImg").src=u||"";$("lbImg").alt=c;$("lbCap").textContent=(LB.length>1?(lbI+1)+"/"+LB.length+" · ":"")+c;lb.hidden=false}
$("lbClose").onclick=()=>lb.hidden=true;$("lbPrev").onclick=()=>lbShow(lbI-1);$("lbNext").onclick=()=>lbShow(lbI+1);
lb.addEventListener("click",e=>{if(e.target===lb)lb.hidden=true});
document.addEventListener("keydown",e=>{if(lb.hidden)return;if(e.key==="Escape")lb.hidden=true;if(e.key==="ArrowRight")lbShow(lbI+1);if(e.key==="ArrowLeft")lbShow(lbI-1)});

document.addEventListener("click",async ev=>{
  const g=ev.target.closest("[data-gal]");
  if(g){LB=(st.ficha&&st.ficha.fotos)||[];lbShow(Number(g.dataset.gal));return}
  const th=ev.target.closest("img.thumb");
  if(th){LB=[[th.dataset.fotoPath,th.dataset.cap||"Foto"]];lbShow(0);return}
  const op=ev.target.closest("[data-open]");
  if(op){openFile(op.dataset.open);return}
  const c=ev.target.closest("[data-copy]");
  if(c){const v=c.dataset.copy.replace(/\D/g,"");try{await navigator.clipboard.writeText(v);c.textContent="Copiado";setTimeout(()=>c.textContent="Copiar código",1800)}catch(_){c.textContent=v}return}
  const t=ev.target.closest("[data-tog]");
  if(t){const k=t.dataset.tog;t.disabled=true;act(()=>isDone(k)?del("status",k):put("status",k,{done:true,at:TODAY}),isDone(k)?"Desfeito":"Marcado");return}
  const d=ev.target.closest("[data-del]");
  if(d){if(d.dataset.confirm!=="1"){d.dataset.confirm="1";d.textContent="Confirmar?";setTimeout(()=>{d.dataset.confirm="";d.textContent="Excluir"},3000);return}
    const [col,id]=d.dataset.del.split("/");act(()=>del(col,id),"Excluído");return}
  const m=ev.target.closest("[data-multa]");
  if(m){const x=st.multas.find(y=>y.id===m.dataset.multa);if(x){const {id,...rest}=x;act(()=>put("multas",id,Object.assign(rest,{status:x.status==="pago"?"aberto":"pago"})))}return}
  const ad=ev.target.closest("[data-amdel]");
  if(ad){if(ad.dataset.confirm!=="1"){ad.dataset.confirm="1";ad.textContent="Confirmar?";setTimeout(()=>{ad.dataset.confirm="";ad.textContent="Desfazer"},3000);return}
    const a=st.amort.find(x=>x.id===ad.dataset.amdel);if(a)act(async()=>{for(const k of (a.parcelas||[]))await del("status",k);await del("amort",a.id)},"Amortização desfeita");return}
  const fz=ev.target.closest("[data-fiz]");
  if(fz){show("caixinha");$("gTipo").value=fz.dataset.fiz;$("gEnv").value="man";$("gData").value=TODAY;const cur=kmNow();if(cur)$("gKm").value=cur.km;$("gValor").focus();toast("Preencha o valor e lance");return}
  const wk=ev.target.closest("[data-wk]");
  if(wk){const m=wk.dataset.wk,km=Number($("wk-km-"+m).value),ol=$("wk-ol-"+m).value,file=$("wk-ft-"+m).files[0];
    const prev=st.km.find(k=>k.id==="w-"+m);
    if(!km&&!file){toast("Digite o KM da foto");return}
    wk.disabled=true;wk.textContent="Salvando…";
    act(async()=>{let foto=prev&&prev.foto;
      if(file){const blob=await compress(file);foto=`${user.id}/painel/${m}-${Date.now()}.jpg`;await upload(foto,blob,"image/jpeg")}
      await put("km","w-"+m,{data:m,km:km||(prev&&prev.km)||0,oleo:ol===""?null:Number(ol),foto:foto||null,obs:"Semana do aluguel"})},"KM salvo");return}
});
document.addEventListener("keydown",ev=>{if(ev.key==="Enter"&&ev.target.matches("[data-open]"))openFile(ev.target.dataset.open)});

$("fGasto").addEventListener("submit",ev=>{ev.preventDefault();
  const g={data:$("gData").value,env:$("gEnv").value,tipo:$("gTipo").value,desc:$("gDesc").value.trim(),valor:Number($("gValor").value),km:$("gKm").value?Number($("gKm").value):null};
  act(async()=>{await put("gastos",newId(),g);if(g.km)await put("km",newId(),{data:g.data,km:g.km,obs:g.tipo})},"Lançado");
  $("gDesc").value="";$("gValor").value="";$("gKm").value=""});
$("gTipo").addEventListener("change",()=>{if($("gEnv").value==="bolso")return;const t=$("gTipo").value;$("gEnv").value=["IPVA","Licenciamento","Franquia"].includes(t)?"res":"man"});
$("fAporte").addEventListener("submit",ev=>{ev.preventDefault();const v=Number($("aValor").value);if(!(v>0))return;act(()=>put("aportes",newId(),{data:$("aData").value,env:$("aEnv").value,desc:$("aDesc").value.trim(),valor:v}),"Aporte lançado");$("aDesc").value="";$("aValor").value=""});
$("fMot").addEventListener("submit",ev=>{ev.preventDefault();act(()=>put("config","motorista",{nome:$("moNome").value.trim(),tel:$("moTel").value.trim(),contrato:$("moCont").value==="sim",caucao:Number($("moCau").value)||0}),"Motorista salvo")});
$("amRegValor").addEventListener("input",amRegPrev);
segBind("segExt",f=>{extFilter=f;renderGastos()});
document.addEventListener("change",ev=>{const c=ev.target.closest("[data-comp]");if(!c||!c.files[0]||!user)return;const m=c.dataset.comp,file=c.files[0];
  act(async()=>{const isImg=file.type.startsWith("image/");const blob=isImg?await compress(file):file;const path=`${user.id}/comprovantes/${m}-${Date.now()}.${isImg?"jpg":(file.name.split(".").pop()||"pdf").toLowerCase()}`;await upload(path,blob,isImg?"image/jpeg":file.type);const x=Object.assign({},st.status["w-"+m]);delete x.id;await put("status","w-"+m,Object.assign(x,{comp:path}))},"Comprovante salvo")});
$("fKm").addEventListener("submit",ev=>{ev.preventDefault();const o=$("kOleo").value;act(()=>put("km",newId(),{data:$("kData").value,km:Number($("kVal").value),oleo:o===""?null:Number(o)}),"KM anotado");$("kVal").value="";$("kOleo").value=""});
$("fMulta").addEventListener("submit",ev=>{ev.preventDefault();act(()=>put("multas",newId(),{data:$("mData").value,desc:$("mDesc").value.trim(),valor:Number($("mValor").value),status:"aberto"}),"Multa registrada");$("mDesc").value="";$("mValor").value=""});
$("fCfg").addEventListener("submit",ev=>{ev.preventDefault();act(()=>put("config","geral",Object.assign({},st.cfg,{man:Number($("cMan").value)||0,res:Number($("cRes").value)||0,oleoKm:Number($("cOleoKm").value)||5000,kmLim:Number($("cKmLim").value)||0,kmEx:Number($("cKmEx").value)||0,oleoPct:Number($("cOleoPct").value)||15})),"Ajustes salvos")});
$("fDoc").addEventListener("submit",ev=>{ev.preventDefault();const file=$("dFile").files[0];if(!file)return;
  act(async()=>{const id=newId();const ext=(file.name.split(".").pop()||"bin").toLowerCase();const blob=await compress(file,2200);const path=`${user.id}/extras/${id}.${file.type.startsWith("image/")?"jpg":ext}`;await upload(path,blob,file.type.startsWith("image/")?"image/jpeg":file.type);await put("docs",id,{nome:$("dNome").value.trim(),path,data:TODAY})},"Documento enviado");
  $("dNome").value="";$("dFile").value=""});
["gData","kData","mData","amData","aData"].forEach(id=>$(id).value=TODAY);


segBind("segAm",f=>{amModo=f;renderSim()});
["amValor","amData"].forEach(id=>$(id).addEventListener("input",renderSim));
$("fAmCfg").addEventListener("submit",ev=>{ev.preventDefault();act(()=>put("config","geral",Object.assign({},st.cfg,{taxa:Number(String($("amTaxa").value).replace(",","."))||0,taxaOk:$("amTaxaOk").checked,colchao:Number($("amColchao").value)||0,planoDez:Number($("amPlano").value)||0,ipva:Number($("amIpva").value)||0,seguroRenov:Number($("amRenov").value)||0})),"Parâmetros salvos")});
$("fAmReg").addEventListener("submit",ev=>{ev.preventDefault();
  const valor=Number($("amRegValor").value)||0,data=$("amData").value||TODAY;if(valor<=0){toast("Informe o valor pago");return}
  if(amModo==="prazo"&&!(amSel&&amSel.sel&&amSel.sel.length)){toast("Simule primeiro");return}
  const sp=splitFor(valor),luc=sp.luc,res=sp.res,bolso=sp.bolso;
  const id=newId();
  const doc={data,valor,modo:amModo,fonte:{luc,res,bolso},economia:amModo==="prazo"?amSel.eco:(amSel?amSel.eco:0)};
  if(amModo==="prazo")doc.parcelas=amSel.sel.map(p=>p.key);else{const np=Number($("amNovaParcela").value)||0;if(np<=0){toast("Informe o novo valor da parcela");return}doc.novaParcela=np}
  act(async()=>{await put("amort",id,doc);if(doc.parcelas)for(const k of doc.parcelas)await put("status",k,{done:true,at:data,antecipada:true,amortId:id})},"Amortização registrada");
  $("amValor").value="";$("amNovaParcela").value=""});
/* ---------- Login ---------- */
$("fLogin").addEventListener("submit",async ev=>{ev.preventDefault();$("lErr").textContent="";$("lBtn").disabled=true;
  const {error}=await sb.auth.signInWithPassword({email:$("lEmail").value.trim(),password:$("lSenha").value});
  $("lBtn").disabled=false;if(error)$("lErr").textContent=error.message==="Invalid login credentials"?"E-mail ou senha incorretos.":error.message});
$("lReset").addEventListener("click",async()=>{const e=$("lEmail").value.trim();if(!e){$("lErr").textContent="Digite seu e-mail primeiro.";return}
  const {error}=await sb.auth.resetPasswordForEmail(e,{redirectTo:location.origin+location.pathname});$("lErr").textContent=error?error.message:"Enviamos um link para redefinir a senha no seu e-mail."});
$("btnSair").addEventListener("click",async()=>{await sb.auth.signOut()});

async function boot(session){
  user=session?session.user:null;
  $("loginView").hidden=!!user;$("appView").hidden=!user;
  if(!user)return;
  $("whoami").textContent="Conectado como "+user.email;
  $("loading").hidden=false;VIEWS.forEach(x=>$("v-"+x).hidden=true);
  try{await loadAll();$("loading").hidden=true;render();
    const h=(location.hash||"").slice(1);let saved=null;try{saved=localStorage.getItem("tab")}catch(e){}
    show(VIEWS.includes(h)?h:(VIEWS.includes(saved)?saved:"painel"));
    if(!st.ficha)msg("Este login não tem acesso aos dados do carro.");
  }catch(e){$("loading").textContent="Sem conexão com os dados. Puxe para recarregar.";}
}
let booted;
sb.auth.onAuthStateChange((evt,session)=>{
  if(evt==="PASSWORD_RECOVERY"){$("novaBox").hidden=false}
  const uid=session&&session.user?session.user.id:null;
  if(uid!==booted){booted=uid;setTimeout(()=>boot(session),0)}
});
$("fNova").addEventListener("submit",async ev=>{ev.preventDefault();const {error}=await sb.auth.updateUser({password:$("nSenha").value});
  if(error){msg(error.message);return}$("novaBox").hidden=true;toast("Senha alterada")});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&user&&!busy){loadAll().then(render).catch(()=>{})}});

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
})();
