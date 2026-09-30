'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'sao-sprint-data.js'),'utf8'),context);
const data=JSON.parse(JSON.stringify(context.window.SAO_SPRINT)),C=require('../sao-sprint-core.js')(data);
test('60 unique authored questions, disjoint 20-question sets covering all 9 syllabus topics',()=>{
  assert.equal(data.questions.length,60);assert.equal(C.byId.size,60);
  assert.deepEqual(data.topics.map((_,i)=>data.questions.filter(q=>q.topic===i+1).length),[10,8,8,6,6,5,5,6,6]);
  assert.equal(new Set(data.sets.flatMap(s=>s.ids)).size,60);
  for(const s of data.sets){assert.equal(s.ids.length,20);assert.equal(new Set(s.ids.map(id=>C.byId.get(id).topic)).size,9);}
  assert.equal(new Set(data.questions.map(q=>q.q)).size,60);
});
test('each choice has distinct text, feedback, and a resolvable HTTPS source',()=>{
  for(const q of data.questions){assert.equal(q.c.length,4);assert.equal(new Set(q.c).size,4);assert.equal(q.feedback.length,4);assert.ok(q.feedback.every(f=>typeof f==='string'&&f.length>15));assert.ok(Number.isInteger(q.a)&&q.a>=0&&q.a<4);assert.ok(q.ref&&q.trap);assert.equal(new URL(data.sources[q.topic].url).protocol,'https:');}
});
test('independently calculated numeric answers match stored answer keys',()=>{
  assert.equal(C.byId.get('sao48-06').c[C.byId.get('sao48-06').a],(32000*12).toLocaleString('en-US')+' บาท');
  assert.equal(C.byId.get('sao48-12').c[C.byId.get('sao48-12').a],Math.max(3*.2,.75)+' ล้านล้านบาท');
  assert.equal(C.byId.get('sao48-58').c[C.byId.get('sao48-58').a],`A ${(3000000/2000).toLocaleString('en-US')} บาทต่อคน ต่ำกว่า B ${(4000000/2000).toLocaleString('en-US')} บาทต่อคน`);
});
test('shuffle keeps correct original choice; a complete run scores accurately without mutating source',()=>{
  const before=JSON.stringify(data);let s=C.createSession(data.questions.map(q=>q.id),'exam','test',()=>.314);
  for(let i=0;i<60;i++){const id=s.ids[s.idx],q=C.byId.get(id);assert.deepEqual([...s.orders[id]].sort(),[0,1,2,3]);s=C.answer(s,q.a);s=C.next(s);assert.ok(C.valid(s));}
  assert.deepEqual(C.score(s),{total:60,answered:60,correct:60,wrong:[]});assert.equal(s.complete,true);assert.equal(JSON.stringify(data),before);
});
test('cannot skip unanswered question, answer twice, or double-complete',()=>{
  let s=C.createSession(['sao48-01'],'practice','test');assert.equal(C.next(s),s);assert.equal(C.answer(s,4),s);
  const q=C.byId.get('sao48-01');s=C.answer(s,(q.a+1)%4);assert.equal(C.answer(s,q.a),s);s=C.next(s);assert.equal(C.next(s),s);assert.equal(C.score(s).correct,0);
});
test('JSON round-trip preserves answers and randomized options for resume',()=>{
  let s=C.createSession(data.sets[0].ids,'practice','test');s=C.answer(s,2);s=C.next(s);const restored=JSON.parse(JSON.stringify(s));assert.ok(C.valid(restored));assert.deepEqual(restored,s);
  assert.equal(C.valid({...restored,version:'old'}),false);assert.equal(C.valid({...restored,idx:20}),false);assert.equal(C.valid({...restored,answers:{}}),false);assert.equal(C.valid({...restored,orders:{}}),false);
});
test('wrong-question ledger clears corrected items while preserving unrelated progress',()=>{
  let s=C.createSession(['sao48-01'],'practice','test');const q=C.byId.get('sao48-01');s=C.answer(s,(q.a+1)%4);let records=C.progress({'sao48-02':true},s);assert.equal(records['sao48-01'],false);
  s=C.answer(C.createSession(['sao48-01'],'practice','test'),q.a);records=C.progress(records,s);assert.deepEqual(records,{'sao48-02':true,'sao48-01':true});
});
test('legacy SAO corrections compile and preserve its 554-question bank',()=>{
  const html=fs.readFileSync(path.join(root,'sao.html'),'utf8'),script=html.split('<script>')[1].split('let S=')[0];const ctx={};vm.runInNewContext(script+';globalThis.b={TOPICS,BOOK_TOPICS};',ctx);
  const qs=[...ctx.b.TOPICS,...ctx.b.BOOK_TOPICS].flatMap(t=>t.q);assert.equal(qs.length,554);
  const find=t=>qs.find(q=>q.q===t);
  let q=find('พ.ร.ป. ว่าด้วยการตรวจเงินแผ่นดิน พ.ศ. 2561 มีทั้งสิ้นกี่มาตรา');assert.equal(q.c[q.a],'115 มาตรา');
  q=find('พ.ร.บ. วิธีการงบประมาณ พ.ศ. 2561 มีจำนวนกี่มาตรา');assert.equal(q.c[q.a],'61 มาตรา');
  assert.ok(!html.includes('มาตรา 4 กำหนดให้ประธานกรรมการตรวจเงินแผ่นดิน'));assert.ok(!html.includes('ครบทั้ง 10 วิชา ตามประกาศ'));
  for(const file of ['index.html','sao.html'])assert.ok(fs.readFileSync(path.join(root,file),'utf8').includes('href="sao-sprint.html"'));
});
