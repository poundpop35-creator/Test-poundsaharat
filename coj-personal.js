/* Local-file import. No upload, analytics or external question data. */
window.openCojPersonal=function(data,rows){
 if(!Array.isArray(rows)||rows.length!==11||!rows.every(r=>r&&typeof r.q==='string'&&r.q.length>0&&Array.isArray(r.c)&&r.c.length===4&&r.c.every(t=>typeof t==='string'&&t.length)&&Number.isInteger(r.a)&&r.a>=0&&r.a<4&&typeof r.e==='string'))throw Error('invalid');
 const mapped=new Map();rows.forEach((r,i)=>{const id='coj-extra-'+(i+1),q=data.questions.find(x=>x.id===id);mapped.set(id,'coj-private-'+(i+1));Object.assign(q,{q:r.q,c:r.c.slice(),a:r.a,e:r.e,id:mapped.get(id),fixedOrder:true,origin:'เนวิเอ้เตอร์ • COJ1',reference:'COJ1 ข้อ '+(i+1)+' • หน้า '+(i+3)+' • เฉลยตามเอกสาร'});});
 data.sets.forEach(s=>s.ids=s.ids.map(id=>mapped.get(id)||id));const s=data.sets.find(s=>s.id==='coj1-all');s.title='COJ1 ต้นฉบับ • เนวิเอ้เตอร์';s.fixedOrder=true;data.initialSet=s.id;data.storageKey+=':personal-pdf-v1';data.briefing.provenance='ชุด COJ1 ส่วนตัว: โจทย์ ตัวเลือก และคำตอบตามเอกสารของเนวิเอ้เตอร์ คำอธิบายเรียบเรียงประกอบการทบทวน';
};
