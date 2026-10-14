'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
function arrayFrom(source,marker){
  const start=source.indexOf('[',source.indexOf(marker));let depth=0,quote=null,escape=false;
  for(let i=start;i<source.length;i++){
    const ch=source[i];
    if(quote){if(escape)escape=false;else if(ch==='\\')escape=true;else if(ch===quote)quote=null;}
    else if(['"',"'",'`'].includes(ch))quote=ch;
    else if(ch==='[')depth++;
    else if(ch===']'&&!--depth)return JSON.parse(JSON.stringify(vm.runInNewContext(source.slice(start,i+1))));
  }
  throw Error('Array missing: '+marker);
}
const originalKeys={energy:'7fdec43e162e08e31fac1712a1c7a00dcb304b280697aa99c7a1a5d484450e13',rd:'3fe97dc455c2c2e5ca9193541a1fa45f819364e4b4b4e650fb42b58e15b29d52'};
for(const role of ['energy','rd']){
  const ctx={window:{EXAM14:{lessons:{}}}};vm.createContext(ctx);
  for(const suffix of ['data','1','2','3','4','b'])vm.runInContext(fs.readFileSync(path.join(root,`${role}-sprint-${suffix}.js`),'utf8'),ctx);
  vm.runInContext(fs.readFileSync(path.join(root,`exam-14-${role}.js`),'utf8'),ctx);
  const sprint=JSON.parse(JSON.stringify(ctx.window.ROLE_SPRINT.questions));
  const html=fs.readFileSync(path.join(root,`${role}.html`),'utf8');
  const main=arrayFrom(html,'const TOPICS =').flatMap(t=>t.q),book=arrayFrom(html,'var BOOK_TOPICS=').flatMap(t=>t.q);
  const drill=JSON.parse(JSON.stringify(ctx.window.EXAM14.lessons[role].flatMap(l=>l.drill.map(d=>({q:d[0],c:d[1],a:0,e:d[2]})))));
  test(`${role}: revised banks retain usable questions and do not advertise answers by length`,()=>{
    assert.deepEqual([sprint.length,main.length,book.length,drill.length],role==='energy'?[200,48,195,28]:[200,81,217,28]);
    for(const [name,questions] of Object.entries({sprint,main,book,drill})){
      let longest=0,shortest=0,conspicuous=0;
      for(const q of questions){
        assert.equal(q.c.length,4,q.q);assert.equal(new Set(q.c.map(c=>c.trim())).size,4,q.q);
        assert.ok(Number.isInteger(q.a)&&q.a>=0&&q.a<4,q.q);assert.ok(q.e.trim(),q.q);
        const answer=q.c[q.a].length,wrong=q.c.filter((_,i)=>i!==q.a).map(c=>c.length);
        longest+=answer>Math.max(...wrong);shortest+=answer<Math.min(...wrong);conspicuous+=answer>1.5*Math.max(...wrong);
      }
      // A coarse regression alarm, not a measure of difficulty or proof of factual correctness.
      assert.ok(longest/questions.length<.45,`${name}: correct option is uniquely longest too often`);
      assert.ok(shortest/questions.length<.45,`${name}: avoid reversing the cue to shortest`);
      assert.ok(conspicuous/questions.length<.06,`${name}: conspicuously long answers`);
    }
  });
  test(`${role}: existing saved answers still address the original question IDs and answer indices`,()=>{
    // Snapshot from e3213b1, before the wording audit; sessions store original choice indices.
    const digest=crypto.createHash('sha256').update(JSON.stringify(sprint.map(q=>[q.id,q.a]).sort())).digest('hex');
    assert.equal(digest,originalKeys[role]);
  });
}
