/**
 * Gera a página AUTÓNOMA do Guia do Técnico Expert (HTML+CSS+JS, sem dependências):
 *   apps/web/public/guia-tecnico-expert.html
 * Legível por qualquer pessoa (não exige leitor de Markdown), offline, imprimível,
 * com índice lateral c/ scrollspy, pesquisa, tema claro/escuro e botão imprimir.
 * Uso: node scripts/gen-guia-html.mjs   (ou: corepack pnpm gen:guia)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const guide = JSON.parse(fs.readFileSync(path.join(here, "../packages/content/src/data/guide.json"), "utf8"));
const OUT = path.join(here, "../apps/web/public/guia-tecnico-expert.html");

const toc = guide.toc; // [[id, title], ...]
const body = guide.html;

const nav = toc
  .map(([id, t], i) => `<a class="toc${i === 0 ? " top" : ""}" href="#${id}" data-t="${t.toLowerCase()}">${t}</a>`)
  .join("\n");

const html = `<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Guia do Técnico Expert — Gestão Cegid PHC Evolution</title>
<meta name="description" content="Guia completo do técnico expert do módulo Gestão do Cegid PHC Evolution: 15 capítulos, offline, imprimível e pesquisável.">
<style>
:root{--bg:#f7f8fb;--fg:#1a2233;--mut:#5b6780;--card:#fff;--line:#e3e7ef;--ac:#d98324;--ac2:#b06a10;--code:#0d1117;--side:#fff}
[data-theme=dark]{--bg:#0d1220;--fg:#e8ecf6;--mut:#93a0bd;--card:#161e31;--line:#2a3754;--ac:#f5a623;--ac2:#ffd97a;--code:#0d1117;--side:#101728}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 "Segoe UI",system-ui,-apple-system,Arial,sans-serif}
.wrap{display:grid;grid-template-columns:280px minmax(0,1fr);gap:0;max-width:1280px;margin:0 auto}
aside{position:sticky;top:0;height:100vh;overflow-y:auto;background:var(--side);border-right:1px solid var(--line);padding:18px 14px}
.brand{font-weight:800;color:var(--ac);font-size:17px;letter-spacing:.3px;margin:0 0 2px}
.sub{color:var(--mut);font-size:12px;margin:0 0 14px}
.tools{display:flex;gap:6px;margin-bottom:12px}
.tools input{flex:1;min-width:0;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg);font-size:13px}
.tools button{padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg);cursor:pointer;font-size:13px}
.toc{display:block;padding:6px 10px;border-radius:8px;color:var(--mut);text-decoration:none;font-size:13px;margin-bottom:2px}
.toc:hover{background:var(--bg);color:var(--fg)}
.toc.active{background:var(--ac);color:#171103;font-weight:600}
.toc.top{font-weight:700;color:var(--fg)}
main{padding:26px 30px 80px;min-width:0}
article{max-width:860px}
h1{font-size:26px;color:var(--ac2);margin:0 0 8px}
h2{font-size:21px;color:var(--ac2);margin:34px 0 10px;padding-top:14px;border-top:2px solid var(--line)}
h3{font-size:17px;margin:22px 0 8px}
h4{font-size:15px;margin:16px 0 6px}
p,li{margin:0 0 8px}
ul,ol{padding-left:22px}
table{width:100%;border-collapse:collapse;font-size:13.5px;margin:12px 0}
th,td{border:1px solid var(--line);padding:7px 9px;text-align:left;vertical-align:top}
th{background:var(--card);color:var(--ac2)}
code{background:var(--card);border:1px solid var(--line);border-radius:4px;padding:1px 5px;font-size:.86em;font-family:ui-monospace,Consolas,monospace}
pre{background:var(--code);color:#d6e0ee;border:1px solid var(--line);border-radius:10px;padding:12px 14px;overflow:auto;font-size:13px}
pre code{background:none;border:none;color:inherit;padding:0}
blockquote{border-left:4px solid var(--ac);background:var(--card);padding:10px 14px;border-radius:0 8px 8px 0;margin:12px 0;color:var(--mut)}
a{color:#1f6fd0}
[data-theme=dark] a{color:#7ec8ff}
mark{background:var(--ac);color:#171103;border-radius:3px;padding:0 2px}
.topbar{display:none}
@media(max-width:900px){
  .wrap{grid-template-columns:1fr}
  aside{position:static;height:auto;border-right:none;border-bottom:1px solid var(--line)}
  .tocList{display:none}
  .tocList.open{display:block}
  main{padding:18px 16px 70px}
  .topbar{display:flex;gap:8px;align-items:center;margin-bottom:10px}
}
@media print{
  aside,.tools,.topbar{display:none!important}
  .wrap{display:block}
  body{background:#fff;color:#000}
  a{color:#000;text-decoration:none}
  pre{white-space:pre-wrap}
}
</style>
</head>
<body>
<div class="wrap">
<aside>
  <p class="brand"> Guia do Técnico Expert</p>
  <p class="sub">Gestão Cegid PHC Evolution · 15 capítulos</p>
  <div class="tools">
    <input id="q" type="search" placeholder="Filtrar índice…" aria-label="Filtrar índice">
    <button id="theme" title="Alternar tema">🌙</button>
    <button id="print" title="Imprimir / PDF">🖨</button>
  </div>
  <div class="tools">
    <input id="fs" type="search" placeholder="Pesquisar no texto… (Enter)" aria-label="Pesquisar no texto">
    <button id="fsNext" title="Próxima ocorrência">↓</button>
    <span id="fsCount" style="font-size:11px;color:var(--mut);align-self:center"></span>
  </div>
  <div class="topbar"><button id="menu" style="flex:1">☰ Índice</button></div>
  <nav class="tocList" id="toc">
${nav}
  </nav>
</aside>
<main>
<article class="guia">
${body}
</article>
</main>
</div>
<script>
(function(){
  var root=document.documentElement;
  var saved=(function(){try{return localStorage.getItem('guiaTheme')}catch(e){return null}})();
  if(saved)root.setAttribute('data-theme',saved);
  else if(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)root.setAttribute('data-theme','dark');
  var tb=document.getElementById('theme');
  function syncTb(){tb.textContent=root.getAttribute('data-theme')==='dark'?'☀️':'🌙'}
  syncTb();
  tb.onclick=function(){var d=root.getAttribute('data-theme')==='dark'?'':'dark';if(d)root.setAttribute('data-theme',d);else root.removeAttribute('data-theme');try{localStorage.setItem('guiaTheme',d)}catch(e){} syncTb();};
  document.getElementById('print').onclick=function(){window.print()};
  var menu=document.getElementById('menu'),list=document.getElementById('toc');
  if(menu)menu.onclick=function(){list.classList.toggle('open')};
  // filtrar índice
  var q=document.getElementById('q');
  q.addEventListener('input',function(){
    var v=q.value.toLowerCase();
    list.querySelectorAll('.toc').forEach(function(a){a.style.display=a.getAttribute('data-t').indexOf(v)>=0?'':'none'});
    if(v)list.classList.add('open');
  });
  // scrollspy
  var links=[].slice.call(list.querySelectorAll('.toc'));
  var byId={};links.forEach(function(a){byId[a.getAttribute('href').slice(1)]=a});
  var heads=[].slice.call(document.querySelectorAll('article [id^=cap-]'));
  function onScroll(){
    var y=window.scrollY+120,cur=heads[0];
    for(var i=0;i<heads.length;i++){if(heads[i].offsetTop<=y)cur=heads[i]}
    links.forEach(function(a){a.classList.remove('active')});
    if(cur&&byId[cur.id])byId[cur.id].classList.add('active');
  }
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  list.addEventListener('click',function(){if(window.innerWidth<=900)list.classList.remove('open')});
  // pesquisa full-text c/ realce (sem regex p/ evitar escaping)
  var art=document.querySelector('article');
  var fs=document.getElementById('fs'),fsNext=document.getElementById('fsNext'),fsCount=document.getElementById('fsCount');
  var marks=[],mi=-1;
  function clearMarks(){for(var i=0;i<marks.length;i++){var m=marks[i],p=m.parentNode;if(p){p.replaceChild(document.createTextNode(m.textContent),m);p.normalize()}}marks=[];mi=-1;fsCount.textContent=''}
  function markNode(node,q){
    var t=node.textContent,low=t.toLowerCase(),ql=q.toLowerCase(),idx=low.indexOf(ql);
    if(idx<0)return;
    var frag=document.createDocumentFragment(),last=0;
    while(idx>=0){
      if(idx>last)frag.appendChild(document.createTextNode(t.slice(last,idx)));
      var mk=document.createElement('mark');mk.textContent=t.slice(idx,idx+q.length);frag.appendChild(mk);marks.push(mk);
      last=idx+q.length;idx=low.indexOf(ql,last);
    }
    if(last<t.length)frag.appendChild(document.createTextNode(t.slice(last)));
    node.parentNode.replaceChild(frag,node);
  }
  function doSearch(){
    clearMarks();
    var q=fs.value.trim();if(q.length<2)return;
    var nodes=[].slice.call(art.querySelectorAll('p,li,td,th,h1,h2,h3,h4,blockquote,code'));
    for(var i=0;i<nodes.length;i++){
      var el=nodes[i];
      var texts=[].slice.call(el.childNodes).filter(function(n){return n.nodeType===3});
      for(var j=0;j<texts.length;j++)markNode(texts[j],q);
    }
    fsCount.textContent=marks.length?marks.length+' resultado(s)':'0 resultados';
    if(marks.length){mi=-1;goMark()}
  }
  function goMark(){if(!marks.length)return;for(var i=0;i<marks.length;i++)marks[i].style.outline='';mi=(mi+1)%marks.length;var m=marks[mi];m.style.outline='3px solid #1f6fd0';m.scrollIntoView({block:'center',behavior:'smooth'})}
  fs.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();doSearch()}});
  fs.addEventListener('input',function(){if(!fs.value.trim())clearMarks()});
  fsNext.onclick=goMark;
})();
</script>
</body>
</html>`;

fs.writeFileSync(OUT, html);
console.log("Guia HTML gerado:", OUT, (html.length / 1024).toFixed(0) + "KB");
