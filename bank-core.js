(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QuestionBankCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const text = value => typeof value === 'string' && value.trim().length > 0;
  function build(bank) {
    if (!bank || bank.schemaVersion !== 1 || !text(bank.id) || !Array.isArray(bank.chapters) || !Array.isArray(bank.questions)) throw Error('รูปแบบคลังข้อสอบไม่ถูกต้อง');
    const chapters = new Map(bank.chapters.map(c => [c.id, c]));
    const sources = new Map((bank.sources || []).map(s => [s.id, s]));
    if (chapters.size !== bank.chapters.length || bank.chapters.some(c => !text(c.id) || !text(c.title))) throw Error('ข้อมูลบทซ้ำหรือไม่ครบ');
    if (sources.size !== (bank.sources || []).length) throw Error('รหัสแหล่งอ้างอิงซ้ำ');
    const byId = new Map();
    for (const q of bank.questions) {
      if (!text(q.id) || byId.has(q.id) || !chapters.has(q.chapterId) || !text(q.q) || !Array.isArray(q.c) || q.c.length !== 4 || q.c.some(c => !text(c)) || new Set(q.c.map(c => c.trim().normalize('NFC'))).size !== 4 || !Number.isInteger(q.a) || q.a < 0 || q.a > 3 || !text(q.e)) throw Error('พบข้อสอบที่ข้อมูลไม่ครบ');
      if (q.choiceReasons && (q.choiceReasons.length !== 4 || q.choiceReasons.some(r => !text(r)))) throw Error('คำอธิบายตัวเลือกไม่ครบ');
      if ((q.sourceIds || []).some(id => !sources.has(id))) throw Error('ไม่พบแหล่งอ้างอิงของข้อสอบ');
      byId.set(q.id, q);
    }
    if (byId.size < 100) throw Error('คลังนี้ยังมีข้อสอบไม่ครบ 100 ข้อ');
    return {bank, byId, chapters, sources};
  }
  function seeded(seed) {
    let value = 2166136261;
    for (const char of String(seed)) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
    return () => {
      value += 0x6D2B79F5;
      let t = Math.imul(value ^ value >>> 15, value | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffle(items, rng = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function groups(model, rng) {
    return model.bank.chapters.map(chapter => shuffle(model.bank.questions.filter(q => q.chapterId === chapter.id).map(q => q.id), rng)).filter(ids => ids.length);
  }
  // Round-robin selection covers chapters before drawing another question from a chapter.
  function mixed(model, size = 100, rng = Math.random) {
    if (!Number.isInteger(size) || size < 1 || size > model.byId.size) throw Error('จำนวนข้อสอบไม่เพียงพอ');
    const buckets = shuffle(groups(model, rng), rng), result = [];
    while (result.length < size) {
      for (const bucket of buckets) {
        if (bucket.length) result.push(bucket.pop());
        if (result.length === size) break;
      }
    }
    return shuffle(result, rng);
  }
  // Fixed sets share no questions; the remainder stays available in chapters and random practice.
  function fixedSets(model) {
    const rng = seeded(model.bank.id + ':sets:v1');
    const count = Math.floor(model.byId.size / 100), result = Array.from({length:count}, () => []);
    const selected = new Set(mixed(model, count * 100, rng));
    let cursor = 0;
    // Distribute each chapter across sets, avoiding chapter/set periodicity.
    for (const bucket of groups(model, rng)) for (const id of bucket) if (selected.has(id)) {
      while (result[cursor].length === 100) cursor = (cursor + 1) % count;
      result[cursor].push(id);
      cursor = (cursor + 1) % count;
    }
    return result.map(ids => shuffle(ids, rng));
  }
  function fixedChoices(q) {
    return q.fixedChoiceOrder || /(?:ข้อ|ตัวเลือก)\s*[กขคง](?:\.|\s|,|และ|กับ)|ทั้ง\s*[กขคง]\s*และ|ข้างต้น|ข้างล่าง|ถูกทุกข้อ|ทุกข้อที่กล่าว/.test([q.e, ...q.c].join(' '));
  }
  function createSession(model, ids, mode, title, rng = Math.random, now = Date.now()) {
    const unique = [...new Set(ids)];
    if (!unique.length || unique.length !== ids.length || unique.some(id => !model.byId.has(id))) throw Error('ชุดข้อสอบไม่ถูกต้อง');
    return {
      id: now + '-' + Math.floor(rng() * 1e9), bankId:model.bank.id, ids:shuffle(unique, rng),
      orders:Object.fromEntries(unique.map(id => [id, fixedChoices(model.byId.get(id)) ? [0,1,2,3] : shuffle([0,1,2,3], rng)])),
      mode:mode === 'exam' ? 'exam' : 'practice', title:String(title), idx:0, answers:{}, complete:false,
      startedAt:now, updatedAt:now
    };
  }
  function valid(session, model) {
    return !!session && text(session.id) && session.bankId === model.bank.id && ['practice','exam'].includes(session.mode) && text(session.title) &&
      Array.isArray(session.ids) && session.ids.length > 0 && new Set(session.ids).size === session.ids.length && session.ids.every(id => model.byId.has(id)) &&
      Number.isInteger(session.idx) && session.idx >= 0 && session.idx < session.ids.length &&
      session.answers && typeof session.answers === 'object' && !Array.isArray(session.answers) && Object.entries(session.answers).every(([id,a]) => session.ids.includes(id) && Number.isInteger(a) && a >= 0 && a < 4) &&
      session.orders && session.ids.every(id => Array.isArray(session.orders[id]) && session.orders[id].length === 4 && session.orders[id].every(Number.isInteger) && [...session.orders[id]].sort().join(',') === '0,1,2,3' && (!fixedChoices(model.byId.get(id)) || session.orders[id].join(',') === '0,1,2,3')) &&
      typeof session.complete === 'boolean' && (!session.complete || session.ids.every(id => Number.isInteger(session.answers[id]))) && Number.isFinite(session.startedAt);
  }
  function answer(session, value, now = Date.now()) {
    const id = session.ids[session.idx];
    if (session.complete || !Number.isInteger(value) || value < 0 || value > 3 || (session.mode === 'practice' && session.answers[id] !== undefined)) return session;
    return {...session, answers:{...session.answers, [id]:value}, updatedAt:now};
  }
  function advance(session, now = Date.now()) {
    if (session.complete || session.answers[session.ids[session.idx]] === undefined) return session;
    if (session.idx < session.ids.length - 1) return {...session, idx:session.idx + 1, updatedAt:now};
    const unanswered = session.ids.findIndex(id => session.answers[id] === undefined);
    return unanswered >= 0 ? {...session, idx:unanswered, updatedAt:now} : {...session, complete:true, endedAt:now, updatedAt:now};
  }
  function score(session, model) {
    const wrong = [], topics = {};
    let correct = 0;
    for (const id of session.ids) {
      const q = model.byId.get(id), right = session.answers[id] === q.a;
      const topic = topics[q.chapterId] || (topics[q.chapterId] = {correct:0,total:0});
      topic.total++;
      if (right) { correct++; topic.correct++; } else wrong.push(id);
    }
    return {correct,total:session.ids.length,wrong,topics};
  }
  function blank() { return {version:1,session:null,history:[],read:[],writing:{},notes:{}}; }
  function clean(raw, model) {
    const state = blank();
    if (!raw || raw.version !== 1) return state;
    if (valid(raw.session, model)) state.session = raw.session;
    if (Array.isArray(raw.history)) state.history = raw.history.filter(h => h && text(h.id) && text(h.title) && Number.isInteger(h.total) && h.total > 0 && Number.isInteger(h.correct) && h.correct >= 0 && h.correct <= h.total && Number.isFinite(h.at)).slice(0,30);
    if (Array.isArray(raw.read)) state.read = [...new Set(raw.read.filter(id => model.chapters.has(id)))];
    for (const key of ['writing','notes']) if (raw[key] && typeof raw[key] === 'object') {
      for (const [id,value] of Object.entries(raw[key])) if (typeof value === 'string') state[key][id] = value.slice(0,20000);
    }
    return state;
  }
  function finish(state, model) {
    const session = state.session;
    if (!session?.complete || state.history.some(h => h.id === session.id)) return state;
    const result = score(session, model);
    return {...state, history:[{id:session.id,title:session.title,mode:session.mode,total:result.total,correct:result.correct,at:session.endedAt || Date.now()}, ...state.history].slice(0,30)};
  }
  function importLegacyWriting(state, legacy, model) {
    if (!legacy || !['rd','energy'].includes(model.bank.id)) return state;
    const next = {...state,writing:{...state.writing},notes:{...state.notes}};
    for (const chapter of model.bank.chapters) for (const lesson of chapter.lessons || []) {
      if (!lesson.legacyId) continue;
      const draft = legacy.writing?.[lesson.legacyId];
      const day = lesson.legacyId.split('-').pop();
      const note = legacy.notes?.[day];
      if (!Object.hasOwn(next.writing,lesson.id) && typeof draft === 'string') next.writing[lesson.id] = draft.slice(0,20000);
      if (!Object.hasOwn(next.notes,lesson.id) && typeof note === 'string') next.notes[lesson.id] = note.slice(0,20000);
    }
    return next;
  }
  return {build,seeded,shuffle,mixed,fixedSets,createSession,valid,answer,advance,score,blank,clean,finish,importLegacyWriting};
});
