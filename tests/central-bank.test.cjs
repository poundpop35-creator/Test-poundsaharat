'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../bank-core.js');
const {buildCentral} = require('../scripts/build-central-bank.cjs');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const central = JSON.parse(read('question-banks/central.json'));
const context = {window:{}};
vm.runInNewContext(read('app-catalog.js'), context);
const catalog = JSON.parse(JSON.stringify(context.window.STUDY_CATALOG));

test('central has 200 original questions with precise statute references across eight chapters', () => {
  const model = core.build(central);
  assert.equal(model.byId.size, 200);
  assert.equal(model.chapters.size, 8);
  assert.equal(new Set(central.questions.map(q => q.q.trim().normalize('NFC'))).size, 200);
  for (const chapter of central.chapters) {
    assert.equal(central.questions.filter(q => q.chapterId === chapter.id).length, 25);
    assert.ok(chapter.sections.length > 0 && chapter.sourceIds.length > 0);
  }
  const allowedHosts = new Set(['infocenter.oic.go.th', 'law.prd.go.th', 'standard.dga.or.th', 'www.ocsc.go.th', 'www.ratchakitcha.soc.go.th', 'ratchakitcha.soc.go.th', 'bbstore.bb.go.th', 'www.bb.go.th', 'www.opdc.go.th', 'skw.onab.go.th']);
  for (const q of central.questions) {
    assert.equal(q.sourceStatus, 'checked', q.id);
    assert.match(q.reference, /มาตรา\s*[0-9๐-๙]/, q.id);
    assert.ok(q.sourceIds.length > 0, q.id);
    for (const id of q.sourceIds) {
      const source = model.sources.get(id);
      assert.ok(source.title && source.note && source.checkedAt, q.id);
      assert.equal(new URL(source.url).protocol, 'https:');
      assert.ok(allowedHosts.has(new URL(source.url).hostname), q.id + ': use primary government sources');
    }
  }
});

test('central fixed sets each cover all eight statutes with 100 distinct questions', () => {
  const model = core.build(central), sets = core.fixedSets(model);
  assert.equal(sets.length, 2);
  assert.equal(new Set(sets.flat()).size, 200);
  for (const ids of sets) {
    assert.equal(ids.length, 100);
    assert.equal(new Set(ids.map(id => model.byId.get(id).chapterId)).size, 8);
  }
  assert.deepEqual(central, buildCentral(), 'rebuild central.json after reviewing its fragments');
});

test('every agency and the central bank have accurate counts and the same two primary routes', () => {
  const entries = catalog.filter(entry => entry.chapterBank);
  assert.equal(entries.length, 10);
  for (const entry of entries) {
    const bank = JSON.parse(read('question-banks/' + entry.chapterBank + '.json'));
    assert.equal(entry.total, bank.questions.length, entry.id);
    assert.equal(entry.directoryFile, 'question-bank.html?agency=' + entry.chapterBank);
    assert.ok(entry.resources.some(r => r.primary && r.file === entry.directoryFile && r.hash === 'chapters'));
    assert.ok(entry.resources.some(r => r.featuredMixed && r.file === entry.directoryFile && r.hash === 'mixed'));
  }
  assert.ok(!catalog.some(entry => entry.id === 'exam-14'));
  assert.doesNotMatch(read('exam-14.html'), /src=["']exam-14(?:-data|-core)?\.js/);
});

test('the original energy URL opens the new bank while legacy session links stay usable', () => {
  for (const hash of ['', '#resume', '#dashboard', '#topicButtons']) {
    let destination;
    vm.runInNewContext(read('energy-entry.js'), {window:{location:{hash,replace:url => { destination = url; }}}});
    assert.equal(destination, hash ? undefined : 'question-bank.html?agency=energy#chapters');
  }
  assert.match(read('energy-sprint.html'), /src="energy-entry\.js\?v=/);
});
