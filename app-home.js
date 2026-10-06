(function () {
  'use strict';
  const catalog = window.STUDY_CATALOG, ui = window.StudyUI;
  if (!catalog || !ui) return;
  const $ = id => document.getElementById(id), esc = ui.escape;
  const groups = {
    agencies:['หน่วยงานที่กำลังเตรียมสอบ','เลือกหน่วยงาน แล้วเริ่มอ่านหรือทำโจทย์ได้เลย'],
    resources:['กฎหมายและตัวบท','สรุปกฎหมาย ลิงก์ต้นฉบับ และตารางเทียบขอบเขต'],
    english:['ภาษาอังกฤษ','เลือกเรียนเป็นคอร์ส หรือทวนบทเรียนพื้นฐาน'],
    archive:['หน่วยงานที่สอบแล้ว','เก็บเนื้อหาเดิมไว้ กลับมาทบทวนได้ทุกเมื่อ']
  };
  const labels = {read:'อ่านเนื้อหา',practice:'ฝึกแยกหมวด',exam:'ข้อสอบรวม',sources:'ตัวบทฉบับเต็ม'};
  let category = groups[location.hash.slice(1)] ? location.hash.slice(1) : 'agencies';
  const input = $('home-search-input');
  function render() {
    const query = input.value.trim().toLocaleLowerCase('th');
    const items = catalog.filter(p => query ? [p.title,p.short,p.role,p.search,p.description].join(' ').toLocaleLowerCase('th').includes(query) : p.group === category);
    $('home-section-title').textContent = query ? 'ผลการค้นหา' : groups[category][0];
    $('home-section-description').textContent = query ? 'ค้นจากทุกหน่วยงานและทุกหมวด' : groups[category][1];
    $('home-count').textContent = items.length+' รายการ';
    $('home-clear').hidden = !input.value;
    $('home-empty').hidden = !!items.length;
    document.querySelectorAll('[data-category]').forEach(a => {
      if (!query && a.dataset.category===category) a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    });
    $('home-cards').innerHTML = items.map(p => `<article class="agency-card${p.priority?' priority':''}"><div class="agency-top"><span class="agency-icon ${p.color}" aria-hidden="true">${ui.icon(p.icon)}</span>${p.priority?`<span class="agency-badge">อ่านก่อน · ${esc(p.short)}</span>`:p.group==='archive'?'<span class="agency-badge archived">สอบแล้ว</span>':''}</div><h3><a href="${ui.href(p.file)}">${esc(p.title)}<span aria-hidden="true">↗</span></a></h3><p class="agency-role">${esc(p.role)}</p><p class="agency-description">${esc(p.description)}</p>${p.sprint?`<div class="sprint-feature"><div><strong>${p.sprintCount===100?'จำลองสอบ':'ตะลุย'} ${esc(p.short)} ${p.sprintCount||60} ข้อ</strong><span>${p.sprintCount===100?'100 ข้อเต็มชุด • 200 คะแนน':'3 ชุดฝึก • เฉลยทุกตัวเลือก'} • ซ้ำข้อผิด</span></div><a href="${p.sprint}">เริ่มทำโจทย์ →</a></div>`:''}<div class="agency-actions">${p.actions.length?p.actions.map(a=>`<a href="${ui.href(p.file,a)}">${labels[a]}</a>`).join(''):`<a class="agency-open" href="${ui.href(p.file)}">เปิด${p.group==='english'?'บทเรียน':'หมวดนี้'} →</a>`}</div></article>`).join('');
  }
  input.addEventListener('input',render);
  $('home-clear').addEventListener('click',()=>{input.value='';render();input.focus();});
  $('home-reset').addEventListener('click',()=>{input.value='';category='agencies';history.replaceState(null,'','#agencies');render();input.focus();});
  document.querySelectorAll('[data-category]').forEach(a=>a.addEventListener('click',e=>{
    e.preventDefault();category=a.dataset.category;input.value='';history.replaceState(null,'','#'+category);render();
  }));
  window.addEventListener('hashchange',()=>{category=groups[location.hash.slice(1)]?location.hash.slice(1):'agencies';input.value='';render();});
  try {
    let recent;
    for(const p of catalog.filter(p=>p.sprint)){
      let saved;try{saved=JSON.parse(localStorage.getItem(p.sprintKey)||'null');}catch(_){continue;}
      const session=saved&&saved.session;
      if(session&&!session.complete&&Array.isArray(session.ids)&&Number.isInteger(session.idx)&&session.idx>=0&&session.idx<session.ids.length){recent={label:'ทำชุด '+p.short+' ที่ค้างไว้ต่อ',file:p.sprint,hash:'#resume'};break;}
    }
    if(!recent){
      const saved = JSON.parse(localStorage.getItem('study:last-page') || 'null');
      const page = saved && catalog.find(p=>p.file===saved.file);
      if (page) recent={label:'เปิดล่าสุด: '+page.short,file:page.file,hash:['#read','#practice','#sources','#summary'].includes(saved.hash)?saved.hash:''};
    }
    if(recent){$('home-recent').innerHTML=`<span>${esc(recent.label)}</span><a href="${ui.href(recent.file,recent.hash)}">กลับไปต่อ →</a>`;$('home-recent').hidden=false;}
  } catch (_) { /* Browsing remains available without storage. */ }
  render();
})();
