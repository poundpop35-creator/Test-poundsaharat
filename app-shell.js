(function () {
  'use strict';
  const catalog = window.STUDY_CATALOG;
  if (!catalog) return;
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function icon(name) {
    const paths = {book:'M12 6c-3-2-7-2-10-1v14c3-1 7-1 10 1m0-14c3-2 7-2 10-1v14c-3-1-7-1-10 1V6',file:'M14 2H5v20h14V7l-5-5v6h5M8 12h8M8 16h8',layers:'m12 3 10 5-10 5L2 8l10-5Zm-10 10 10 5 10-5M2 18l10 5 10-5',search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',menu:'M3 6h18M3 12h18M3 18h18'};
    return paths[name]?`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"/></svg>`:esc(name);
  }
  function href(file,hash='') {
    const item=catalog.find(p=>p.file===file);
    return (item?'study.html?page='+encodeURIComponent(item.id):file)+(hash?('#'+hash.replace(/^#/,'')):'');
  }
  window.StudyUI={escape:esc,icon,href};
  const file = location.pathname.split('/').pop() || 'index.html';
  const sprintPage = catalog.find(p=>p.sprint===file);
  const sprint = !!sprintPage;
  const page = catalog.find(p=>p.file===file);
  const groups = {agencies:'กำลังเตรียมสอบ',resources:'กฎหมายและตัวบท',english:'ภาษาอังกฤษ',archive:'หน่วยงานที่สอบแล้ว'};
  const bar = document.createElement('div');bar.className='app-bar';
  bar.innerHTML=`<div class="app-bar-inner"><a class="app-brand" href="index.html" aria-label="คลังติว กลับหน้าเลือกหน่วยงาน"><span class="app-brand-mark">${icon('book')}</span><span>คลังติว</span></a><span class="app-breadcrumb">${esc(sprint?sprintPage.short+' / '+(sprintPage.sprintCount||60)+' ข้อ':page?page.short:'เลือกหน่วยงาน')}</span><details class="app-menu"><summary>${icon('menu')}<span>หน่วยงาน / หมวด</span></summary><nav aria-label="เลือกหน่วยงานและหมวด" class="app-menu-panel"><a class="app-menu-home" href="index.html">หน้าแรก · ทุกหมวด →</a><div class="app-menu-groups">${Object.entries(groups).map(([key,label])=>`<section><h2>${label}</h2>${catalog.filter(p=>p.group===key).map(p=>`<a href="${href(p.file)}"${p.file===file?' aria-current="page"':''}><span>${esc(p.short)}</span>${p.priority?'<small>อ่านก่อน</small>':''}</a>${p.sprint?`<a class="app-menu-child" href="${p.sprint}"${p.sprint===file?' aria-current="page"':''}>↳ ${p.sprintCount===100?'สอบเต็มชุด':'ตะลุย'} ${esc(p.short)} ${p.sprintCount||60} ข้อ</a>`:''}`).join('')}</section>`).join('')}</div></nav></details></div>`;
  document.body.prepend(bar);
  const content = document.querySelector('main') || document.querySelector('body > .wrap');
  if(content){if(!content.id)content.id='app-content';content.tabIndex=-1;const skip=document.createElement('a');skip.className='app-skip';skip.href='#'+content.id;skip.textContent='ข้ามไปเนื้อหา';document.body.prepend(skip);}
  const menu = bar.querySelector('details'), trigger=menu.querySelector('summary');
  document.addEventListener('click',e=>{if(menu.open&&!menu.contains(e.target))menu.open=false;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.open){menu.open=false;trigger.focus();}});
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.open=false;}));
  if(file==='index.html')return;
  try{if(page)localStorage.setItem('study:last-page',JSON.stringify({file,hash:location.hash}));}catch(_){}
  const header = document.querySelector('body > header');
  if(header){
    header.querySelectorAll('a[href="index.html"]').forEach(a=>a.hidden=true);
    if(sprint){const n=header.querySelector('nav');if(n)n.hidden=true;}
    if(page&&(page.group==='agencies'||page.group==='archive')){
      const h=header.querySelector('h1'),sub=header.querySelector('.sub');
      if(h&&sub){const role=h.textContent;h.textContent=page.title;sub.textContent=role;}
      const eyebrow=header.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent=page.group==='archive'?'คลังเดิม · หน่วยงานที่สอบแล้ว':'เตรียมสอบ · '+page.short;
    }
  }
  if(page?.id==='opsmoac')document.querySelectorAll('body > .wrap > .intro-card, #home > .intro-card').forEach(card=>{if(!card.querySelector('a[href="opsmoac-sprint.html"]'))return;const walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);while(walker.nextNode())walker.currentNode.nodeValue=walker.currentNode.nodeValue.replace(/(?:60|100)(?=\s*(ข้อ|โจทย์))/g,'300').replace(/3 ชุด(?:ฝึก)?/g,'3 ชุด ชุดละ 100 ข้อ');});
  const tabInfo={home:['อ่านเนื้อหา','read'],book:['ฝึกแยกหมวด','practice'],mock:['ข้อสอบรวม','exam'],laws:['สรุปกฎหมาย','summary'],src:['ตัวบทฉบับเต็ม','sources']};
  const tabs=document.querySelector('.tabs');
  if(tabs){
    tabs.setAttribute('role','navigation');tabs.setAttribute('aria-label','หมวดการเรียน');
    if(page&&page.sprint&&!tabs.querySelector(`a[href="${page.sprint}"]`)){
      const link=document.createElement('a');link.className='tab';link.href=page.sprint;tabs.append(link);
    }
    tabs.querySelectorAll('.tab').forEach(old=>{
      let el=old;
      if(old.tagName!=='A'&&old.tagName!=='BUTTON'){
        el=document.createElement('button');
        [...old.attributes].forEach(a=>el.setAttribute(a.name,a.value));el.type='button';el.innerHTML=old.innerHTML;old.replaceWith(el);
      }
      if(tabInfo[el.dataset.tab]){
        const [label,hash]=tabInfo[el.dataset.tab];el.textContent=label;el.style.order=Object.keys(tabInfo).indexOf(el.dataset.tab);
        el.addEventListener('click',()=>rememberHash(hash));
      }else if(el.tagName==='A'&&catalog.some(p=>p.sprint===el.getAttribute('href'))){
        const bank=catalog.find(p=>p.sprint===el.getAttribute('href'));el.textContent=(bank.sprintCount===100?'สอบเต็มชุด ':'ตะลุย ')+(bank.sprintCount||60)+' ข้อ ↗';el.removeAttribute('style');el.classList.add('app-sprint-tab');el.style.order=5;
      }
    });
    if(tabs.querySelector('[data-tab]'))[...tabs.children].sort((a,b)=>Number(a.style.order)-Number(b.style.order)).forEach(el=>tabs.append(el));
  } else if(page&&page.group==='english') {
    const nav=document.createElement('nav');nav.className='app-local-nav';nav.setAttribute('aria-label','บทเรียนภาษาอังกฤษ');
    nav.innerHTML=`<button type="button" class="app-button">เลือกบทเรียน</button><a href="${href(file==='english.html'?'english-course.html':'english.html')}">${file==='english.html'?'คอร์สภาษาอังกฤษ':'อังกฤษพื้นฐาน'} ↗</a>`;
    nav.querySelector('button').addEventListener('click',()=>{if(typeof window.goHome==='function')window.goHome();rememberHash('read');});
    content.prepend(nav);
  } else if(sprint) {
    const nav=document.createElement('nav');nav.className='app-local-nav';nav.setAttribute('aria-label','หมวดตะลุย '+sprintPage.short);
    nav.innerHTML=`<a href="#dashboard">เลือกชุดโจทย์</a><a href="#notes">บัตรทวน ${sprintPage.sprintTopics} หมวด</a><a href="#sources">ตัวบทฉบับเต็ม</a><a href="${href(sprintPage.file)}">คลัง ${esc(sprintPage.short)} ทั้งหมด ↗</a>`;
    content.prepend(nav);
  }
  function syncParentHash(){if(window.parent!==window)window.parent.postMessage({type:'study:hash',hash:location.hash},location.origin);}
  window.addEventListener('hashchange',syncParentHash);
  function rememberHash(hash){history.replaceState(null,'',hash?'#'+hash:location.pathname);syncParentHash();try{if(page)localStorage.setItem('study:last-page',JSON.stringify({file,hash:location.hash}));}catch(_) {}}
  document.querySelectorAll(file==='law-sources.html'?'.intro-card':'#home > .intro-card').forEach(card=>{
    const heading=card.querySelector('h2');if(!heading)return;
    const details=document.createElement('details');details.className=card.className+' app-intro-help';
    const summary=document.createElement('summary');summary.textContent=heading.textContent;heading.remove();details.append(summary);
    while(card.firstChild)details.append(card.firstChild);card.replaceWith(details);
  });
  function route(){
    const hash=location.hash.slice(1);
    if(sprint){if(hash==='resume'){const b=document.getElementById('resume');if(b&&!b.hidden)b.click();}else if(['dashboard','notes','sources'].includes(hash)){document.getElementById(hash)?.scrollIntoView();}return;}
    if(file==='compare.html'){const i=['overview','table','common','different','plan'].indexOf(hash);if(i>=0&&typeof window.go==='function')window.go(i);return;}
    if(page&&page.group==='english'){if(hash==='read'&&typeof window.goHome==='function')window.goHome();return;}
    const handlers={read:'startHome',practice:typeof window.startBook==='function'?'startBook':'startHome',exam:'startMock',summary:typeof window.startLaws==='function'?'startLaws':'startHome',sources:'startSources'};
    if(handlers[hash]&&typeof window[handlers[hash]]==='function')window[handlers[hash]]();
  }
  window.addEventListener('hashchange',route);
  function filterGrid(id,label){
    const grid=document.getElementById(id);if(!grid)return;
    const box=document.createElement('div');box.className='app-filter';
    box.innerHTML=`<label for="app-search-${id}">${esc(label)}</label><div class="app-filter-field">${icon('search')}<input id="app-search-${id}" type="search" autocomplete="off" placeholder="พิมพ์ชื่อหัวข้อหรือคำที่ต้องการ"><button type="button" hidden aria-label="ล้างคำค้น">×</button></div><span class="app-filter-count" role="status"></span>`;
    const empty=document.createElement('p');empty.className='app-empty';empty.textContent='ไม่พบหัวข้อนี้ ลองใช้คำอื่นหรือล้างคำค้น';empty.hidden=true;
    grid.before(box);grid.after(empty);
    const input=box.querySelector('input'),clear=box.querySelector('button'),status=box.querySelector('[role="status"]');
    function filter(){const query=input.value.trim().toLocaleLowerCase('th');const items=[...grid.children];let count=0;items.forEach(item=>{
      const match=item.textContent.toLocaleLowerCase('th').includes(query);item.hidden=!match;if(match)count++;
      if(item.matches('.unit[onclick]')&&!item.hasAttribute('role')){item.setAttribute('role','button');item.tabIndex=0;item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();item.click();}});}
    });status.textContent=count+' / '+items.length+' หัวข้อ';clear.hidden=!input.value;empty.hidden=count!==0||items.length===0;}
    input.addEventListener('input',filter);clear.addEventListener('click',()=>{input.value='';filter();input.focus();});
    new MutationObserver(filter).observe(grid,{childList:true});filter();
  }
  ['topicGrid','bookGrid','modGrid','lessonGrid','listBody'].forEach(id=>filterGrid(id,'ค้นหาหัวข้อในหมวดนี้'));
  filterGrid('srcBody','ค้นหากฎหมายและเอกสารของหน่วยงานนี้');
  if(file==='law-sources.html')enhanceSources();
  function enhanceSources(){
    const sections=[...document.querySelectorAll('section.grp')];if(!sections.length)return;
    const controls=document.createElement('div');controls.className='app-source-controls';
    controls.innerHTML=`<div><label for="app-source-agency">เลือกหน่วยงาน</label><select id="app-source-agency"><option value="all">ทุกหน่วยงาน</option>${sections.map(s=>`<option value="${s.id}">${esc(catalog.find(p=>p.id===s.id)?.short||s.id)}</option>`).join('')}</select></div><div><label for="app-source-query">ค้นชื่อกฎหมายหรือเอกสาร</label><input type="search" id="app-source-query" placeholder="เช่น วินัยการเงิน งบประมาณ"></div><p role="status"></p>`;
    const details=sections.map(s=>{const d=document.createElement('details');d.className=s.className;d.id=s.id;const summary=document.createElement('summary');const h=s.querySelector('h2');summary.textContent=h.textContent;h.remove();d.append(summary);while(s.firstChild)d.append(s.firstChild);s.replaceWith(d);return d;});
    details[0].before(controls);
    const jumps=document.querySelector('.jumps');if(jumps)jumps.hidden=true;
    const select=controls.querySelector('select'),input=controls.querySelector('input'),status=controls.querySelector('[role="status"]');
    const empty=document.createElement('p');empty.className='app-empty';empty.textContent='ไม่พบเอกสาร ลองเปลี่ยนคำค้นหรือเลือกทุกหน่วยงาน';empty.hidden=true;controls.after(empty);
    function filter(){let total=0;const query=input.value.trim().toLocaleLowerCase('th');details.forEach(d=>{let visible=0;const included=select.value==='all'||d.id===select.value;d.querySelectorAll('.doc-link').forEach(row=>{const match=included&&row.textContent.toLocaleLowerCase('th').includes(query);row.hidden=!match;if(match)visible++;});d.hidden=visible===0;total+=visible;if(query||select.value!=='all')d.open=visible>0;});status.textContent=total+' เอกสาร · กดชื่อหมวดเพื่อเปิดรายการ';empty.hidden=total>0;}
    function fromHash(){select.value=details.some(d=>d.id===location.hash.slice(1))?location.hash.slice(1):'all';filter();}
    select.addEventListener('change',()=>{rememberHash(select.value==='all'?'':select.value);filter();});input.addEventListener('input',filter);window.addEventListener('hashchange',fromHash);fromHash();
  }
  const quiz=document.getElementById('quiz');
  function isQuizzing(){return !!quiz&&(sprint?!quiz.hidden:quiz.classList.contains('show'));}
  if(quiz){const update=()=>document.body.classList.toggle('app-quizzing',isQuizzing());new MutationObserver(update).observe(quiz,{attributes:true,attributeFilter:['class','hidden']});update();}
  if(!sprint)document.addEventListener('click',e=>{
    if(!isQuizzing())return;
    const target=e.target.closest('a,button');if(!target)return;
    if(target.closest('.app-bar,.tabs,.app-local-nav')||target.matches('#quiz .back,#quiz .back-btn')){
      if(!window.confirm('กำลังทำข้อสอบอยู่ หากออกตอนนี้ชุดนี้จะไม่ถูกบันทึก ต้องการออกหรือไม่?')){e.preventDefault();e.stopImmediatePropagation();}
    }
  },true);
  document.querySelectorAll('table').forEach(table=>{if(table.parentElement.classList.contains('app-table-scroll'))return;const wrap=document.createElement('div');wrap.className='app-table-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','ตาราง เลื่อนแนวนอนเพื่ออ่านได้');table.before(wrap);wrap.append(table);});
  route();
})();
