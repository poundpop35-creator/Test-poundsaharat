'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../bank-core.js');
const root = path.resolve(__dirname, '..');
const clone = value => JSON.parse(JSON.stringify(value));
function fixture() {
  return {
    schemaVersion:1, id:'fixture', title:'Fixture',
    chapters:['one','two','three'].map(id => ({id, title:id, sections:[], lessons:[], sourceIds:['src']})),
    sources:[{id:'src', title:'Source', url:'https://example.com/original'}],
    questions:Array.from({length:240}, (_, i) => ({
      id:'q' + i, chapterId:i < 150 ? 'one' : i < 220 ? 'two' : 'three',
      q:'Question ' + i, c:i === 1 ? ['A','B','C','ถูกทุกข้อ'] : ['A','B','C','D'],
      a:i % 4, e:'Explanation ' + i, sourceIds:['src'], sourceStatus:'existing',
      ...(i === 0 ? {fixedChoiceOrder:true} : {})
    }))
  };
}
const model = C.build(fixture());

test('mixed practice covers every populated chapter without repetition and leaves the bank unchanged', () => {
  const before = JSON.stringify(model.bank);
  const ids = C.mixed(model, 100, C.seeded('coverage'));
  assert.equal(ids.length, 100);
  assert.equal(new Set(ids).size, 100);
  assert.ok(ids.every(id => model.byId.has(id)));
  assert.deepEqual([...new Set(ids.map(id => model.byId.get(id).chapterId))].sort(), ['one','three','two']);
  assert.equal(JSON.stringify(model.bank), before);
  for (const size of [0, -1, 241, 1.5]) assert.throws(() => C.mixed(model, size));
});

test('fixed sets are reproducible, disjoint groups of 100 and cover all available chapters in all nine real banks', () => {
  for (const id of ['coj','energy','rd','dmh','drr','sao','opsmoac','diprom','namban']) {
    const bank = JSON.parse(fs.readFileSync(path.join(root, 'question-banks', id + '.json'), 'utf8'));
    const model = C.build(bank), before = JSON.stringify(bank);
    const sets = C.fixedSets(model);
    assert.deepEqual(C.fixedSets(model), sets, id + ': fixed sets must be stable');
    assert.equal(sets.length, Math.floor(bank.questions.length / 100), id);
    assert.equal(new Set(sets.flat()).size, sets.length * 100, id + ': sets must not overlap');
    for (const ids of sets) {
      assert.equal(ids.length, 100);
      assert.ok(ids.every(questionId => model.byId.has(questionId)));
      const chapters = new Set(ids.map(questionId => model.byId.get(questionId).chapterId));
      for (const chapter of bank.chapters) {
        const count = bank.questions.filter(q => q.chapterId === chapter.id).length;
        if (count >= sets.length) assert.ok(chapters.has(chapter.id), id + ': missing chapter ' + chapter.id);
      }
    }
    assert.equal(JSON.stringify(bank), before);
  }
});

test('bank validation rejects duplicate identities, duplicate choices, and unresolved references', () => {
  for (const mutate of [
    bank => { bank.questions[1].id = bank.questions[0].id; },
    bank => { bank.chapters[1].id = bank.chapters[0].id; },
    bank => { bank.questions[0].c = ['same','same','third','fourth']; },
    bank => { bank.questions[0].c = ['only','three','choices']; },
    bank => { bank.questions[0].sourceIds = ['missing']; },
    bank => { bank.questions[0].chapterId = 'missing'; }
  ]) {
    const bank = fixture(); mutate(bank);
    assert.throws(() => C.build(bank));
  }
  const grammar = fixture();
  grammar.questions[2].c = ['my name is nok', 'My name is Nok.', 'MY NAME IS NOK', 'my name is Nok'];
  assert.doesNotThrow(() => C.build(grammar), 'Capitalization and punctuation may distinguish valid answers');
});

test('sessions preserve authored choice order where required and reject corrupt order metadata', () => {
  const session = C.createSession(model, ['q0','q1','q2'], 'practice', 'Review', C.seeded('session'), 1000);
  assert.equal(C.valid(session, model), true);
  assert.deepEqual(session.orders.q0, [0,1,2,3], 'Explicit fixed ordering');
  assert.deepEqual(session.orders.q1, [0,1,2,3], 'All-of-the-above ordering');
  assert.equal(new Set(session.orders.q2).size, 4);
  for (const mutate of [
    s => { s.orders.q2 = [0,1,2,'3']; },
    s => { s.orders.q2 = [0,1,2,2]; },
    s => { s.orders.q0 = [1,0,2,3]; },
    s => { s.orders.q1 = [3,0,1,2]; },
    s => { s.ids = ['q0','q0']; },
    s => { s.bankId = 'other-bank'; },
    s => { s.idx = -1; },
    s => { s.idx = s.ids.length; },
    s => { s.answers.unknown = 0; },
    s => { s.answers.q0 = 4; },
    s => { s.complete = true; }
  ]) {
    const corrupted = clone(session); mutate(corrupted);
    assert.equal(C.valid(corrupted, model), false, JSON.stringify(corrupted));
  }
  assert.throws(() => C.createSession(model, ['q0','q0'], 'practice', 'Duplicate'));
  assert.throws(() => C.createSession(model, ['missing'], 'practice', 'Missing'));
});

