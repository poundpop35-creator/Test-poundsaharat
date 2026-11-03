const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const create=require('../role-sprint-core.js');
function bank(id){const c={window:{}};vm.runInNewContext(fs.readFileSync(`${id}-syllabus-data.js`,'utf8'),c);return JSON.parse(JSON.stringify(c.window.ROLE_SYLLABUS));}
for(const id of ['dmh','drr'])test(`${id}: complete syllabus, valid sources, stable resume and independent scoring`,()=>{
 const b=bank(id);assert.equal(b.questions.length,50);assert.equal(new Set(b.questions.map(q=>q.q)).size,50);assert.equal(b.topics.length,id==='dmh'?10:5);
 for(let i=1;i<=b.topics.length;i++)assert.equal(b.questions.filter(q=>q.topic===i).length,id==='dmh'?5:10);
 for(const q of b.questions){assert.equal(new Set(q.c).size,4);assert(q.a>=0&&q.a<4);assert(q.e&&q.reference);for(const key of q.sources)assert.match(b.sources[key].url,/^https:\/\//);}
 const core=create(b);let s=core.createSession(b.questions.map(q=>q.id),'exam','test',()=>.37);const savedOrder=JSON.stringify(s.orders);let correct=0;
 for(let i=0;i<50;i++){const q=core.byId.get(s.ids[s.idx]),a=i%3===0?(q.a+1)%4:q.a;if(a===q.a)correct++;s=core.answer(s,a);s=JSON.parse(JSON.stringify(s));assert(core.valid(s));s=core.next(s);}
 assert(s.complete);assert.equal(core.score(s).correct,correct);assert.equal(JSON.stringify(s.orders),savedOrder);assert.notEqual(b.storageKey,'energy100:v1');assert.notEqual(b.storageKey,'rd100:v1');
});
test('new catalog keeps old DMH resources and exposes both new banks',()=>{const c={window:{}};vm.runInNewContext(fs.readFileSync('app-catalog.js','utf8'),c);for(const id of ['dmh','drr']){const e=c.window.STUDY_CATALOG.find(x=>x.id===id);assert(fs.existsSync(e.file));for(const r of e.resources)assert(fs.existsSync(r.file));}const dmh=c.window.STUDY_CATALOG.find(x=>x.id==='dmh');assert.equal(dmh.total,128);assert(dmh.resources.some(r=>r.file==='dmh.html'));});
test('DMH includes draft 14 rather than replacing it with plan 13',()=>{const b=bank('dmh');assert.match(b.topics[2],/ร่าง.*14.*2571.*2575/);assert.equal(b.questions.filter(q=>q.topic===3).length,5);});
