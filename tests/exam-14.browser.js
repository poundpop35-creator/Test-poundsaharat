/* NODE_PATH=<playwright modules> CHROMIUM_PATH=<chromium> node tests/exam-14.browser.js [base] */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const base=(process.argv[2]||'http://127.0.0.1:8765').replace(/\/$/,''),errors=[];
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 try{
  if(process.env.FONT_DIR)await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:[400,500,600,700].map(w=>`@font-face{font-family:Sarabun;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(process.env.FONT_DIR,`sarabun-thai-${w}-normal.woff2`)).toString('base64')});font-weight:${w}}`).join('')}));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/index.html');await page.locator('.home-focus').click();await page.waitForSelector('.lesson-card.rd');
  assert.equal(await page.locator('#course-error').isHidden(),true);assert.equal(await page.locator('.time-box').count(),6);
  await page.evaluate(()=>{localStorage.setItem('rd100:v1','{"legacy":"keep-rd"}');localStorage.setItem('energy100:v1','{"legacy":"keep-energy"}');});
  await page.locator('[data-hours="4"]').click();assert.match(await page.locator('.day-top').innerText(),/240 นาที/);
  await page.locator('[data-hours="3"]').click();assert.match(await page.locator('.day-top').innerText(),/180 นาที/);
  for(const w of [1280,390,320]){await page.setViewportSize({width:w,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'reading width '+w);}
  if(process.env.SCREENSHOT_DIR){fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});await page.setViewportSize({width:1280,height:900});await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'course-desktop.png')});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'course-mobile.png')});}
  await page.locator('[data-read="rd-1"]').check();await page.locator('[data-done="1"]').check();await page.locator('#daily-notes').fill('ทวนอำนาจกับวิธี <b>literal</b>');
  await page.goto(base+'/exam-14.html#day-1-quiz');await page.waitForSelector('.quiz-item');assert.equal(await page.locator('.quiz-item').count(),20);
  // Answer all questions, two incorrectly. Use rendered choice values, independent of shuffle.
  await page.evaluate(()=>{const m=Exam14Core.build(EXAM14),ids=m.quizzes[0];ids.forEach((id,i)=>{const q=m.all.get(id),choice=i<2?(q.a+1)%4:q.a;document.querySelector(`[data-answer="${id}"][data-choice="${choice}"]`).click();});});
  assert.match(await page.locator('#quiz-score').innerText(),/ตอบ 20\/20 · ถูก 18/);await page.reload();assert.match(await page.locator('#quiz-score').innerText(),/ถูก 18/);assert.equal(await page.locator('.feedback').count(),20);
  await page.locator('#wrong-link').click();await page.waitForSelector('.quiz-item');assert.equal(await page.locator('.quiz-item').count(),2);await page.locator('[data-retry="wrong"]').click();assert.equal(await page.locator('.feedback').count(),0);
  await page.evaluate(()=>{const m=Exam14Core.build(EXAM14);document.querySelectorAll('.quiz-item').forEach(el=>{const id=el.id.slice('question-'.length),q=m.all.get(id);el.querySelector(`[data-choice="${q.a}"]`).click();});});assert.match(await page.locator('#wrong-link').innerText(),/\(0\)/);
  await page.goto(base+'/exam-14.html#day-1-write');await page.waitForSelector('#essay');const text='ประเด็น: แบ่งซื้อเพื่อเปลี่ยนวิธีไม่ได้ <script>window.BAD=1</script>';
  await page.locator('#essay').fill(text);await page.locator('[data-rubric="rd-1"][data-index="0"]').check();await page.locator('[data-writing-role="energy"]').first().click();await page.locator('#essay').fill('พลังงาน = กำลัง × เวลา');await page.reload();assert.equal(await page.locator('#essay').inputValue(),'พลังงาน = กำลัง × เวลา');await page.locator('[data-writing-role="rd"]').first().click();assert.equal(await page.locator('#essay').inputValue(),text);assert.match(await page.locator('#rubric-score').innerText(),/2 \/ 10/);assert.equal(await page.evaluate(()=>window.BAD),undefined);
  await page.goto(base+'/exam-14.html#day-1-rd');assert.ok(await page.locator('[data-read="rd-1"]').isChecked());assert.ok(await page.locator('[data-done="1"]').isChecked());assert.equal(await page.locator('#daily-notes').inputValue(),'ทวนอำนาจกับวิธี <b>literal</b>');
  for(const role of ['rd','energy'])for(let d=1;d<=14;d++){await page.goto(base+`/exam-14.html#day-${d}-${role}`);await page.waitForSelector(`.lesson-card.${role}`);assert.ok(await page.locator('.lesson-card h2').innerText());assert.equal(await page.locator('.recall-item').count(),2);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${role} day ${d}`);}
  await page.goto(base+'/exam-14.html#plan');assert.equal(await page.locator('.plan-row').count(),14);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('rd100:v1'),localStorage.getItem('energy100:v1')]),['{"legacy":"keep-rd"}','{"legacy":"keep-energy"}']);
  await page.goto(base+'/study.html?page=rd#read');await page.waitForSelector('#study-frame[data-ready]');await page.frameLocator('#study-frame').locator('a[href="exam-14.html#day-1-rd"]').click();await page.waitForURL('**/exam-14.html#day-1-rd');
  await page.goto(base+'/study.html?page=exam-14#plan');await page.waitForURL('**/exam-14.html#plan');
  const before=await page.evaluate(()=>localStorage.getItem('exam14:rd-energy:v1'));await page.route('**/energy-sprint-b.js*',r=>r.abort());await page.goto(base+'/exam-14.html');assert.ok(await page.locator('#course-error').isVisible());assert.equal(await page.evaluate(()=>localStorage.getItem('exam14:rd-energy:v1')),before);
  assert.deepEqual(errors,[]);console.log('PASS: entry routes, 28 lessons, 3/4-hour totals, 320/390/1280px, quiz scoring/reload/retry, essays/rubric/notes persistence, legacy storage preserved, missing data guard, no JS errors');
  const blocked=await browser.newContext();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked storage')}})});const p=await blocked.newPage();await p.goto(base+'/exam-14.html#day-1-write');await p.waitForSelector('#essay');await p.locator('#essay').fill('ยังเขียนต่อได้');assert.ok(await p.locator('#course-storage').isVisible());assert.equal(await p.locator('#essay').inputValue(),'ยังเขียนต่อได้');await blocked.close();console.log('PASS: blocked storage remains usable and reports failure');
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
