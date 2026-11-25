'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {
  AGENCIES, buildBanks, loadLegacy, loadScripts, plainText, normalizeText, normalizeChoice
} = require('../scripts/build-chapter-banks.cjs');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const banks = new Map(AGENCIES.map(([id]) => [id, JSON.parse(read('question-banks/' + id + '.json'))]));
const manifest = JSON.parse(read('question-banks/manifest.json'));
const course = loadScripts(['exam-14-data.js', 'exam-14-rd.js', 'exam-14-energy.js']).EXAM14;
const dedicatedFiles = {
  coj:['coj-quiz-data', 'coj-extra', 'coj-hard', 'coj-topics'],
  energy:['energy-sprint-data', 'energy-sprint-1', 'energy-sprint-2', 'energy-sprint-3', 'energy-sprint-4', 'energy-sprint-b', 'energy-sprint-focus', 'role-research'],
  rd:['rd-sprint-data', 'rd-sprint-1', 'rd-sprint-2', 'rd-sprint-3', 'rd-sprint-4', 'rd-sprint-b', 'role-research'],
  dmh:['dmh-syllabus-data'], drr:['drr-syllabus-data'],
  sao:['sao-sprint-data'],
  opsmoac:['opsmoac-sprint-data', 'opsmoac-sprint-extra', 'opsmoac-sprint-a1', 'opsmoac-sprint-a2', 'opsmoac-sprint-b1', 'opsmoac-sprint-b2', 'opsmoac-sprint-300']
};
function originalQuestions(id) {
  const old = loadLegacy(id);
  const rows = [...old.topics, ...old.book].flatMap(topic => topic.q || []);
  if (dedicatedFiles[id]) {
    const data = loadScripts(dedicatedFiles[id].map(file => file + '.js'));
    rows.push(...Object.values(data).find(value => value && Array.isArray(value.questions)).questions);
  }
  if (['rd', 'dmh', 'drr', 'opsmoac', 'namban'].includes(id)) rows.push(...JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root, 'practice500', id + '.json.gz')))));
  if (id === 'energy') for (const set of ['a','b','c','d','e']) rows.push(...JSON.parse(read('energy-intensive-set-' + set + '.json')).questions);
  if (course.lessons[id]) for (const lesson of course.lessons[id]) rows.push(...lesson.drill.map(([q,c,e]) => ({q,c,a:0,e})));
  if (id === 'coj') {
    for (const [, field] of read('coj.html').matchAll(/<fieldset\b[^>]*>([\s\S]*?)<\/fieldset>/gi)) {
      const q = /<legend[^>]*>([\s\S]*?)<\/legend>/i.exec(field);
      const answer = /<p\b[^>]*data-answer=["'](\d)["'][^>]*>([\s\S]*?)<\/p>/i.exec(field);
      const c = [...field.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/gi)].map(match => plainText(match[1]));
      rows.push({q:plainText(q[1]).replace(/^\d+\.\s*/, ''), c, a:Number(answer[1]), e:plainText(answer[2])});
    }
  }
  return rows;
}

