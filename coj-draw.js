// Pick at least one item per syllabus heading, then fill each part to its exam weight.
(function(root){
 function draw(bank,shuffle){
  function part(lo,hi,size){
   const pool=bank.filter(q=>q.topic>=lo&&q.topic<=hi);
   const shuffled=shuffle(pool),topics=new Set(),ids=new Set();
   for(const q of shuffled)if(!topics.has(q.topic)){topics.add(q.topic);ids.add(q.id);}
   if(topics.size!==hi-lo+1||pool.length<size)throw Error('Incomplete court exam bank');
   for(const q of shuffled){if(ids.size===size)break;ids.add(q.id);}
   return [...ids];
  }
  return shuffle([...part(1,5,30),...part(6,14,70)]);
 }
 if(typeof module==='object'&&module.exports)module.exports=draw;else root.drawCourtExam=draw;
})(typeof window==='undefined'?globalThis:window);
