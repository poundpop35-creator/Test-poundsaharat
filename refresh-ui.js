(()=>{'use strict';
const file=location.pathname.split('/').pop()||'index.html';
document.documentElement.classList.add('reading-room');
const qs=(s)=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const bar=qs('.app-bar');
if(bar){
 const panel=bar.querySelector('.app-menu-panel');
 const catalog=(window.STUDY_CATALOG||[]).filter(p=>p.hub!==false);
 const current=catalog.find(p=>p.file===file||p.sprint===file);
 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const groups=[['agencies','กำลังเตรียมสอบ'],['archive','สอบแล้ว · เปิดทวน'],['resources','คลังกลางและกฎหมาย'],['english','ภาษาอังกฤษ']];
 panel.innerHTML='<a class="app-menu-home" href="index.html">← หน้าแรก · คลังติวทั้งหมด</a>'+
   '<div class="room-menu-groups">'+groups.map(([key,title])=>{
     const pages=catalog.filter(p=>p.group===key);
     return '<details class="room-menu-group"'+(current?.group===key?' open':'')+'>'+
       '<summary>'+title+' <small>'+pages.length+'</small></summary>'+
       '<div class="room-menu-items"><a class="room-group-overview" href="index.html#'+key+'">ดูภาพรวมหมวดนี้</a>'+
       pages.map(p=>'<a href="'+safe(p.file)+'"'+(p.id===current?.id?' aria-current="page"':'')+'>'+safe(p.short)+'</a>').join('')+
       '</div></details>';
   }).join('')+'</div>';
 bar.querySelector('.app-menu summary span').textContent='เลือกสนาม';
}else if(file!=='study.html'){
 const n=document.createElement('nav');n.className='room-nav';n.setAttribute('aria-label','เมนูหลัก');n.innerHTML='<a class="room-brand" href="index.html">▤ &nbsp;คลังติว</a><a href="index.html#agencies">เลือกสนาม →</a>';document.body.prepend(n);
}
function fold(el,title){
 if(!el||!title||el.parentElement.classList.contains('room-fold'))return;
 const d=document.createElement('details'),s=document.createElement('summary');d.className='room-fold';s.textContent=title;el.before(d);d.append(s,el);return d;
}
all('.app-agency-rail,.app-research-link').forEach(n=>fold(n,n.classList.contains('app-agency-rail')?'ชุดอื่นในสนามนี้':'แผนอ่านและสรุปเสริม'));
if(file==='index.html'){
 const search=qs('.home-search'),end=qs('.home-help'),group=document.createElement('details');
 if(search&&end){group.className='room-fold room-directory';group.id='directory';const title=document.createElement('summary');title.textContent='ค้นหาสนามสอบและคลังอื่น ๆ';search.before(group);group.append(title);while(group.nextElementSibling&&group.nextElementSibling!==end)group.append(group.nextElementSibling);
 const show=()=>{if(['#agencies','#resources','#english','#archive'].includes(location.hash)){group.open=true;group.scrollIntoView({block:'start'})}};show();window.addEventListener('hashchange',show);document.addEventListener('click',e=>{const a=e.target.closest('.app-menu-panel a');if(a&&a.hash===location.hash)show()})}
}
if(file==='coj.html'){
 all('main>article.card,main>section.card').forEach(el=>{const h=el.querySelector('h2,h3');if(h)fold(el,h.textContent)});
 const main=qs('main'),nav=document.createElement('nav');nav.className='room-path';nav.setAttribute('aria-label','เลือกบทอ่าน');nav.innerHTML='<b>สารบัญบทติว</b><a href="#roadmap">แผนอ่าน</a><a href="#law">กฎหมาย 60 คะแนน</a><a href="#proc">พัสดุ 140 คะแนน</a><a href="#policy">นโยบายปี 2570</a>';main.prepend(nav);
}
if(file==='exam-tutor.html'||file.startsWith('opsmoac-writing')||file.startsWith('opsmoac-five')){
 all('main>section.agency,main>article.five-card,main>section.section').forEach(el=>{let h=el.querySelector('h2,h3');if(h)fold(el,h.textContent)});
}
if(file==='energy-study-guide.html'){
 all('main>h3').forEach(h=>{let article=document.createElement('section');h.before(article);article.append(h);while(article.nextElementSibling&&!/^H[23]$/.test(article.nextElementSibling.tagName))article.append(article.nextElementSibling);fold(article,h.textContent)});
}
if(qs('#dashboard')){
 const review=qs('#history')?.closest('section.card');if(review&&review.parentElement.id==='dashboard')fold(review,'ผลการฝึกที่ผ่านมา');
 const briefing=qs('#briefing');if(briefing&&!briefing.closest('details'))fold(briefing,'วิธีใช้และขอบเขตชุดฝึก');
}
function reveal(){let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}const el=id&&document.getElementById(id);if(!el)return;let changed=false;for(let n=el;n;n=n.parentElement)if(n.tagName==='DETAILS'&&!n.open){n.open=true;changed=true}if(changed)el.scrollIntoView({block:'start'})}
reveal();window.addEventListener('hashchange',reveal);document.addEventListener('click',e=>{let a=e.target.closest('a[href^="#"]');if(a&&a.hash===location.hash)reveal()});
})();