test('all nine agencies have a complete, internally linked bank with over 100 distinct valid questions', () => {
  assert.equal(banks.size, 9);
  const globalIds = new Set();
  for (const [id, bank] of banks) {
    assert.equal(bank.schemaVersion, 1);
    assert.equal(bank.id, id);
    assert.ok(bank.questions.length > 100, id);
    const chapters = new Set(bank.chapters.map(chapter => chapter.id));
    const sources = new Set(bank.sources.map(source => source.id));
    const stems = new Set();
    assert.equal(chapters.size, bank.chapters.length, id + ': duplicate chapters');
    for (const chapter of bank.chapters) {
      assert.ok(chapter.title && (chapter.sections.length || chapter.lessons.length), chapter.id);
      assert.ok(chapter.legacyUrl, chapter.id + ': missing original reading route');
      for (const section of chapter.sections) {
        assert.ok(section.heading && section.text);
        assert.doesNotMatch(section.text, /<\/?(?:script|style|p|div|table|b|strong|a)\b/i);
      }
      for (const key of chapter.sourceIds) assert.ok(sources.has(key), chapter.id + ': missing source ' + key);
      for (const lesson of chapter.lessons) {
        assert.ok(lesson.id && lesson.title && lesson.blocks.length);
        for (const key of lesson.sourceIds) assert.ok(sources.has(key));
      }
    }
    for (const q of bank.questions) {
      assert.ok(!globalIds.has(q.id), q.id);
      globalIds.add(q.id);
      assert.ok(chapters.has(q.chapterId), q.id);
      assert.equal(q.c.length, 4, q.id);
      assert.equal(new Set(q.c.map(normalizeChoice)).size, 4, q.id);
      assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < 4, q.id);
      assert.ok(q.q && q.e && q.reference, q.id);
      assert.equal(q.sourceStatus, 'existing', q.id);
      assert.ok(q.sourceIds.length && q.sourceIds.every(key => sources.has(key)), q.id);
      if (q.choiceReasons) assert.ok(q.choiceReasons.length === 4 && q.choiceReasons.every(Boolean), q.id);
      assert.ok(q.legacyIds.length, q.id + ': lost original identity');
      const stem = normalizeText(q.q);
      assert.ok(!stems.has(stem), q.id + ': duplicate question text');
      stems.add(stem);
    }
    for (const source of bank.sources) {
      assert.ok(source.title && /^(https?:\/\/|[a-z0-9].*\.html)/i.test(source.url), source.id);
    }
  }
});

test('all original agency questions are retained, deduplicated, or explicitly quarantined; none are borrowed across new agency banks', () => {
  for (const [id, bank] of banks) {
    const input = originalQuestions(id);
    const inputStems = new Set(input.map(question => normalizeText(question.q)));
    const summary = manifest.banks.find(entry => entry.id === id);
    const available = new Set(bank.questions.map(q => normalizeText(q.q)));
    const quarantined = new Set(summary.quarantinedQuestions.map(q => normalizeText(q.q)));
    const malformed = new Set(summary.invalidQuestions.map(q => normalizeText(q.q)));
    for (const stem of inputStems) assert.ok(available.has(stem) || quarantined.has(stem) || malformed.has(stem), id + ': silently lost original question');
    for (const stem of available) assert.ok(inputStems.has(stem), id + ': newly introduced or foreign question');
    assert.equal(summary.inputQuestions, input.length, id + ': input extraction incomplete');
    assert.equal(summary.inputQuestions - summary.invalidQuestions.length - summary.duplicateQuestions - summary.quarantinedQuestions.length, bank.questions.length, id);
  }
  assert.equal(loadLegacy('diprom').topics.reduce((total, topic) => total + topic.q.length, 0), 629, 'Diprom EXTRA assignments and concat additions must be included');
});

test('28 former course lessons retain every substantive field, writing guidance, original key, and original drill', () => {
  for (const id of ['rd', 'energy']) {
    const bank = banks.get(id);
    const imported = bank.chapters.flatMap(chapter => chapter.lessons).filter(lesson => lesson.id.startsWith(id + '-course-'));
    assert.equal(imported.length, 14);
    course.lessons[id].forEach((original, index) => {
      const lesson = imported.find(lesson => lesson.legacyId === id + '-' + (index + 1));
      assert.ok(lesson, id + ': old read/writing key must stay discoverable');
      assert.equal(lesson.lead, plainText(original.lead));
      assert.deepEqual(lesson.blocks, original.blocks.map(pair => pair.map(plainText)));
      assert.deepEqual(lesson.table, {heads:original.table.heads.map(plainText), rows:original.table.rows.map(row => row.map(plainText))});
      assert.deepEqual(lesson.example, original.example.map(plainText));
      assert.deepEqual(lesson.traps, original.traps.map(plainText));
      assert.deepEqual(lesson.recall, original.recall.map(pair => pair.map(plainText)));
      assert.equal(lesson.writing.prompt, plainText(original.example[0]));
      assert.ok(lesson.writing.modelAnswer.includes(plainText(original.example[1])));
      assert.equal(lesson.writing.rubric.length, 5);
      assert.ok(lesson.sourceIds.length);
      original.drill.forEach(([stem, choices, explanation], exercise) => {
        const oldId = 'e14-' + id + '-' + (index + 1) + '-' + (exercise + 1);
        const question = bank.questions.find(q => q.legacyIds.includes(oldId));
        assert.ok(question, oldId);
        assert.equal(normalizeText(question.q), normalizeText(stem));
        assert.equal(normalizeText(question.c[question.a]), normalizeText(choices[0]));
        assert.ok(question.e.includes(plainText(explanation)));
      });
    });
    assert.equal(manifest.banks.find(entry => entry.id === id).importedCourseQuestions, 28);
    assert.ok(bank.chapters.every(chapter => !/วันที่\s*\d+|14 วัน/.test(chapter.title)), 'Chapter organization must not reinstate a day schedule');
  }
});

