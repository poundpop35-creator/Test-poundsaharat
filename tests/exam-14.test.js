'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const C=require('../exam-14-core.js'),root=path.join(__dirname,'..');
function load(){const ctx={window:{}};vm.createContext(ctx);const html=fs.readFileSync(path.join(root,'exam-14.html'),'utf8');for(const m of html.matchAll(/<script defer src="([^"]+)"/g)){const file=m[1].split('?')[0];if(['exam-14.js','app-shell.js'].includes(file))continue;vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);}return JSON.parse(JSON.stringify(ctx.window.EXAM14));}
test('course covers both official syllabi, preserves banks and builds 280 unique daily questions',()=>{
 const d=load(),m=C.build(d);assert.equal(d.lessons.rd.length,14);assert.equal(d.lessons.energy.length,14);
 assert.equal(m.quizzes.flat().length,280);assert.equal(new Set(m.quizzes.flat()).size,280);assert.equal([...m.all.values()].filter(q=>q.fresh).length,56);
 for(const role of ['rd','energy']){assert.equal(d.banks[role].questions.length,200);const seen=new Set(d.lessons[role].flatMap(l=>l.topics));assert.deepEqual([...seen].sort((a,b)=>a-b),Array.from({length:role==='rd'?8:11},(_,i)=>i+1));for(const l of d.lessons[role]){assert.equal(l.drill.length,2);assert.ok(l.blocks.length>=3);assert.ok(l.example.every(Boolean));assert.equal(l.recall.length,2);for(const k of l.sources)assert.match(d.banks[role].sources[k].url,/^https:\/\//);}}
 for(const ids of m.quizzes){assert.equal(ids.length,20);for(const role of ['rd','energy'])assert.equal(ids.filter(id=>m.all.get(id).role===role).length,10);}
 for(const q of m.all.values()){assert.equal(q.c.length,4,q.id);assert.equal(new Set(q.c).size,4,q.id);assert.ok(q.c[q.a]);assert.ok(q.e);assert.equal(new Set(C.order(q.id)).size,4);}
 assert.equal(d.lessons.energy.filter(l=>l.section==='general').length,3);
 assert.equal(d.lessons.energy.filter(l=>l.section==='specific').length,11);
 assert.equal(d.routine.reduce((n,r)=>n+r.minutes,0),180);assert.equal(d.routine.reduce((n,r)=>n+r.minutes+r.extra,0),240);
});
test('new numerical questions recompute independently',()=>{
 const m=C.build(load());const cases=[
 ['rd',4,1,450000*.001*6],['rd',9,1,535000-535000/1.07*.01],['rd',10,1,60000-(34000-9000)],['rd',10,2,18000-12000],['rd',13,1,2000*(37-35)],['rd',14,1,267500-267500/1.07*.01-1000],
 ['energy',1,1,2.4*5*25],['energy',2,1,72/.8-72/.9],['energy',2,2,18/.9],['energy',3,1,240000/(80000-20000)],['energy',3,2,-100000+121000/1.1],['energy',4,2,(1-.85*.8)*100],['energy',12,1,40*4*.75*30],['energy',12,2,30/5]
 ];for(const [role,day,i,value] of cases){const q=m.all.get(`e14-${role}-${day}-${i}`);const actual=Number(q.c[q.a].replaceAll(',','').match(/\d+(?:\.\d+)?/)[0]);assert.ok(Math.abs(actual-value)<1e-6,q.id);}
});
test('restore validates state without accepting missing questions or invalid choices',()=>{
 const m=C.build(load()),id=m.quizzes[0][0];const s=C.clean({day:99,role:'other',hours:4,done:[1,1,-4,14,15],answers:{[id]:2,bad:1},records:{[id]:8},writing:{'rd-1':'<b>literal answer</b>'},checks:{'rd-1':[true,false,1,true,false]},notes:{1:'จำจุดเริ่มนับ'}},m.all);
 assert.equal(s.day,1);assert.equal(s.role,'rd');assert.equal(s.hours,4);assert.deepEqual(s.done,[1,14]);assert.deepEqual(s.answers,{[id]:2});assert.deepEqual(s.records,{});assert.equal(s.writing['rd-1'],'<b>literal answer</b>');assert.deepEqual(s.checks['rd-1'],[true,false,false,true,false]);assert.deepEqual(C.clean(s,m.all),s);assert.deepEqual(C.reviewDays(8),[7,5,1]);
});
test('missing bank data fails visibly instead of giving an incomplete course',()=>{const d=load();d.banks.energy.questions.pop();assert.throws(()=>C.build(d),/ไม่ครบ/);});
