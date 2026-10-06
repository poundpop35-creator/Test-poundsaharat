'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'opsmoac-sprint-data.js'),'utf8'),context);
const original=JSON.parse(JSON.stringify(context.window.OPS_SPRINT));
vm.runInNewContext(fs.readFileSync(path.join(root,'opsmoac-sprint-extra.js'),'utf8'),context);
const data=JSON.parse(JSON.stringify(context.window.OPS_SPRINT)),C=require('../opsmoac-sprint-core.js')(data);
test('OPS sprint: 100 unique questions in five disjoint practice sets, 20 per topic and four per topic in each set',()=>{
  assert.equal(data.questions.length,100);assert.equal(C.byId.size,100);assert.equal(data.topics.length,5);
  assert.deepEqual(data.topics.map((_,i)=>data.questions.filter(q=>q.topic===i+1).length),[20,20,20,20,20]);
  assert.equal(new Set(data.sets.flatMap(s=>s.ids)).size,100);assert.equal(new Set(data.questions.map(q=>q.q)).size,100);
  for(const s of data.sets){assert.equal(s.ids.length,20);for(let t=1;t<=5;t++)assert.equal(s.ids.filter(id=>C.byId.get(id).topic===t).length,4);}
});
test('OPS sprint: every choice has feedback and every question has a precise reference plus official source links',()=>{
  for(const q of data.questions){
    assert.equal(q.c.length,4);assert.equal(new Set(q.c).size,4);assert.equal(q.feedback.length,4);assert.ok(q.feedback.every(f=>typeof f==='string'&&f.length>25));
    assert.ok(Number.isInteger(q.a)&&q.a>=0&&q.a<4);assert.ok(q.ref.length>10&&q.trap.length>10);assert.ok(q.sources.length>0);
    for(const key of q.sources){const source=data.sources[key];assert.ok(source&&source.title);const u=new URL(source.url);assert.equal(u.protocol,'https:');assert.ok(u.hostname.endsWith('.go.th')||u.hostname==='www.oecd.org'||u.hostname==='www.fao.org'||u.hostname==='eu-cap-network.ec.europa.eu',u.hostname);}
  }
  assert.equal(data.notes.length,5);assert.ok(data.notes.every(n=>n.length>=3));
});
test('OPS sprint: shuffling preserves answer keys and full 100-question run scores accurately',()=>{
  const before=JSON.stringify(data);let s=C.createSession(data.questions.map(q=>q.id),'exam','full run',()=>.31);
  for(let i=0;i<100;i++){const id=s.ids[s.idx],q=C.byId.get(id);assert.deepEqual([...s.orders[id]].sort(),[0,1,2,3]);s=C.answer(s,q.a);s=C.next(s);assert.ok(C.valid(s));}
  assert.deepEqual(C.score(s),{total:100,answered:100,correct:100,wrong:[]});assert.equal(s.complete,true);assert.equal(JSON.stringify(data),before);
});
test('OPS sprint: cannot skip, double-answer, or double-complete; wrong-answer ledger clears on correction',()=>{
  const id=data.questions[0].id,q=C.byId.get(id);let s=C.createSession([id],'practice','test');assert.equal(C.next(s),s);assert.equal(C.answer(s,4),s);
  s=C.answer(s,(q.a+1)%4);assert.equal(C.answer(s,q.a),s);s=C.next(s);assert.equal(C.next(s),s);assert.equal(C.score(s).correct,0);
  let records=C.progress({'untouched':true},s);assert.equal(records[id],false);
  records=C.progress(records,C.answer(C.createSession([id],'practice','retry'),q.a));assert.equal(records[id],true);assert.equal(records.untouched,true);
});
test('OPS sprint: resume retains order, answers, index; corrupt sessions rejected',()=>{
  let s=C.createSession(data.sets[0].ids,'practice','resume');s=C.answer(s,2);s=C.next(s);s=JSON.parse(JSON.stringify(s));assert.ok(C.valid(s));
  for(const bad of [{...s,version:'old'},{...s,idx:20},{...s,answers:{}},{...s,orders:{}},{...s,ids:[s.ids[0],s.ids[0]]},{...s,complete:true}])assert.equal(Boolean(C.valid(bad)),false);
});
test('OPS sprint: scripts compile, entrypoints resolve, separate storage and explicit scope caveat remain',()=>{
  const html=fs.readFileSync(path.join(root,'opsmoac-sprint.html'),'utf8');
  assert.ok(html.includes('ส่วนล่างถูกตัด'));assert.ok(html.includes('ไม่ใช่น้ำหนัก'));assert.ok(!html.includes('อีก 2 วัน'));
  for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(m[1].startsWith('http'))continue;assert.ok(fs.existsSync(path.join(root,m[1].split(/[?#]/)[0])),m[1]);}
  for(const f of ['opsmoac-sprint-data.js','opsmoac-sprint-extra.js','opsmoac-sprint-core.js','opsmoac-sprint.js'])new vm.Script(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
  const js=fs.readFileSync(path.join(root,'opsmoac-sprint.js'),'utf8');assert.ok(js.includes("KEY='opsmoac60:v1'"));assert.ok(!js.includes("KEY='sao48:v1'"));assert.ok(js.includes('sourceLinks(q.sources)'));
  for(const f of ['index.html','opsmoac.html'])assert.ok(fs.readFileSync(path.join(root,f),'utf8').includes('href="opsmoac-sprint.html"'));
});
test('OPS sprint: hypothetical farm-income and subsidy arithmetic independently verified',()=>{
  const income=C.byId.get('ops60-33'),subsidy=C.byId.get('ops60-35');
  assert.ok(income.c[income.a].includes((10000*10-70000).toLocaleString('en-US')));
  assert.ok(income.c[income.a].includes((9000*12-82000).toLocaleString('en-US')));
  assert.ok(subsidy.c[subsidy.a].includes(String(1000-600)));
});
test('OPS sprint: cost effectiveness, NPV, benefit-cost ratio and budget percentages independently verified',()=>{
  const a=id=>{const q=C.byId.get(id);return q.c[q.a];};
  for(const n of [500000/250,420000/140])assert.ok(a('ops60-55').includes(n.toLocaleString('en-US')));
  assert.ok(Math.abs(121000/Math.pow(1.1,2)-100000)<1e-8);assert.equal(a('ops60-56'),'0 บาท');
  assert.ok(a('ops60-57').includes((150/120).toFixed(2)));assert.ok(a('ops60-57').includes((150*.8/120).toFixed(2)));
  assert.ok(a('ops60-58').includes((1.8/2*100)+'%'));assert.ok(a('ops60-58').includes((140/200*100)+'%'));
});

test('OPS 100: existing 60 questions and old unfinished sessions remain compatible',()=>{
  for(const q of original.questions)assert.deepEqual(C.byId.get(q.id),q);
  assert.equal(data.version,original.version);
  const oldCore=require('../opsmoac-sprint-core.js')(original);
  let session=oldCore.createSession(original.questions.map(q=>q.id),'exam','previous 60-question run',()=>.5);
  for(let i=0;i<17;i++){session=oldCore.answer(session,1);session=oldCore.next(session);}
  assert.ok(C.valid(session));assert.equal(session.ids.length,60);assert.equal(session.idx,17);
  const snapshot=JSON.stringify(context.window.OPS_SPRINT);
  vm.runInNewContext(fs.readFileSync(path.join(root,'opsmoac-sprint-extra.js'),'utf8'),context);
  assert.equal(JSON.stringify(context.window.OPS_SPRINT),snapshot);
});
test('OPS 100: additional arithmetic independently checked',()=>{
  const answer=n=>{const q=C.byId.get('ops100-'+String(n).padStart(3,'0'));return q.c[q.a];};
  assert.ok(answer(79).includes(String((1000*500-800*600)/(1000*500)*100)+'%'));
  assert.ok(answer(80).includes(String(Math.round((1.2*.9-1)*100))+'%'));
  assert.ok(answer(82).includes((1000*(36-34)).toLocaleString('en-US')));
  assert.ok(answer(84).includes(((4*20000+220000)/5).toLocaleString('en-US')));
  assert.ok(answer(95).includes(String((30-18)/30*100)+'%'));
  assert.ok(answer(96).includes(String(.7*80+.3*60)));
  assert.equal(answer(97),(200000/50000)+' ปี');
  assert.ok(answer(99).includes(String(3*5))&&answer(99).includes(String(5*2)));
});
