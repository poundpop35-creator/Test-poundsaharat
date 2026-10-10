(() => {
  'use strict';
  const D=window.ROLE_SPRINT,$=id=>document.getElementById(id);
  const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ready=D&&D.questions.length===100&&new Set(D.questions.map(q=>q.id)).size===100&&D.loadedParts?.slice().sort().join(',')==='1,2,3,4'&&typeof window.createRoleSprintCore==='function';
  if(!ready){$('bankNotice').hidden=false;document.querySelectorAll('[data-launch],#allPractice,#examStart').forEach(b=>b.disabled=true);return;}
  const C=window.createRoleSprintCore(D),KEY=D.id+'100:v1';
  let state={records:{},marked:[],history:[],session:null};
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved==='object'){
    state.records=Object.fromEntries(Object.entries(saved.records||{}).filter(([id,v])=>C.byId.has(id)&&typeof v==='boolean'));
    state.marked=Array.isArray(saved.marked)?[...new Set(saved.marked.filter(id=>C.byId.has(id)))]:[];
    state.history=Array.isArray(saved.history)?saved.history.filter(h=>h&&Number.isInteger(h.correct)&&Number.isInteger(h.total)&&h.total>0&&h.correct>=0&&h.correct<=h.total&&typeof h.title==='string'&&typeof h.date==='string').slice(0,12):[];
    state.session=C.valid(saved.session)?saved.session:null;
  }}catch(_){$('storageNotice').hidden=false;}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){$('storageNotice').hidden=false;}};
  const wrongIds=()=>Object.keys(state.records).filter(id=>state.records[id]===false);
  const links=keys=>keys.map(k=>`<a class="source-link" href="${E(D.sources[k].url)}" target="_blank" rel="noopener noreferrer">${E(D.sources[k].title)} ↗</a>`).join('');
  function visible(id){['dashboard','quiz','result'].forEach(v=>$(v).hidden=v!==id);window.scrollTo(0,0);}
  function dashboard(){
    visible('dashboard');const done=Object.keys(state.records).length,wrong=wrongIds().length;
    $('stats').innerHTML=`<div class="stat"><b>${done}/100</b><span>ตอบและตรวจแล้ว</span></div><div class="stat"><b>${wrong}</b><span>ยังตอบผิด</span></div><div class="stat"><b>${state.marked.length}</b><span>ปักไว้ทวน</span></div>`;
    $('resume').hidden=!state.session;$('resume').textContent=state.session?.complete?'เปิดผลชุดล่าสุด':'ทำชุดค้างต่อ';
    $('wrongBtn').disabled=!wrong;$('wrongBtn').textContent=`ซ้ำข้อผิด (${wrong})`;
    $('markedBtn').disabled=!state.marked.length;$('markedBtn').textContent=`ทวนข้อที่ปัก (${state.marked.length})`;
    $('history').innerHTML=state.history.length?state.history.map(h=>`<p><strong>${E(h.title)} · ${h.correct}/${h.total}</strong><br><small>${E(h.date)}</small></p>`).join(''):'<p class="muted">ยังไม่มีชุดที่ทำจบ เริ่มฝึก 100 ข้อได้เลย</p>';
  }
  function start(ids,title,mode='practice'){
    if(state.session&&!state.session.complete&&!confirm('มีชุดที่ยังทำไม่จบ เริ่มชุดใหม่จะแทนชุดค้าง ต้องการเริ่มใหม่หรือไม่?'))return;
    state.session=C.createSession(ids,mode,title);save();visible('quiz');question(true);
  }
  function feedback(q,order,chosen){
    const labels=['ก','ข','ค','ง'];
    return `<div class="feedback"><h3>${chosen===q.a?'ตอบถูก':'ยังไม่ถูก'} · ${labels[order.indexOf(q.a)]}. ${E(q.c[q.a])}</h3><p>${E(q.e)}</p>${q.choiceReasons?`<details><summary>ทำไมตัวเลือกอื่นจึงไม่ถูก</summary><ul>${order.map((o,i)=>`<li><b>${labels[i]}. ${E(q.c[o])}</b> — ${E(q.choiceReasons[o])}</li>`).join('')}</ul></details>`:''}<p class="muted">อ้างอิง: ${E(q.reference)}</p><div class="source-links">${links(q.sources)}</div></div>`;
  }
  function question(focus){
    const s=state.session,id=s.ids[s.idx],q=C.byId.get(id),chosen=s.answers[id],answered=chosen!==undefined,order=s.orders[id],reveal=s.mode==='practice'&&answered;
    $('counter').textContent=`ข้อ ${s.idx+1}/${s.ids.length}`;$('progress').max=s.ids.length;$('progress').value=s.idx+(answered?1:0);
    $('question').innerHTML=`<div class="card"><p class="kicker">${E(D.topics[q.topic-1])} · ${s.mode==='exam'?'ซ้อมสอบ · เฉลยท้ายชุด':'ฝึก · เฉลยทันที'}</p><h2 id="questionTitle" class="question-title" tabindex="-1">${E(q.q)}</h2><div class="options">${order.map((o,i)=>`<button class="option${chosen===o?' chosen':''}${reveal?(o===q.a?' correct':o===chosen?' wrong':''):''}" data-option="${o}" ${answered?'disabled':''}><span class="letter">${['ก','ข','ค','ง'][i]}.</span><span>${E(q.c[o])}</span></button>`).join('')}</div><div id="answerFeedback" aria-live="polite">${reveal?feedback(q,order,chosen):answered?'<p class="muted">บันทึกคำตอบแล้ว เฉลยเมื่อจบชุด</p>':''}</div></div>`;
    $('next').disabled=!answered;$('next').textContent=!answered?'เลือกคำตอบก่อน':s.idx===s.ids.length-1?'จบชุดและดูผล':'ข้อถัดไป →';
    $('mark').textContent=state.marked.includes(id)?'✓ ปักไว้แล้ว':'ปักไว้ทวน';$('mark').setAttribute('aria-pressed',String(state.marked.includes(id)));
    if(focus){$('quiz').scrollIntoView({block:'start'});$('questionTitle').focus({preventScroll:true});}
  }
  function result(){
    const s=state.session,r=C.score(s);visible('result');
    const rows=D.topics.map((topic,i)=>{const ids=s.ids.filter(id=>C.byId.get(id).topic===i+1);return ids.length?`<tr><th scope="row">${E(topic)}</th><td>${ids.filter(id=>s.answers[id]===C.byId.get(id).a).length}/${ids.length}</td></tr>`:'';}).join('');
    let sections='';if(D.id==='energy'&&r.total===100){sections=`<p>${[['general','ทั่วไป',50],['specific','เฉพาะตำแหน่ง',150]].map(([key,name,max])=>`${name} ${s.ids.filter(id=>C.byId.get(id).section===key&&s.answers[id]===C.byId.get(id).a).length*2}/${max} คะแนน`).join(' · ')}</p>`;}
    $('result').innerHTML=`<div class="card"><p class="kicker">${E(s.title)}</p><h2>ผลการฝึก</h2><div class="result-score">${r.correct}/${r.total} <small>ข้อ</small></div><p class="exam-points">คะแนนฝึก ${r.correct*2}/${r.total*2} คะแนน · ข้อละ 2 คะแนน</p>${sections}<p class="muted">คะแนนฝึกใช้หาจุดที่ควรทวน ไม่ใช่เกณฑ์ผ่านหรือการทำนายคะแนนจริง</p><div class="actions"><button id="resultWrong" class="primary" ${r.wrong.length?'':'disabled'}>ซ้ำข้อผิดชุดนี้ (${r.wrong.length})</button><button id="backDashboard">กลับหน้าเลือกชุด</button></div></div><section class="card"><h2>ผลแยกหัวข้อ</h2><div class="table-wrap"><table><thead><tr><th>หัวข้อ</th><th>ตอบถูก</th></tr></thead><tbody>${rows}</tbody></table></div></section><section class="card"><h2>เฉลยครบทุกข้อ</h2>${s.ids.map((id,i)=>{const q=C.byId.get(id),chosen=s.answers[id];return `<details><summary>${i+1}. ${chosen===q.a?'✓':'✗'} ${E(q.q)}</summary>${feedback(q,s.orders[id],chosen)}</details>`;}).join('')}</section>`;
    $('resultWrong').onclick=()=>start(r.wrong,'ซ้ำข้อผิดจากชุดล่าสุด');$('backDashboard').onclick=dashboard;$('result').focus({preventScroll:true});
  }
  $('topicButtons').innerHTML=D.topics.map((t,i)=>`<button data-topic="${i+1}"><span>${i+1}. ${E(t)}</span><small>${D.counts[i]} ข้อ</small></button>`).join('');
  $('notes').innerHTML=D.notes.map((items,i)=>`<details><summary>${i+1}. ${E(D.topics[i])}</summary><ul>${items.map(t=>`<li>${E(t)}</li>`).join('')}</ul></details>`).join('');
  const used=[...new Set(['recruit',...(D.id==='rd'?['proc-amend2','proc-amend3','proc-amend3-copy']:[]),...D.questions.flatMap(q=>q.sources)])];
  $('sources').innerHTML=used.map(k=>`<div class="source">${links([k])}${D.sources[k].note?`<p class="muted">${E(D.sources[k].note)}</p>`:''}</div>`).join('');
  $('topicButtons').onclick=e=>{const b=e.target.closest('[data-topic]');if(b){const t=Number(b.dataset.topic);start(D.questions.filter(q=>q.topic===t).map(q=>q.id),D.topics[t-1]);}};
  $('question').onclick=e=>{const b=e.target.closest('[data-option]');if(!b||b.disabled)return;state.session=C.answer(state.session,Number(b.dataset.option));if(state.session.mode==='practice')state.records=C.progress(state.records,state.session);save();question(false);$('next').focus({preventScroll:true});};
  $('next').onclick=()=>{const old=state.session;state.session=C.next(old);if(old===state.session)return;if(state.session.complete){const r=C.score(state.session);state.records=C.progress(state.records,state.session);state.history.unshift({title:state.session.title,mode:state.session.mode,correct:r.correct,total:r.total,date:new Date().toLocaleString('th-TH')});state.history=state.history.slice(0,12);save();result();}else{save();question(true);}};
  $('mark').onclick=()=>{const id=state.session.ids[state.session.idx];state.marked=state.marked.includes(id)?state.marked.filter(x=>x!==id):[...state.marked,id];save();question(false);$('mark').focus({preventScroll:true});};
  $('pause').onclick=dashboard;$('resume').onclick=()=>{if(state.session.complete)result();else{visible('quiz');question(true);}};
  $('allPractice').onclick=()=>start(D.questions.map(q=>q.id),'ตะลุย '+D.agency+' 100 ข้อ');
  $('examStart').onclick=()=>start(D.questions.map(q=>q.id),'ซ้อมสอบ '+D.agency+' 100 ข้อ','exam');
  $('wrongBtn').onclick=()=>start(wrongIds(),'ซ้ำข้อที่ยังตอบผิด');$('markedBtn').onclick=()=>start(state.marked,'ทวนข้อที่ปักไว้');
  document.querySelectorAll('[data-launch]').forEach(b=>b.onclick=()=>{const offset=Number(b.dataset.launch)*20;start(D.questions.slice(offset,offset+20).map(q=>q.id),`ฝึกย่อย ${Number(b.dataset.launch)+1} · 20 ข้อ`);});
  function route(){const hash=location.hash.slice(1);if(['dashboard','notes','sources'].includes(hash)){dashboard();$(hash).scrollIntoView();}else if(hash==='resume'&&state.session)$('resume').click();}
  window.addEventListener('hashchange',route);dashboard();route();
})();
