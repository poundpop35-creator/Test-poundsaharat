(() => {
  'use strict';
  const D = window.EXAM14, C = window.Exam14Core, $ = id => document.getElementById(id);
  const KEY = 'exam14:rd-energy:v1';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let model;
  try {model = C.build(D);} catch (_) {$('course-loading').hidden = true; $('course-error').hidden = false; return;}
  let raw = null, storageOK = true;
  try {raw = JSON.parse(localStorage.getItem(KEY) || 'null');} catch (_) {storageOK = false;}
  const s = C.clean(raw, model.all);
  let view = 'rd', activeQuiz = [], lastRoute = '';
  function save() {
    try {localStorage.setItem(KEY, JSON.stringify(s)); storageOK = true;} catch (_) {storageOK = false;}
    $('course-storage').hidden = storageOK;
  }
  function wrongIds() {return [...new Set(model.quizzes.flat())].filter(id => Number.isInteger(s.records[id]) && s.records[id] !== model.all.get(id).a);}
  function sourceLinks(role, keys) {
    return [...new Set(keys)].map(key => {
      const src = D.banks[role].sources[key];
      return src && /^https:\/\//.test(src.url) ? `<a href="${esc(src.url)}" target="_blank" rel="noopener noreferrer">${esc(src.title)} ↗</a>` : '';
    }).join('');
  }
  function controls() {
    $('course-progress').textContent = `${s.done.length} / 14 วัน`;
    $('course-progress-bar').value = s.done.length;
    $('wrong-link').textContent = `ทวนข้อผิด (${wrongIds().length})`;
    document.querySelectorAll('[data-hours]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.hours) === s.hours));
    $('course-days').innerHTML = Array.from({length: 14}, (_, i) => `<a href="#day-${i + 1}" class="${s.done.includes(i + 1) ? 'done' : ''}" ${s.day === i + 1 && !['plan', 'mistakes'].includes(view) ? 'aria-current="page"' : ''} aria-label="วันที่ ${i + 1}${s.done.includes(i + 1) ? ' ทำครบตามแผนแล้ว' : ''}">${i + 1}</a>`).join('');
  }
  function tabs() {
    return `<nav class="course-tabs" aria-label="อ่านและฝึกประจำวัน">${[['rd','สรรพากร'],['energy','พลังงาน'],['quiz','ปรนัย 20 ข้อ'],['write','ฝึกเขียนตอบ']].map(([key,label]) => `<a class="${key}" href="#day-${s.day}-${key}" ${view === key ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`;
  }
  function dailyHeader() {
    const reviews = C.reviewDays(s.day);
    return `<div class="day-top"><div><span class="day-number">วันที่ ${s.day} / 14</span><h2>แผนวันนี้ · ${s.hours} ชั่วโมง</h2><p class="muted">เวลาเรียนสุทธิ ${s.hours * 60} นาที · พักสั้นระหว่างช่วงได้ · ${s.hours === 3 ? 'รวม 42 ชั่วโมงใน 14 วัน' : 'รวม 56 ชั่วโมงใน 14 วัน'}</p></div><a class="button" href="#plan">เลือกหัวข้อจากแผนทั้งหมด</a></div>
    <div class="time-grid">${D.routine.map(r => `<div class="time-box"><strong>${r.minutes + (s.hours === 4 ? r.extra : 0)} <small>นาที</small></strong><span>${esc(r.label)}</span></div>`).join('')}</div>
    <details class="recap"><summary>เริ่มด้วยการทวน ${reviews.length ? 'วันที่ ' + reviews.join(', ') : 'พื้นฐานก่อนอ่าน'} · ไม่ดูเฉลยก่อน</summary>${reviews.length ? `<p>ตอบคำถามปิดหนังสือท้ายบทของวันที่ห่าง 1, 3 และ 7 วันตามที่มี ถ้าตอบไม่ได้ให้ย้อนเฉพาะจุดนั้น</p><div class="recap-links">${reviews.map(d => `<a href="#day-${d}-rd">วันที่ ${d} · สรรพากร</a><a href="#day-${d}-energy">วันที่ ${d} · พลังงาน</a>`).join('')}</div>` : '<p>ลองตอบ: วงเงินเลือกวิธีซื้อกับอำนาจอนุมัติต่างกันอย่างไร? kW กับ kWh ต่างกันอย่างไร? จดส่วนที่ยังไม่แน่ใจแล้วกลับมาตอบหลังอ่าน</p>'}</details>${tabs()}`;
  }
  function lesson(role) {
    const l = D.lessons[role][s.day - 1], key = `${role}-${s.day}`;
    const time = role === 'rd' ? (s.hours === 3 ? 50 : 60) : (s.hours === 3 ? 60 : 80);
    return `<article class="lesson-card ${role}"><span class="scope-tag ${l.section || ''}">${role === 'energy' ? (l.section === 'general' ? 'ส่วนที่ 1 · ความรู้ทั่วไป 50 คะแนน' : 'ส่วนที่ 2 · เฉพาะตำแหน่ง 150 คะแนน') : 'ตรงขอบเขตนักวิชาการพัสดุ'}</span><p class="eyebrow">${esc(D.labels[role])}</p><h2>${esc(l.title)}</h2><p class="lesson-lead">${esc(l.lead)}</p><div class="reading-steps"><strong>ใช้ ${time} นาทีอย่างไร</strong><br>${role === 'rd' ? 'อ่านบทติว 15 นาที → เปิดตัวบทตามหัวข้อและแหล่งท้ายบท 20 นาที → ปิดเอกสารอธิบายเงื่อนไขกับลองตัวอย่าง 15 นาที' : 'อ่านบทติว 20 นาที → ตรวจเอกสาร/สูตรตามแหล่งท้ายบท 25 นาที → เขียนวิธีคิดและทวนโดยไม่ดู 15 นาที'}${s.hours === 4 ? `<br>เวลาเพิ่ม ${role === 'rd' ? 10 : 20} นาที: เจาะจุดที่ตอบไม่ได้และทำโจทย์แยกหมวดในคลังเดิม` : ''}</div>
    ${l.blocks.map(([h, text]) => `<section class="body-block"><h3>${esc(h)}</h3><p>${esc(text)}</p></section>`).join('')}
    <div class="table-scroll" role="region" aria-label="ตารางช่วยจำ" tabindex="0"><table><thead><tr>${l.table.heads.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${l.table.rows.map(row => `<tr>${row.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <section class="worked"><h3>ลองคิดก่อนเปิดวิธีตอบ</h3><p>${esc(l.example[0])}</p><details><summary>เปิดวิธีคิดและคำตอบ</summary><p>${esc(l.example[1])}</p></details></section>
    <aside class="trap"><strong>จุดที่ต้องแยกให้ได้</strong><ul>${l.traps.map(t => `<li>${esc(t)}</li>`).join('')}</ul></aside>
    <h3>ปิดหนังสือแล้วตอบ</h3>${l.recall.map(([q,a]) => `<details class="recall-item"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
    <details class="sources"><summary>เปิดตัวบทและเอกสารเพื่ออ่านต่อ (${l.sources.length})</summary><p class="small">เลือกบท/มาตราตามหัวข้อด้านบน กฎหมายฉบับต้นอ่านพร้อมฉบับแก้ไข; เอกสารแผนยึดปีที่ระบุในบท</p>${sourceLinks(role,l.sources)}</details>
    <div class="lesson-bottom"><label class="check-line"><input type="checkbox" data-read="${key}" ${s.read[key] ? 'checked' : ''}>อ่านและลองตอบบทนี้แล้ว</label><a class="button primary" href="#day-${s.day}-${role === 'rd' ? 'energy' : 'quiz'}">${role === 'rd' ? 'ต่อบทพลังงาน' : 'ทำโจทย์วันนี้'} →</a><a class="button" href="${role}-sprint.html#topicButtons">โจทย์แยกหมวดในคลังเดิม ↗</a></div></article>`;
  }
  function question(id, i) {
    const q = model.all.get(id), answered = Number.isInteger(s.answers[id]), chosen = s.answers[id], correct = chosen === q.a;
    return `<article class="quiz-item" id="question-${esc(id)}"><span class="question-role ${q.role}">${i + 1}. ${esc(D.labels[q.role])}${q.fresh ? ' · ข้อใหม่' : ' · คัดจากคลังเดิม'}</span><h3>${esc(q.q)}</h3><div class="options" role="group" aria-label="ตัวเลือกข้อ ${i + 1}">${C.order(id).map((n,k) => `<button class="option ${answered ? (n === q.a ? 'correct' : n === chosen ? 'wrong' : '') : ''}" data-answer="${esc(id)}" data-choice="${n}" ${answered ? 'disabled' : ''}><span class="letter">${['ก','ข','ค','ง'][k]}.</span><span>${esc(q.c[n])}${answered && n === chosen ? ' — คำตอบของคุณ' : ''}${answered && n === q.a ? ' ✓' : ''}</span></button>`).join('')}</div>${answered ? `<div class="feedback" role="status"><strong>${correct ? 'ตอบถูก' : 'ยังไม่ถูก'} · คำตอบ: ${esc(q.c[q.a])}</strong><p>${esc(q.e)}</p><p class="small">อ้างอิง: ${esc(q.reference)}</p>${sourceLinks(q.role,q.sources)}</div>` : ''}</article>`;
  }
  function quiz(wrong = false) {
    if (!activeQuiz.length) return '<div class="empty-card"><h2>ยังไม่มีข้อผิดให้ทวน</h2><p>เมื่อทำโจทย์ประจำวัน ข้อที่ตอบผิดจะมาอยู่ที่นี่</p><a class="button primary" href="#day-' + s.day + '-quiz">ทำโจทย์ประจำวัน</a></div>';
    const rdCount = activeQuiz.filter(id => model.all.get(id).role === 'rd').length;
    const freshCount = activeQuiz.filter(id => model.all.get(id).fresh).length;
    return `<section class="practice-card"><div class="practice-head"><div><h2>${wrong ? 'ทวนเฉพาะข้อผิด' : `ทดสอบวันนี้ ${activeQuiz.length} ข้อ`}</h2><p>${wrong ? 'เปิดรอบใหม่แล้วลองตอบจากความเข้าใจ ข้อที่แก้ถูกจะออกจากรายการข้อผิดครั้งต่อไป' : `สรรพากร ${rdCount} + พลังงาน ${activeQuiz.length - rdCount} · ข้อใหม่ ${freshCount} ข้อและคัดจากคลังเดิม ${activeQuiz.length - freshCount} ข้อ · เฉลยหลังเลือก`}</p></div><p id="quiz-score" class="score-line"></p></div><p class="small">คะแนนนี้ใช้ดูจุดที่ต้องทวน ไม่ใช่เกณฑ์ผ่านหรือจำนวนข้อสอบจริง คำตอบบันทึกทันทีเมื่อเลือก</p><div class="quiz-actions"><button data-retry="wrong">เริ่มตอบข้อผิดใหม่</button><button data-retry="all">เริ่มชุดนี้ใหม่</button></div>${activeQuiz.map(question).join('')}<p class="score-line" id="quiz-score-end"></p></section>`;
  }
  const checks = ['ระบุประเด็นและสิ่งที่โจทย์ถามครบ', 'ใช้หลักกฎหมาย/หลักวิชาถูกเรื่องและถูกเงื่อนไข', 'นำข้อเท็จจริงหรือข้อมูลมาวิเคราะห์ ไม่ท่องลอย ๆ', 'สรุปแนวทางหรือผลคำนวณ พร้อมหน่วยและข้อจำกัดที่จำเป็น', 'เขียนลำดับชัด อ่านรู้เรื่อง และไม่แต่งข้อเท็จจริงเพิ่ม'];
  function writing() {
    const role = s.role, l = D.lessons[role][s.day - 1], key = `${role}-${s.day}`;
    return `<section class="writing-card"><h2>ฝึกข้อเขียน · วันที่ ${s.day}</h2><p>ฝึกหน่วยงานละ ${s.hours === 3 ? '10' : '15'} นาที: วางโครง → เขียนตอบ → เทียบแนวคำตอบ ทำทั้งสองหน่วยงานในช่วงนี้</p><div class="segmented">${['rd','energy'].map(r => `<button data-writing-role="${r}" aria-pressed="${r === role}">${r === 'rd' ? 'สรรพากร' : 'พลังงาน'}</button>`).join('')}</div><p class="scope-tag">${esc(D.labels[role])} · ${esc(l.title)}</p><h3>โจทย์สถานการณ์</h3><p>${esc(l.example[0])}</p><p>จงระบุหลักที่เกี่ยวข้อง แสดงการวิเคราะห์ และสรุปคำตอบพร้อมเหตุผล หากเป็นโจทย์คำนวณให้เขียนสูตร แทนค่า และหน่วย หากเป็นสถานการณ์ให้เสนอขั้นตอนที่ทำได้จริง</p><label class="writing-label" for="essay">คำตอบของคุณ</label><textarea id="essay" maxlength="20000" data-writing="${key}" placeholder="ประเด็นคือ…\nหลักที่ใช้คือ…\nเมื่อพิจารณาข้อเท็จจริง…\nจึงควร…">${esc(s.writing[key] || '')}</textarea><p class="save-status" id="essay-status">${s.writing[key] ? 'มีคำตอบที่บันทึกไว้บนเครื่องนี้' : 'คำตอบจะบันทึกอัตโนมัติบนเครื่องนี้'}</p>
    <details class="model-answer"><summary>ดูโครงและแนวคำตอบ หลังลองเขียนเอง</summary><ol><li><strong>จับประเด็น:</strong> ${esc(l.lead)}</li><li><strong>หลักที่ใช้:</strong> ${esc(l.blocks[0][1])}</li><li><strong>วิเคราะห์และสรุป:</strong> ${esc(l.example[1])}</li><li><strong>ตรวจข้อจำกัด:</strong> ${l.traps.map(esc).join(' · ')}</li><li><strong>ตรวจที่มา:</strong> ใช้เอกสารท้ายบท ถ้าจำเลขมาตราไม่แน่ให้เขียนหลักอย่างถูกต้องก่อน อย่าเดาเลขมาตราหรือเงื่อนไขเพิ่มเติม</li></ol><p class="small">เป็นแนวตอบสำหรับฝึก อาจเรียบเรียงได้หลายแบบ เกณฑ์จริงขึ้นกับกรรมการและคำสั่งข้อสอบ</p>${sourceLinks(role,l.sources)}</details>
    <div class="self-check"><h3>ตรวจคำตอบด้วยตัวเอง</h3><p class="small">5 จุด จุดละ 2 คะแนน เป็นเกณฑ์ฝึกของแอพ ไม่ใช่การตรวจอัตโนมัติหรือเกณฑ์ของผู้ออกสอบ</p>${checks.map((t,i) => `<label class="check-line"><input type="checkbox" data-rubric="${key}" data-index="${i}" ${s.checks[key]?.[i] ? 'checked' : ''}>${esc(t)}</label>`).join('')}<strong id="rubric-score"></strong></div><div class="quiz-actions"><button class="primary" data-writing-role="${role === 'rd' ? 'energy' : 'rd'}">ฝึกอีกหน่วยงาน →</button><a class="button" href="#day-${s.day}-${role}">กลับอ่านหลักในบทนี้</a></div></section>`;
  }
  function plan() {
    return `<section class="plan-card"><span class="eyebrow">42–56 ชั่วโมงใน 14 วัน</span><h2>แผนติวสรรพากรและพลังงาน</h2><p>อ่านวันละหนึ่งบทต่อหน่วยงาน แล้วฝึก 20 ข้อและเขียนตอบ 2 กรณี รายการเป็นวันเรียนลำดับ 1–14 เลื่อนอ่านหัวข้อที่อ่อนก่อนได้</p><p class="small">พลังงาน: วันที่ 1, 13, 14 เป็นส่วนทั่วไป ส่วนวันที่ 2–12 เน้นเฉพาะตำแหน่งตามสัดส่วนคะแนน 50:150 โดยประมาณ</p>${D.lessons.rd.map((l,i) => `<div class="plan-row"><span class="plan-day">${i + 1}${s.done.includes(i + 1) ? ' ✓' : ''}</span><a href="#day-${i + 1}-rd"><span class="plan-role">สรรพากร</span>${esc(l.title)}</a><a href="#day-${i + 1}-energy"><span class="plan-role">พลังงาน</span>${esc(D.lessons.energy[i].title)}</a></div>`).join('')}<h3>ซ้อมเต็มชุดเมื่อพร้อม</h3><p>คลังเดิมมี A/B ชุดละ 100 ข้อ พร้อมพักแล้วทำต่อได้ ใช้แบ่งช่วงฝึกเพิ่มหรือซ้อมต่อเนื่อง โดยยึดเวลาสอบจริงจากประกาศนัดสอบ</p><div class="quiz-actions"><a class="button" href="rd-sprint.html">สรรพากร 200 ข้อ ↗</a><a class="button" href="energy-sprint.html">พลังงาน 200 ข้อ ↗</a></div></section>`;
  }
  function endDay() {
    return `<section class="notes-wrap"><label class="writing-label" for="daily-notes">จดสิ่งที่ยังพลาด · วันที่ ${s.day}</label><textarea class="notes" id="daily-notes" data-notes="${s.day}" maxlength="12000" placeholder="ฉันยังสลับ…กับ… / สูตรที่ต้องทวนคือ… / พรุ่งนี้ต้องลองตอบ…">${esc(s.notes[s.day] || '')}</textarea><p class="save-status" id="notes-status">บันทึกเฉพาะเครื่องนี้</p></section><div class="day-finish"><label class="check-line"><input type="checkbox" data-done="${s.day}" ${s.done.includes(s.day) ? 'checked' : ''}>ทำครบตามแผนวันนี้แล้ว (บันทึกด้วยตนเอง)</label>${s.day < 14 ? `<a class="button primary" href="#day-${s.day + 1}">ไปวันที่ ${s.day + 1} →</a>` : '<a class="button primary" href="#mistakes">เก็บข้อผิดที่เหลือ →</a>'}</div>`;
  }
  function counters() {
    if ($('quiz-score')) {
      const p = C.score(activeQuiz,s.answers,model.all), t = `ตอบ ${p.answered}/${p.total} · ถูก ${p.correct}`;
      $('quiz-score').textContent = t; $('quiz-score-end').textContent = t;
    }
    if ($('rubric-score')) $('rubric-score').textContent = `ประเมินด้วยตนเอง ${2 * (s.checks[`${s.role}-${s.day}`] || []).filter(Boolean).length} / 10`;
  }
  function render() {
    controls();
    $('course-view').innerHTML = view === 'plan' ? plan() : view === 'mistakes' ? quiz(true) : dailyHeader() + (view === 'quiz' ? quiz() : view === 'write' ? writing() : lesson(view)) + endDay();
    counters();
  }
  function route(initial = false) {
    const hash = location.hash.slice(1), match = /^day-(\d+)(?:-(rd|energy|quiz|write))?$/.exec(hash);
    if (hash === 'plan' || hash === 'mistakes') view = hash;
    else if (match && +match[1] >= 1 && +match[1] <= 14) {s.day = +match[1]; view = match[2] || s.role;}
    else view = s.role;
    if (view === 'rd' || view === 'energy') s.role = view;
    activeQuiz = view === 'mistakes' ? wrongIds() : [...model.quizzes[s.day - 1]];
    save(); render();
    if (!initial && lastRoute !== location.hash) {$('course-view').scrollIntoView({block:'start'}); $('course-view').focus({preventScroll:true});}
    lastRoute = location.hash;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.hours) {s.hours = Number(b.dataset.hours) === 4 ? 4 : 3; save(); render();}
    if (b.dataset.writingRole) {s.role = b.dataset.writingRole; save(); render(); $('essay')?.focus({preventScroll:true});}
    if (b.dataset.answer) {
      const id = b.dataset.answer, q = model.all.get(id), n = Number(b.dataset.choice);
      if (!q || Number.isInteger(s.answers[id]) || !Number.isInteger(n) || n < 0 || n > 3) return;
      s.answers[id] = n; s.records[id] = n; save();
      const el = document.getElementById('question-' + id); el.outerHTML = question(id,activeQuiz.indexOf(id));
      const feedback = document.getElementById('question-' + id).querySelector('.feedback'); feedback.tabIndex = -1; feedback.focus({preventScroll:true});
      controls(); counters();
    }
    if (b.dataset.retry) {
      const ids = b.dataset.retry === 'all' ? activeQuiz : activeQuiz.filter(id => Number.isInteger(s.records[id]) && s.records[id] !== model.all.get(id).a);
      if (!ids.length) {b.textContent = 'ไม่มีข้อผิดในชุดนี้'; return;}
      // New attempt only affects this course; previous latest results remain until reanswered.
      ids.forEach(id => {delete s.answers[id];}); activeQuiz = [...ids]; save(); render();
    }
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.read) {s.read[el.dataset.read] = el.checked; save();}
    if (el.dataset.done) {const d = Number(el.dataset.done); s.done = s.done.filter(x => x !== d); if (el.checked) s.done.push(d); save(); controls();}
    if (el.dataset.rubric) {const key = el.dataset.rubric; s.checks[key] ||= [false,false,false,false,false]; s.checks[key][Number(el.dataset.index)] = el.checked; save(); counters();}
  });
  document.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.writing) {s.writing[el.dataset.writing] = el.value; save(); $('essay-status').textContent = storageOK ? 'บันทึกคำตอบแล้ว · เฉพาะเครื่องนี้' : 'บันทึกไม่ได้ กรุณาคัดลอกคำตอบเก็บไว้';}
    if (el.dataset.notes) {s.notes[el.dataset.notes] = el.value; save(); $('notes-status').textContent = storageOK ? 'บันทึกจุดที่ต้องทวนแล้ว' : 'บันทึกไม่ได้ กรุณาคัดลอกเก็บไว้';}
  });
  $('course-loading').hidden = true;
  window.addEventListener('hashchange', () => route());
  route(true);
})();
