/* Usage: node tests/opsmoac-sprint.browser.js http://127.0.0.1:8765
   Requires Playwright and Chromium. Override CHROMIUM_PATH for your installation.
   Uses a fresh isolated browser context; never touches a user's saved progress. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=(process.argv[2]||'http://127.0.0.1:8765').replace(/\/$/,''),key='opsmoac60:v1';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1366,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 const clickAnswer=async(correct=true)=>{const n=await page.evaluate(({k,correct})=>{const s=JSON.parse(localStorage.getItem(k)).session,q=window.OPS_SPRINT.questions.find(q=>q.id===s.ids[s.idx]);return correct?q.a:(q.a+1)%4;},{k:key,correct});await page.locator(`[data-option="${n}"]`).click();};
 const finish=async()=>{while(await page.locator('#quiz').isVisible()){const s=await read();if(s.answers[s.ids[s.idx]]===undefined)await clickAnswer();await page.locator('#next').click();}};
 await page.goto(base+'/index.html');await page.locator('a[href="opsmoac-sprint.html"]').first().click();await page.waitForSelector('#sets article');
 assert.equal(await page.locator('#sets article').count(),3);assert.equal(await page.locator('#topicButtons button').count(),5);
 await page.evaluate(()=>{localStorage.setItem('sao48:v1','{"sentinel":true}');localStorage.setItem('exam-tutor-v1:opsmoac','{"sentinel":true}');});
 await page.screenshot({path:'/tmp/ops-desktop.png',fullPage:true});
 await page.locator('[data-start="1"]').first().click();assert.equal(await page.locator('#next').isDisabled(),true);
 await clickAnswer(false);assert.equal(await page.locator('#answerFeedback .feedback').count(),1);assert.ok(await page.locator('#answerFeedback a').count());
 await page.locator('#mark').click();await page.locator('#next').click();const saved=await read();
 await page.locator('#pause').click();page.once('dialog',d=>d.dismiss());await page.locator('[data-start="2"]').click();assert.deepEqual((await read()).session,saved.session);
 await page.reload();await page.locator('#resume').click();assert.deepEqual((await read()).session,saved.session);await finish();
 assert.match(await page.locator('.result-score').innerText(),/^19\/20/);assert.equal((await read()).history.length,1);
 await page.locator('#resultWrong').click();await finish();assert.match(await page.locator('.result-score').innerText(),/^1\/1/);
 await page.locator('#backDashboard').click();assert.equal(await page.locator('#wrongBtn').isDisabled(),true);
 await page.locator('#markedBtn').click();assert.match(await page.locator('#counter').innerText(),/1\/1/);await finish();await page.locator('#backDashboard').click();
 for(const set of ['2','3']){await page.locator('input[value="exam"]').check();await page.locator(`[data-start="${set}"]`).click();await clickAnswer();assert.equal(await page.locator('#answerFeedback .feedback').count(),0);await finish();assert.match(await page.locator('.result-score').innerText(),/^20\/20/);await page.locator('#backDashboard').click();}
 await page.locator('#allBtn').click();await clickAnswer();assert.equal(await page.locator('#answerFeedback .feedback').count(),0);await finish();assert.match(await page.locator('.result-score').innerText(),/^60\/60/);
 assert.equal(await page.locator('#result details').count(),60);assert.equal(await page.locator('#result tbody tr').count(),5);
 assert.equal(await page.evaluate(()=>localStorage.getItem('sao48:v1')),'{"sentinel":true}');assert.equal(await page.evaluate(()=>localStorage.getItem('exam-tutor-v1:opsmoac')),'{"sentinel":true}');
 await page.locator('#backDashboard').click();await page.locator('a[href="opsmoac.html"]').click();assert.ok(await page.locator('a[href="opsmoac-sprint.html"]').count());await page.goBack();await page.locator('#resume').click();assert.match(await page.locator('.result-score').innerText(),/^60\/60/);
 await page.setViewportSize({width:320,height:740});await page.locator('#backDashboard').click();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/ops-mobile.png',fullPage:true});
 await page.locator('[data-start="1"]').first().click();await clickAnswer();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/ops-mobile-question.png',fullPage:true});
 const broken=await context.newPage();await broken.goto(base+'/opsmoac-sprint.html');await broken.evaluate(k=>localStorage.setItem(k,'{broken'),key);await broken.reload();assert.equal(await broken.locator('#storageNotice').isVisible(),true);assert.equal(await broken.locator('#sets article').count(),3);
 const blockedContext=await browser.newContext();await blockedContext.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}})});const blocked=await blockedContext.newPage();await blocked.goto(base+'/opsmoac-sprint.html');assert.equal(await blocked.locator('#storageNotice').isVisible(),true);await blocked.locator('[data-start="1"]').first().click();await blocked.locator('[data-option]').first().click();assert.equal(await blocked.locator('#next').isEnabled(),true);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: desktop/mobile, 3 x 20 + all 60, practice/exam feedback, sources, resume/reload, cancel, repeat, marks, wrong retry, navigation/back, independent storage, corrupt and blocked storage; no page errors.');
})().catch(e=>{console.error(e);process.exit(1)});
