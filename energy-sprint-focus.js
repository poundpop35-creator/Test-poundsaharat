/* Rebalance practice for นักวิชาการพลังงาน; preserve all questions and saved IDs. */
(() => {
  'use strict';
  const D=window.ROLE_SPRINT;
  if(!D||D.id!=='energy')return;
  const f=n=>`energy-focus-20260914-${String(n).padStart(3,'0')}`;
  const a=n=>`energy-100-new-${n}`, b=n=>`energy-b-${String(n).padStart(3,'0')}`;
  const general=[
    ...[1,2,3,4].map(f),... [1,2,3,4,5,10].map(b),
    ...[5,6,7,8].map(f),...[7,9,10,11,12].map(a),b(14),
    ...[9,10,11,12].map(f),b(24)
  ];
  const professional=[
    ...[13,14,16,18].map(f),...[14,15,20,21].map(a),
    ...[19,20,21,22,23].map(f),...[25,26,27,31].map(a),
    ...[25,26,27,28].map(f),...[37,43,44,46].map(a)
  ];
  const laws=D.questions.filter(q=>q.topic>=7).map(q=>q.id);
  const calculations=[f(5),a(7),a(11),f(16),f(23),a(31),f(28),a(44),b(81),b(96)];
  const ids=[...general,...professional,...laws];
  const byId=new Map(D.questions.map(q=>[q.id,q]));
  if(ids.length!==100||new Set(ids).size!==100||ids.some(id=>!byId.has(id))||laws.length!==50||general.length!==25||professional.length!==25)return;
  const originalSets=D.sets.map(s=>s.id==='b'?{...s,title:'ชุด B · คำนวณและวิเคราะห์เพิ่มเติม (เสริม)'}:s);
  D.sets=[{id:'c',title:'ชุดหลัก C · เน้น พ.ร.บ. และงานนักวิชาการ',ids},...originalSets];
  D.focus={lawIds:laws,calculationIds:calculations,checkedAt:'2026-10-14'};
  D.loadedParts.push(6);
})();