test('practice locks answered choices, exam permits correction, and unanswered questions cannot be skipped', () => {
  let session = C.createSession(model, ['q2','q3'], 'practice', 'Practice', C.seeded('practice'), 1000);
  assert.equal(C.advance(session, 1001), session);
  const first = session.ids[0];
  session = C.answer(session, 0, 1002);
  assert.equal(session.answers[first], 0);
  assert.equal(C.answer(session, 1, 1003), session, 'Practice feedback must lock the first answer');
  assert.equal(C.answer(session, -1), session);
  assert.equal(C.answer(session, 4), session);
  session = C.advance(session, 1004);
  assert.equal(session.idx, 1);
  assert.equal(session.complete, false);
  session = C.advance(C.answer(session, 1, 1005), 1006);
  assert.equal(session.complete, true);
  assert.equal(session.endedAt, 1006);
  assert.equal(C.answer(session, 2), session);
  assert.equal(C.advance(session), session);
  let exam = C.createSession(model, ['q2','q3'], 'exam', 'Exam', C.seeded('exam'), 1000);
  const questionId = exam.ids[0];
  exam = C.answer(C.answer(exam, 0), 3);
  assert.equal(exam.answers[questionId], 3);
});

test('exam completion returns to missing answers and scoring uses original choice indices', () => {
  let session = C.createSession(model, ['q2','q3','q4'], 'exam', 'Exam', C.seeded('score'), 1000);
  session.idx = session.ids.length - 1;
  session = C.answer(session, model.byId.get(session.ids[session.idx]).a, 1010);
  session = C.advance(session, 1011);
  assert.equal(session.idx, 0);
  assert.equal(session.complete, false);
  const wrongId = session.ids[0];
  while (!session.complete) {
    const id = session.ids[session.idx], question = model.byId.get(id);
    if (session.answers[id] === undefined) {
      const originalIndex = id === wrongId ? (question.a + 1) % 4 : question.a;
      // The UI stores the original option index, not its shuffled display position.
      session = C.answer(session, session.orders[id][session.orders[id].indexOf(originalIndex)], 1020);
    }
    session = C.advance(session, 1021);
  }
  assert.equal(C.valid(session, model), true);
  const score = C.score(session, model);
  assert.equal(score.correct, 2);
  assert.equal(score.total, 3);
  assert.deepEqual(score.wrong, [wrongId]);
  assert.equal(Object.values(score.topics).reduce((total, chapter) => total + chapter.total, 0), 3);
});

test('cleaning protects valid progress while dropping corrupt sessions and finish records each result once', () => {
  let session = C.createSession(model, ['q2','q3'], 'practice', 'Finished practice', C.seeded('finish'), 1000);
  while (!session.complete) {
    session = C.answer(session, model.byId.get(session.ids[session.idx]).a, 1001);
    session = C.advance(session, 1002);
  }
  let state = C.finish({...C.blank(), session, read:['one'], writing:{draft:'keep me'}}, model);
  assert.equal(state.history.length, 1);
  assert.equal(state.history[0].correct, 2);
  assert.equal(C.finish(state, model), state);
  assert.deepEqual(C.clean(clone(state), model), state);
  const bad = clone(state); bad.session.idx = -1; bad.read.push('missing');
  const clean = C.clean(bad, model);
  assert.equal(clean.session, null);
  assert.deepEqual(clean.read, ['one']);
  assert.equal(clean.writing.draft, 'keep me');
  assert.equal(clean.history.length, 1);
});

test('former course writing and notes import by original lesson key without overwriting newer drafts', () => {
  for (const id of ['rd','energy']) {
    const bank = JSON.parse(fs.readFileSync(path.join(root, 'question-banks', id + '.json'), 'utf8'));
    const model = C.build(bank);
    const lessons = bank.chapters.flatMap(chapter => chapter.lessons).filter(lesson => lesson.legacyId);
    const legacy = {writing:{}, notes:{}};
    for (const lesson of lessons) {
      legacy.writing[lesson.legacyId] = 'Original ' + lesson.legacyId;
      legacy.notes[lesson.legacyId.split('-').pop()] = 'Original note';
    }
    const first = lessons[0], nextDraft = 'Newer draft';
    const state = {...C.blank(), writing:{[first.id]:nextDraft}, notes:{[first.id]:''}};
    const beforeLegacy = JSON.stringify(legacy), beforeState = JSON.stringify(state);
    const imported = C.importLegacyWriting(state, legacy, model);
    assert.equal(imported.writing[first.id], nextDraft);
    assert.equal(imported.notes[first.id], '', 'An explicitly emptied new note should stay empty');
    for (const lesson of lessons.slice(1)) {
      assert.equal(imported.writing[lesson.id], legacy.writing[lesson.legacyId]);
      assert.equal(imported.notes[lesson.id], 'Original note');
    }
    assert.equal(JSON.stringify(legacy), beforeLegacy);
    assert.equal(JSON.stringify(state), beforeState);
  }
});

test('two fixed sets distribute two equally sized chapters evenly without periodic aliasing', () => {
  const bank = fixture();
  bank.chapters = bank.chapters.slice(0, 2);
  bank.questions = bank.questions.slice(0, 200).map((q, i) => ({...q, chapterId:i < 100 ? 'one' : 'two'}));
  const twoChapterModel = C.build(bank), sets = C.fixedSets(twoChapterModel);
  assert.equal(sets.length, 2);
  assert.equal(new Set(sets.flat()).size, 200);
  for (const ids of sets) {
    assert.equal(ids.length, 100);
    assert.equal(ids.filter(id => twoChapterModel.byId.get(id).chapterId === 'one').length, 50);
    assert.equal(ids.filter(id => twoChapterModel.byId.get(id).chapterId === 'two').length, 50);
  }
});
