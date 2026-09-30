(function(){
  'use strict';
  const D=window.SAO_SPRINT,C=window.createSAOSprintCore(D),KEY='sao48:v1';
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
  const notes=[
    ['คตง. กำหนดนโยบาย/มาตรฐานและสั่งโทษทางปกครอง (ม.27); ผู้ว่าการตรวจและกำกับเจ้าหน้าที่ (ม.53); สำนักงานเป็นนิติบุคคลใต้ผู้ว่าการ (ม.58)',
     'ม.89 หลักตรวจผลสัมฤทธิ์เมื่อเสร็จสิ้น แต่ถ้าเห็นชัดว่าจะไม่เกิดผลสัมฤทธิ์หรือขาดประสิทธิภาพ แจ้งก่อนหรือระหว่างได้พร้อมแนะนำวิธีที่ถูกต้อง หากคัดค้านอย่างมีเหตุผลต้องร่วมหาข้อยุติ',
     'ม.98 โทษ: ภาคทัณฑ์ / ตำหนิโดยเปิดเผย / ปรับทางปกครองไม่เกินเงินเดือน 12 เดือน; ม.99 ต้องให้ชี้แจงหลักฐาน; ม.103 อุทธรณ์ศาลปกครองสูงสุด 90 วันนับแต่ได้รับคำสั่ง',
     'ม.8 มติที่ประชุมร่วมไม่น้อยกว่า 2/3 ของกรรมการที่ลงคะแนน ผู้ว่าการแสดงความคิดเห็นได้แต่ไม่ลงคะแนน; ผู้รักษาการตามกฎหมายคือประธาน คตง. ตาม ม.9; กฎหมายมีถึง ม.115'],
    ['ม.20(1) กรณีปกติ งบลงทุน ≥ 20% ของงบรายจ่ายประจำปี และ ≥ วงเงินขาดดุล ต้องผ่านทั้งสองเงื่อนไข เลือกค่าที่สูงกว่าเป็นขั้นต่ำ',
     'ม.20 วรรคท้าย หากทำตามหลักเกณฑ์ไม่ได้ ต้องแสดงเหตุผลความจำเป็นและมาตรการแก้ไขต่อรัฐสภาพร้อมร่างงบประมาณ',
     'ม.27 โครงการเข้าเงื่อนไขต้องเสนอรายจ่าย/แหล่งเงินตลอดโครงการและประโยชน์ รวมรายได้ที่รัฐสูญเสีย แล้วเปรียบเทียบผลจริงกับประมาณการทุกสิ้นปีจนแล้วเสร็จ',
     'ม.13 แผนการคลังระยะปานกลาง ≥ 3 ปี จัดทำภายใน 3 เดือนหลังสิ้นปีงบประมาณทุกปี; ม.79 ต้องมีตรวจสอบภายใน + ควบคุมภายใน + บริหารความเสี่ยง'],
    ['ม.4 ปีงบประมาณ 1 ตุลาคม–30 กันยายน เรียกตามปีที่สิ้นสุด; ม.40 รายการทั่วไปต้องมีแผนที่เห็นชอบและอนุมัติเงินจัดสรรก่อนจ่าย/ก่อหนี้ อ่านข้อยกเว้นในมาตราประกอบ',
     'ม.43 ข้ามปี: ก่อหนี้ก่อนสิ้นปีและกันเงินตามระเบียบ → ขยายไม่เกิน 6 เดือน → หากจำเป็นขอตกลงกระทรวงการคลังอีกไม่เกิน 6 เดือน ไม่ได้ 12 เดือนอัตโนมัติ',
     'ม.45 เงินทุนสำรองจ่าย 50,000 ล้านบาท ใช้เมื่อจำเป็นเร่งด่วนและงบกลางรายการฉุกเฉินหรือจำเป็นไม่พอ โดยอนุมัติ ครม. และตั้งงบชดใช้ในโอกาสแรก',
     'ม.46 ระบบติดตามก่อน ระหว่าง หลังใช้เงิน; ม.47 หน่วยรับงบประมาณมีระบบประเมินต่อเนื่องและเปิดเผย ไม่ดูแค่เปอร์เซ็นต์เบิกจ่าย'],
    ['ม.6 มี 7 เป้าหมาย: ประโยชน์สุข / ผลสัมฤทธิ์ / ประสิทธิภาพและคุ้มค่า / ไม่เกินขั้นตอนจำเป็น / ปรับภารกิจทันสถานการณ์ / อำนวยความสะดวกและตอบสนอง / ประเมินสม่ำเสมอ',
     'ม.8(3) ก่อนเริ่มต้องศึกษาผลดีผลเสีย มีขั้นตอนโปร่งใส กลไกตรวจสอบ และรับฟังหรือชี้แจง; ม.9 มีแผนล่วงหน้าพร้อมตัวชี้วัด',
     'ม.10 ภารกิจเกี่ยวข้องหลายหน่วย ให้กำหนดแนวปฏิบัติแบบบูรณาการร่วมกัน มุ่งผลสัมฤทธิ์',
     'ม.16 ตามฉบับแก้ไข 2562: แผน 5 ปี + แผนประจำปีเสนอรัฐมนตรีเห็นชอบ; แผน 3 ปี 2563–2565 เป็นบทเริ่มแรก ไม่ใช่หลักถาวร; ภารกิจไม่มีแผนหรือไม่ได้เห็นชอบ ไม่จัดสรรงบให้ภารกิจนั้น'],
    ['ข้อ 8 ครอบคลุมประโยชน์โดยมิชอบเพื่อตนหรือผู้อื่น รวมรู้เห็นยินยอมให้ใช้ตำแหน่ง; ข้อ 9 ไม่เรียก ไม่รับ หรือยอมจะรับประโยชน์ที่อาจกระทบหน้าที่',
     'ข้อ 14 ผลประโยชน์ขัดกันทั้งทางตรงและทางอ้อม; การไม่ถือหุ้นในชื่อตนไม่ใช่ข้อยกเว้น',
     'ข้อ 15 ข้อมูลต้องจริง ครบ ไม่บิดเบือน คู่กับข้อ 16 รักษาความลับตามกฎหมาย; ข้อ 17 อิสระ เป็นกลาง เที่ยงธรรม โปร่งใส ตรวจสอบได้',
     'ข้อ 27 ที่แก้ไข 2562: กรรมการตามข้อ 25(4)(5) วาระ 3 ปี ไม่เกิน 2 วาระติดต่อกัน ข้อความเดิม 4 ปีอยู่ช่วงแรกของไฟล์ ต้องอ่านส่วนแก้ไขด้วย'],
    ['ยุทธศาสตร์ชาติ 2561–2580 = 20 ปี 6 ด้าน; แผนแม่บทฉบับแก้ไข 2566–2580 ยังคง 23 ประเด็น',
     'แผนแม่บทเป็นแผนระดับที่ 2 มีผลผูกพันหน่วยงานรัฐที่เกี่ยวข้องให้แปลงสู่การปฏิบัติร่วมกัน และจัดทำงบให้สอดคล้อง',
     'ประเด็น 20 บริการประชาชนและประสิทธิภาพภาครัฐ / 21 ต่อต้านทุจริต / 22 กฎหมายและกระบวนการยุติธรรม / 23 วิจัยและพัฒนานวัตกรรม',
     'เวลาเขียนหรือวิเคราะห์โครงการ ให้เชื่อมกิจกรรม → ผลที่จะเกิด → เป้าหมายที่เกี่ยวข้อง ไม่ใช่ใส่ชื่อแผนจำนวนมากโดยไม่มีเหตุผลรองรับ'],
    ['ฉบับที่ 13 ครอบคลุมปีงบประมาณ 2566–2570 เริ่ม 1 ต.ค.2565–30 ก.ย.2570 เป็นแผนระดับที่ 2',
     'หมุดหมาย 1 เกษตรมูลค่าสูง / 2 ท่องเที่ยวคุณภาพยั่งยืน / 3 ยานยนต์ไฟฟ้า / 4 การแพทย์และสุขภาพมูลค่าสูง / 5 การค้า ลงทุน โลจิสติกส์ / 6 อิเล็กทรอนิกส์อัจฉริยะ',
     'หมุดหมาย 7 SME / 8 พื้นที่และเมืองน่าอยู่ / 9 ลดจนข้ามรุ่นและคุ้มครองสังคม / 10 เศรษฐกิจหมุนเวียนคาร์บอนต่ำ / 11 ลดความเสี่ยงภัยธรรมชาติและภูมิอากาศ / 12 กำลังคนสมรรถนะสูง / 13 ภาครัฐทันสมัย',
     'หลักคิด 4 เรื่อง: เศรษฐกิจพอเพียง / ล้มแล้วลุกไว (พร้อมรับ ปรับตัว เปลี่ยนแปลง) / SDGs ไม่ทิ้งใครไว้ข้างหลัง / BCG; อย่าสลับจำนวนหลักคิดกับ 13 หมุดหมาย'],
    ['ยึดนโยบาย 2566–2570 ตามภาพขอบเขตสอบ หน้า สตง. มีนโยบายรายปีแยกอีกฉบับ',
     'ข้อ 2.6 และ 4.1.5 Non-Audit Product: วิเคราะห์ข้อมูล ผลตรวจหรือวิจัยเพื่อเสริมความเข้มแข็งและคุณค่างานตรวจ; ข้อ 2.7 ส่งเสริมหน่วยรับตรวจเข้าใจวินัยการคลัง',
     'ข้อ 2.12 รายงานโปร่งใสและอิสระ รับข้อคิดเห็นหน่วยรับตรวจมาพิจารณา และเผยแพร่ประชาชนทราบสะดวก รับฟังไม่ได้แปลว่าให้ยับยั้งรายงาน',
     'ข้อ 4.1.3 ให้ความสำคัญผลกระทบการคลัง/ประชาชน/เรื่องสนใจสาธารณะ; ข้อ 4.1.6 นวัตกรรมเพื่อทันกาล (Timeliness) และเพิ่มคุณค่า (Value Added)'],
    ['Relevance: ตอบปัญหาและบริบทไหม / Coherence: สอดรับหรือขัดกับมาตรการอื่นไหม / Effectiveness: บรรลุเป้าที่ตั้งไว้ไหม',
     'Efficiency: ใช้ทรัพยากรคุ้มกับผลไหม / Impact: สร้างความเปลี่ยนแปลงอะไร / Sustainability: ประโยชน์จะคงอยู่ต่อไหม',
     'เทียบต้นทุนต่อคนต้องกำหนดผลและคุณภาพที่เทียบกันได้; ผลดีขึ้นหลังโครงการอย่างเดียวไม่พิสูจน์ว่าเกิดจากโครงการทั้งหมด ต้องพิจารณาปัจจัยอื่น',
     'OECD ระบุ 6 เกณฑ์ ความเป็นธรรม (equity) เป็นมิติที่พิจารณาข้ามเกณฑ์ ไม่ใช่เกณฑ์ที่เจ็ดในรายการนี้; ตัวเลขและกรณีในชุดฝึกเป็นเรื่องสมมติ']
  ];
  function sourceLink(topic){const s=D.sources[topic];return `<a class="button" href="${E(s.url)}" target="_blank" rel="noopener noreferrer">${topic===9?'เปิดแหล่งอ้างอิง OECD':'เปิดตัวบท / เอกสารฉบับเต็ม'} ↗</a>`;}
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
    return `<div class="feedback"><h3>${chosen===q.a?'ตอบถูก':'ยังไม่ถูก'} · คำตอบ ${labels[position]}. ${E(q.c[q.a])}</h3><ol>${order.map((original,i)=>`<li><b>${labels[i]}. ${E(q.c[original])}${original===q.a?' ✓':original===chosen?' (ที่เลือก)':''}</b><br>${E(q.feedback[original])}</li>`).join('')}</ol><div class="trap"><b>จุดจำ:</b> ${E(q.trap)}</div><p class="muted">อ้างอิง: ${E(q.ref)}</p>${sourceLink(q.topic)}</div>`;
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
  $('sets').innerHTML=D.sets.map((s,i)=>`<article class="card"><span class="set-number">0${i+1}</span><h3>${E(s.title.split(' • ')[1])}</h3><p class="muted">20 ข้อ · ครบ 9 หัวข้อ · ชุดไม่ซ้ำกัน</p><button data-start="${s.id}">ทำชุด ${i+1}</button></article>`).join('');
  $('notes').innerHTML=notes.map((items,i)=>`<details><summary>${i+1}. ${E(D.topics[i])}</summary><ul>${items.map(n=>`<li>${E(n)}</li>`).join('')}</ul>${sourceLink(i+1)}</details>`).join('');
  $('sources').innerHTML=Object.entries(D.sources).map(([id,s])=>`<div class="source"><b>${id}. ${E(s.title)}</b><small>${E(D.topics[Number(id)-1])}</small>${sourceLink(Number(id))}</div>`).join('');
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
