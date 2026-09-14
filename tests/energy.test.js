const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const core = require('../exam-core');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const box = {window:{}};
vm.runInNewContext(read('data/energy.js'),box);
const data = JSON.parse(JSON.stringify(box.window.EXAM_DATA));
const pool = data.topics.flatMap(t=>t.q);
test('energy coverage follows both image sections and all five Acts',()=>{
  assert.equal(data.topics.length,11);
  assert.equal(pool.length,48);
  assert.equal(data.topics.filter(t=>t.section==='general').flatMap(t=>t.q).length,12);
  assert.equal(data.topics.filter(t=>t.section==='specific').flatMap(t=>t.q).length,36);
  assert.deepEqual(data.topics.slice(6).map(t=>t.sources[0]),['control','trade','conserve','industry','fund']);
  assert.deepEqual(new Set(data.config.studyOrder),new Set(data.topics.map(t=>t.id)));
  assert.equal(data.config.mock.all,true);
  assert.equal(data.config.mock.count,pool.length);
});
test('all energy questions preserve answer reasons through shuffling and have traceable references',()=>{
  assert.equal(new Set(pool.map(q=>q.id)).size,48);
  assert.equal(new Set(pool.map(q=>q.q)).size,48);
  for(const t of data.topics){
    assert.ok(t.content.length>=2 && t.recall.points.length>=3);
    for(const q of t.q){
      assert.equal(q.c.length,4);assert.equal(new Set(q.c).size,4);
      assert.equal(q.choiceReasons.length,4); assert.equal(q.topicId,t.id);
      assert.ok(q.reference.length>10); assert.equal(q.verifiedAt,'2026-09-14');
      assert.ok(q.sources.length>0);
      for(const id of q.sources)assert.ok(data.sources[id]?.url.startsWith('https://'),id);
      for(const r of [()=>0,()=>0.5,()=>0.999]){
        const shuffled=core.question(q,r);assert.equal(shuffled.options[shuffled.answer].text,q.c[q.a]);
        for(const o of shuffled.options)assert.equal(o.why,q.choiceReasons[q.c.indexOf(o.text)]);
      }
    }
  }
});
test('energy calculation answers are independently checked',()=>{
  const answer=n=>pool[n-1].c[pool[n-1].a];
  assert.equal(answer(5),(2*3)+' kWh');
  assert.equal(answer(16),(300000/(90000-15000))+' ปี');
  assert.equal(answer(17),Math.round(110000/1.1-100000)+' บาท');
  assert.equal(answer(23),(20/100*100)+'%');
  assert.equal(answer(24),(80/100).toString());
  assert.equal(answer(28),((40-18)*100*8*250/1000).toLocaleString('en-US')+' kWh');
});
test('energy entrypoints, direct Act URLs and saved progress are connected',()=>{
  const page=read('energy.html');
  assert.match(read('index.html'),/href="energy.html#focus"/);
  assert.match(page,/law-sources.html#energy/);
  assert.match(page,/data\/energy.js\?v=20260914-energy/);
  assert.match(page,/ทั่วไป 50 คะแนน \+ เฉพาะตำแหน่ง 150 คะแนน/);
  for(const p of [...page.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1].split('?')[0]).filter(p=>!p.includes(':'))){
    assert.ok(fs.existsSync(path.join(root,p.split('#')[0])),p);
  }
  for(const id of ['control','trade','conserve','industry','fund']){
    const u=data.sources[id].fullUrl;
    assert.match(u,/^https:\/\/law.energy.go.th\/.*\.pdf$/);
    assert.ok(read('law-sources.html').includes(u));
  }
  let progress=core.normalize(null,data.topics);
  progress=core.record(progress,pool[0].id,false);
  progress=core.normalize(JSON.parse(JSON.stringify(progress)),data.topics);
  assert.equal(core.wrong(data.topics,progress)[0].id,pool[0].id);
  assert.equal(core.focused(data.topics).length,48);
});
