(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EnergyIntensiveCore=api;})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const STORAGE_KEY='energy-intensive:500:v1';
  const TOPICS=['หน่วยงาน วิสัยทัศน์ พันธกิจ และยุทธศาสตร์','พื้นฐานพลังงาน น้ำมัน ก๊าซ ไฟฟ้า และการอนุรักษ์','จริยธรรมข้าราชการพลเรือน','วิเคราะห์และจัดทำแผนพัฒนาพลังงาน','น้ำมัน ก๊าซ ไฟฟ้า การทดสอบและตรวจสอบ','พลังงานทดแทน เทคโนโลยี และการอนุรักษ์','พ.ร.บ.ควบคุมน้ำมันเชื้อเพลิง พ.ศ.2542','พ.ร.บ.การค้าน้ำมันเชื้อเพลิง พ.ศ.2543','พ.ร.บ.การส่งเสริมการอนุรักษ์พลังงาน พ.ศ.2535','พ.ร.บ.การประกอบกิจการพลังงาน พ.ศ.2550','พ.ร.บ.กองทุนน้ำมันเชื้อเพลิง พ.ศ.2562'];
  const BLUEPRINT={a:[10,9,6,8,11,8,10,9,10,9,10],b:[8,10,7,8,10,12,9,9,9,9,9],c:[8,10,7,12,13,10,8,8,8,8,8],d:[9,9,7,13,10,12,8,8,8,8,8],e:[9,10,6,10,13,12,8,8,8,8,8]};
  const normalized=s=>String(s).normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu,'');
  const isText=s=>typeof s==='string'&&s.trim().length>0;
  function validate(documents,sourceCatalog,options={}){
    const errors=[],questions=[],sets=[],ids=new Set(),stems=new Map(),sources={...sourceCatalog};
    if(!Array.isArray(documents)||documents.length!==5)errors.push('ต้องมีชุดข้อสอบ 5 ชุด');
    const setIds=new Set();
    for(const [index,doc]of (documents||[]).entries()){
      const setId=String(doc.setId||doc.id||String.fromCharCode(97+index)).toLowerCase();
      if(!Object.hasOwn(BLUEPRINT,setId))errors.push('รหัสชุดต้องเป็น A ถึง E: '+setId);
      if(setIds.has(setId))errors.push('รหัสชุดซ้ำ '+setId);setIds.add(setId);
      for(const[key,source]of Object.entries(doc.sources||{})){if(sources[key]&&sources[key].url!==source.url)errors.push('แหล่งอ้างอิงชื่อเดียวกันแต่ URL ต่างกัน: '+key);else sources[key]=source;}
      const qs=Array.isArray(doc)?doc:doc.questions;
      if(!Array.isArray(qs)||qs.length!==100){errors.push('ชุด '+setId+' ต้องมี 100 ข้อ');continue;}
      const counts=Array(11).fill(0),answers=Array(4).fill(0);
      for(const raw of qs){
        const q={...raw,setId};
        if(q.set&&String(q.set).toLowerCase()!==setId)errors.push(q.id+': รหัสชุดประจำข้อไม่ตรงกับไฟล์');
        if(!isText(q.id)||ids.has(q.id))errors.push('รหัสข้อซ้ำหรือหาย: '+q.id);ids.add(q.id);
        if(!Number.isInteger(q.topic)||q.topic<1||q.topic>11)errors.push(q.id+': หัวข้อไม่ถูกต้อง');else counts[q.topic-1]++;
        if(!isText(q.q))errors.push(q.id+': ไม่มีคำถาม');
        const stem=normalized(q.q);if(stems.has(stem))errors.push('คำถามซ้ำ: '+stems.get(stem)+' / '+q.id);else stems.set(stem,q.id);
        if(!Array.isArray(q.c)||q.c.length!==4||q.c.some(c=>!isText(c))||new Set(q.c.map(normalized)).size!==4)errors.push(q.id+': ตัวเลือกต้องมี 4 ข้อที่ไม่ซ้ำ');
        if(!Number.isInteger(q.a)||q.a<0||q.a>3)errors.push(q.id+': ดัชนีคำตอบไม่ถูกต้อง');else answers[q.a]++;
        if(!isText(q.e)||!isText(q.reference))errors.push(q.id+': ไม่มีเฉลยหรือจุดอ้างอิง');
        if(!Array.isArray(q.choiceReasons)||q.choiceReasons.length!==4||q.choiceReasons.some(r=>!isText(r)))errors.push(q.id+': ต้องอธิบายครบทุกตัวเลือก');
        if(!Array.isArray(q.sources)||!q.sources.length||q.sources.some(s=>!isText(s)))errors.push(q.id+': ไม่มีแหล่งอ้างอิง');
        const expectedSection=q.topic<=3?'general':'specific';if(q.section&&q.section!==expectedSection)errors.push(q.id+': ส่วนทั่วไป/เฉพาะไม่ตรงหัวข้อ');q.section=expectedSection;
        if(!['practice','existing_practice','official_past','candidate_recollection'].includes(q.provenance))errors.push(q.id+': ประเภทที่มาของคำถามไม่ถูกต้อง');
        if(options.metadata&&q.provenance==='existing_practice'&&!isText(q.originalId))errors.push(q.id+': ข้อฝึกเดิมต้องมีรหัสต้นฉบับ');
        if(!isText(q.skill)||!/^\d{4}-\d{2}-\d{2}$/.test(q.verifiedAt||''))errors.push(q.id+': ไม่มีทักษะหรือวันที่ตรวจ');
        if(options.metadata&&(!isText(q.conceptId)||!['basic','applied','challenge'].includes(q.difficulty)))errors.push(q.id+': ไม่มีรหัสแนวคิดหรือระดับความยาก');
        questions.push(q);
      }
      if(counts.slice(0,3).reduce((a,b)=>a+b,0)!==25||counts.slice(3).reduce((a,b)=>a+b,0)!==75)errors.push('ชุด '+setId+': ต้องเป็นทั่วไป 25 / เฉพาะ 75');
      if(counts.some(n=>!n))errors.push('ชุด '+setId+': หัวข้อหลักสูตรไม่ครบ');
      const expectedCounts=options.topicCounts?.[setId]||options.topicCounts;if(expectedCounts&&Array.isArray(expectedCounts)&&counts.some((n,i)=>n!==expectedCounts[i]))errors.push('ชุด '+setId+': จำนวนรายหัวข้อไม่ตรงโครงสร้างที่กำหนด');
      if(options.answerBalance&&answers.some(n=>n!==25))errors.push('ชุด '+setId+': ตำแหน่งคำตอบต้องสมดุล 25 ต่อดัชนี');
      sets.push({id:setId,title:doc.title||'ชุด '+String.fromCharCode(65+index),subtitle:doc.subtitle||'',ids:qs.map(q=>q.id),counts,answers});
    }
    for(const q of questions){for(const key of q.sources||[]){const source=sources[key];if(!source||!isText(source.title)||!/^https:\/\//.test(source.url||''))errors.push(q.id+': ไม่พบแหล่งอ้างอิง HTTPS '+key);}}
    if(questions.length!==500||ids.size!==500)errors.push('จำนวนรวมต้องเป็น 500 ข้อไม่ซ้ำ');
    if(errors.length)throw Object.assign(new Error(errors.slice(0,5).join(' · ')),{errors});
    return{questions,byId:new Map(questions.map(q=>[q.id,q])),sets,sources,topics:TOPICS};
  }
  function shuffle(items,rng=Math.random){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function createSession(ids,mode,title,model,rng=Math.random,now=Date.now()){
    const unique=[...new Set(ids)].filter(id=>model.byId.has(id));if(!unique.length)throw Error('ไม่มีข้อสอบในชุดนี้');
    return{ids:shuffle(unique,rng),orders:Object.fromEntries(unique.map(id=>[id,shuffle([0,1,2,3],rng)])),mode:mode==='exam'?'exam':'practice',title:String(title),idx:0,answers:{},complete:false,startedAt:now,endedAt:null};
  }
  function validSession(s,model){
    return!!s&&['practice','exam'].includes(s.mode)&&isText(s.title)&&Array.isArray(s.ids)&&s.ids.length>0&&s.ids.length<=500&&new Set(s.ids).size===s.ids.length&&s.ids.every(id=>model.byId.has(id))&&Number.isInteger(s.idx)&&s.idx>=0&&s.idx<s.ids.length&&s.answers&&typeof s.answers==='object'&&Object.entries(s.answers).every(([id,a])=>s.ids.includes(id)&&Number.isInteger(a)&&a>=0&&a<4)&&s.orders&&s.ids.every(id=>Array.isArray(s.orders[id])&&s.orders[id].length===4&&[...s.orders[id]].sort().join(',')==='0,1,2,3')&&typeof s.complete==='boolean'&&(!s.complete||s.ids.every(id=>Number.isInteger(s.answers[id])))&&Number.isFinite(s.startedAt)&&s.startedAt>0;
  }
  function answer(s,answerIndex){
    if(s.complete||!Number.isInteger(answerIndex)||answerIndex<0||answerIndex>3)return s;
    const id=s.ids[s.idx];if(s.mode==='practice'&&s.answers[id]!==undefined)return s;
    return{...s,answers:{...s.answers,[id]:answerIndex}};
  }
  function advance(s,now=Date.now()){
    if(s.complete||s.answers[s.ids[s.idx]]===undefined)return s;
    if(s.idx<s.ids.length-1)return{...s,idx:s.idx+1};
    const missing=s.ids.findIndex(id=>s.answers[id]===undefined);if(missing>=0)return{...s,idx:missing};
    return{...s,complete:true,endedAt:now};
  }
  function score(ids,answers,model){let correct=0,answered=0;const wrong=[];for(const id of ids){const a=answers[id];if(Number.isInteger(a)){answered++;if(a===model.byId.get(id).a)correct++;else wrong.push(id);}}return{correct,answered,total:ids.length,wrong};}
  function blank(){return{version:1,records:{},marked:[],history:[],session:null,planDone:[],note:''};}
  function clean(raw,model){
    const out=blank();if(!raw||typeof raw!=='object'||raw.version!==1)return out;
    if(raw.records&&typeof raw.records==='object')for(const[id,r]of Object.entries(raw.records)){if(model.byId.has(id)&&r&&Number.isInteger(r.answer)&&r.answer>=0&&r.answer<4)out.records[id]={answer:r.answer,correct:r.answer===model.byId.get(id).a,attempts:Number.isInteger(r.attempts)&&r.attempts>0?Math.min(r.attempts,100000):1,lastAt:Number.isFinite(r.lastAt)?r.lastAt:0};}
    if(Array.isArray(raw.marked))out.marked=[...new Set(raw.marked.filter(id=>model.byId.has(id)))];
    if(Array.isArray(raw.history))out.history=raw.history.filter(h=>h&&isText(h.title)&&['practice','exam'].includes(h.mode)&&Number.isInteger(h.total)&&h.total>0&&h.total<=500&&Number.isInteger(h.correct)&&h.correct>=0&&h.correct<=h.total&&Number.isFinite(h.at)).slice(0,20);
    if(validSession(raw.session,model))out.session=raw.session;
    if(Array.isArray(raw.planDone))out.planDone=[...new Set(raw.planDone.filter(n=>Number.isInteger(n)&&n>=1&&n<=18))];
    if(typeof raw.note==='string')out.note=raw.note.slice(0,20000);return out;
  }
  function record(state,session,model,now=Date.now()){
    const records={...state.records};for(const id of session.ids){const a=session.answers[id];if(Number.isInteger(a))records[id]={answer:a,correct:a===model.byId.get(id).a,attempts:(records[id]?.attempts||0)+1,lastAt:now};}
    const r=score(session.ids,session.answers,model);return{...state,records,history:[{title:session.title,mode:session.mode,total:r.total,correct:r.correct,at:now},...state.history].slice(0,20)};
  }
  function stats(state){const records=Object.values(state.records),correct=records.filter(r=>r.correct).length;return{done:records.length,correct,wrong:records.length-correct,marked:state.marked.length};}
  return{STORAGE_KEY,TOPICS,BLUEPRINT,normalized,validate,shuffle,createSession,validSession,answer,advance,score,blank,clean,record,stats};
});
