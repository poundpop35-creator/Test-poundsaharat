'use strict';
// DOM behavior tests: real HTML/scripts and banks; no layout or browser emulation claims.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, VirtualConsole} = require('jsdom');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'question-bank.html'), 'utf8');
const core = fs.readFileSync(path.join(root, 'bank-core.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'question-bank.js'), 'utf8');
const banks = ['coj','energy','rd','dmh','drr','sao','opsmoac','diprom','namban','central'];
const loadBank = id => JSON.parse(fs.readFileSync(path.join(root, 'question-banks', id + '.json'), 'utf8'));

async function boot(agency, options = {}) {
  const errors = [], requests = [], writes = [];
  const storage = options.storage || new Map();
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, {
    url:'https://test.invalid/Test-poundsaharat/question-bank.html?agency=' + agency + (options.hash || ''),
    runScripts:'outside-only', pretendToBeVisual:true, virtualConsole
  });
  const {window} = dom;
  window.scrollTo = () => {};
  window.addEventListener('error', event => errors.push(event.message));
  Object.defineProperty(window, 'localStorage', {value:{
    getItem(key) {
      if (options.blockReads) throw new Error('Storage unavailable');
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      writes.push(key);
      if (options.blockWrites) throw new Error('Storage unavailable');
      storage.set(key, String(value));
    },
    removeItem() { throw new Error('Existing progress must never be removed'); },
    clear() { throw new Error('Existing progress must never be cleared'); }
  }});
  window.fetch = async url => {
    requests.push(url);
    if (options.rejectFetch) throw new Error('Offline');
    if (options.failFetch) return {ok:false};
    assert.equal(url.split('?')[0], 'question-banks/' + agency + '.json');
    return {ok:true, json:async () => window.JSON.parse(JSON.stringify(options.bank || loadBank(agency)))};
  };
  // jsdom has no dialog methods or method="dialog" submission. Supply only that platform behavior.
  window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  window.HTMLDialogElement.prototype.close = function (value) {
    if (value !== undefined) this.returnValue = value;
    this.removeAttribute('open');
    this.dispatchEvent(new window.Event('close'));
  };
  window.document.addEventListener('click', event => {
    const button = event.target.closest('dialog form[method="dialog"] button');
    if (button) { event.preventDefault(); button.closest('dialog').close(button.value); }
  }, true);
  const flush = async () => {
    await new Promise(resolve => window.setTimeout(resolve, 0));
    await new Promise(resolve => window.setTimeout(resolve, 0));
  };
  window.eval(core);
  await window.eval(ui);
  await flush();
  const get = selector => window.document.querySelector(selector);
  const all = selector => [...window.document.querySelectorAll(selector)];
  return {
    window, storage, errors, requests, writes, get, all, flush,
    state() { return JSON.parse(storage.get('chapter-bank:' + agency + ':v1') || 'null'); },
    async click(selector) {
      const element = typeof selector === 'string' ? get(selector) : selector;
      assert.ok(element, 'Missing clickable element: ' + selector);
      element.click(); await flush();
    },
    async navigate(hash) { window.location.hash = hash; await flush(); },
    input(element, value, type = 'input') {
      element.value = value;
      element.dispatchEvent(new window.Event(type, {bubbles:true}));
    },
    async dismissDialog() {
      const dialog = get('#replace-dialog');
      const cancel = new window.Event('cancel', {cancelable:true});
      if (dialog.dispatchEvent(cancel)) dialog.close();
      await flush();
    },
    close() { window.close(); assert.deepEqual(errors, [], 'Uncaught DOM errors'); }
  };
}

async function beginMixed(app, mode = 'practice', index = 0) {
  await app.navigate('#mixed');
  const radio = app.get('input[name="mode"][value="' + mode + '"]');
  radio.checked = true;
  radio.dispatchEvent(new app.window.Event('change', {bubbles:true}));
  await app.click('[data-set="' + index + '"]');
}
const compact = text => text.replace(/\s+/g, ' ').trim();

test('all nine agencies and the central bank boot, list every chapter, expose fixed sets and source links', async t => {
  for (const agency of banks) await t.test(agency, async t => {
    const bank = loadBank(agency), app = await boot(agency);
    t.after(() => app.close());
    assert.equal(app.get('#bank-title').textContent, bank.title);
    assert.equal(app.get('#bank-label').textContent, agency === 'central' ? 'คลังกลาง · กฎหมายที่ใช้ร่วมกัน' : 'ข้อสอบรายหน่วยงาน');
    assert.equal(app.get('#bank-tabs').hidden, false);
    assert.equal(app.all('.chapter-card').length, bank.chapters.length);
    assert.equal(app.get('#chapter-search-count').textContent, bank.chapters.length + ' บท');
    assert.ok(app.get('#bank-meta').textContent.includes(bank.questions.length.toLocaleString('th-TH')));
    assert.deepEqual(app.requests.map(url => url.split('?')[0]), ['question-banks/' + agency + '.json']);
    assert.equal(app.storage.size, 0, 'Opening a bank should not rewrite any saved state');
    await app.navigate('#mixed');
    assert.equal(app.all('[data-set]').length, Math.floor(bank.questions.length / 100));
    await app.navigate('#sources');
    assert.equal(app.all('.source-card').length, bank.sources.length);
    for (const link of app.all('.source-card a')) {
      assert.equal(link.target, '_blank');
      assert.ok(link.rel.includes('noopener'));
      assert.ok(link.rel.includes('noreferrer'));
    }
  });
});

test('chapter search preserves the focused input through consecutive edits and clearing', async t => {
  const app = await boot('energy'), bank = loadBank('energy');
  t.after(() => app.close());
  const input = app.get('#chapter-search'); input.focus();
  for (const query of ['พ', 'พลัง', 'พลังงาน', 'ไม่มีบทชื่อนี้']) {
    app.input(input, query);
    assert.equal(app.get('#chapter-search'), input, 'The input must not be replaced while typing');
    assert.equal(app.window.document.activeElement, input);
    assert.equal(input.value, query);
    const expected = bank.chapters.filter(chapter => chapter.title.includes(query));
    assert.equal(app.all('.chapter-card').length, expected.length);
    assert.equal(app.get('#chapter-search-count').textContent, expected.length + ' บท');
  }
  assert.ok(app.get('#chapter-list').textContent.includes('ไม่พบบท'));
  app.input(input, '');
  assert.equal(app.all('.chapter-card').length, bank.chapters.length);
  assert.equal(app.window.document.activeElement, input);
});

test('former course lessons retain content and writing imports/save/reload never change the original key', async t => {
  const bank = loadBank('rd');
  const chapter = bank.chapters.find(ch => ch.lessons.some(lesson => lesson.legacyId === 'rd-1'));
  const lesson = chapter.lessons.find(item => item.legacyId === 'rd-1');
  const original = JSON.stringify({writing:{'rd-1':'คำตอบเดิม <b>ต้องคงเป็นข้อความ</b>'}, notes:{'1':'บันทึกเดิม'}, read:{'rd-1':true}});
  const storage = new Map([['exam14:rd-energy:v1', original]]);
  let app = await boot('rd', {storage, hash:'#chapter/' + chapter.id});
  t.after(() => app.close());
  let container = app.all('details.lesson').find(node => node.querySelector('summary').textContent === lesson.title);
  assert.ok(container);
  assert.ok(compact(container.textContent).includes(compact(lesson.lead)));
  for (const block of lesson.blocks) {
    assert.ok(container.textContent.includes(block[0]), 'Missing lesson heading');
    assert.ok(compact(container.textContent).includes(compact(block[1])), 'Missing lesson paragraph');
  }
  for (const row of lesson.table?.rows || []) for (const cell of row) assert.ok(container.textContent.includes(cell));
  for (const text of lesson.example || []) assert.ok(compact(container.textContent).includes(compact(text)));
  for (const text of lesson.traps || []) assert.ok(container.textContent.includes(text));
  for (const pair of lesson.recall || []) for (const text of pair) assert.ok(compact(container.textContent).includes(compact(text)));
  for (const text of [].concat(lesson.writing.modelAnswer, lesson.writing.rubric || [])) {
    for (const paragraph of text.split(/\n+/)) assert.ok(compact(container.textContent).includes(compact(paragraph)));
  }
  const selector = '[data-draft="' + lesson.id + '"]';
  assert.equal(app.get(selector).value, 'คำตอบเดิม <b>ต้องคงเป็นข้อความ</b>');
  assert.ok(container.textContent.includes('บันทึกเดิม'));
  assert.equal(storage.get('exam14:rd-energy:v1'), original);
  const draft = 'คำตอบที่แก้ใหม่\n<script>window.bad=1</script>';
  app.input(app.get(selector), draft);
  await app.click('[data-save-draft="' + lesson.id + '"]');
  assert.equal(app.state().writing[lesson.id], draft);
  assert.equal(app.get('#saved-' + lesson.id).textContent, 'บันทึกคำตอบแล้ว');
  await app.click('[data-read="' + chapter.id + '"]');
  assert.ok(app.state().read.includes(chapter.id));
  assert.ok(app.writes.every(key => ['chapter-bank:rd:v1','chapter-bank:last'].includes(key)));
  assert.equal(storage.get('exam14:rd-energy:v1'), original);
  app.close();
  app = await boot('rd', {storage, hash:'#chapter/' + chapter.id});
  assert.equal(app.get(selector).value, draft, 'A newer draft must survive re-import on reload');
  assert.equal(app.window.bad, undefined, 'Saved drafts must render as text');
  assert.equal(app.get('#view script'), null);
  assert.equal(storage.get('exam14:rd-energy:v1'), original);
  await app.navigate('#chapters');
  assert.ok(app.all('.chapter-card').find(node => node.textContent.includes(chapter.title)).textContent.includes('อ่านแล้ว'));
});

test('pending-session dialog keeps progress on cancel/resume and replaces it only on explicit replacement', async t => {
  const app = await boot('energy'); t.after(() => app.close());
  await beginMixed(app);
  const original = app.state().session, firstId = original.ids[0];
  await app.click('[data-answer="0"]');
  await app.click('[data-action="pause"]');
  const saved = app.state().session;
  await app.navigate('#mixed');
  const exam = app.get('input[name="mode"][value="exam"]'); exam.checked = true;
  exam.dispatchEvent(new app.window.Event('change', {bubbles:true}));
  await app.click('[data-set="1"]');
  assert.equal(app.get('#replace-dialog').open, true);
  assert.deepEqual(app.state().session, saved);
  await app.click('#replace-dialog [value="cancel"]');
  assert.equal(app.get('#replace-dialog').open, false);
  assert.equal(app.window.location.hash, '#mixed');
  assert.deepEqual(app.state().session, saved);
  await app.click('[data-set="1"]');
  await app.click('#replace-dialog [value="resume"]');
  assert.equal(app.window.location.hash, '#quiz');
  assert.equal(app.state().session.id, original.id);
  assert.equal(app.state().session.mode, 'practice', 'Resume keeps the original mode despite a different pending selection');
  assert.equal(app.state().session.answers[firstId], 0);
  assert.ok(app.get('.feedback'));
  await app.click('[data-action="pause"]');
  await app.navigate('#mixed'); await app.click('[data-set="1"]');
  await app.click('#replace-dialog [value="replace"]');
  const replacement = app.state().session;
  assert.equal(app.window.location.hash, '#quiz');
  assert.notEqual(replacement.id, original.id);
  assert.deepEqual(replacement.answers, {});
  assert.equal(replacement.idx, 0);
  assert.equal(replacement.mode, 'exam', 'Replacement uses the pending selection mode');
  assert.equal(replacement.ids.length, 100);
  assert.ok(replacement.ids.every(id => !original.ids.includes(id)), 'Fixed sets must not overlap');
  await app.click('[data-action="pause"]');
  await app.navigate('#mixed'); await app.click('[data-set="0"]');
  assert.equal(app.get('#replace-dialog').open, true);
  await app.dismissDialog();
  assert.equal(app.get('#replace-dialog').open, false);
  assert.equal(app.window.location.hash, '#mixed');
  assert.deepEqual(app.state().session, replacement, 'Escape dismissal must not reuse an earlier replace result');
});

test('practice100 locks choices, reveals feedback, resumes across reload, independently scores 85/100 and records history once', async t => {
  const bank = loadBank('energy'), byId = new Map(bank.questions.map(q => [q.id,q]));
  const legacy = JSON.stringify({session:{ids:['old-question'],idx:0}});
  const storage = new Map([['energy:sprint:v1',legacy]]);
  let app = await boot('energy', {storage}); t.after(() => app.close());
  await beginMixed(app);
  const wrongIds = [];
  const originalIds = app.state().session.ids;
  assert.equal(originalIds.length, 100); assert.equal(new Set(originalIds).size, 100);
  for (let index = 0; index < 100; index++) {
    const session = app.state().session;
    assert.equal(session.idx, index);
    assert.equal(app.get('[data-action="next"]').disabled, true);
    const q = byId.get(session.ids[index]), isWrong = index % 7 === 0;
    const chosen = isWrong ? (q.a + 1) % 4 : q.a;
    if (isWrong) wrongIds.push(q.id);
    await app.click('[data-answer="' + chosen + '"]');
    assert.ok(app.get('.feedback'));
    assert.ok(compact(app.get('.feedback').textContent).includes(compact(q.e)));
    assert.equal(app.get('.feedback').classList.contains('incorrect'), isWrong);
    assert.ok(app.all('.choice').every(button => button.disabled));
    assert.equal(app.window.document.activeElement.id, 'answer-feedback');
    await app.click('[data-answer="' + ((chosen + 1) % 4) + '"]');
    assert.equal(app.state().session.answers[q.id], chosen, 'Practice answer cannot change after feedback');
    await app.click('[data-action="next"]');
    if (index === 9) {
      await app.click('[data-action="pause"]');
      assert.ok(app.get('#resume-slot [data-action="resume"]'));
      const paused = app.state().session; app.close();
      app = await boot('energy', {storage});
      assert.ok(app.get('#resume-slot [data-action="resume"]'));
      await app.click('#resume-slot [data-action="resume"]');
      assert.deepEqual(app.state().session, paused);
      assert.equal(app.state().session.idx, 10);
      assert.equal(app.window.location.hash, '#quiz');
    }
  }
  assert.equal(wrongIds.length, 15);
  assert.equal(app.window.location.hash, '#result');
  assert.equal(compact(app.get('.score').textContent), '85 / 100');
  assert.equal(app.all('.review-list > details').length, 100);
  assert.equal(app.state().history.length, 1);
  assert.equal(app.state().history[0].correct, 85);
  assert.equal(app.state().history[0].total, 100);
  assert.equal(app.state().history[0].mode, 'practice');
  assert.equal(app.state().session.complete, true);
  assert.equal(storage.get('energy:sprint:v1'), legacy);
  const completed = app.state().session; app.close();
  app = await boot('energy', {storage, hash:'#resume'});
  assert.equal(app.window.location.hash, '#result');
  assert.equal(compact(app.get('.score').textContent), '85 / 100');
  assert.deepEqual(app.state().session, completed);
  assert.equal(app.state().history.length, 1);
  await app.navigate('#history');
  assert.equal(app.all('.history-row').length, 1);
  await app.navigate('#result');
  assert.equal(app.state().history.length, 1);
  await app.click('[data-action="retry"]');
  assert.deepEqual(new Set(app.state().session.ids), new Set(wrongIds));
  assert.equal(app.state().session.mode, 'practice');
  assert.equal(app.state().history.length, 1);
});

test('exam100 hides correctness before completion and previous/edit changes the final score to 99/100', async t => {
  const bank = loadBank('coj'), byId = new Map(bank.questions.map(q => [q.id,q]));
  const app = await boot('coj'); t.after(() => app.close());
  await beginMixed(app, 'exam');
  const ids = app.state().session.ids;
  assert.equal(app.state().session.mode, 'exam');
  for (let index = 0; index < 2; index++) {
    const q = byId.get(ids[index]);
    await app.click('[data-answer="' + q.a + '"]');
    assert.equal(app.get('.feedback'), null);
    assert.equal(app.get('.choice.right, .choice.wrong'), null);
    assert.ok(app.all('.choice').every(button => !button.disabled));
    if (index === 0) await app.click('[data-action="next"]');
  }
  await app.click('[data-action="previous"]');
  assert.equal(app.state().session.idx, 0);
  await app.click('[data-answer="' + ((byId.get(ids[0]).a + 1) % 4) + '"]');
  assert.notEqual(app.state().session.answers[ids[0]], byId.get(ids[0]).a);
  await app.click('[data-action="next"]');
  assert.equal(app.state().session.idx, 1);
  assert.equal(app.get('[data-action="next"]').disabled, false);
  await app.click('[data-action="next"]');
  for (let index = 2; index < 100; index++) {
    assert.equal(app.state().session.idx, index);
    const q = byId.get(ids[index]);
    await app.click('[data-answer="' + q.a + '"]');
    assert.equal(app.get('.feedback'), null);
    assert.equal(app.get('.choice.right, .choice.wrong'), null);
    await app.click('[data-action="next"]');
  }
  assert.equal(app.window.location.hash, '#result');
  assert.equal(compact(app.get('.score').textContent), '99 / 100');
  assert.equal(app.all('.review-list .feedback').length, 100);
  assert.equal(app.state().history[0].correct, 99);
  assert.equal(app.state().history[0].mode, 'exam');
});

test('fetch failures, invalid bank data and unknown agency have recoverable pages without uncaught errors', async t => {
  for (const options of [{failFetch:true}, {rejectFetch:true}, {bank:{schemaVersion:1,id:'energy',chapters:[],questions:[]}}]) {
    const app = await boot('energy', options);
    assert.equal(app.get('#bank-title').textContent, 'ยังเปิดคลังนี้ไม่ได้');
    assert.ok(app.get('#view a[href="question-bank.html?agency=energy"]'));
    assert.ok(app.get('#view a[href="index.html"]'));
    assert.equal(app.get('#bank-tabs').hidden, true);
    app.close();
  }
  const app = await boot('not-a-bank'); t.after(() => app.close());
  assert.equal(app.get('#bank-title').textContent, 'เลือกคลังที่ต้องการ');
  assert.equal(app.requests.length, 0);
  assert.ok(app.get('#view a[href="index.html"]'));
});

test('blocked or malformed storage leaves the bank usable without deleting any old progress', async t => {
  await t.test('storage reads and writes blocked', async t => {
    const app = await boot('energy', {blockReads:true,blockWrites:true}); t.after(() => app.close());
    assert.equal(app.get('#bank-title').textContent, loadBank('energy').title);
    await beginMixed(app);
    assert.equal(app.get('#storage-notice').hidden, false);
    await app.click('[data-answer="0"]');
    assert.ok(app.get('.feedback'));
    assert.equal(app.get('[data-action="next"]').disabled, false);
    await app.click('[data-action="next"]');
    assert.equal(app.get('.quiz-count').textContent, 'ข้อ 2 / 100');
  });
  await t.test('malformed saved JSON', async t => {
    const storage = new Map([['chapter-bank:rd:v1','{broken'],['exam14:rd-energy:v1','{broken']]);
    const app = await boot('rd', {storage}); t.after(() => app.close());
    assert.equal(app.get('#bank-title').textContent, loadBank('rd').title);
    assert.ok(app.get('.chapter-card'));
    assert.equal(storage.get('chapter-bank:rd:v1'), '{broken', 'Opening alone must not overwrite malformed old state');
    assert.equal(storage.get('exam14:rd-energy:v1'), '{broken');
    assert.deepEqual(app.writes, []);
  });
});
