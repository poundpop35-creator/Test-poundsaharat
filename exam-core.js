(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ExamCore = api;
})(typeof window === 'object' ? window : globalThis, function() {
  'use strict';
  function shuffle(items, random = Math.random) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function balanced(topics, count = 30, random = Math.random) {
    const pools = shuffle(topics.filter(t => !t.supplemental), random).map(t => shuffle(t.q, random));
    const result = [];
    while (result.length < count && pools.some(p => p.length)) {
      for (const pool of pools) if (pool.length && result.length < count) result.push(pool.pop());
    }
    return shuffle(result, random);
  }
  function question(item, random = Math.random) {
    const options = shuffle(item.c.map((text, i) => ({text, correct: i === item.a})), random);
    return {...item, options, answer: options.findIndex(o => o.correct)};
  }
  function normalize(input, topics) {
    const out = {version: 1, read: {}, answers: {}, drafts: {}, lastTopic: null};
    if (!input || typeof input !== 'object' || input.version !== 1) return out;
    const ids = new Set(topics.flatMap(t => t.q.map(q => q.id)));
    for (const t of topics) {
      if (input.read?.[t.id] === true) out.read[t.id] = true;
      if (typeof input.drafts?.[t.id] === 'string') out.drafts[t.id] = input.drafts[t.id].slice(0, 10000);
      if (input.lastTopic === t.id) out.lastTopic = t.id;
    }
    for (const [id, value] of Object.entries(input.answers || {})) {
      if (ids.has(id) && value && typeof value.correct === 'boolean' && Number.isSafeInteger(value.attempts) && value.attempts > 0)
        out.answers[id] = {correct: value.correct, attempts: value.attempts};
    }
    return out;
  }
  function record(progress, id, correct) {
    return {...progress, answers: {...progress.answers, [id]: {correct, attempts: Math.min((progress.answers[id]?.attempts || 0) + 1, Number.MAX_SAFE_INTEGER)}}};
  }
  function stats(topic, progress) {
    const values = topic.q.map(q => progress.answers[q.id]).filter(Boolean);
    return {total: topic.q.length, answered: values.length, correct: values.filter(v => v.correct).length, wrong: values.filter(v => !v.correct).length};
  }
  function wrong(topics, progress) { return topics.filter(t => !t.supplemental).flatMap(t => t.q).filter(q => progress.answers[q.id]?.correct === false); }
  return {shuffle, balanced, question, normalize, record, stats, wrong};
});
