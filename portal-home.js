/* Homepage navigation and search, layered over the existing stable links. */
(()=>{
  'use strict';
  const main=document.querySelector('main');
  const header=main?.querySelector(':scope > header');
  if(!main||!header)return;
  document.body.classList.add('hub-v2');
  main.id='hub-main';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sections=[...main.querySelectorAll(':scope > section')];
  const groups={agencies:main.querySelector('#agencies'),archive:main.querySelector('#archive'),resources:main.querySelector('#resources'),english:main.querySelector('#english')};
  const agencyCards=[...(groups.agencies?.querySelectorAll('article')||[])];
  const archiveCards=[...(groups.archive?.querySelectorAll('article')||[])];
  const counts={agencies:agencyCards.length,archive:archiveCards.length};
  const totalQuestions=[...agencyCards,...archiveCards].reduce((sum,card)=>{
    const m=card.querySelector('.tiletop small')?.textContent.match(/[\d,]+/);
    return sum+(m?Number(m[0].replace(/,/g,'')):0);
  },0);
  document.body.insertAdjacentHTML('afterbegin',
    '<a class="hub-skip" href="#hub-main">ข้ามไปยังสนามสอบ</a>'+
    '<nav class="hub-nav" aria-label="เมนูหลัก"><div class="hub-nav-inner">'+
      '<a class="hub-brand" href="index.html"><span class="hub-brand-mark" aria-hidden="true">▤</span>คลังติวสอบราชการ</a>'+
      '<div class="hub-nav-links"><a href="#agencies">สนามสอบ</a><a href="#resources">คลังกลาง</a><a href="#english">อังกฤษ</a></div>'+
    '</div></nav>'
  );
  header.insertAdjacentHTML('beforeend',
    '<p class="hub-lead">เลือกหน่วยงานที่กำลังเตรียมสอบ อ่านสรุป ฝึกทีละหมวด หรือจำลองสอบ พร้อมกลับมาทำชุดที่ค้างไว้ได้จากเครื่องเดิม</p>'+
    '<div class="hub-stats" aria-label="ข้อมูลคลังติว">'+
      '<span><b>'+counts.agencies+'</b> สนามที่กำลังเตรียม</span>'+
      '<span><b>'+counts.archive+'</b> สนามเก็บทวน</span>'+
      '<span><b>'+totalQuestions.toLocaleString('th-TH')+'</b> ข้อตามหน้าคลัง</span>'+
    '</div>'+
    '<div class="hub-search"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>'+
      '<input id="hub-query" type="search" autocomplete="off" aria-label="ค้นหาสนามสอบและบทเรียน" placeholder="ค้นหน่วยงาน ตำแหน่ง หรือหัวข้อสอบ…">'+
      '<button id="hub-clear" type="button" hidden>ล้าง</button>'+
    '</div>'
  );
  const recent=document.getElementById('home-recent');
  if(recent)header.after(recent);
  header.insertAdjacentHTML('afterend',
    '<div class="hub-tabs" role="group" aria-label="กรองสนามสอบ">'+
      '<button type="button" data-hub-filter="all" aria-pressed="true">ทั้งหมด</button>'+
      '<button type="button" data-hub-filter="agencies" aria-pressed="false">กำลังเตรียม · '+counts.agencies+'</button>'+
      '<button type="button" data-hub-filter="archive" aria-pressed="false">สอบแล้ว · '+counts.archive+'</button>'+
      '<span class="hub-filter-info" id="hub-count" role="status" aria-live="polite"></span>'+
    '</div><p class="hub-empty" id="hub-empty" hidden>ไม่พบสนามสอบหรือบทเรียนที่ค้นหา ลองใช้ชื่อหน่วยงานหรือคำสำคัญอื่น</p>'
  );
  const input=document.getElementById('hub-query');
  const clear=document.getElementById('hub-clear');
  const status=document.getElementById('hub-count');
  const empty=document.getElementById('hub-empty');
  const buttons=[...document.querySelectorAll('[data-hub-filter]')];
  let filter='all';
  const normal=s=>(s||'').trim().toLocaleLowerCase('th');
  const matches=(el,q)=>!q||normal(el.textContent).includes(q);
  const tiles=[...agencyCards,...archiveCards];
  // Keep all lessons of a single exam within one disclosure instead of scattering
  // nearly identical links through the landing page.
  for(const card of tiles){
    const details=card.querySelector('details');
    if(details){
      details.addEventListener('toggle',()=>{
        if(!details.open)return;
        for(const other of tiles){
          const o=other.querySelector('details');
          if(o&&o!==details&&o.open)o.open=false;
        }
      });
    }
  }
  function render(){
    const q=normal(input.value);
    clear.hidden=!input.value;
    let visible=0;
    for(const [key,section] of Object.entries(groups)){
      if(!section)continue;
      const enabled=filter==='all'||filter===key;
      if(key==='agencies'||key==='archive'){
        let shown=0;
        section.querySelectorAll('article').forEach(card=>{
          const okay=enabled&&matches(card,q);
          card.hidden=!okay;
          if(okay){
            shown++;visible++;
            if(q){
              const details=card.querySelector('details');
              const head=card.querySelector('.tile');
              if(details&&!matches(head,q))details.open=true;
            }
          }
        });
        section.hidden=!shown;
      }else{
        let shown=0;
        section.querySelectorAll(':scope > a').forEach(link=>{
          const okay=enabled&&matches(link,q);
          link.hidden=!okay;
          if(okay){shown++;visible++}
        });
        section.hidden=!shown;
      }
    }
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.hubFilter===filter)));
    status.textContent=q?'พบ '+visible+' รายการ':'แสดง '+visible+' รายการ';
    empty.hidden=visible!==0;
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{
    filter=button.dataset.hubFilter;
    render();
  }));
  input.addEventListener('input',()=>{
    // Search across all sections, including shared laws and English courses.
    if(input.value.trim())filter='all';
    render();
  });
  clear.addEventListener('click',()=>{input.value='';filter='all';render();input.focus()});
  document.querySelectorAll('.hub-nav a[href^="#"]').forEach(link=>
    link.addEventListener('click',()=>{
      filter='all';input.value='';render();
      document.querySelectorAll('.hub-nav a[aria-current]').forEach(a=>a.removeAttribute('aria-current'));
      link.setAttribute('aria-current','location');
    })
  );
  const foot=document.createElement('p');
  foot.className='hub-foot';
  foot.textContent='ผลการฝึกจะถูกบันทึกไว้ในเบราว์เซอร์ของอุปกรณ์นี้เป็นหลัก • แนะนำให้เปิดหน้าเดิมเมื่อกลับมาทำต่อ';
  main.append(foot);
  render();
})();
