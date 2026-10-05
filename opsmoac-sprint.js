(function(){
  'use strict';
  const D=window.OPS_SPRINT,C=window.createOPSSprintCore(D),KEY='opsmoac60:v1';
  const $=id=>document.getElementById(id),E=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let state={records:{},marked:[],history:[],session:null};
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||'null');
    if(saved&&typeof saved==='object'){
      state.records=Object.fromEntries(Object.entries(saved.records||{}).filter(([id,v])=>C.byId.has(id)&&typeof v==='boolean'));
      state.marked=Array.isArray(saved.marked)?[...new Set(saved.marked.filter(id=>C.byId.has(id)))]:[];
      state.history=Array.isArray(saved.history)?saved.history.filter(h=>h&&typeof h.title==='string'&&typeof h.date==='string'&&Number.isInteger(h.correct)&&Number.isInteger(h.total)&&h.total>0&&h.correct>=0&&h.correct<=h.total).slice(0,12):[];
      state.session=C.valid(saved.session)?saved.session:null;
    }
  }catch(e){$('storageNotice').hidden=false;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){$('storageNotice').hidden=false;}}
  const notes=D.notes;
  function sourceLinks(keys){return keys.map(key=>{const s=D.sources[key];return `<a class="button" href="${E(s.url)}" target="_blank" rel="noopener noreferrer">${E(s.title)} ↗</a>`;}).join(' ');}
  function topicSources(topic){return [...new Set(D.questions.filter(q=>q.topic===topic).flatMap(q=>q.sources))];}
  function wrongIds(){return Object.keys(state.records).filter(id=>state.records[id]===false);}
  function visible(id){for(const v of ['dashboard','quiz','result'])$(v).hidden=v!==id;window.scrollTo(0,0);}
  function dashboard(){
    visible('dashboard');
    const done=Object.keys(state.records).length,wrong=wrongIds().length;
    $('stats').innerHTML=`<div class="stat"><b>${done}/60</b><span>เคยตอบและตรวจแล้ว</span></div><div class="stat"><b>${wrong}</b><span>คำตอบล่าสุดยังผิด</span></div><div class="stat"><b>${state.marked.length}</b><span>ปักไว้ทวน</span></div>`;
    $('resume').hidden=!state.session;$('resume').textContent=state.session?.complete?'เปิดผลชุดล่าสุด':'ทำชุดค้างต่อ';
    $('wrongBtn').disabled=!wrong;$('wrongBtn').textContent=`ซ้ำข้อที่ยังตอบผิด (${wrong})`;
    $('markedBtn').disabled=!state.marked.length;$('markedBtn').textContent=`ทวนข้อที่ปักไว้ (${state.marked.length})`;
    $('history').innerHTML=state.history.length?state.history.map(h=>`<div class="history-row"><b>${E(h.title)} · ${h.correct}/${h.total}</b><span>${E(h.date)} · ${h.mode==='exam'?'จำลองสอบ':'ฝึกเรียนรู้'}</span></div>`).join(''):'<p class="muted">ยังไม่มีชุดที่ทำจบ เริ่มชุด 1 เพื่อวัดจุดที่ต้องทวนก่อน</p>';
  }
  function mode(){return document.querySelector('input[name=mode]:checked').value;}
  function start(ids,title,forcedMode){
    if(state.session&&!state.session.complete&&!window.confirm('มีชุดที่ยังทำไม่จบ เริ่มชุดใหม่นี้จะทับชุดค้าง ต้องการเริ่มใหม่หรือไม่?'))return;
    state.session=C.createSession(ids,forcedMode||mode(),title);save();visible('quiz');renderQuestion(true);
  }
  function feedback(q,order,chosen){
    const position=order.indexOf(q.a),labels=['ก','ข','ค','ง'];
    return `<div class="feedback"><h3>${chosen===q.a?'ตอบถูก':'ยังไม่ถูก'} · คำตอบ ${labels[position]}. ${E(q.c[q.a])}</h3><ol>${order.map((original,i)=>`<li><b>${labels[i]}. ${E(q.c[original])}${original===q.a?' ✓':original===chosen?' (ที่เลือก)':''}</b><br>${E(q.feedback[original])}</li>`).join('')}</ol><div class="trap"><b>จุดจำ:</b> ${E(q.trap)}</div><p class="muted">อ้างอิง: ${E(q.ref)}</p><div class="source-links">${sourceLinks(q.sources)}</div></div>`;
  }
  function renderQuestion(focus){
    const s=state.session,id=s.ids[s.idx],q=C.byId.get(id),chosen=s.answers[id],order=s.orders[id],answered=chosen!==undefined;
    $('counter').textContent=`${s.mode==='exam'?'จำลองสอบ':'ฝึกเรียนรู้'} · ข้อ ${s.idx+1}/${s.ids.length}`;
    $('progress').max=s.ids.length;$('progress').value=s.idx+(answered?1:0);
    $('question').innerHTML=`<div class="card"><p class="kicker">${E(s.title)} · ${E(D.topics[q.topic-1])}</p><h2 id="questionTitle" class="question-title" tabindex="-1">${E(q.q)}</h2><div class="options">${order.map((original,i)=>`<button class="option${answered&&chosen===original?' chosen':''}${answered&&s.mode==='practice'?(original===q.a?' correct':original===chosen?' wrong':''):''}" data-option="${original}" ${answered?'disabled':''}><span class="letter">${['ก','ข','ค','ง'][i]}.</span><span>${E(q.c[original])}</span></button>`).join('')}</div><div id="answerFeedback" aria-live="polite">${answered?(s.mode==='practice'?feedback(q,order,chosen):'<p class="notice">บันทึกคำตอบแล้ว เฉลยและคะแนนจะแสดงเมื่อจบชุด</p>'):''}</div></div>`;
    $('next').disabled=!answered;$('next').textContent=!answered?'เลือกคำตอบก่อน':s.idx===s.ids.length-1?'จบชุดและดูผล':'ข้อถัดไป →';
    $('mark').textContent=state.marked.includes(id)?'✓ ปักไว้แล้ว (กดเอาออก)':'ปักไว้ทวน';$('mark').setAttribute('aria-pressed',String(state.marked.includes(id)));
    if(focus){window.scrollTo(0,0);$('questionTitle').focus({preventScroll:true});}
  }
  function result(){
    const s=state.session,r=C.score(s),percent=Math.round(r.correct/r.total*100);
    visible('result');
    const rows=D.topics.map((name,i)=>{const ids=s.ids.filter(id=>C.byId.get(id).topic===i+1);if(!ids.length)return '';const good=ids.filter(id=>s.answers[id]===C.byId.get(id).a).length;return `<tr><td>${E(name)}</td><td>${good}/${ids.length}</td></tr>`;}).join('');
    $('result').innerHTML=`<div class="card"><p class="kicker">${E(s.title)}</p><h2>ผลการฝึกชุดนี้</h2><div class="result-score">${r.correct}/${r.total} <small>(${percent}%)</small></div><p>${percent>=80?'ทำได้ดีในชุดนี้ ทวนเหตุผลของตัวเลือกที่ยังลังเลอีกครั้ง':'เริ่มทวนจากหัวข้อที่คะแนนน้อย แล้วซ้ำข้อผิดพร้อมเปิดตัวบท'}</p><p class="muted">เป็นคะแนนฝึก ไม่ใช่เกณฑ์ผ่านหรือการคาดการณ์คะแนนสอบจริง</p><div class="actions"><button class="primary" id="resultWrong" ${r.wrong.length?'':'disabled'}>ซ้ำข้อผิดชุดนี้ (${r.wrong.length})</button><button id="backDashboard">กลับหน้าเลือกชุด</button></div></div><div class="card"><h2>จุดอ่อนแยกตามหัวข้อ</h2><div class="table-wrap"><table><thead><tr><th>หัวข้อ</th><th>ตอบถูก</th></tr></thead><tbody>${rows}</tbody></table></div></div><div class="card"><h2>เฉลยทุกข้อ</h2><p class="muted">เปิดเฉลยได้ทั้งข้อถูกและข้อผิด พร้อมลิงก์ต้นฉบับ</p>${s.ids.map((id,i)=>{const q=C.byId.get(id),chosen=s.answers[id];return `<details ${chosen!==q.a?'open':''}><summary>${i+1}. ${chosen===q.a?'✓':'✗'} ${E(q.q)}</summary>${feedback(q,s.orders[id],chosen)}</details>`;}).join('')}</div>`;
    $('resultWrong').addEventListener('click',()=>start(r.wrong,'ซ้ำข้อผิดจากชุดล่าสุด','practice'));
    $('backDashboard').addEventListener('click',dashboard);$('result').focus({preventScroll:true});
  }
  $('sets').innerHTML=D.sets.map((s,i)=>`<article class="card"><span class="set-number">0${i+1}</span><h3>${E(s.title.split(' • ')[1])}</h3><p class="muted">20 ข้อ · ครบ 5 หัวข้อ · ชุดไม่ซ้ำกัน</p><button data-start="${s.id}">ทำชุด ${i+1}</button></article>`).join('');
  $('notes').innerHTML=notes.map((items,i)=>`<details><summary>${i+1}. ${E(D.topics[i])}</summary><ul>${items.map(n=>`<li>${E(n)}</li>`).join('')}</ul><div class="source-links">${sourceLinks(topicSources(i+1))}</div></details>`).join('');
  $('sources').innerHTML=Object.entries(D.sources).map(([id,s])=>`<div class="source">${sourceLinks([id])}</div>`).join('');
  $('topicButtons').innerHTML=D.topics.map((name,i)=>`<button data-topic="${i+1}">${i+1}. ${E(name)} (${D.questions.filter(q=>q.topic===i+1).length})</button>`).join('');
  document.querySelectorAll('[data-start]').forEach(b=>b.addEventListener('click',()=>{const s=D.sets.find(x=>x.id===b.dataset.start);start(s.ids,s.title);}));
  document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{const t=Number(b.dataset.topic);start(D.questions.filter(q=>q.topic===t).map(q=>q.id),D.topics[t-1]);}));
  $('question').addEventListener('click',event=>{const button=event.target.closest('[data-option]');if(!button)return;state.session=C.answer(state.session,Number(button.dataset.option));if(state.session.mode==='practice')state.records=C.progress(state.records,state.session);save();renderQuestion(false);$('next').focus({preventScroll:true});});
  $('next').addEventListener('click',()=>{
    const previous=state.session;state.session=C.next(previous);if(state.session===previous)return;
    if(state.session.complete){const r=C.score(state.session);state.records=C.progress(state.records,state.session);state.history.unshift({title:state.session.title,mode:state.session.mode,correct:r.correct,total:r.total,date:new Date().toLocaleString('th-TH')});state.history=state.history.slice(0,12);save();result();}
    else{save();renderQuestion(true);}
  });
  $('mark').addEventListener('click',()=>{const id=state.session.ids[state.session.idx];state.marked=state.marked.includes(id)?state.marked.filter(x=>x!==id):[...state.marked,id];save();renderQuestion(false);$('mark').focus({preventScroll:true});});
  $('pause').addEventListener('click',dashboard);
  $('resume').addEventListener('click',()=>{if(state.session.complete)result();else{visible('quiz');renderQuestion(true);}});
  $('wrongBtn').addEventListener('click',()=>start(wrongIds(),'ซ้ำข้อที่คำตอบล่าสุดยังผิด','practice'));
  $('markedBtn').addEventListener('click',()=>start(state.marked,'ทวนข้อที่ปักไว้'));
  $('allBtn').addEventListener('click',()=>start(D.questions.map(q=>q.id),'จำลองสอบรวม 60 ข้อ','exam'));
  save();dashboard();
})();

