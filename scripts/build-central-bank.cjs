'use strict';
const fs = require('node:fs');
const path = require('node:path');
const core = require('../bank-core.js');
const root = path.resolve(__dirname, '..');

function buildCentral() {
  const fragments = ['central-public-law', 'central-fiscal-law'].map(id =>
    JSON.parse(fs.readFileSync(path.join(root, 'question-banks', id + '.json'), 'utf8')));
  const bank = {
    schemaVersion:1,
    id:'central',
    title:'ข้อสอบคลังกลาง',
    subtitle:'กฎหมายที่ใช้ร่วมกัน 8 บท พร้อมเฉลย มาตราอ้างอิง และตัวบทต้นฉบับ',
    checkedAt:'2026-11-25',
    chapters:fragments.flatMap(fragment => fragment.chapters),
    questions:fragments.flatMap(fragment => fragment.questions),
    sources:fragments.flatMap(fragment => fragment.sources)
  };
  core.build(bank);
  if (bank.questions.length !== 200 || bank.chapters.length !== 8) throw Error('Expected 200 questions across eight statutes');
  for (const q of bank.questions) {
    if (q.sourceStatus !== 'checked' || !q.reference || !q.sourceIds?.length) throw Error('Missing reviewed reference: ' + q.id);
  }
  return bank;
}

module.exports = {buildCentral};
if (require.main === module) {
  const bank = buildCentral();
  fs.writeFileSync(path.join(root, 'question-banks/central.json'), JSON.stringify(bank) + '\n');
  console.log('central: ' + bank.chapters.length + ' chapters, ' + bank.questions.length + ' questions');
}
