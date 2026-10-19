'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),C=require('../energy-intensive-core.js');
const dir=path.join(__dirname,'..');
const ready=['A','B','C','D','E'].every(s=>fs.existsSync(path.join(dir,`energy-intensive-set-${s.toLowerCase()}.json`)));
test('authored bank has 500 valid items and all five shuffled exams score correctly',{},()=>{
 const documents=['A','B','C','D','E'].map(s=>JSON.parse(fs.readFileSync(path.join(dir,`energy-intensive-set-${s.toLowerCase()}.json`),'utf8'))),sources=JSON.parse(fs.readFileSync(path.join(dir,'energy-intensive-sources.json'),'utf8'));
 const model=C.validate(documents,sources,{topicCounts:C.BLUEPRINT,answerBalance:true,metadata:true});assert.equal(model.questions.length,500);assert.equal(model.questions.filter(q=>q.section==='general').length,125);assert.ok(model.questions.every(q=>['practice','existing_practice'].includes(q.provenance)));
 const allPlanIds=[];
 for(const set of model.sets){
  let session=C.createSession(set.ids,'exam',set.title,model,()=>.31,1000);while(!session.complete){session=C.answer(session,model.byId.get(session.ids[session.idx]).a);session=C.advance(session,2000);}assert.equal(C.score(session.ids,session.answers,model).correct,100);
  for(const part of [0,1]){const ids=set.ids.filter((_,i)=>i%2===part);assert.equal(ids.length,50);allPlanIds.push(...ids);}
 }
 assert.equal(new Set(allPlanIds).size,500);
});
