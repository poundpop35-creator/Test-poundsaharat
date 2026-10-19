'use strict';
const C=require('../energy-intensive-core.js');
function fixture(){
 const sources={test:{title:'แหล่งข้อมูลสำหรับทดสอบระบบเท่านั้น',url:'https://example.org/test'}};
 const documents=Object.entries(C.BLUEPRINT).map(([setId,counts])=>{let n=0;return{setId,title:'ชุดทดสอบระบบ '+setId.toUpperCase(),questions:counts.flatMap((count,i)=>Array.from({length:count},()=>{n++;return{id:`fixture-${setId}-${n}`,set:setId.toUpperCase(),topic:i+1,section:i<3?'general':'specific',q:`คำถามจำลองเพื่อทดสอบระบบ ${setId} ลำดับ ${n}`,c:['ทางเลือกที่หนึ่ง','ทางเลือกที่สอง','ทางเลือกที่สาม','ทางเลือกที่สี่'],a:(n-1)%4,e:'เฉลยทดสอบระบบ ไม่ใช่เนื้อหาเตรียมสอบ',choiceReasons:['เหตุผลหนึ่ง','เหตุผลสอง','เหตุผลสาม','เหตุผลสี่'],sources:['test'],reference:'ข้อมูลจำลองสำหรับ automated test',verifiedAt:'2026-10-19',provenance:'practice',skill:'ทดสอบระบบ',conceptId:`fixture-${setId}-${n}`,difficulty:'basic'};}))};});return{documents,sources};
}
module.exports=fixture;
