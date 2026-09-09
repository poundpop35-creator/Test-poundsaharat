const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../exam-core.js');
const root = path.join(__dirname, '..');
const bank = {};
for (const name of ['sao', 'opsmoac', 'rd']) {
  const box = {window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'data', name + '.js'), 'utf8'), box);
  bank[name] = JSON.parse(JSON.stringify(box.window.EXAM_DATA));
}
test('official topic order matches each supplied image and preserves the supplementary lesson separately', () => {
  const expected = {sao:[1,2,3,4,5,6,7,8,9],opsmoac:[4,2,3,1,5],rd:[3,4,1,2,5,6,8,7]};
  for (const [name, data] of Object.entries(bank)) {
    assert.deepEqual(data.topics.filter(t => !t.supplemental).map(t => t.id), expected[name]);
    assert.deepEqual(data.topics.filter(t => !t.supplemental).map(t => t.number), expected[name].map((_,i)=>i+1));
    assert.ok(data.config.studyOrder.every(id => expected[name].includes(id)));
  }
  assert.equal(bank.sao.topics.filter(t=>t.supplemental).length,1);
});
test('question banks have unique stable IDs, valid answers, explanations and resolvable sources', () => {
  const ids = new Set(); let added = 0;
  for (const data of Object.values(bank)) for (const t of data.topics) {
    assert.ok(t.content.length > 0);
    if (!t.supplemental) assert.ok(t.recall?.prompt && t.recall.points.length >= 3);
    for (const q of t.q) {
      assert.ok(!ids.has(q.id), q.id); ids.add(q.id);
      assert.equal(q.c.length,4); assert.equal(new Set(q.c).size,4,q.id);
      assert.ok(Number.isInteger(q.a) && q.a>=0 && q.a<4,q.id);
      assert.ok(q.e.length>10,q.id); assert.equal(q.topicId,t.id);
      assert.ok(q.sources.length>0);
      for (const id of q.sources) assert.ok(data.sources[id]?.url.startsWith('https://'),id);
      if (q.added) added++;
    }
  }
  assert.equal(added,88); assert.equal(ids.size,363);
});
test('all statutory main lessons expose full-text links in addition to source metadata', () => {
  const required={sao:[1,2,3,4,5],opsmoac:[4],rd:[1,2,3,5,6,7]};
  for(const [name,topicIds] of Object.entries(required)) for(const id of topicIds) {
    const t=bank[name].topics.find(t=>t.id===id);
    assert.ok(t.sources.some(s=>bank[name].sources[s].fullUrl),name+':'+id);
  }
  assert.ok(bank.rd.sources.pdpa.fullUrl.endsWith('.pdf'));
  assert.ok(bank.rd.sources.oic.fullUrl.endsWith('.pdf'));
});
test('30-question rounds cover all official topics, exclude supplements and never repeat an item', () => {
  for (const data of Object.values(bank)) {
    const before=JSON.stringify(data.topics);
    for(const random of [()=>0,()=>0.999,Math.random]) {
      const list=core.balanced(data.topics,30,random);
      assert.equal(list.length,30); assert.equal(new Set(list.map(q=>q.id)).size,30);
      assert.deepEqual([...new Set(list.map(q=>q.topicId))].sort((a,b)=>a-b),data.topics.filter(t=>!t.supplemental).map(t=>t.id).sort((a,b)=>a-b));
      const counts=data.topics.filter(t=>!t.supplemental).map(t=>list.filter(q=>q.topicId===t.id).length);
      assert.ok(Math.max(...counts)-Math.min(...counts)<=1);
    }
    assert.equal(JSON.stringify(data.topics),before);
  }
});
test('answer shuffling preserves the correct text and replay uses the original question pool', () => {
  const q=bank.rd.topics[0].q[0],before=JSON.stringify(q);
  const first=core.question(q,()=>0),retry=core.question(first,()=>0.999);
  for (const item of [first,retry]) assert.equal(item.options[item.answer].text,q.c[q.a]);
  assert.equal(retry.id,q.id);assert.equal(JSON.stringify(q),before);
});
test('wrong-answer review tracks the latest attempt and progress remains separated by agency', () => {
  const topics=bank.sao.topics,id=topics[0].q[0].id;
  const fresh=core.normalize(null,topics),wrong=core.record(fresh,id,false);
  assert.equal(core.wrong(topics,wrong).length,1);assert.equal(core.wrong(topics,fresh).length,0);
  const corrected=core.record(wrong,id,true);
  assert.equal(core.wrong(topics,corrected).length,0);
  assert.equal(corrected.answers[id].attempts,2);
  assert.equal(core.stats(topics[0],corrected).answered,1);
  assert.equal(Object.keys(core.normalize(corrected,bank.rd.topics).answers).length,0);
});
test('untrusted saved progress is normalized and removed questions cannot leak into review', () => {
  const topics=bank.sao.topics,id=topics[0].q[0].id;
  const p=core.normalize({version:1,read:{1:true,999:true},lastTopic:999,drafts:{1:'x'.repeat(15000)},answers:{[id]:{correct:false,attempts:2},deleted:{correct:false,attempts:1},invalid:{correct:'no',attempts:1}}},topics);
  assert.deepEqual(p.read,{1:true});assert.equal(p.lastTopic,null);assert.equal(p.drafts[1].length,10000);
  assert.deepEqual(Object.keys(p.answers),[id]);
  assert.deepEqual(core.normalize({version:999},topics),core.normalize(null,topics));
  assert.deepEqual(core.normalize({version:1,answers:{[id]:null}},topics).answers,{});
});
test('published entrypoints and scripts are syntactically valid and local assets resolve', () => {
  for(const name of Object.keys(bank)) {
    const html=fs.readFileSync(path.join(root,name+'.html'),'utf8');
    for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const target=match[1]; if(target.startsWith('http'))continue;
      assert.ok(fs.existsSync(path.join(root,target)),name+':'+target);
    }
    assert.ok(html.includes('id="fullTextLinks"'));
  }
  for(const file of ['exam-core.js','exam-tutor.js']) new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
});
