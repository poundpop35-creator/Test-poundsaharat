'use strict';
/*
 * Rebuild with: node scripts/build-chapter-banks.cjs
 * This is a content migration, not a fresh legal/factual verification.
 * Original inputs and browser storage keys are never changed.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const hash = value => crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
const unique = values => [...new Set(values.filter(Boolean))];
const AGENCIES = [
  ['coj', 'สำนักงานศาลยุติธรรม', 'นักวิชาการพัสดุปฏิบัติการ'],
  ['energy', 'สำนักงานปลัดกระทรวงพลังงาน', 'นักวิชาการพลังงานปฏิบัติการ'],
  ['rd', 'กรมสรรพากร', 'นักวิชาการพัสดุปฏิบัติการ'],
  ['dmh', 'กรมสุขภาพจิต', 'นักวิเคราะห์นโยบายและแผนปฏิบัติการ'],
  ['drr', 'กรมทางหลวงชนบท', 'นักจัดการงานทั่วไปปฏิบัติการ'],
  ['sao', 'สำนักงานการตรวจเงินแผ่นดิน', 'นักวิเคราะห์นโยบายและแผน'],
  ['opsmoac', 'สำนักงานปลัดกระทรวงเกษตรและสหกรณ์', 'นักวิเคราะห์นโยบายและแผน'],
  ['diprom', 'กรมส่งเสริมอุตสาหกรรม', 'บทเรียนและข้อสอบตามหัวข้อเดิม'],
  ['namban', 'กรมทรัพยากรน้ำบาดาล', 'นักวิเคราะห์นโยบายและแผน']
];
const DEDICATED = {
  coj: {key:'ROLE_SYLLABUS', files:['coj-quiz-data', 'coj-extra', 'coj-hard', 'coj-topics']},
  energy: {key:'ROLE_SPRINT', files:['energy-sprint-data', 'energy-sprint-1', 'energy-sprint-2', 'energy-sprint-3', 'energy-sprint-4', 'energy-sprint-b', 'energy-sprint-focus', 'role-research']},
  rd: {key:'ROLE_SPRINT', files:['rd-sprint-data', 'rd-sprint-1', 'rd-sprint-2', 'rd-sprint-3', 'rd-sprint-4', 'rd-sprint-b', 'role-research']},
  dmh: {key:'ROLE_SYLLABUS', files:['dmh-syllabus-data']},
  drr: {key:'ROLE_SYLLABUS', files:['drr-syllabus-data']},
  sao: {key:'SAO_SPRINT', files:['sao-sprint-data']},
  opsmoac: {key:'OPS_SPRINT', files:['opsmoac-sprint-data', 'opsmoac-sprint-extra', 'opsmoac-sprint-a1', 'opsmoac-sprint-a2', 'opsmoac-sprint-b1', 'opsmoac-sprint-b2', 'opsmoac-sprint-300']}
};
const PRACTICE500 = ['rd', 'dmh', 'drr', 'opsmoac', 'namban'];
const ENTITIES = {amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' ', ndash:'–', mdash:'—', hellip:'…', bull:'•', middot:'·', times:'×', divide:'÷', le:'≤', ge:'≥', rarr:'→', larr:'←', deg:'°', copy:'©', reg:'®', thinsp:' '};

function decodeEntities(value) {
  return String(value).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, key) => {
    if (key[0] !== '#') return ENTITIES[key.toLowerCase()] ?? whole;
    const code = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
    return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
  });
}
function plainText(value) {
  return decodeEntities(String(value ?? '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\b[^>]*>/gi, '\n')
    .replace(/<\/(?:p|div|section|article|h[1-6]|ul|ol|li|tr|table)\s*>/gi, '\n')
    .replace(/<\/(?:td|th)\s*>/gi, ' | ')
    .replace(/<li\b[^>]*>/gi, '• ')
    .replace(/<\/?[a-z][^>]*>/gi, ''))
    .replace(/\r/g, '').replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
function normalizeText(value) {
  // Keep mathematical operators, decimal separators, and numbers meaningful.
  return plainText(value).normalize('NFKC').toLowerCase()
    .replace(/[\s\u200b“”‘’"'?？ฯ:：。]/gu, '');
}
function normalizeChoice(value) {
  // Capitalization and punctuation can be the subject of an English question.
  return plainText(value).normalize('NFKC').replace(/\s+/g, ' ').trim();
}
function nearDuplicateCandidates(questions) {
  const prepared = questions.map(question => {
    const text = normalizeText(question.q), grams = new Set();
    for (let i = 0; i < text.length - 2; i++) grams.add(text.slice(i, i + 3));
    return {question, text, grams, numbers:(text.match(/\d+(?:[.,]\d+)*/g) || []).join('|')};
  });
  const candidates = [];
  for (let i = 0; i < prepared.length; i++) for (let j = i + 1; j < prepared.length; j++) {
    const a = prepared[i], b = prepared[j];
    if (a.numbers !== b.numbers || Math.min(a.text.length, b.text.length) / Math.max(a.text.length, b.text.length) < 0.9) continue;
    let overlap = 0;
    for (const gram of a.grams) if (b.grams.has(gram)) overlap++;
    const similarity = overlap / (a.grams.size + b.grams.size - overlap);
    if (similarity >= 0.94) candidates.push({ids:[a.question.id, b.question.id], similarity:Number(similarity.toFixed(3))});
  }
  return candidates;
}
function extractLiteral(source, name, fallback = []) {
  const marker = new RegExp('\\b(?:const|var|let)\\s+' + name + '\\s*=\\s*([\\[{])').exec(source);
  if (!marker) return fallback;
  const start = marker.index + marker[0].lastIndexOf(marker[1]);
  const stack = [];
  let quote = null, escaped = false, comment = null;
  for (let i = start; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (comment === '//') { if (ch === '\n') comment = null; continue; }
    if (comment === '/*') { if (ch === '*' && next === '/') { comment = null; i++; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '/' && (next === '/' || next === '*')) { comment = ch + next; i++; continue; }
    if (ch === "'" || ch === '"' || ch.charCodeAt(0) === 96) { quote = ch; continue; }
    if (ch === '[' || ch === '{') stack.push(ch);
    else if (ch === ']' || ch === '}') {
      stack.pop();
      if (!stack.length) return JSON.parse(JSON.stringify(vm.runInNewContext('(' + source.slice(start, i + 1) + ')', {}, {timeout:5000})));
    }
  }
  throw new Error('Unclosed literal: ' + name);
}
function loadScripts(files) {
  const context = {window:{}};
  vm.createContext(context);
  for (const file of files) vm.runInContext(read(file), context, {filename:file, timeout:5000});
  return JSON.parse(JSON.stringify(context.window));
}
function loadLegacy(id) {
  const file = id + '.html';
  if (!fs.existsSync(path.join(ROOT, file))) return {topics:[], book:[], laws:[], sources:[]};
  const html = read(file);
  const topics = extractLiteral(html, 'TOPICS');
  let extra = extractLiteral(html, 'EXTRA', {});
  const extraStart = html.search(/\b(?:var|const|let)\s+EXTRA\s*=/);
  const extraEnd = html.indexOf('/* merge extra questions into topics */', extraStart);
  if (extraStart >= 0 && extraEnd > extraStart) {
    // Diprom fills EXTRA through separate indexed assignments and concat calls.
    extra = vm.runInNewContext(html.slice(extraStart, extraEnd) + ';EXTRA', {}, {timeout:5000});
  }
  for (const topic of topics) if (extra[topic.id]) topic.q = [...topic.q, ...extra[topic.id]];
  return {topics, book:extractLiteral(html, 'BOOK_TOPICS'), laws:extractLiteral(html, 'LAWS'), sources:extractLiteral(html, 'SOURCES')};
}
function linksIn(html) {
  return [...String(html).matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(match => ({url:decodeEntities(match[1]), title:plainText(match[2]) || 'เอกสารประกอบจากคลังเดิม'}));
}
function htmlSections(html) {
  const parts = String(html).split(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi);
  const result = [];
  if (plainText(parts[0])) result.push({heading:'บทอ่านประกอบ', text:plainText(parts[0])});
  for (let i = 1; i < parts.length; i += 2) {
    const heading = plainText(parts[i]), text = plainText(parts[i + 1] || '');
    if (text) result.push({heading, text});
  }
  return result;
}

function buildBank(definition, course) {
  const [id, title, subtitle] = definition;
  const legacy = loadLegacy(id);
  const descriptor = DEDICATED[id];
  const dedicated = descriptor ? loadScripts(descriptor.files.map(file => file + '.js'))[descriptor.key] : null;
  const chapters = [], chapterAliases = new Map(), sourceMap = new Map(), questionMap = new Map(), variantsByStem = new Map();
  const metrics = {inputQuestions:0, invalidQuestions:[], duplicateQuestions:0, quarantinedQuestions:[], nearDuplicateCandidates:[], importedCourseLessons:0, importedCourseQuestions:0};
  const bank = {schemaVersion:1, id, title, subtitle, chapters, questions:[], sources:[]};
  const fallbackUrl = id === 'drr' ? 'drr-syllabus.html' : id + '.html';
  function addSource(raw) {
    if (!raw || !raw.url) return null;
    const url = decodeEntities(String(raw.url)).trim();
    if (!/^(?:https?:\/\/|[a-z0-9][a-z0-9/_-]*\.html(?:[?#].*)?$)/i.test(url)) return null;
    const sourceId = id + '-src-' + hash(url);
    const next = {id:sourceId, title:plainText(raw.title || raw.t || 'แหล่งอ่านจากคลังเดิม'), url};
    const note = plainText(raw.note || raw.n || '');
    if (note) next.note = note;
    if (raw.checkedAt) next.checkedAt = String(raw.checkedAt);
    const old = sourceMap.get(sourceId);
    if (old) {
      if (next.title.length > old.title.length) old.title = next.title;
      if (next.note && !old.note?.includes(next.note)) old.note = unique([old.note, next.note]).join('\n');
      if (!old.checkedAt && next.checkedAt) old.checkedAt = next.checkedAt;
    } else sourceMap.set(sourceId, next);
    return sourceId;
  }
  function importSources(rawSources) {
    const mapping = {};
    for (const [key, raw] of Object.entries(rawSources || {})) {
      const sourceId = addSource(raw);
      if (sourceId) mapping[key] = sourceId;
      if (raw.full) addSource({...raw, title:(raw.title || raw.t) + ' · ฉบับเต็ม', url:raw.full});
    }
    return mapping;
  }
  const legacySource = addSource({title:'บทเรียนและข้อสอบเดิม · ' + title, url:fallbackUrl, note:'แหล่งที่มาของเนื้อหาที่จัดหมวดใหม่ ไม่ใช่การตรวจรับรองกฎหมายหรือคำตอบรอบใหม่'});
  importSources(legacy.sources);
  const dedicatedSources = importSources(dedicated?.sources);
  function addChapter(key, chapterTitle) {
    const chapter = {id:id + '-ch-' + key, title:plainText(chapterTitle).replace(/^\d+\.\d+\s+/, ''), sections:[], lessons:[], sourceIds:[], legacyUrl:fallbackUrl};
    chapters.push(chapter);
    chapterAliases.set(normalizeText(chapterTitle), chapter);
    return chapter;
  }
  const baseTopics = ['sao', 'diprom', 'namban'].includes(id) ? legacy.topics.map(topic => topic.title) : dedicated.topics;
  const baseChapters = baseTopics.map((name, index) => addChapter(String(index + 1).padStart(2, '0'), name));
  const at = number => baseChapters[number - 1];
  const extras = {};
  if (id === 'dmh') {
    for (const [key, name] of Object.entries({plan13:'แผนพัฒนาเศรษฐกิจและสังคมแห่งชาติ ฉบับที่ 13', governance:'บริหารราชการแผ่นดินและการบริหารกิจการบ้านเมืองที่ดี', budget:'งบประมาณและวินัยการเงินการคลัง', information:'ข้อมูลข่าวสารราชการและข้อมูลส่วนบุคคล', current:'เศรษฐกิจ สังคม และเทคโนโลยี'})) extras[key] = addChapter(key, name);
  }
  if (id === 'rd') extras.integration = addChapter('integration', 'ประยุกต์งานพัสดุ ภาษี และการเงินร่วมกัน');
  if (id === 'sao') extras.common = addChapter('common', 'จัดซื้อจัดจ้างและข้อมูลข่าวสารราชการ');
  if (id === 'coj') extras.organization = addChapter('organization', 'วิสัยทัศน์ พันธกิจ และนโยบายศาลยุติธรรม');

  const legacyMaps = {rd:[3,4,1,2,5,6,8,7]};
  const bookMaps = {
    energy:[7,8,9,10,11,1,3,4,5,6],
    rd:[1,2,3,4,5,6,7,8,3,1,4,3,1,6],
    sao:[1,2,3,4,6,9,10,null,8],
    opsmoac:[4,2,3,1,5,1,2,3,4,5]
  };
  function mapLegacy(topic, book = false) {
    if (id === 'dmh') {
      if (book) return [at(7), extras.governance, extras.current][topic.id - 1];
      return [at(1), extras.plan13, extras.governance, extras.budget, at(7), extras.information][topic.id - 1];
    }
    if (id === 'sao' && book && topic.id === 8) return extras.common;
    const mapping = book ? bookMaps[id] : legacyMaps[id];
    return at(mapping ? mapping[topic.id - 1] : topic.id);
  }
  for (const [book, groups] of [[false, legacy.topics], [true, legacy.book]]) {
    for (const topic of groups) {
      const chapter = mapLegacy(topic, book);
      if (!chapter) throw new Error(id + ': no chapter for ' + topic.title);
      chapterAliases.set(normalizeText(topic.title), chapter);
    }
  }
  if (dedicated) dedicated.topics.forEach((name, index) => chapterAliases.set(normalizeText(name), at(index + 1)));
  function chapterForTitle(value) {
    const exact = chapterAliases.get(normalizeText(value));
    if (exact) return exact;
    const t = plainText(value);
    if (id === 'energy') {
      if (/ควบคุมน้ำมัน/.test(t)) return at(7);
      if (/การค้าน้ำมัน/.test(t)) return at(8);
      if (/ส่งเสริมการอนุรักษ์|พรบ.*อนุรักษ์/.test(t)) return at(9);
      if (/การประกอบกิจการ/.test(t)) return at(10);
      if (/กองทุนน้ำมัน/.test(t)) return at(11);
      if (/จริยธรรม/.test(t)) return at(3);
      if (/วิสัยทัศน์|หน่วยงาน|โครงสร้าง|พันธกิจ|นโยบายพลังงาน/.test(t)) return at(1);
      if (/แผน|โครงการ|ประเมิน|คืนทุน/.test(t)) return at(4);
      if (/ทดแทน|อนุรักษ์|ประสิทธิภาพ|Solar|SEC|แบตเตอรี่/.test(t)) return at(6);
      if (/เชื้อเพลิง|ก๊าซ|ไฟฟ้า|ตรวจสอบ|ทดสอบ/.test(t)) return at(5);
      return at(2);
    }
    if (id === 'rd') {
      if (/PDPA|ข้อมูลข่าวสาร|ข้อมูลส่วนบุคคล/.test(t)) return at(8);
      if (/ภาษี|รัษฎากร/.test(t) && !/รู้จักกรม|เกี่ยวกับกรม/.test(t)) return at(1);
      if (/รู้จักกรม|เกี่ยวกับกรม/.test(t)) return at(2);
      if (/จัดซื้อ|จัดจ้าง|พัสดุ|กรรมการ|สัญญา|วงเงิน/.test(t)) return at(3);
      if (/เบิก|จ่าย|ส่งคลัง|การเงิน/.test(t)) return at(4);
      if (/บริหารงบ|เปลี่ยนแปลงงบ/.test(t)) return at(6);
      if (/งบประมาณ/.test(t)) return at(5);
      return at(7);
    }
    if (id === 'opsmoac') {
      if (/กฎหมาย|ระเบียบ/.test(t)) return at(4);
      if (/โครงสร้าง|วิสัยทัศน์|ภารกิจ|หน้าที่/.test(t)) return at(1);
      if (/ยุทธศาสตร์|แผนแม่บท|แผนพัฒนา/.test(t)) return at(2);
      if (/นโยบายรัฐบาล|นโยบายรัฐมนตรี|เร่งด่วน|สถานการณ์|PM/.test(t)) return at(3);
      return at(5);
    }
    if (id === 'sao') {
      if (/จริยธรรม/.test(t)) return at(5);
      if (/วินัยการเงิน/.test(t)) return at(2);
      if (/งบประมาณ/.test(t)) return at(3);
      if (/บ้านเมือง|บริหารราชการ/.test(t)) return at(4);
      if (/ฉบับที่ 13|แผนพัฒนา/.test(t)) return at(7);
      if (/ยุทธศาสตร์|แม่บท/.test(t)) return at(6);
      if (/นโยบาย.*ตรวจเงิน/.test(t)) return at(8);
      if (/นโยบายสาธารณะ/.test(t)) return at(9);
      if (/ควบคุมภายใน|ความเสี่ยง|โครงการ|กลยุทธ์/.test(t)) return at(10);
      return at(1);
    }
    if (id === 'dmh') {
      if (/13/.test(t)) return extras.plan13;
      if (/งบ|การคลัง/.test(t)) return extras.budget;
      if (/PDPA|ข้อมูลข่าวสาร|ข้อมูลส่วนบุคคล/.test(t)) return extras.information;
      if (/บริหารราชการ|บ้านเมือง/.test(t)) return extras.governance;
      if (/ยุทธศาสตร์ชาติ|แผน 3 ระดับ/.test(t)) return at(1);
      return at(7);
    }
    // A deterministic title comparison is used only for unmatched supplementary notes.
    let best = baseChapters[0], bestScore = 0;
    const key = normalizeText(t);
    for (const chapter of chapters) {
      const text = normalizeText(chapter.title);
      let score = 0;
      for (let i = 0; i + 4 <= key.length; i++) if (text.includes(key.slice(i, i + 4))) score++;
      if (score > bestScore) { best = chapter; bestScore = score; }
    }
    return best;
  }
  function addSection(chapter, heading, text, sources = []) {
    const section = {heading:plainText(heading), text:plainText(text)};
    if (section.text && !chapter.sections.some(old => old.heading === section.heading && old.text === section.text)) chapter.sections.push(section);
    chapter.sourceIds = unique([...chapter.sourceIds, ...sources]);
  }
  function addLesson(chapter, lesson) {
    if (!chapter.lessons.some(old => old.id === lesson.id)) chapter.lessons.push(lesson);
    chapter.sourceIds = unique([...chapter.sourceIds, ...lesson.sourceIds]);
  }
  function addQuestion(raw, chapter, sourceIds, legacyId) {
    metrics.inputQuestions++;
    const q = plainText(raw.q), c = (raw.c || []).map(plainText), a = raw.a;
    const feedback = raw.choiceReasons || raw.feedback;
    const e = plainText(raw.e || (Array.isArray(feedback) ? feedback[a] : ''));
    const truncated = id === 'diprom' && ((q.length < 40 && /^พ\.(?!ศ\.|ร\.)/.test(c[0] || '')) || q === 'จำนวนกี่คน');
    const invalidReason = !q ? 'Missing question text' : c.length !== 4 ? 'Expected exactly four choices' : c.some(option => !option) ? 'Empty choice' : new Set(c.map(normalizeChoice)).size !== 4 ? 'Duplicate choices' : !Number.isInteger(a) || a < 0 || a > 3 ? 'Invalid answer index' : !e ? 'Missing explanation' : truncated ? 'Truncated question or question text spilled into the first choice' : null;
    if (invalidReason) {
      metrics.invalidQuestions.push({id:legacyId, q, c, a, reason:invalidReason});
      return;
    }
    const stem = normalizeText(q);
    const entry = {
      id:id + '-q-' + hash(stem), chapterId:chapter.id, q, c, a,
      e:e + (raw.trap ? '\nข้อควรระวัง: ' + plainText(raw.trap) : ''),
      reference:plainText(raw.reference || raw.ref || chapter.title),
      sourceIds:unique(sourceIds?.length ? sourceIds : [legacySource]),
      sourceStatus:'existing',
      legacyIds:unique([raw.id, legacyId])
    };
    if (Array.isArray(feedback) && feedback.length === 4 && feedback.every(item => plainText(item))) entry.choiceReasons = feedback.map(plainText);
    if (raw.fixedOrder || raw.fixedChoiceOrder || /(?:ข้อ|ตัวเลือก)\s*[กขคง](?:\.|\s|,|และ|กับ)|ทั้ง [กขคง] และ/.test([entry.e, ...c].join(' '))) entry.fixedChoiceOrder = true;
    if (!variantsByStem.has(stem)) variantsByStem.set(stem, []);
    variantsByStem.get(stem).push(JSON.parse(JSON.stringify(entry)));
    const old = questionMap.get(stem);
    if (!old) questionMap.set(stem, entry);
    else {
      metrics.duplicateQuestions++;
      const oldAnswer = normalizeChoice(old.c[old.a]), newAnswer = normalizeChoice(entry.c[entry.a]);
      const quality = item => (item.choiceReasons ? 10000 : 0) + Math.min(item.e.length, 4000) + 100 * item.sourceIds.filter(key => key !== legacySource).length;
      const chosen = quality(entry) > quality(old) ? entry : old;
      chosen.sourceIds = unique([...old.sourceIds, ...entry.sourceIds]);
      chosen.legacyIds = unique([...old.legacyIds, ...entry.legacyIds]);
      if (oldAnswer === newAnswer && !chosen.choiceReasons) {
        const richer = [old, entry].find(item => item.choiceReasons);
        if (richer && chosen.c.every(option => richer.c.some(other => normalizeChoice(option) === normalizeChoice(other)))) chosen.choiceReasons = chosen.c.map(option => richer.choiceReasons[richer.c.findIndex(other => normalizeChoice(option) === normalizeChoice(other))]);
      }
      questionMap.set(stem, chosen);
    }
  }

  for (const [book, groups] of [[false, legacy.topics], [true, legacy.book]]) {
    for (const topic of groups) {
      const chapter = mapLegacy(topic, book);
      for (const content of topic.content || []) {
        const text = [...(content.points || []), ...(content.kbox ? ['จุดทบทวน: ' + content.kbox] : [])].map(plainText).join('\n\n');
        addSection(chapter, content.h || topic.title, text, [legacySource]);
      }
      for (const [index, raw] of (topic.q || []).entries()) addQuestion(raw, chapter, [legacySource], id + '-legacy-' + (book ? 'book' : 'lesson') + '-' + topic.id + '-' + (index + 1));
    }
  }
  for (const memo of legacy.laws) {
    addSection(chapterForTitle(memo.h), memo.h, [...(memo.points || []), ...(memo.kbox ? [memo.kbox] : [])].map(plainText).join('\n\n'), [legacySource]);
  }
  if (dedicated) {
    const notes = dedicated.notes || (id === 'sao' ? extractLiteral(read('sao-sprint.js'), 'notes') : []);
    notes.forEach((items, index) => addSection(at(index + 1), 'ประเด็นทบทวน', items.map(plainText).join('\n\n')));
    for (const raw of dedicated.questions) {
      const keys = raw.sources || (id === 'sao' ? [raw.topic] : []);
      const sourceIds = keys.map(key => dedicatedSources[key]).filter(Boolean);
      addQuestion(raw, at(raw.topic), sourceIds, raw.id);
    }
    const briefing = dedicated.briefing;
    if (briefing) {
      for (const [heading, text, keys] of [...(briefing.recall || []), ...(briefing.updates || []), ...(briefing.supplementRecall || [])]) {
        const sourceIds = String(keys || '').split(',').map(key => dedicatedSources[key]).filter(Boolean);
        addSection(chapterForTitle(heading), heading, text, sourceIds);
      }
    }
  }
  if (PRACTICE500.includes(id)) {
    const rows = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ROOT, 'practice500', id + '.json.gz'))));
    for (const raw of rows) {
      const chapter = chapterAliases.get(normalizeText(raw.t)) || chapterForTitle(raw.t);
      const sourceId = raw.src ? addSource({title:raw.ref || raw.t, url:raw.src}) : null;
      addQuestion(raw, chapter, sourceId ? [sourceId] : [], raw.id);
    }
  }
  if (id === 'energy') {
    const common = JSON.parse(read('energy-intensive-sources.json'));
    for (const set of ['a', 'b', 'c', 'd', 'e']) {
      const document = JSON.parse(read('energy-intensive-set-' + set + '.json'));
      const sources = importSources({...common, ...document.sources});
      for (const raw of document.questions) addQuestion(raw, at(raw.topic), (raw.sources || []).map(key => sources[key]).filter(Boolean), raw.id);
    }
    const resources = loadScripts(['energy-intensive-resources.js']);
    const html = resources.ENERGY_INTENSIVE_GUIDE_HTML;
    const sourceIds = linksIn(html).map(addSource).filter(Boolean);
    for (const section of htmlSections(html)) {
      // Time-based instructions are retired; substantive subject material remains.
      if (/^5\.\s*วิธีใช้|วิธีใช้ 5 ชุด/.test(section.heading)) continue;
      addSection(chapterForTitle(section.heading), section.heading, section.text, sourceIds);
    }
    for (const raw of resources.ENERGY_INTENSIVE_RESOURCES.resources || []) addSource(raw);
  }
  if (id === 'rd' || id === 'energy') {
    const lessons = course.lessons[id];
    lessons.forEach((original, index) => {
      const chapter = id === 'rd' && original.topics.length > 3 ? extras.integration : at(original.topics[0]);
      const sourceIds = original.sources.map(key => dedicatedSources[key]).filter(Boolean);
      const lesson = {
        id:id + '-course-' + String(index + 1).padStart(2, '0'),
        legacyId:id + '-' + (index + 1),
        title:plainText(original.title).replace(/^วันเก็บจุดอ่อน:/, 'ทบทวนจุดอ่อน:'),
        lead:plainText(original.lead),
        blocks:original.blocks.map(pair => pair.map(plainText)),
        table:{heads:original.table.heads.map(plainText), rows:original.table.rows.map(row => row.map(plainText))},
        example:original.example.map(plainText), traps:original.traps.map(plainText),
        recall:original.recall.map(pair => pair.map(plainText)),
        writing:{
          prompt:plainText(original.example[0]),
          modelAnswer:[original.lead, original.blocks[0][1], original.example[1], ...original.traps].map(plainText).join('\n\n'),
          rubric:course.rubric
        },
        sourceIds
      };
      addLesson(chapter, lesson);
      metrics.importedCourseLessons++;
      original.drill.forEach(([q, c, e], exercise) => {
        const legacyId = 'e14-' + id + '-' + (index + 1) + '-' + (exercise + 1);
        addQuestion({id:legacyId, q, c, a:0, e, reference:original.title}, chapter, sourceIds, legacyId);
        metrics.importedCourseQuestions++;
      });
    });
  }
  if (id === 'opsmoac') {
    const writing = loadScripts(['opsmoac-writing-data.js']).OPS_WRITING;
    const sources = importSources(writing.sources);
    for (const group of writing.groups) {
      addSection(at(3), group.title, [group.mnemonic, group.story, group.note].filter(Boolean).join('\n\n'));
      for (const card of group.cards || []) addSection(at(3), card.title, [card.detail, card.example].filter(Boolean).join('\n\n'), [sources[card.source]].filter(Boolean));
    }
    for (const item of writing.questions) {
      const sourceIds = item.sources.map(key => sources[key]).filter(Boolean);
      addLesson(chapterForTitle(item.title), {
        id:'opsmoac-writing-' + item.id, legacyId:item.id,
        title:plainText(item.title), lead:plainText(item.memory), blocks:[['แนวคำตอบ', item.model.map(plainText).join('\n\n')]],
        traps:item.avoid ? [plainText(item.avoid)] : [],
        writing:{prompt:plainText(item.prompt), modelAnswer:item.model.map(plainText).join('\n\n'), rubric:item.check.map(plainText)},
        sourceIds
      });
    }
  }
  if (id === 'coj') {
    const html = read('coj.html');
    const policy = /<section\b[^>]*id=["']policy["'][^>]*>([\s\S]*?)<\/section>/i.exec(html);
    if (policy) {
      const content = policy[1].split(/<h3\b[^>]*id=["']policy-test["']/i)[0];
      const sourceIds = linksIn(content).map(addSource).filter(Boolean);
      for (const section of htmlSections(content)) addSection(extras.organization, section.heading, section.text, sourceIds);
      const fields = [...policy[1].matchAll(/<fieldset\b[^>]*>([\s\S]*?)<\/fieldset>/gi)];
      fields.forEach((match, index) => {
        const field = match[1], question = /<legend[^>]*>([\s\S]*?)<\/legend>/i.exec(field);
        const options = [...field.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/gi)].map(item => plainText(item[1]));
        const answer = /<p\b[^>]*data-answer=["'](\d)["'][^>]*>([\s\S]*?)<\/p>/i.exec(field);
        if (question && options.length === 4 && answer) addQuestion({q:plainText(question[1]).replace(/^\d+\.\s*/, ''), c:options, a:Number(answer[1]), e:plainText(answer[2])}, extras.organization, sourceIds, 'coj-policy-' + (index + 1));
      });
    }
  }
  for (const [stem, variants] of variantsByStem) {
    const answers = unique(variants.map(variant => normalizeChoice(variant.c[variant.a])));
    if (answers.length > 1) {
      metrics.quarantinedQuestions.push({
        id:id + '-q-' + hash(stem), q:variants[0].q,
        reason:'Different answer text for the same question in original banks; retained for review, excluded from new practice',
        variants:variants.map(({c, a, e, reference, sourceIds, legacyIds}) => ({c, a, e, reference, sourceIds, legacyIds}))
      });
      questionMap.delete(stem);
    }
  }
  bank.questions = [...questionMap.values()].sort((a, b) => chapters.findIndex(ch => ch.id === a.chapterId) - chapters.findIndex(ch => ch.id === b.chapterId) || a.id.localeCompare(b.id));
  metrics.nearDuplicateCandidates = nearDuplicateCandidates(bank.questions);
  for (const chapter of chapters) {
    chapter.sourceIds = unique([...chapter.sourceIds, ...bank.questions.filter(q => q.chapterId === chapter.id).flatMap(q => q.sourceIds)]);
    if (!chapter.sections.length && !chapter.lessons.length) {
      // Preserve explanations as a readable subject summary where no lesson existed.
      const qs = bank.questions.filter(q => q.chapterId === chapter.id);
      for (const q of qs.slice(0, 6)) addSection(chapter, q.q, q.e, q.sourceIds);
    }
    if (!chapter.sourceIds.length) chapter.sourceIds = [legacySource];
  }
  bank.sources = [...sourceMap.values()].sort((a, b) => a.id.localeCompare(b.id));
  return {bank, metrics};
}
function buildBanks() {
  const course = loadScripts(['exam-14-data.js', 'exam-14-rd.js', 'exam-14-energy.js']).EXAM14;
  course.rubric = extractLiteral(read('exam-14.js'), 'checks');
  const results = AGENCIES.map(definition => buildBank(definition, course));
  const manifest = {
    schemaVersion:1,
    sourceStatus:'existing',
    note:'จัดหมวดจากเนื้อหาและข้อสอบเดิม ไม่ได้ตรวจรับรองความถูกต้องหรือสถานะกฎหมายรอบใหม่',
    banks:results.map(({bank, metrics}) => ({
      id:bank.id, title:bank.title, subtitle:bank.subtitle, file:bank.id + '.json',
      chapters:bank.chapters.length, questions:bank.questions.length,
      lessons:bank.chapters.reduce((total, chapter) => total + chapter.lessons.length, 0),
      sources:bank.sources.length, ...metrics
    }))
  };
  return {banks:results.map(result => result.bank), manifest};
}
function writeBanks() {
  const output = path.join(ROOT, 'question-banks');
  fs.mkdirSync(output, {recursive:true});
  const {banks, manifest} = buildBanks();
  for (const bank of banks) fs.writeFileSync(path.join(output, bank.id + '.json'), JSON.stringify(bank) + '\n');
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  for (const entry of manifest.banks) console.log(entry.id + ': ' + entry.chapters + ' chapters, ' + entry.questions + ' questions, ' + entry.lessons + ' lessons; ' + entry.invalidQuestions.length + ' invalid inputs; ' + entry.quarantinedQuestions.length + ' conflicting stems quarantined');
}
module.exports = {AGENCIES, buildBanks, loadLegacy, loadScripts, extractLiteral, plainText, normalizeText, normalizeChoice};
if (require.main === module) writeBanks();
