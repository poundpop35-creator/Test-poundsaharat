/* node tests/opsmoac-sprint.browser.js http://127.0.0.1:8765
   Requires Playwright + Chromium; CHROMIUM_PATH overrides executable.
   Always uses isolated storage. Can also import run(browser, base, screenshotDir). */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async function run(browser,base,out){
 base=base.replace(/\/$/,'');const key='opsmoac60:v1',report=[],errors=[];
 const context=await browser.newContext({viewport:{width:1280,height:960}}),page=await context.newPage();
 const fontDir=path.resolve(__dirname,'../qa/fonts');
 if(fs.existsSync(fontDir))await context.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:[400,500,600,700].map(w=>`@font-face{font-family:Sarabun;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(fontDir,'sarabun-thai-'+w+'-normal.woff2')).toString('base64')});font-weight:${w}}`).join('')}));
 page.on('pageerror',e=>errors.push(e.message));
 const check=(v,label)=>{assert.ok(v,label);report.push(label);},read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 async function answer(correct=true){const a=await page.evaluate(({key,correct})=>{const s=JSON.parse(localStorage.getItem(key)).session,q=window.OPS_SPRINT.questions.find(q=>q.id===s.ids[s.idx]);return correct?q.a:(q.a+1)%4;},{key,correct});await page.locator(`[data-option="${a}"]`).click();assert.equal(await page.locator('#answerFeedback .feedback li').count(),4);}
 async function finish(){return page.evaluate(key=>{let count=0;while(!document.getElementById('quiz').hidden){if(++count>100)throw Error('Loop');const s=JSON.parse(localStorage.getItem(key)).session,q=window.OPS_SPRINT.questions.find(q=>q.id===s.ids[s.idx]);if(s.answers[q.id]===undefined)document.querySelector(`[data-option="${q.a}"]`).click();if(document.querySelectorAll('#answerFeedback .feedback li').length!==4)throw Error('Missing choice feedback');if(!document.querySelector('#answerFeedback a[href^="https://"]'))throw Error('Missing source');document.getElementById('next').click();}return count;},key);}
 try{
  await page.goto(base+'/index.html');await page.waitForSelector('.agency-card.priority');
  check((await page.locator('.agency-card.priority').textContent()).includes('300 ข้อ'),'Homepage advertises 300');
  await page.goto(base+'/study.html?page=opsmoac');await page.waitForSelector('#study-frame[data-ready]');
  const legacy=page.frameLocator('#study-frame');check((await legacy.locator('.app-sprint-tab').textContent()).includes('300 ข้อ'),'Legacy tab links to 300');
  await page.goto(base+'/opsmoac-sprint.html');await page.waitForSelector('#examSets article');
  check(await page.locator('#examSets article').count()===3,'Three full sets visible');check((await page.locator('#stats').textContent()).includes('/300'),'Progress denominator 300');
  await page.setViewportSize({width:320,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Landing fits 320px');
  if(out)await page.screenshot({path:path.join(out,'ops300-mobile.png'),fullPage:false});
  const old=await page.evaluate(()=>{const D=window.OPS_SPRINT,C=window.createOPSSprintCore(D);let session=C.createSession(D.questions.filter(q=>q.id.startsWith('ops60-')).map(q=>q.id),'exam','เดิม 60 ข้อ',()=>.31);session=C.next(C.answer(session,2));const state={records:{},marked:[],history:[],session};localStorage.setItem('opsmoac60:v1',JSON.stringify(state));localStorage.setItem('sao48:v1','{"sentinel":true}');return JSON.stringify(state);});
  await page.reload();await page.locator('#resume').click();check((await page.locator('#counter').textContent()).includes('2/60'),'Legacy 60 resumes');check(await page.evaluate(k=>localStorage.getItem(k),key)===old,'Legacy session preserved');
  await page.locator('#pause').click();page.once('dialog',d=>d.dismiss());await page.locator('#allPractice').click();check(await page.evaluate(k=>localStorage.getItem(k),key)===old,'Cancel retains old session');
  page.once('dialog',d=>d.accept());await page.locator('#allPractice').click();check((await read()).session.ids.length===100,'Primary button starts only 100');
  await answer(false);await page.locator('#mark').click();check(await page.locator('#answerFeedback a[target="_blank"]').count()>0,'Direct source buttons open separately');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Question and feedback fit 320px');
  if(out)await page.screenshot({path:path.join(out,'ops300-feedback.png'),fullPage:false});
  await page.locator('#next').click();for(let i=1;i<10;i++){await answer();await page.locator('#next').click();}
  const saved=await page.evaluate(k=>localStorage.getItem(k),key);await page.locator('#pause').click();await page.locator('.app-brand').click();await page.waitForURL('**/index.html');await page.locator('#home-recent a').click();await page.waitForSelector('#quiz:not([hidden])');
  check((await page.locator('#counter').textContent()).includes('11/100'),'Homepage resumes at question 11');check(await page.evaluate(k=>localStorage.getItem(k),key)===saved,'Answers and shuffle survive navigation');
  await finish();check((await page.locator('.result-score').textContent()).includes('99/100'),'Set one score 99/100');check((await page.locator('.exam-points').textContent()).includes('198/200'),'Set one score 198/200');
  check(await page.locator('#result details').count()===100&&await page.locator('#result .feedback li').count()===400,'All 100 answers and 400 choice reasons');
  await page.locator('#nextSet').click();check((await read()).session.ids.every(id=>Number(id.slice(-3))>=201),'Next starts second distinct 100');await answer();await finish();check((await page.locator('.exam-points').textContent()).includes('200/200'),'Second set scores 200');
  await page.locator('#nextSet').click();check((await read()).session.ids.every(id=>!id.startsWith('ops300-')),'Third set is original 100');await answer();await finish();check((await page.locator('.exam-points').textContent()).includes('200/200'),'Third set scores 200');
  check(await page.locator('#nextSet').isHidden(),'No extra fourth set');check(Object.keys((await read()).records).length===300,'300 distinct questions completed');
  await page.locator('#backDashboard').click();await page.locator('#wrongBtn').click();await finish();check((await page.locator('.result-score').textContent()).includes('1/1'),'Wrong retry succeeds');
  await page.locator('#backDashboard').click();check(await page.locator('#wrongBtn').isDisabled(),'Wrong ledger clears');await page.locator('#markedBtn').click();await finish();await page.locator('#backDashboard').click();await page.locator('#focusBtn').click();check((await read()).session.ids.length===20,'Focus drill has 20');await answer();
  check(await page.evaluate(()=>localStorage.getItem('sao48:v1'))==='{"sentinel":true}','Other agency progress untouched');
  const before=await page.evaluate(k=>localStorage.getItem(k),key);await page.route('**/opsmoac-sprint-b2.js*',route=>route.abort());await page.goto(base+'/opsmoac-sprint.html');check(await page.locator('#bankNotice').isVisible()&&await page.locator('#allPractice').isDisabled(),'Missing part blocks incorrect bank');check(await page.evaluate(k=>localStorage.getItem(k),key)===before,'Missing part preserves progress');
  check(errors.length===0,'No JavaScript errors');return report;
 }finally{await context.close();}
};
if(require.main===module){const {chromium}=require('playwright');(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{const report=await module.exports(browser,process.argv[2]||'http://127.0.0.1:8765',process.env.SCREENSHOT_DIR);console.log('PASS browser: '+report.join('; '));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});}
