(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Exam14Core = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const ROLES = ['rd', 'energy'];
  function build(data) {
    const all = new Map(), quizzes = [], used = {rd: new Set(), energy: new Set()};
    for (const role of ROLES) {
      const bank = data.banks[role];
      if (!bank || bank.questions.length !== 200 || data.lessons[role].length !== 14) throw Error('โหลดบทเรียนหรือคลังข้อสอบไม่ครบ');
      for (const q of bank.questions) all.set(q.id, {...q, role});
      data.lessons[role].forEach((l, day) => {
        if (!l.sources.every(key => bank.sources[key])) throw Error('ไม่พบแหล่งอ่านของบทเรียน');
        l.drill.forEach(([q, c, e], i) => {
          const id = `e14-${role}-${day + 1}-${i + 1}`;
          all.set(id, {id, role, topic: l.topics[0], q, c, a: 0, e, sources: l.sources, reference: l.title, fresh: true});
        });
      });
    }
    for (let day = 0; day < 14; day++) {
      const ids = [];
      for (const role of ROLES) {
        const l = data.lessons[role][day], bank = data.banks[role];
        const candidates = bank.questions.filter(q => l.topics.includes(q.topic) && !used[role].has(q.id));
        // Mix foundation and application. Keep deterministic IDs across refreshes.
        const advanced = candidates.filter(q => q.id.includes('-b-'));
        const basic = candidates.filter(q => !q.id.includes('-b-'));
        const queue = [];
        while (advanced.length || basic.length) {
          if (advanced.length) queue.push(advanced.shift());
          if (basic.length) queue.push(basic.shift());
        }
        if (queue.length < 8) throw Error(`หัวข้อวันที่ ${day + 1} มีข้อฝึกไม่พอ`);
        const picked = queue.slice(0, 8);
        picked.forEach(q => used[role].add(q.id));
        ids.push(`e14-${role}-${day + 1}-1`, `e14-${role}-${day + 1}-2`, ...picked.map(q => q.id));
      }
      quizzes.push(ids);
    }
    return {all, quizzes};
  }
  function order(id) {
    let n = 0;
    for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
    const a = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) {n = (Math.imul(n, 1664525) + 1013904223) >>> 0; const j = n % (i + 1); [a[i], a[j]] = [a[j], a[i]];}
    return a;
  }
  function clean(raw, all) {
    const s = {day: 1, role: 'rd', hours: 3, done: [], read: {}, answers: {}, records: {}, writing: {}, checks: {}, notes: {}};
    if (!raw || typeof raw !== 'object') return s;
    if (Number.isInteger(raw.day) && raw.day >= 1 && raw.day <= 14) s.day = raw.day;
    if (ROLES.includes(raw.role)) s.role = raw.role;
    if (raw.hours === 4) s.hours = 4;
    if (Array.isArray(raw.done)) s.done = [...new Set(raw.done.filter(x => Number.isInteger(x) && x >= 1 && x <= 14))];
    for (const key of ['answers', 'records']) {
      if (raw[key] && typeof raw[key] === 'object') for (const [id, a] of Object.entries(raw[key])) if (all.has(id) && Number.isInteger(a) && a >= 0 && a < 4) s[key][id] = a;
    }
    for (let d = 1; d <= 14; d++) {
      if (typeof raw.notes?.[d] === 'string') s.notes[d] = raw.notes[d].slice(0, 12000);
      for (const role of ROLES) {
        const key = `${role}-${d}`;
        if (raw.read?.[key] === true) s.read[key] = true;
        if (typeof raw.writing?.[key] === 'string') s.writing[key] = raw.writing[key].slice(0, 20000);
        if (Array.isArray(raw.checks?.[key])) s.checks[key] = Array.from({length: 5}, (_, i) => raw.checks[key][i] === true);
      }
    }
    return s;
  }
  function score(ids, answers, all) {
    let answered = 0, correct = 0;
    for (const id of ids) if (Number.isInteger(answers[id])) {answered++; if (answers[id] === all.get(id).a) correct++;}
    return {answered, correct, total: ids.length};
  }
  function reviewDays(day) {return [1, 3, 7].map(gap => day - gap).filter(d => d > 0);}
  return {build, order, clean, score, reviewDays};
});
