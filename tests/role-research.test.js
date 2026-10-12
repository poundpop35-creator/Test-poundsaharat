'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),createCore=require('../role-sprint-core.js');
function load(role,supplement=true){const ctx={window:{}};vm.createContext(ctx);for(const n of ['data','1','2','3','4',...(supplement?['b']:[])])vm.runInContext(fs.readFileSync(path.join(root,`${role}-sprint-${n}.js`),'utf8'),ctx);if(supplement)vm.runInContext(fs.readFileSync(path.join(root,'role-research.js'),'utf8'),ctx);return JSON.parse(JSON.stringify(ctx.window.ROLE_SPRINT));}
for(const role of ['rd','energy']){
  test(`${role}: 200 sourced questions in disjoint 100-question sets`,()=>{
    const d=load(role);assert.equal(d.questions.length,200);assert.equal(new Set(d.questions.map(q=>q.id)).size,200);assert.equal(new Set(d.questions.map(q=>q.q.trim())).size,200);
    assert.deepEqual(d.sets.map(s=>s.ids.length),[100,100]);assert.equal(new Set(d.sets.flatMap(s=>s.ids)).size,200);
    for(const q of d.questions){assert.equal(q.c.length,4,q.id);assert.equal(new Set(q.c).size,4,q.id);assert.ok(q.a>=0&&q.a<4&&Number.isInteger(q.a),q.id);assert.ok(q.e&&q.reference&&q.sources.length,q.id);for(const k of q.sources)assert.match(d.sources[k]?.url||'',/^https:\/\//,q.id+': '+k);}
    for(const row of [...d.briefing.recall,...d.briefing.updates])for(const k of row[2].split(','))assert.ok(d.sources[k],k);
    assert.deepEqual(d.counts,d.topics.map((_,i)=>d.questions.filter(q=>q.topic===i+1).length));
    if(role==='energy')for(const set of d.sets){const qs=set.ids.map(id=>d.questions.find(q=>q.id===id));assert.equal(qs.filter(q=>q.section==='general').length,25);assert.equal(qs.filter(q=>q.section==='specific').length,75);}
  });
  test(`${role}: legacy answer order, answers and progress survive extension`,()=>{
    const old=load(role,false),updated=load(role),before=createCore(old),after=createCore(updated);
    let s=before.createSession(old.questions.map(q=>q.id),'exam','old session',()=>.31);for(let i=0;i<9;i++)s=before.next(before.answer(s,i%4));
    const snapshot=JSON.stringify(s);assert.ok(after.valid(s));assert.equal(JSON.stringify(s),snapshot);assert.equal(after.score(s).answered,9);for(const q of old.questions)assert.deepEqual(after.byId.get(q.id),q);
    const records=before.progress({},s);assert.deepEqual(after.progress({},s),records);
  });
  test(`${role}: new set can finish, score, retry wrong answers and reject broken session`,()=>{
    const d=load(role),c=createCore(d);let s=c.createSession(d.sets[0].ids,'exam','new');for(let i=0;i<100;i++){const q=c.byId.get(s.ids[s.idx]);s=c.next(c.answer(s,i%5===0?(q.a+1)%4:q.a));}
    assert.ok(c.valid(s));assert.ok(s.complete);assert.equal(c.score(s).correct,80);assert.equal(c.score(s).wrong.length,20);
    let retry=c.createSession(c.score(s).wrong,'practice','retry');for(let i=0;i<20;i++){const q=c.byId.get(retry.ids[retry.idx]);retry=c.next(c.answer(retry,q.a));}assert.equal(c.score(retry).correct,20);
    assert.equal(c.valid({...s,ids:[...s.ids,'missing']}),false);
  });
}
test('independently recomputed multistep numerical answers',()=>{
  const rd=load('rd'),en=load('energy');const checks=[
    [rd,'rd-b-001',214000-(214000/1.07)*.01,0],
    [rd,'rd-b-005',35000-(24000-4000),0],
    [rd,'rd-b-006',150000*.05+100000*.10,0],
    [rd,'rd-b-009',(50000-2000)*1.07,0],
    [en,'energy-b-011',1000*.8*.75,0],
    [en,'energy-b-026',120000/(40000-10000),0],
    [en,'energy-b-027',-100000+60000/1.1+60000/(1.1**2),0],
    [en,'energy-b-030',100000*(1-.8*.9),0],
    [en,'energy-b-043',(200*.1+50)/(200+50)*100,0],
    [en,'energy-b-044',1250*.8*42,0],
    [en,'energy-b-056',Math.sqrt(3)*400*20*.8/1000,2],
    [en,'energy-b-058',90/.75-90/.9,0],
    [en,'energy-b-061',40000*.7*4,0],
    [en,'energy-b-062',30*4.5*.8*30,0],
    [en,'energy-b-063',10*.8*.9/1.8,0],
    [en,'energy-b-064',(24/2-24/4)*1600,0],
    [en,'energy-b-065',8*.8**3,3],
    [en,'energy-b-066',1000*9.81*.01*20/.7/1000,2],
    [en,'energy-b-067',500*4.2*40/.8/3600,2],
    [en,'energy-b-068',2000-1200/.75,0],
    [en,'energy-b-069',(36-18)*200/1000*2000*4,0]
  ];
  for(const [d,id,expected,decimals] of checks){const q=d.questions.find(q=>q.id===id),a=q.c[q.a];const number=Number(a.replaceAll(',','').match(/\d+(?:\.\d+)?/)[0]);assert.ok(Math.abs(number-expected)<=.51*10**(-decimals),`${id}: ${number} vs ${expected}`);}
});
