'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'opsmoac-sprint-data.js'),'utf8'),context);
const original=JSON.parse(JSON.stringify(context.window.OPS_SPRINT));
vm.runInNewContext(fs.readFileSync(path.join(root,'opsmoac-sprint-extra.js'),'utf8'),context);
const previous100=JSON.parse(JSON.stringify(context.window.OPS_SPRINT));
const additions=['a1','a2','b1','b2','300'].map(p=>'opsmoac-sprint-'+p+'.js');
for(const f of additions)vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),context);
const data=JSON.parse(JSON.stringify(context.window.OPS_SPRINT)),C=require('../opsmoac-sprint-core.js')(data);
test('OPS sprint: 300 unique questions, three disjoint 100-question sets, original five mini sets retained',()=>{
  assert.equal(data.questions.length,300);assert.equal(C.byId.size,300);assert.equal(data.topics.length,5);
  assert.deepEqual(data.topics.map((_,i)=>data.questions.filter(q=>q.topic===i+1).length),[40,60,55,85,60]);
  assert.equal(data.pack300Ready,true);assert.equal(data.examSets.length,3);
  for(const s of data.examSets){assert.equal(s.ids.length,100);assert.ok(s.ids.every(id=>C.byId.has(id)));}
  assert.equal(new Set(data.examSets.flatMap(s=>s.ids)).size,300);
  assert.ok(data.examSets.slice(0,2).every(s=>s.ids.every(id=>id.startsWith('ops300-'))));
  assert.deepEqual(data.examSets[2].ids,previous100.questions.map(q=>q.id));
  assert.equal(data.focusIds.length,20);assert.equal(new Set(data.focusIds).size,20);assert.ok(data.focusIds.every(id=>C.byId.has(id)));
  assert.equal(new Set(data.sets.flatMap(s=>s.ids)).size,100);assert.equal(new Set(data.questions.map(q=>q.q)).size,300);
  for(const s of data.sets){assert.equal(s.ids.length,20);for(let t=1;t<=5;t++)assert.equal(s.ids.filter(id=>C.byId.get(id).topic===t).length,4);}
});
test('OPS sprint: every choice has feedback and every question has a precise reference plus official source links',()=>{
  for(const q of data.questions){
    assert.equal(q.c.length,4);assert.equal(new Set(q.c).size,4);assert.equal(q.feedback.length,4);assert.ok(q.feedback.every(f=>typeof f==='string'&&f.length>10),q.id);
    assert.ok(Number.isInteger(q.a)&&q.a>=0&&q.a<4);assert.ok(q.ref.length>10&&q.trap.length>10);assert.ok(q.sources.length>0);
    for(const key of q.sources){const source=data.sources[key];assert.ok(source&&source.title);const u=new URL(source.url);assert.equal(u.protocol,'https:');assert.ok(u.hostname.endsWith('.go.th')||u.hostname==='www.etda.or.th'||u.hostname==='www.oecd.org'||u.hostname==='www.fao.org'||u.hostname==='eu-cap-network.ec.europa.eu',u.hostname);}
  }
  assert.equal(data.notes.length,5);assert.ok(data.notes.every(n=>n.length>=3));
});
test('OPS sprint: each 100-question session scores 200 points and preserves shuffled keys',()=>{
  const before=JSON.stringify(data);
  for(const set of data.examSets){let s=C.createSession(set.ids,'practice',set.title,()=>.31);
    for(let i=0;i<100;i++){const id=s.ids[s.idx],q=C.byId.get(id);assert.deepEqual([...s.orders[id]].sort(),[0,1,2,3]);s=C.answer(s,q.a);s=C.next(s);assert.ok(C.valid(s));}
    assert.deepEqual(C.score(s),{total:100,answered:100,correct:100,wrong:[]});assert.equal(C.score(s).correct*data.fullExam.pointsPerQuestion,200);assert.equal(s.complete,true);
  }assert.equal(JSON.stringify(data),before);
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
test('OPS sprint: scripts compile, entrypoints resolve, source scope and separate storage are explicit',()=>{
  const html=fs.readFileSync(path.join(root,'opsmoac-sprint.html'),'utf8');
  assert.ok(html.includes('481591791935#page=9'));assert.ok(html.includes('ไม่ใช่น้ำหนัก'));assert.ok(!html.includes('อีก 2 วัน'));assert.ok(html.includes('32 ในภาพเห็นไม่ครบ'));
  for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(m[1].startsWith('http'))continue;assert.ok(fs.existsSync(path.join(root,m[1].split(/[?#]/)[0])),m[1]);}
  for(const f of ['opsmoac-sprint-data.js','opsmoac-sprint-extra.js','opsmoac-sprint-core.js','opsmoac-sprint.js',...additions])new vm.Script(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
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

test('OPS 300: original 100 unchanged; unfinished 60/100 sessions and repeated loads remain compatible',()=>{
  for(const q of previous100.questions)assert.deepEqual(C.byId.get(q.id),q);
  assert.equal(data.version,original.version);
  for(const old of [original,previous100]){const oldCore=require('../opsmoac-sprint-core.js')(old);
    let session=oldCore.createSession(old.questions.map(q=>q.id),'exam','previous run',()=>.5);
    for(let i=0;i<17;i++){session=oldCore.answer(session,1);session=oldCore.next(session);}
    assert.ok(C.valid(session));assert.equal(session.ids.length,old.questions.length);assert.equal(session.idx,17);
  }
  const snapshot=JSON.stringify(context.window.OPS_SPRINT);
  for(const f of ['opsmoac-sprint-extra.js',...additions])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),context);
  assert.equal(JSON.stringify(context.window.OPS_SPRINT),snapshot);
});
test('OPS 300: new financial, weighted-score and scheduling answers independently checked',()=>{
  const a=n=>{const q=C.byId.get('ops300-'+n);return q.c[q.a];};
  const cases=[[199,180-120],[200,90/100],[241,(500-450)*100],[248,120000-85000],[249,20*.85],[250,800*750/1000],[251,(920-800)/800*100],[252,.3*.2*100],[254,(650-500)/500*100],[256,2000*(37-35)],[272,175/250*100],[278,20000-8000],[280,100/150*100],[283,150*.8-100*1.1],[284,1.8/2.4*100],[285,900000/300],[286,110000/1.1],[287,55000/1.1+60500/1.1**2-100000],[290,150000-100000],[291,150000/60000],[292,40000/(100-60)],[293,.5*70+.3*90+.2*80],[294,.2*500000],[296,Math.max(3+4,5)+2],[297,Math.max(3+4,5+1)+2]];
  for(const [id,n] of cases)assert.ok(a(id).includes((Math.abs(n)<1e-8?0:Number(n.toFixed(2))).toLocaleString('en-US')),id+' '+a(id));
  assert.ok(a(253).includes('ลด '+Math.round((1-.9*1.1)*100)));assert.ok(a(255).includes(((1-1.08/1.1)*100).toFixed(2)));
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