test('legacy lesson paragraphs, memory boxes, and source links survive migration as plain text', () => {
  for (const [id, bank] of banks) {
    const legacy = loadLegacy(id);
    const sections = bank.chapters.flatMap(chapter => chapter.sections);
    for (const topic of legacy.topics) for (const content of topic.content || []) {
      const expected = (content.points || []).map(plainText).filter(Boolean);
      const match = sections.find(section => section.heading === plainText(content.h || topic.title) && expected.every(point => section.text.includes(point)));
      assert.ok(match, id + ': missing paragraph block ' + content.h);
      if (content.kbox) assert.ok(match.text.includes(plainText(content.kbox)));
    }
    for (const source of legacy.sources) {
      for (const url of [source.url, source.full].filter(Boolean)) assert.ok(bank.sources.some(entry => entry.url === url), id + ': missing source ' + url);
    }
  }
});

test('conflicting original answers and malformed choices cannot enter the new quiz', () => {
  const totalQuarantined = manifest.banks.reduce((sum, bank) => sum + bank.quarantinedQuestions.length, 0);
  assert.ok(totalQuarantined > 0, 'Existing conflicts must be visible for review');
  for (const summary of manifest.banks) {
    const bank = banks.get(summary.id);
    const stems = new Set(bank.questions.map(question => normalizeText(question.q)));
    for (const item of summary.quarantinedQuestions) {
      assert.ok(!stems.has(normalizeText(item.q)), item.id);
      assert.ok(new Set(item.variants.map(variant => normalizeChoice(variant.c[variant.a]))).size > 1, item.id);
      assert.ok(item.variants.every(variant => variant.e && variant.reference && variant.legacyIds.length), item.id);
    }
    for (const item of summary.invalidQuestions) assert.ok(item.reason && item.q && item.id);
    for (const candidate of summary.nearDuplicateCandidates) assert.ok(candidate.ids.every(id => bank.questions.some(question => question.id === id)));
  }
});

test('HTML conversion preserves paragraphs, entities, tables, and mathematical comparison text without active markup', () => {
  assert.equal(plainText('<p>กฎหมาย <b>และ</b> ตัวอย่าง &amp; A</p><p>2 &lt; 3<br>10 × 2</p>'), 'กฎหมาย และ ตัวอย่าง & A\n2 < 3\n10 × 2');
  assert.equal(plainText('<script>alert(1)</script><style>p{color:red}</style><p>อ่านต่อ</p>'), 'อ่านต่อ');
  assert.equal(plainText('<table><tr><td>หัวข้อ</td><td>คำตอบ</td></tr></table>'), 'หัวข้อ | คำตอบ |');
  assert.notEqual(normalizeText('2 + 3 = เท่าไร'), normalizeText('2 - 3 = เท่าไร'));
  assert.notEqual(normalizeChoice('my name is nok'), normalizeChoice('My name is Nok.'));
});

test('rebuilding is deterministic and does not rewrite any original source', () => {
  const inputs = [
    ...AGENCIES.filter(([id]) => id !== 'drr').map(([id]) => id + '.html'),
    ...Object.values(dedicatedFiles).flat().map(file => file + '.js'),
    'exam-14-data.js', 'exam-14-rd.js', 'exam-14-energy.js', 'exam-14.js'
  ];
  const digest = () => crypto.createHash('sha256').update(inputs.map(file => read(file)).join('\n')).digest('hex');
  const before = digest();
  const rebuilt = buildBanks();
  assert.equal(digest(), before);
  for (const bank of rebuilt.banks) assert.equal(JSON.stringify(bank) + '\n', read('question-banks/' + bank.id + '.json'), bank.id);
  assert.equal(JSON.stringify(rebuilt.manifest, null, 2) + '\n', read('question-banks/manifest.json'));
});
