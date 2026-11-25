(async function () {
  'use strict';
  const $ = id => document.getElementById(id), C = window.QuestionBankCore;
  const E = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const allowed = ['coj','energy','rd','dmh','drr','sao','opsmoac','diprom','namban','central'];
  const agency = new URLSearchParams(location.search).get('agency');
  if (!allowed.includes(agency)) {
    $('bank-title').textContent = 'เลือกคลังที่ต้องการ';
    $('view').innerHTML = '<div class="empty"><p>เลือกหน่วยงานหรือคลังกลางจากหน้ารวม</p><p><a class="button primary" href="index.html">เปิดคลังข้อสอบทั้งหมด</a></p></div>';
    return;
  }
  const key = 'chapter-bank:' + agency + ':v1';
  let model, state, sets, mode = 'practice', pendingStart = null, currentView = 'chapters';
  const letters = ['ก','ข','ค','ง'];
  function readSaved(storageKey) { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch (_) { return null; } }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(state));
      localStorage.setItem('chapter-bank:last', JSON.stringify({agency, at:Date.now()}));
    } catch (_) { $('storage-notice').hidden = false; }
  }
  function isSourceUrl(url) { return /^(https?:\/\/|[a-z0-9][a-z0-9-]*\.html(?:[?#].*)?$)/i.test(url || ''); }
  function sourceLinks(ids) {
    return '<div class="source-list">' + [...new Set(ids || [])].map(id => model.sources.get(id)).filter(Boolean).filter(s => isSourceUrl(s.url)).map(s => '<div><a href="' + E(s.url) + '" target="_blank" rel="noopener noreferrer">' + E(s.title) + '</a></div>').join('') + '</div>';
  }
  function paragraph(text) { return '<p>' + E(text).replace(/\n/g, '<br>') + '</p>'; }
  function go(hash) {
    if (location.hash === hash) route(); else location.hash = hash;
  }
  function finishRender(focus = true) {
    document.body.classList.toggle('quiz-active', currentView === 'quiz');
    const tab = currentView === 'mixed' ? 'mixed' : 'chapters';
    document.querySelectorAll('[data-view]').forEach(link => {
      if (link.dataset.view === tab && ['chapters','chapter','mixed'].includes(currentView)) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    renderResume();
    if (focus) {
      $('view').focus({preventScroll:true});
      window.scrollTo({top:currentView === 'quiz' ? 0 : Math.max(0, $('bank-heading').offsetTop - 72),behavior:'instant'});
    }
  }
  function renderResume() {
    const s = state.session;
    $('resume-slot').innerHTML = s && !s.complete && !['quiz','result'].includes(currentView)
      ? '<div class="resume-card"><div><strong>ทำชุดที่ค้างไว้ต่อ</strong><p>' + E(s.title) + ' · ข้อ ' + (s.idx + 1) + ' จาก ' + s.ids.length + '</p></div><button class="primary" data-action="resume">ทำต่อจากเดิม</button></div>' : '';
  }
  function renderChapters(query = '') {
    const normalized = query.trim().toLocaleLowerCase('th');
    const chapters = model.bank.chapters.filter(ch => ch.title.toLocaleLowerCase('th').includes(normalized));
    const cards = chapters.map(ch => {
      const number = model.bank.chapters.indexOf(ch) + 1;
      const count = model.bank.questions.filter(q => q.chapterId === ch.id).length;
      return '<article class="chapter-card card"><span class="chapter-number" aria-hidden="true">' + number + '</span><div><h3>' + E(ch.title) + '</h3><p>' + count + ' ข้อ' + ((ch.lessons || []).length ? ' · ' + ch.lessons.length + ' บทอ่าน' : '') + '</p>' + (state.read.includes(ch.id) ? '<span class="chapter-done">อ่านแล้ว</span>' : '') + '</div><div class="chapter-actions"><a class="button" href="#chapter/' + encodeURIComponent(ch.id) + '">อ่านบทนี้</a><button class="primary" data-chapter="' + E(ch.id) + '"' + (count ? '' : ' disabled') + '>ฝึก ' + count + ' ข้อ</button></div></article>';
    }).join('');
    if ($('chapter-list')) {
      $('chapter-list').innerHTML = cards || '<p class="empty">ไม่พบบทที่ตรงกับคำค้น</p>';
      $('chapter-search-count').textContent = chapters.length + ' บท';
      return;
    }
    $('view').innerHTML = '<div class="section-heading"><div><h2>เลือกบทที่อยากทบทวน</h2><p class="small muted">อ่านเนื้อหา แล้วฝึกโจทย์ของบทนั้นได้ทันที</p></div></div><label class="search-label" for="chapter-search">ค้นหาบทหรือชื่อกฎหมาย</label><input id="chapter-search" type="search" placeholder="พิมพ์ชื่อบทที่ต้องการ" autocomplete="off"><p class="small muted" id="chapter-search-count">' + chapters.length + ' บท</p><div class="chapter-list" id="chapter-list" style="margin-top:12px">' + cards + '</div>';
  }
  function renderMixed() {
    const remainder = model.byId.size % 100;
    $('view').innerHTML = '<div class="section-heading"><div><h2>คละหลายบทในชุดเดียว</h2><p class="small muted">ทุกชุดมี 100 ข้อ จากคลัง' + (agency === 'central' ? 'กลาง' : 'ของหน่วยงานนี้') + '</p></div></div>' +
      '<fieldset class="mode-picker"><legend>เลือกวิธีทำข้อสอบ</legend><label><input type="radio" name="mode" value="practice"' + (mode === 'practice' ? ' checked' : '') + '>ฝึกพร้อมเฉลย</label><label><input type="radio" name="mode" value="exam"' + (mode === 'exam' ? ' checked' : '') + '>ซ้อมสอบ</label></fieldset>' +
      '<p class="small muted" id="mode-help" style="margin-bottom:16px">' + modeHelp() + '</p>' +
      '<div class="mixed-hero"><h2>สุ่มชุดใหม่ 100 ข้อ</h2><p>คละข้อสอบจากบทต่าง ๆ ทุกครั้งที่เริ่มใหม่ ไม่มีข้อซ้ำภายในชุด</p><button class="primary" data-action="random">เริ่มชุดคละ 100 ข้อ</button></div>' +
      '<div class="section-heading"><h2>ชุดฝึกที่จัดไว้</h2><span class="small muted">' + sets.length + ' ชุด</span></div><p class="small muted" style="margin-bottom:14px">แต่ละชุดคละหลายบท ข้อสอบไม่ซ้ำระหว่างชุดที่จัดไว้' + (remainder ? ' ส่วนอีก ' + remainder + ' ข้ออยู่ในบทและการสุ่มชุดใหม่' : '') + '</p><div class="set-list">' +
      sets.map((ids,i) => '<article class="set-card card"><h3>ชุดที่ ' + (i + 1) + '</h3><p>100 ข้อ · ' + new Set(ids.map(id => model.byId.get(id).chapterId)).size + ' บท</p><button data-set="' + i + '">เริ่มชุดที่ ' + (i + 1) + '</button></article>').join('') + '</div>';
  }
  function modeHelp() { return mode === 'exam' ? 'ตอบให้ครบแล้วดูคะแนนและเฉลยท้ายชุด ย้อนกลับไปแก้คำตอบได้' : 'ดูเฉลยและเหตุผลทันทีหลังตอบแต่ละข้อ'; }
  function renderLesson(lesson) {
    const table = lesson.table;
    const example = lesson.example;
    const writing = lesson.writing;
    let html = '<details class="lesson"><summary>' + E(lesson.title) + '</summary>' + (lesson.lead ? paragraph(lesson.lead) : '');
    html += (lesson.blocks || []).map(block => '<h3>' + E(block[0]) + '</h3>' + paragraph(block[1])).join('');
    if (table?.heads && table?.rows) html += '<div class="table-wrap"><table><thead><tr>' + table.heads.map(h => '<th>' + E(h) + '</th>').join('') + '</tr></thead><tbody>' + table.rows.map(row => '<tr>' + row.map(v => '<td>' + E(v) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
    if (Array.isArray(example) && example.length) html += '<div class="example"><strong>ลองใช้กับสถานการณ์</strong>' + paragraph(example[0]) + (example[1] ? '<strong style="margin-top:12px">แนวคิด</strong>' + paragraph(example[1]) : '') + '</div>';
    if (lesson.traps?.length) html += '<h3>จุดที่ควรแยกให้ชัด</h3><ul>' + lesson.traps.map(t => '<li>' + E(t) + '</li>').join('') + '</ul>';
    if (lesson.recall?.length) html += '<h3>ทวนจากความเข้าใจ</h3><div class="recall">' + lesson.recall.map(pair => '<details><summary>' + E(pair[0]) + '</summary>' + paragraph(pair[1]) + '</details>').join('') + '</div>';
    if (writing?.prompt) {
      html += '<h3>ฝึกเขียนตอบ</h3>' + paragraph(writing.prompt) + '<label class="draft-label" for="draft-' + E(lesson.id) + '">คำตอบของคุณ</label><textarea id="draft-' + E(lesson.id) + '" data-draft="' + E(lesson.id) + '" placeholder="เขียนแนวคิดของคุณที่นี่">' + E(state.writing[lesson.id] || '') + '</textarea><button data-save-draft="' + E(lesson.id) + '">บันทึกคำตอบ</button><p class="draft-status" id="saved-' + E(lesson.id) + '" role="status"></p>';
      if (writing.modelAnswer) html += '<details class="lesson"><summary>เปิดแนวคำตอบ</summary>' + paragraph(Array.isArray(writing.modelAnswer) ? writing.modelAnswer.join('\n') : writing.modelAnswer) + (writing.rubric?.length ? '<ul>' + writing.rubric.map(r => '<li>' + E(r) + '</li>').join('') + '</ul>' : '') + '</details>';
    }
    if (state.notes[lesson.id]) html += '<details class="lesson"><summary>บันทึกที่เคยจดไว้</summary>' + paragraph(state.notes[lesson.id]) + '</details>';
    html += sourceLinks(lesson.sourceIds) + '</details>';
    return html;
  }
  function renderChapter(id) {
    const chapter = model.chapters.get(id);
    if (!chapter) { go('#chapters'); return; }
    const count = model.bank.questions.filter(q => q.chapterId === id).length;
    $('view').innerHTML = '<a class="chapter-back" href="#chapters">กลับไปเลือกบท</a><article class="reading"><span class="small muted">บทที่ ' + (model.bank.chapters.indexOf(chapter) + 1) + ' · ' + count + ' ข้อ</span><h2>' + E(chapter.title) + '</h2>' +
      (chapter.sections || []).map(section => '<section class="reading-section">' + (section.heading ? '<h3>' + E(section.heading) + '</h3>' : '') + paragraph(section.text) + '</section>').join('') +
      (chapter.lessons || []).map(renderLesson).join('') +
      (!(chapter.sections || []).length && !(chapter.lessons || []).length ? '<p>เลือกฝึกโจทย์ของบทนี้ แล้วเปิดเฉลยและแหล่งอ่านประกอบในแต่ละข้อได้</p>' : '') +
      (chapter.sourceIds?.length ? '<h3>ตัวบทและแหล่งอ่านของบทนี้</h3>' + sourceLinks(chapter.sourceIds) : '') +
      '<div class="reading-actions"><button class="primary" data-chapter="' + E(id) + '"' + (count ? '' : ' disabled') + '>ฝึกบทนี้ ' + count + ' ข้อ</button><button data-read="' + E(id) + '">' + (state.read.includes(id) ? 'อ่านแล้ว ✓' : 'บันทึกว่าอ่านแล้ว') + '</button></div></article>';
  }
  function feedback(q, chosen, order) {
    const right = chosen === q.a;
    return '<div class="feedback' + (right ? '' : ' incorrect') + '"><h3>' + (right ? 'ตอบถูก' : 'ยังไม่ถูก') + ' · ' + letters[order.indexOf(q.a)] + '. ' + E(q.c[q.a]) + '</h3>' + paragraph(q.e) +
      (q.choiceReasons?.length === 4 ? '<ul class="choice-reasons">' + order.map((original,i) => '<li><strong>' + letters[i] + '.</strong> ' + E(q.choiceReasons[original]) + '</li>').join('') + '</ul>' : '') +
      (q.reference ? '<p class="reference"><strong>อ้างอิง:</strong> ' + E(q.reference) + '</p>' : '') + sourceLinks(q.sourceIds) + '</div>';
  }
  function renderQuiz() {
    const s = state.session;
    if (!s) { go('#chapters'); return; }
    if (s.complete) { go('#result'); return; }
    const q = model.byId.get(s.ids[s.idx]), selected = s.answers[q.id], answered = selected !== undefined;
    const reveal = answered && s.mode === 'practice', order = s.orders[q.id];
    const answers = Object.keys(s.answers).length;
    $('view').innerHTML = '<div class="quiz-top"><button data-action="pause">พักและกลับเมนู</button><span class="quiz-count">ข้อ ' + (s.idx + 1) + ' / ' + s.ids.length + '</span></div><progress max="' + s.ids.length + '" value="' + answers + '" aria-label="ตอบแล้ว ' + answers + ' จาก ' + s.ids.length + ' ข้อ"></progress><span class="quiz-topic">' + E(model.chapters.get(q.chapterId).title) + ' · ' + (s.mode === 'exam' ? 'ซ้อมสอบ' : 'ฝึกพร้อมเฉลย') + '</span><h2 class="quiz-question" id="question-title">' + E(q.q) + '</h2><div class="choices" aria-labelledby="question-title">' + order.map((original,i) => {
      const right = reveal && original === q.a, wrong = reveal && original === selected && !right;
      return '<button class="choice' + (right ? ' right' : wrong ? ' wrong' : selected === original ? ' selected' : '') + '" data-answer="' + original + '" aria-pressed="' + (selected === original) + '"' + (reveal ? ' disabled' : '') + '><span class="letter">' + letters[i] + '</span><span class="choice-content">' + E(q.c[original]) + (right ? '<span class="choice-result">คำตอบที่ถูก</span>' : wrong ? '<span class="choice-result">คำตอบที่คุณเลือก</span>' : '') + '</span></button>';
    }).join('') + '</div><div id="answer-feedback" tabindex="-1">' + (reveal ? feedback(q,selected,order) : s.mode === 'exam' && answered ? '<p class="small muted" style="margin-top:14px">บันทึกคำตอบแล้ว เปลี่ยนคำตอบได้ก่อนจบชุด</p>' : '') + '</div><div class="quiz-actions"><button data-action="previous"' + (s.idx ? '' : ' disabled') + '>ย้อนกลับ</button><button class="primary" data-action="next"' + (answered ? '' : ' disabled') + '>' + (s.idx === s.ids.length - 1 ? 'ดูคะแนน' : 'ข้อถัดไป') + '</button></div>';
  }
  function renderResult() {
    const s = state.session;
    if (!s?.complete) { go(s ? '#quiz' : '#chapters'); return; }
    const result = C.score(s, model);
    $('view').innerHTML = '<section class="score-card card"><span class="small muted">' + E(s.title) + '</span><div class="score">' + result.correct + '<small> / ' + result.total + '</small></div><h2>' + (result.wrong.length ? 'ทวนจุดที่ยังไม่แม่น แล้วลองอีกครั้ง' : 'ทำถูกครบชุดแล้ว') + '</h2><p class="muted">' + Math.round(100 * result.correct / result.total) + '% · ' + (s.mode === 'exam' ? 'ซ้อมสอบ' : 'ฝึกพร้อมเฉลย') + '</p><div class="result-actions">' + (result.wrong.length ? '<button class="primary" data-action="retry">ทวนข้อผิด ' + result.wrong.length + ' ข้อ</button>' : '') + '<a class="button" href="#mixed">เลือกชุดฝึก</a></div></section><div class="section-heading"><h2>คะแนนแยกบท</h2></div><div class="card">' + Object.entries(result.topics).map(([id,v]) => '<div class="history-row"><span>' + E(model.chapters.get(id).title) + '</span><strong>' + v.correct + ' / ' + v.total + '</strong></div>').join('') + '</div><div class="section-heading"><h2>ตรวจคำตอบและเฉลย</h2></div><div class="review-list">' + s.ids.map((id,i) => {
      const q = model.byId.get(id), selected = s.answers[id], right = selected === q.a;
      return '<details class="review-item"><summary>' + (right ? '✓' : '✕') + ' ' + (i + 1) + '. ' + E(q.q) + '</summary><p class="small muted" style="margin-top:12px">คุณเลือก: ' + E(q.c[selected]) + '</p>' + feedback(q,selected,s.orders[id]) + '</details>';
    }).join('') + '</div>';
  }
  function renderHistory() {
    $('view').innerHTML = '<div class="section-heading"><h2>ผลการฝึก</h2><a href="#chapters">เลือกบท</a></div>' + (state.history.length ? '<div class="card">' + state.history.map(h => '<div class="history-row"><div><h3>' + E(h.title) + '</h3><p>' + new Date(h.at).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'}) + ' · ' + (h.mode === 'exam' ? 'ซ้อมสอบ' : 'ฝึกพร้อมเฉลย') + '</p></div><strong>' + h.correct + ' / ' + h.total + '</strong></div>').join('') + '</div>' : '<div class="empty"><p>เมื่อทำจบชุด คะแนนจะปรากฏตรงนี้</p><p><a class="button primary" href="#mixed">เริ่มชุดรวม 100 ข้อ</a></p></div>');
  }
  function renderSources() {
    $('view').innerHTML = '<div class="section-heading"><h2>ตัวบทและแหล่งอ้างอิง</h2></div><p class="muted" style="margin-bottom:18px">เฉลยแต่ละข้อระบุมาตราหรือแหล่งที่ใช้ประกอบคำตอบ เปิดเอกสารต้นฉบับจากรายการด้านล่างได้</p>' + (agency === 'central' ? '<p class="notice">ชุดกฎหมายกลางแต่งขึ้นเพื่อฝึกจากตัวบทที่ระบุ ตรวจเอกสารวันที่ 25 พฤศจิกายน 2569 ขอบเขตฉบับที่ใช้แสดงไว้ใต้แต่ละแหล่ง</p>' : '<p class="small muted" style="margin-bottom:18px">คลังหน่วยงานรวบรวมเนื้อหาเดิม แหล่งอ้างอิงและวันที่ตรวจของแต่ละเอกสารอาจต่างกัน</p>') + '<div class="source-list">' + [...model.sources.values()].filter(s => isSourceUrl(s.url)).map(s => '<article class="source-card"><h3><a href="' + E(s.url) + '" target="_blank" rel="noopener noreferrer">' + E(s.title) + '</a></h3>' + (s.note ? '<small>' + E(s.note) + '</small>' : '') + '</article>').join('') + '</div>';
  }
  function route(focus = true) {
    if (!model) return;
    const hash = location.hash.slice(1) || 'chapters';
    currentView = hash.startsWith('chapter/') ? 'chapter' : ['mixed','history','sources','quiz','result','resume'].includes(hash) ? hash : 'chapters';
    if (currentView === 'resume') { go(state.session ? state.session.complete ? '#result' : '#quiz' : '#chapters'); return; }
    $('view').innerHTML = '';
    if (currentView === 'chapter') {
      try { renderChapter(decodeURIComponent(hash.slice(8))); } catch (_) { go('#chapters'); return; }
    } else if (currentView === 'mixed') renderMixed();
    else if (currentView === 'history') renderHistory();
    else if (currentView === 'sources') renderSources();
    else if (currentView === 'quiz') renderQuiz();
    else if (currentView === 'result') renderResult();
    else renderChapters();
    finishRender(focus);
  }
  function start(ids, title, sessionMode = mode) {
    if (state.session && !state.session.complete) {
      pendingStart = {ids,title,sessionMode};
      $('replace-dialog').returnValue = 'cancel';
      $('replace-dialog').showModal();
      return;
    }
    launch(ids,title,sessionMode);
  }
  function launch(ids, title, sessionMode) {
    state.session = C.createSession(model,ids,sessionMode,title);
    save(); go('#quiz');
  }
  document.addEventListener('click', event => {
    if (!model) return;
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.chapter) {
      const chapter = model.chapters.get(button.dataset.chapter);
      start(model.bank.questions.filter(q => q.chapterId === chapter.id).map(q => q.id),'บท: ' + chapter.title,'practice');
    } else if (button.dataset.set !== undefined) {
      const i = Number(button.dataset.set); start(sets[i], 'ชุดรวมที่ ' + (i + 1) + ' · 100 ข้อ');
    } else if (button.dataset.answer !== undefined) {
      state.session = C.answer(state.session,Number(button.dataset.answer)); save(); renderQuiz();
      if (state.session.mode === 'practice') $('answer-feedback').focus({preventScroll:true});
    } else if (button.dataset.read) {
      const id = button.dataset.read;
      if (!state.read.includes(id)) state.read.push(id);
      save(); button.textContent = 'อ่านแล้ว ✓';
    } else if (button.dataset.saveDraft) {
      const id = button.dataset.saveDraft;
      state.writing[id] = $('draft-' + id).value.slice(0,20000); save();
      $('saved-' + id).textContent = $('storage-notice').hidden ? 'บันทึกคำตอบแล้ว' : 'ยังบันทึกในเครื่องไม่ได้';
    } else {
      const action = button.dataset.action;
      if (action === 'random') start(C.mixed(model),'ชุดสุ่มรวม 100 ข้อ');
      else if (action === 'resume') go(state.session?.complete ? '#result' : '#quiz');
      else if (action === 'pause') { save(); go('#chapters'); }
      else if (action === 'previous' && state.session.idx > 0) { state.session.idx--; state.session.updatedAt = Date.now(); save(); renderQuiz(); window.scrollTo({top:0,behavior:'instant'}); }
      else if (action === 'next') {
        state.session = C.advance(state.session);
        if (state.session.complete) state = C.finish(state,model);
        save();
        if (state.session.complete) go('#result'); else { renderQuiz(); window.scrollTo({top:0,behavior:'instant'}); }
      } else if (action === 'retry') start(C.score(state.session,model).wrong,'ทวนข้อผิด','practice');
    }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'chapter-search') renderChapters(event.target.value);
  });
  document.addEventListener('change', event => {
    if (event.target.name === 'mode') { mode = event.target.value; $('mode-help').textContent = modeHelp(); }
    if (event.target.dataset.draft) {
      const id = event.target.dataset.draft;
      state.writing[id] = event.target.value.slice(0,20000); save();
      $('saved-' + id).textContent = $('storage-notice').hidden ? 'บันทึกคำตอบแล้ว' : 'ยังบันทึกในเครื่องไม่ได้';
    }
  });
  $('replace-dialog').addEventListener('close', () => {
    const request = pendingStart; pendingStart = null;
    if ($('replace-dialog').returnValue === 'resume') go('#quiz');
    else if ($('replace-dialog').returnValue === 'replace' && request) launch(request.ids,request.title,request.sessionMode);
  });
  window.addEventListener('hashchange', () => route());
  try {
    const response = await fetch('question-banks/' + agency + '.json?v=20261125-chapters');
    if (!response.ok) throw Error('โหลดคลังไม่สำเร็จ');
    model = C.build(await response.json());
    state = C.importLegacyWriting(C.clean(readSaved(key),model),readSaved('exam14:rd-energy:v1'),model); sets = C.fixedSets(model);
    $('bank-title').textContent = model.bank.title;
    $('bank-subtitle').textContent = model.bank.subtitle || 'อ่านเป็นบท ฝึกรายบท และทำชุดรวม 100 ข้อ';
    $('bank-label').textContent = agency === 'central' ? 'คลังกลาง · กฎหมายที่ใช้ร่วมกัน' : 'ข้อสอบรายหน่วยงาน';
    $('bank-meta').innerHTML = '<span>' + model.bank.chapters.length + ' บท</span><span>' + model.byId.size.toLocaleString('th-TH') + ' ข้อ</span><span>ชุดรวมละ 100 ข้อ</span>';
    document.title = model.bank.title + ' · บทเรียนและชุดรวม 100 ข้อ';
    $('bank-tabs').hidden = $('bank-tools').hidden = false;
    route(false);
  } catch (error) {
    $('bank-title').textContent = 'ยังเปิดคลังนี้ไม่ได้';
    $('view').innerHTML = '<div class="empty"><p>โหลดข้อมูลไม่ครบ กรุณาลองใหม่อีกครั้ง</p><p><a class="button primary" href="question-bank.html?agency=' + E(agency) + '">ลองเปิดอีกครั้ง</a> <a class="button" href="index.html">กลับคลังข้อสอบ</a></p></div>';
  }
})();
