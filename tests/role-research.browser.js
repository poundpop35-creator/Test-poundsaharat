/* NODE_PATH=<playwright modules> CHROMIUM_PATH=<chromium> node tests/role-research.browser.js [base]
   Runs only in isolated browser storage. SCREENSHOT_DIR is optional. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const base=(process.argv[2]||'http://127.0.0.1:8765').replace(/\/$/,''),errors=[];
 try{
  for(const role of ['rd','energy']){
   const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),key=role+'100:v1';page.on('pageerror',e=>errors.push(e.message));
   // Local fonts make offline screenshots reproducible when supplied.
   if(process.env.FONT_DIR)await context.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:[400,500,600,700].map(w=>`@font-face{font-family:Sarabun;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(process.env.FONT_DIR,`sarabun-thai-${w}-normal.woff2`)).toString('base64')});font-weight:${w}}`).join('')}));
   await page.goto(base+`/${role}-sprint.html`);await page.waitForSelector('#setPicker option',{state:'attached'});assert.equal(await page.locator('#setPicker option').count(),2);assert.ok((await page.locator('#stats').textContent()).includes('/200'));assert.equal(await page.locator('#bankNotice').isHidden(),true);
   for(const width of [320,390,1280]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),role+' layout '+width);}
   if(process.env.SCREENSHOT_DIR){await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,role+'-desktop.png'),fullPage:false});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,role+'-mobile.png'),fullPage:false});}
   const legacy=await page.evaluate(key=>{const d=window.ROLE_SPRINT,c=window.createRoleSprintCore(d),a=d.sets.find(s=>s.id==='a');let session=c.createSession(a.ids,'exam','old 100',()=>.3);session=c.next(c.answer(session,1));const state={records:{},marked:[],history:[],session};localStorage.setItem(key,JSON.stringify(state));return JSON.stringify(state);},key);
   await page.reload();await page.locator('#resume').click();assert.match(await page.locator('#counter').textContent(),/2\/100/);assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),legacy);
   await page.locator('#pause').click();page.once('dialog',d=>d.dismiss());await page.locator('#allPractice').click();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),legacy);
   page.once('dialog',d=>d.accept());await page.locator('#examStart').click();assert.ok(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).session.ids.every(id=>id.includes('-b-')),key));
   // Answer one incorrectly; exam mode must not expose the answer before completion.
   const wrong=await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key)).session,q=window.ROLE_SPRINT.questions.find(q=>q.id===s.ids[0]);return(q.a+1)%4;},key);await page.locator(`[data-option="${wrong}"]`).click();assert.equal(await page.locator('#answerFeedback .feedback').count(),0);await page.locator('#mark').click();await page.locator('#next').click();const saved=await page.evaluate(k=>localStorage.getItem(k),key);await page.reload();await page.locator('#resume').click();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),saved);
   await page.evaluate(key=>{let guard=0;while(!document.getElementById('quiz').hidden){if(++guard>100)throw Error('quiz loop');const s=JSON.parse(localStorage.getItem(key)).session,q=window.ROLE_SPRINT.questions.find(q=>q.id===s.ids[s.idx]);if(s.answers[q.id]===undefined)document.querySelector(`[data-option="${q.a}"]`).click();document.getElementById('next').click();}},key);
   assert.match(await page.locator('.result-score').textContent(),/99\/100/);assert.match(await page.locator('.exam-points').textContent(),/198\/200/);assert.equal(await page.locator('#result details').count(),100);assert.equal(await page.locator('#result .feedback').count(),100);if(role==='energy'){const t=await page.locator('#result').textContent();assert.ok(t.includes('/50 คะแนน')&&t.includes('/150 คะแนน'));}
   await page.locator('#backDashboard').click();await page.locator('#wrongBtn').click();assert.match(await page.locator('#counter').textContent(),/1\/1/);await page.locator('[data-option="0"]').click();assert.ok(await page.locator('#answerFeedback .source-link').count()>0);await page.locator('#next').click();await page.locator('#backDashboard').click();assert.equal(await page.locator('#wrongBtn').isDisabled(),true);
   await page.selectOption('#setPicker','a');await page.locator('[data-launch="0"]').evaluate(el=>el.closest('details').open=true);await page.locator('[data-launch="0"]').click();assert.ok(await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key)).session;return s.ids.length===20&&s.ids.every(id=>!id.includes('-b-'));},key));
   await page.goto(base+`/study.html?page=${role}#read`);await page.waitForSelector('#study-frame[data-ready]');const frame=page.frameLocator('#study-frame');assert.match(await frame.locator('.app-sprint-tab').textContent(),/200/);await frame.locator('.app-research-link a').click();await page.waitForURL(`**/${role}-sprint.html#briefing`);assert.ok(await page.locator('#briefing').isVisible());
   const before=await page.evaluate(k=>localStorage.getItem(k),key);await page.route(`**/${role}-sprint-b.js*`,route=>route.abort());await page.goto(base+`/${role}-sprint.html`);assert.ok(await page.locator('#bankNotice').isVisible());assert.ok(await page.locator('#allPractice').isDisabled());assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before);
   await context.close();console.log('PASS '+role+': sets, mobile, legacy resume, full exam, wrong retry, original URL, missing-data protection');
  }
  assert.deepEqual(errors,[]);console.log('PASS no browser JavaScript errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
