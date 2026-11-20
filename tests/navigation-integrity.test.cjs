'use strict';
/* Run with: node --test tests/navigation-integrity.test.cjs */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const exists=name=>fs.existsSync(path.join(root,name.split(/[?#]/)[0]));
const htmlFiles=fs.readdirSync(root).filter(name=>name.endsWith('.html'));
const context={window:{}};
vm.runInNewContext(read('app-catalog.js'),context);
const catalog=context.window.STUDY_CATALOG;
const isExternal=url=>/^(?:https?:|\/\/|mailto:|tel:|data:|blob:|javascript:)/i.test(url);
const asset=url=>url.split(/[?#]/)[0].replace(/^\.\//,'');
test('every catalog route, sprint, lesson, and secondary resource is present',()=>{
  assert.ok(catalog.length>0);
  for(const p of catalog){
    for(const item of [p,...(p.resources||[]),...(p.extras||[])]){
      if(item.file)assert.ok(exists(item.file),p.id+': missing '+item.file);
    }
    if(p.sprint)assert.ok(exists(p.sprint),p.id+': missing sprint '+p.sprint);
  }
});
test('all static local HTML links and script/style references point to real files',()=>{
  for(const name of htmlFiles){
    const content=read(name);
    const attrs=[...content.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)];
    for(const [,url] of attrs){
      if(!url||url.startsWith('#')||url.startsWith('?')||isExternal(url)||url.includes('$'+'{'))continue;
      const target=asset(url);
      if(!target)continue;
      assert.ok(exists(target),name+' points to missing '+url);
    }
  }
});
test('landing page and practice player load the unified interface',()=>{
  assert.match(read('index.html'),/portal-home\.css\?v=/);
  assert.match(read('index.html'),/portal-home\.js\?v=/);
  assert.match(read('practice500.html'),/portal-practice\.css\?v=/);
  assert.match(read('practice500.html'),/id="practice-links"/);
});
test('portal navigation targets are valid and core virtual routes remain supported',()=>{
  const home=read('index.html');
  for(const id of ['agencies','archive','resources','english']){
    assert.ok(home.includes('id="'+id+'"')||home.includes("id='"+id+"'"),'missing section '+id);
  }
  const shell=read('app-shell.js');
  for(const id of ['read','practice','summary','sources'])
    assert.ok(shell.includes(id+':'),id+' route must be handled');
  for(const agency of ['rd','dmh','drr','opsmoac','namban']){
    assert.ok(exists('practice500/'+agency+'.json.gz'),'missing '+agency+' bank');
  }
});
