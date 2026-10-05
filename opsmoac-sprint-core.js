(function(root){
  'use strict';
  function createCore(data){
    const byId=new Map(data.questions.map(q=>[q.id,q]));
    function shuffle(items,rng=Math.random){
      const out=[...items];
      for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
      return out;
    }
    function createSession(ids,mode,title,rng=Math.random){
      const unique=[...new Set(ids)].filter(id=>byId.has(id));
      if(!unique.length)throw new Error('No questions');
      return {version:data.version,ids:shuffle(unique,rng),mode:mode==='exam'?'exam':'practice',title,idx:0,answers:{},orders:Object.fromEntries(unique.map(id=>[id,shuffle([0,1,2,3],rng)])),complete:false};
    }
    function valid(s){
      return !!s&&s.version===data.version&&['exam','practice'].includes(s.mode)&&typeof s.title==='string'&&Array.isArray(s.ids)&&s.ids.length>0&&new Set(s.ids).size===s.ids.length&&s.ids.every(id=>byId.has(id))&&Number.isInteger(s.idx)&&s.idx>=0&&s.idx<s.ids.length&&s.answers&&typeof s.answers==='object'&&s.orders&&s.ids.every(id=>Array.isArray(s.orders[id])&&[...s.orders[id]].sort().join(',')==='0,1,2,3'&&(s.answers[id]===undefined||Number.isInteger(s.answers[id])&&s.answers[id]>=0&&s.answers[id]<4))&&Object.keys(s.answers).every(id=>s.ids.includes(id))&&s.ids.slice(0,s.idx).every(id=>s.answers[id]!==undefined)&&s.ids.slice(s.idx+1).every(id=>s.answers[id]===undefined)&&typeof s.complete==='boolean'&&(!s.complete||s.ids.every(id=>s.answers[id]!==undefined));
    }
    function answer(s,option){
      const id=s.ids[s.idx];
      if(s.complete||s.answers[id]!==undefined||!Number.isInteger(option)||option<0||option>3)return s;
      return {...s,answers:{...s.answers,[id]:option}};
    }
    function next(s){
      if(s.answers[s.ids[s.idx]]===undefined||s.complete)return s;
      return s.idx===s.ids.length-1?{...s,complete:true}:{...s,idx:s.idx+1};
    }
    function score(s){
      return s.ids.reduce((r,id)=>{const q=byId.get(id),a=s.answers[id];r.total++;if(a!==undefined){r.answered++;if(a===q.a)r.correct++;else r.wrong.push(id);}return r;},{total:0,answered:0,correct:0,wrong:[]});
    }
    function progress(records,s){
      const result={...records};
      for(const id of s.ids){if(s.answers[id]!==undefined)result[id]=s.answers[id]===byId.get(id).a;}
      return result;
    }
    return {byId,shuffle,createSession,valid,answer,next,score,progress};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports=createCore;
  else root.createOPSSprintCore=createCore;
})(globalThis);

