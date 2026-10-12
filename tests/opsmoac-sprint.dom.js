/* Optional integration check: NODE_PATH=/path/to/node_modules node tests/opsmoac-sprint.dom.js
   Requires jsdom. This verifies interaction and persistence, not rendered layout. */
'use strict';
const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),key='opsmoac60:v1',html=fs.readFileSync(path.join(root,'opsmoac-sprint.html'),'utf8');
const names=['data','extra','a1','a2','b1','b2','300','core'].map(n=>'opsmoac-sprint-'+n+'.js').concat('opsmoac-sprint.js');
const scripts=names.map(f=>fs.readFileSync(path.join(root,f),'utf8')),errors=[];
function load(saved={},blocked=false,missing=''){
  const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{url:'https://exam.test/opsmoac-sprint.html',runScripts:'outside-only',virtualConsole:vc}),w=dom.window;
  w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>false;
  if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('blocked')}});else for(const [k,v]of Object.entries(saved))w.localStorage.setItem(k,v);
  scripts.forEach((s,i)=>{if(names[i]!==missing)w.eval(s);});return w;
}
let w=load({'sao48:v1':'{"sentinel":true}','exam-tutor-v1:opsmoac':'{"sentinel":true}'});
const el=s=>w.document.querySelector(s),click=s=>{const e=el(s);assert.ok(e,s);e.click();},state=()=>JSON.parse(w.localStorage.getItem(key)),shown=s=>!el(s).hidden;
function answer(correct=true){const s=state().session,q=w.OPS_SPRINT.questions.find(q=>q.id===s.ids[s.idx]);click(`[data-option="${correct?q.a:(q.a+1)%4}"]`);assert.equal(w.document.querySelectorAll('#answerFeedback .feedback li').length,4);assert.ok(el('#answerFeedback a[href^="https://"]'));}
function finish(){let guard=0;while(shown('#quiz')){assert.ok(guard++<=100);const s=state().session;if(s.answers[s.ids[s.idx]]===undefined)answer();click('#next');}}
assert.equal(w.document.querySelectorAll('#examSets article').length,3);assert.equal(w.document.querySelectorAll('#sets article').length,5);
click('#allPractice');assert.equal(state().session.ids.length,100);assert.ok(el('#next').disabled);answer(false);click('#mark');click('#next');
const saved=JSON.stringify(state().session);click('#pause');click('[data-exam="new-2"]');assert.equal(JSON.stringify(state().session),saved);
const storage=Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]));w.close();w=load(storage);click('#resume');assert.equal(JSON.stringify(state().session),saved);finish();
assert.match(el('.result-score').textContent,/99\/100/);assert.match(el('.exam-points').textContent,/198\/200/);assert.equal(w.document.querySelectorAll('#result details').length,100);assert.equal(w.document.querySelectorAll('#result .feedback li').length,400);
assert.ok(shown('#nextSet'));click('#nextSet');assert.ok(state().session.ids.every(id=>Number(id.slice(-3))>=201));finish();assert.match(el('.exam-points').textContent,/200\/200/);
click('#nextSet');assert.ok(state().session.ids.every(id=>!id.startsWith('ops300-')));finish();assert.ok(!shown('#nextSet'));assert.equal(Object.keys(state().records).length,300);assert.equal(state().history.length,3);
click('#backDashboard');assert.match(el('#stats').textContent,/300\/300/);click('#wrongBtn');finish();assert.match(el('.result-score').textContent,/1\/1/);click('#backDashboard');assert.ok(el('#wrongBtn').disabled);click('#markedBtn');finish();click('#backDashboard');
click('#focusBtn');assert.equal(state().session.ids.length,20);finish();click('#backDashboard');click('[data-start="1"]');finish();assert.match(el('.result-score').textContent,/20\/20/);
assert.equal(w.localStorage.getItem('sao48:v1'),'{"sentinel":true}');assert.equal(w.localStorage.getItem('exam-tutor-v1:opsmoac'),'{"sentinel":true}');
// Missing data must not erase existing progress.
const finalSaved=w.localStorage.getItem(key);w.close();w=load({[key]:finalSaved},false,'opsmoac-sprint-b2.js');assert.ok(shown('#bankNotice'));assert.ok(el('#allPractice').disabled);assert.equal(w.localStorage.getItem(key),finalSaved);w.close();
// Legacy exam sessions retain the immediate feedback behavior already in main.
w=load();const C=w.createOPSSprintCore(w.OPS_SPRINT);let session=C.createSession(w.OPS_SPRINT.examSets[2].ids,'exam','old 100');session=C.next(C.answer(session,1));w.close();
w=load({[key]:JSON.stringify({records:{},marked:[],history:[],session})});click('#resume');assert.match(el('#counter').textContent,/2\/100/);answer();w.close();
w=load({[key]:'{broken'});assert.ok(shown('#storageNotice'));assert.equal(w.document.querySelectorAll('#examSets article').length,3);w.close();
w=load({},true);assert.ok(shown('#storageNotice'));click('#allPractice');click('[data-option]');assert.ok(!el('#next').disabled);assert.equal(w.document.querySelectorAll('#answerFeedback .feedback li').length,4);w.close();
assert.deepEqual(errors,[]);console.log('PASS DOM: 3 x 100, 200-point scoring, immediate explanations/sources, next-set flow, resume, cancel, wrong/marked/focus/mini drills, separate storage, legacy session, incomplete bank, corrupt/blocked storage.');
