/* Shared tutor for the three upcoming exams. All question IDs are persistent. */
(() => {
  'use strict';
  const {config, topics, sources} = window.EXAM_DATA;
  const core = window.ExamCore, $ = id => document.getElementById(id);
  const official = topics.filter(t => !t.supplemental);
  const focused = core.focused(topics);
  const key = 'exam-tutor-v1:' + config.id;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const find = id => topics.find(t => t.id === Number(id));
  const button = (action, label, id = '', primary = false) => `<button type="button" class="btn ${primary ? 'primary' : ''}" data-action="${action}" data-id="${id}">${esc(label)}</button>`;
  const links = ids => (ids || []).map(id => `<a href="${esc(sources[id].fullUrl || sources[id].url)}" target="_blank" rel="noopener noreferrer">${esc(sources[id].title)} ↗</a>`).join(' · ');
  const fullLinks = ids => (ids || []).map(id => {
    const source = sources[id];
    const direct = source.fullUrl || source.url;
    const title = source.title.split(' • ').pop();
    const label = source.fullUrl && !source.fullType?.includes('หน้าเอกสาร') ? 'เปิดฉบับเต็ม' : 'เปิดต้นฉบับที่ใช้สรุป';
    return `<div class="document-link"><span>${esc(title)}</span><a class="btn document-button" href="${esc(direct)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>${direct !== source.url ? `<a class="publisher-link" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">แหล่งเผยแพร่</a>` : ''}</div>`;
  }).join('');
  function feedback(item) {
    const analysis = item.options.some(o => o.why) ? `<details class="choice-analysis"><summary>เหตุผลครบทั้ง 4 ตัวเลือก</summary><ol>${item.options.map(o => `<li><strong>${o.text}</strong><p>${esc(o.why)}</p></li>`).join('')}</ol></details>` : '';
    return `<p>${item.e}</p>${analysis}${item.focus ? `<p class="small">ฝึก: ${esc(item.skill)} · ตรวจเทียบเอกสารอ้างอิง ${esc(item.verifiedAt)}</p>` : ''}<p class="small">${esc(item.reference || '')}</p><div class="answer-sources"><h4>กดอ่านต้นฉบับที่ใช้เฉลย</h4>${fullLinks(item.sources)}</div>`;
  }
  let progress = core.normalize(null, topics), session = null, readTopic = null;
  try { progress = core.normalize(JSON.parse(localStorage.getItem(key)), topics); }
  catch { $('storageNotice').hidden = false; }
  function save() {
    try { localStorage.setItem(key, JSON.stringify(progress)); $('storageNotice').hidden = true; }
    catch { $('storageNotice').hidden = false; }
  }
  function show(name) {
    document.querySelectorAll('.view').forEach(v => { v.hidden = v.id !== name; });
    document.querySelectorAll('[data-tab]').forEach(b => {
      const active = b.dataset.tab === name;
      b.classList.toggle('active', active);
      if (active) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
    const heading = $(name).querySelector('h2');
    if (heading) { heading.tabIndex = -1; heading.focus({preventScroll: true}); }
  }
  function grid() {
    const term = $('topicSearch').value.trim().toLocaleLowerCase('th');
    const matches = t => !term || JSON.stringify([t.title, t.content, t.q]).toLocaleLowerCase('th').includes(term);
    const card = t => {
      const stat = core.stats(t, progress);
      return `<article class="topic"><div class="topic-title"><span class="number">${t.supplemental ? '+' : t.number}</span><h3>${esc(t.title)}</h3></div>
        <p>${t.q.length} ข้อ · ${progress.read[t.id] ? '✓ อ่านแล้ว' : 'ยังไม่ทำเครื่องหมายว่าอ่านแล้ว'}</p>
        <p class="small">ฝึกแล้ว ${stat.answered}/${stat.total} ข้อ${stat.wrong ? ' · ต้องทวน ' + stat.wrong + ' ข้อ' : ''}</p>
        <div class="actions">${button('read', 'อ่านและทบทวน', t.id)}${button('topic', 'ฝึกทำข้อสอบ', t.id, true)}${t.q.some(q => q.focus) ? button('focus-topic', 'เน้นสอบ ' + t.q.filter(q => q.focus).length + ' ข้อ', t.id) : ''}</div><div class="topic-documents"><h4>ต้นฉบับที่ใช้สรุป</h4>${fullLinks(t.sources)}</div></article>`;
    };
    const found = official.filter(matches);
    $('topicGrid').innerHTML = found.map(card).join('') || '<p>ไม่พบหัวข้อ ลองใช้คำค้นสั้นลง</p>';
    $('searchCount').textContent = `พบ ${found.length}/${official.length} หัวข้อหลัก`;
    $('supplementalGrid').innerHTML = topics.filter(t => t.supplemental).filter(matches).map(card).join('');
    $('supplemental').hidden = !topics.some(t => t.supplemental);
  }
  function home(message = '') {
    session = null;
    const next = find(progress.lastTopic) || config.studyOrder.map(find).find(t => !progress.read[t.id]) || official[0];
    const readCount = official.filter(t => progress.read[t.id]).length;
    const answered = official.reduce((n, t) => n + core.stats(t, progress).answered, 0);
    const total = official.reduce((n, t) => n + t.q.length, 0);
    $('studySummary').innerHTML = `<h2>เริ่มติว${esc(config.shortName)}</h2><p>อ่านแล้ว ${readCount}/${official.length} หัวข้อ · ฝึกแล้ว ${answered}/${total} ข้อ</p>
      <div class="actions">${button('read', 'อ่านต่อ: ' + next.shortTitle, next.id, true)}${button('wrong', 'ทวนข้อที่ยังผิด (' + core.wrong(topics, progress).length + ')')}${button('mock', 'ฝึกรวม 30 ข้อ')}</div>
      <p class="small">บันทึกการอ่าน คำตอบ และข้อที่ต้องทวนไว้ในอุปกรณ์นี้</p>`;
    $('focusPanel').innerHTML = `<p class="focus-label">ชุดใหม่ • เฉลยพร้อมเหตุผลทุกตัวเลือก</p><h2>${esc(config.focus.title)} ${focused.length} ข้อ</h2><p>ฝึกแยกเงื่อนไข ข้อยกเว้น และแก้สถานการณ์ตามงานของตำแหน่ง ครบ ${official.length} หัวข้อหลัก</p><div class="actions">${button('focus', 'เริ่มชุดเน้นสอบ ' + focused.length + ' ข้อ', '', true)}${button('focus-mock', 'ลองสอบชุดเน้น • เฉลยท้ายชุด')}</div><p class="small">${esc(config.focus.note)}</p><details><summary>เลือกประเด็นฝึกจากอะไร</summary><p>${esc(config.focus.method)}</p><ul>${official.map(t => `<li>${esc(t.shortTitle)}: ${t.q.filter(q => q.focus).length} ข้อ ${button('focus-topic', 'ฝึกเฉพาะหัวข้อนี้', t.id)}</li>`).join('')}</ul><p class="small">ตรวจเทียบเอกสารอ้างอิงของข้อใหม่วันที่ 10 ก.ย. 2569 ดูฉบับและมาตราในเฉลยแต่ละข้อ ข่าวและกฎหมายไม่ได้อัปเดตอัตโนมัติ</p></details>`;
    $('studyPlan').innerHTML = `<summary>แผนอ่านตามลำดับความสำคัญ</summary><p>${esc(config.plan)}</p><ol>${config.studyOrder.map(id => `<li><button class="text-button" type="button" data-action="read" data-id="${id}">${esc(find(id).shortTitle)}</button></li>`).join('')}</ol><p class="small">หนึ่งรอบแนะนำ: อ่าน 25 นาที → อธิบายด้วยคำตัวเอง 5 นาที → ฝึก 15 นาที → ทวนข้อผิด 5 นาที ปรับเวลาได้ตามสะดวก</p>`;
    $('homeMessage').textContent = message; grid(); show('home');
  }
  function read(id) {
    const t = find(id); if (!t) return;
    readTopic = t; session = null; progress.lastTopic = t.id; save();
    $('readTitle').textContent = `${t.supplemental ? 'บทเสริม' : 'หัวข้อ ' + t.number} • ${t.title}`;
    const full = fullLinks(t.sources);
    $('fullTextLinks').hidden = !full;
    $('fullTextLinks').innerHTML = full ? '<h3>เปิดกฎหมายและต้นฉบับที่ใช้สรุป</h3>' + full + '<p class="small">กดปุ่มเพื่อเปิดต้นฉบับบนเว็บไซต์หน่วยงานในแท็บใหม่</p>' : '';
    $('readBody').innerHTML = t.content.map(s => `<section><h3>${s.h}</h3>${s.points?.length ? '<ul>' + s.points.map(p => `<li>${p}</li>`).join('') + '</ul>' : ''}${s.kbox ? '<div class="kbox">' + s.kbox + '</div>' : ''}</section>`).join('') +
      `<section class="sources"><h3>อ่านต้นฉบับประกอบ</h3><p>${links(t.sources)}</p><p class="small">${esc(t.sourceNote || '')} ตรวจแหล่งประกอบชุดเพิ่มเติม 9 ก.ย. 2569</p></section>` +
      (t.recall ? `<section><h3>ปิดเนื้อหา แล้วลองอธิบายเอง</h3><p>${esc(t.recall.prompt)}</p><label for="recallDraft">คำตอบของฉัน</label><textarea id="recallDraft" rows="5" maxlength="10000">${esc(progress.drafts[t.id] || '')}</textarea><details><summary>ดูแนวคำตอบ</summary><ul>${t.recall.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul><p class="small">ใช้ตรวจประเด็นด้วยตัวเอง ไม่มีการให้คะแนนอัตโนมัติ</p></details></section>` : '');
    $('readActions').innerHTML = `<label><input id="readCheck" type="checkbox" ${progress.read[t.id] ? 'checked' : ''}> อ่านและทบทวนแล้ว</label>${button('topic', 'ฝึกหัวข้อนี้', t.id, true)}`;
    show('read');
  }
  function start(items, title, mode = 'practice') {
    if (!items.length) { home('ยังไม่มีข้อที่ต้องทวน ลองฝึกหัวข้อหรือทำชุดรวมก่อน'); return; }
    session = {items: items.map(q => core.question(q)), index: 0, score: 0, responses: [], answered: false, title, mode};
    show('quiz'); renderQuestion();
  }
  function renderQuestion() {
    const item = session.items[session.index]; session.answered = false;
    $('quizTitle').textContent = session.title;
    $('quizMode').textContent = session.mode === 'mock' ? 'เฉลยเมื่อจบชุด • กระจายให้ครบหัวข้อ ไม่ใช่สัดส่วนข้อสอบจริง' : 'ตอบแล้วดูคำอธิบายได้ทันที';
    $('qcount').textContent = `ข้อ ${session.index + 1}/${session.items.length}`;
    $('qscore').textContent = session.mode === 'mock' ? 'บันทึกเมื่อเลือกคำตอบ' : `ถูก ${session.score} ข้อ`;
    $('qbar').value = session.index; $('qbar').max = session.items.length;
    $('qCard').innerHTML = `<p class="small">${item.focus ? '<span class="focus-label">ชุดเน้นสอบ</span> · ' : ''}${esc(item.topicTitle)}</p><h3 id="questionTitle" tabindex="-1">${item.q}</h3><div id="options">${item.options.map((o, i) => `<button class="option" type="button" data-action="pick" data-id="${i}"><span>${['ก','ข','ค','ง'][i]}.</span>${o.text}</button>`).join('')}</div><div id="explanation" aria-live="polite"></div>`;
    $('nextBtn').disabled = true; $('nextBtn').textContent = 'เลือกคำตอบก่อน';
    $('questionTitle').focus({preventScroll: true});
  }
  function pick(index) {
    if (!session || session.answered || !Number.isInteger(index) || index < 0 || index > 3) return;
    session.answered = true;
    const item = session.items[session.index], correct = index === item.answer;
    if (correct) session.score++;
    session.responses.push({item, index, correct}); progress = core.record(progress, item.id, correct); save();
    document.querySelectorAll('#options button').forEach((b, i) => {
      b.disabled = true;
      if (session.mode === 'mock') { if (i === index) b.classList.add('selected'); }
      else if (i === item.answer) b.classList.add('correct'); else if (i === index) b.classList.add('wrong');
    });
    $('explanation').innerHTML = session.mode === 'mock' ? '<p>บันทึกคำตอบแล้ว ดูเฉลยพร้อมกันเมื่อจบชุด</p>' : `<h4>${correct ? '✓ ถูกต้อง' : 'ยังไม่ถูก • คำตอบที่ถูก: ' + item.options[item.answer].text}</h4>${feedback(item)}`;
    if (session.mode !== 'mock') $('qscore').textContent = `ถูก ${session.score} ข้อ`;
    $('nextBtn').disabled = false; $('nextBtn').textContent = session.index === session.items.length - 1 ? 'ดูผลและเฉลย' : 'ข้อถัดไป';
  }
  function result() {
    const total = session.items.length;
    $('result').innerHTML = `<div class="panel"><h2>ผลการฝึก ${session.score}/${total} ข้อ (${Math.round(session.score / total * 100)}%)</h2><p>ทบทวนเหตุผลของข้อที่พลาด แล้วฝึกซ้ำเพื่อเช็กความเข้าใจ</p><p class="small">คะแนนจากชุดฝึกนี้ไม่ใช่เกณฑ์ผ่านหรือการรับรองความพร้อมสอบจริง</p><div class="actions">${button('retry', 'ทำชุดเดิมอีกครั้ง', '', true)}${button('wrong', 'ทวนข้อที่ยังผิด')}${button('home', 'กลับบทเรียน')}</div></div>
      <section class="panel"><h3>ผลรายหัวข้อ</h3><ul>${topics.map(t => { const a = session.responses.filter(r => r.item.topicId === t.id); return a.length ? `<li>${esc(t.shortTitle)}: ${a.filter(r => r.correct).length}/${a.length} ${button('read', 'อ่านทบทวน', t.id)}</li>` : ''; }).join('')}</ul></section>
      <h3>เฉลยทุกข้อและเหตุผล</h3>${session.responses.map((r, i) => `<details class="review" ${r.correct ? '' : 'open'}><summary>${r.correct ? '✓' : '✗'} ข้อ ${i + 1}: ${r.item.q}</summary><p>คำตอบของฉัน: ${r.item.options[r.index].text}</p><p><b>คำตอบที่ถูก: ${r.item.options[r.item.answer].text}</b></p>${feedback(r.item)}${button('read', 'กลับไปอ่านหัวข้อนี้', r.item.topicId)}</details>`).join('')}`;
    show('result');
  }
  function sourcePage() {
    session = null;
    const ids = [...new Set(topics.flatMap(t => t.sources))];
    $('sourcesBody').innerHTML = `<h2>ขอบเขตสอบและแหล่งอ่าน</h2><p>${esc(config.scopeNote)}</p><p>ภาพระบุคะแนนเต็ม 200 คะแนน ไม่ได้ระบุจำนวนข้อ สัดส่วนคะแนนรายหัวข้อ หรือยืนยันว่าทุกข้อเป็นปรนัย ข้อฝึกในแอปแต่งขึ้นเพื่อเรียนรู้ ไม่ใช่ข้อสอบจริงของหน่วยงาน</p><ol>${official.map(t => `<li>${esc(t.title)}</li>`).join('')}</ol><h3>อ่านกฎหมายและเอกสารฉบับเต็ม</h3>${fullLinks(ids)}<h3>แหล่งเผยแพร่และคำอธิบาย • ข้อเน้นสอบตรวจเทียบเอกสาร 10 ก.ย. 2569</h3>${ids.map(id => `<section><h4>${links([id])}</h4><p>${esc(sources[id].note || '')}</p></section>`).join('')}<p class="small">ข่าวระบุวันที่ของเหตุการณ์และมีลิงก์ติดตามฉบับใหม่ เนื้อหาไม่ได้อัปเดตอัตโนมัติ</p>`; show('sources');
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-action]'); if (!target) return;
    const id = Number(target.dataset.id);
    switch (target.dataset.action) {
      case 'home': home(); break;
      case 'read': read(id); break;
      case 'topic': {const t = find(id); if (t) start(core.shuffle(t.q), 'ฝึก • ' + t.shortTitle); break;}
      case 'focus': start(core.shuffle(focused), 'ชุดเน้นสอบ • ' + config.shortName); break;
      case 'focus-mock': start(core.shuffle(focused), 'ลองสอบชุดเน้น • ' + config.shortName, 'mock'); break;
      case 'focus-topic': {const t = find(id); if (t && !t.supplemental) start(core.shuffle(t.q.filter(q => q.focus)), 'เน้นสอบ • ' + t.shortTitle); break;}
      case 'mock': start(core.balanced(topics), 'ฝึกรวม 30 ข้อ • ครบทุกหัวข้อหลัก', 'mock'); break;
      case 'wrong': start(core.shuffle(core.wrong(topics, progress)), 'ทวนข้อที่ยังตอบผิด'); break;
      case 'pick': pick(id); break;
      case 'next': if (session?.answered) { if (++session.index < session.items.length) {renderQuestion(); window.scrollTo(0, 0);} else result(); } break;
      case 'retry': if (session) start(core.shuffle(session.items), session.title, session.mode); break;
      case 'sources': sourcePage(); break;
    }
  });
  $('topicSearch').addEventListener('input', grid);
  document.addEventListener('input', event => { if (event.target.id === 'recallDraft' && readTopic) { progress.drafts[readTopic.id] = event.target.value; save(); } });
  document.addEventListener('change', event => { if (event.target.id === 'readCheck' && readTopic) { progress.read[readTopic.id] = event.target.checked; save(); } });
  home();
  if (window.location.hash === '#focus') $('focusPanel').scrollIntoView();
})();
