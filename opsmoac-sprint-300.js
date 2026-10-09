/* Assemble three disjoint 100-question sessions. Preserve original IDs and storage version. */
(function(){'use strict';
 const D=window.OPS_SPRINT;
 if(!D||D.pack300Ready||D.parts300?.length!==4||D.questions.length!==300||new Set(D.questions.map(q=>q.id)).size!==300)return;
 Object.assign(D.sources,{
  "ops60-budget": {
    "title": "พ.ร.บ.วิธีการงบประมาณ 2561 • ตัวบทเต็ม 18 หน้า (PDF)",
    "url": "https://plan.onab.go.th/th/file/get/file/202106159e72ce0863934fb9f3ffe07989249b46093448.PDF"
  },
  "ops300-doae": {
    "title": "กรมส่งเสริมการเกษตร • โครงสร้างและหน้าที่สำนักงานเกษตรจังหวัด",
    "url": "https://newperson.doae.go.th/?page_id=8756"
  },
  "ops300-eta": {
    "title": "พ.ร.บ.ธุรกรรมทางอิเล็กทรอนิกส์ 2544 และที่แก้ไขเพิ่มเติม • ตัวบทเต็ม ETDA",
    "url": "https://www.etda.or.th/th/Useful-Resource/%E0%B8%81%E0%B8%8F%E0%B8%AB%E0%B8%A1%E0%B8%B2%E0%B8%A2-HTML/%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%9A%E0%B8%8D%E0%B8%8D%E0%B8%95%E0%B8%A7%E0%B8%B2%E0%B8%94%E0%B8%A7%E0%B8%A2%E0%B8%98%E0%B8%A3%E0%B8%81%E0%B8%A3%E0%B8%A3%E0%B8%A1%E0%B8%97%E0%B8%B2%E0%B8%87%E0%B8%AD%E0%B9%80%E0%B8%A5%E0%B8%81%E0%B8%97%E0%B8%A3%E0%B8%AD%E0%B8%99%E0%B8%81%E0%B8%AA/%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%9A%E0%B8%8D%E0%B8%8D%E0%B8%95%E0%B8%A7%E0%B8%B2%E0%B8%94%E0%B8%A7%E0%B8%A2%E0%B8%98%E0%B8%A3%E0%B8%81%E0%B8%A3%E0%B8%A3%E0%B8%A1%E0%B8%97%E0%B8%B2%E0%B8%87%E0%B8%AD%E0%B9%80%E0%B8%A5%E0%B8%81%E0%B8%97%E0%B8%A3%E0%B8%AD%E0%B8%99%E0%B8%81%E0%B8%AA-%E0%B8%9E-%E0%B8%A8-2544-%28%E0%B8%89%E0%B8%9A%E0%B8%9A%E0%B9%81%E0%B8%81%E0%B9%84%E0%B8%82%E0%B9%80%E0%B8%9E%E0%B8%A1%E0%B9%80%E0%B8%95%E0%B8%A1%29.aspx"
  },
  "ops300-cofarm": {
    "title": "กรมส่งเสริมการเกษตร • คู่มือยกระดับแปลงใหญ่ด้วยเกษตรสมัยใหม่และเชื่อมโยงตลาด (PDF)",
    "url": "https://co-farm.doae.go.th/up/doc/handbook.pdf"
  },
  "ops300-3s": {
    "title": "กระทรวงเกษตรฯ • กรอบ 3S ในการประชุมมอบนโยบาย 7 ธันวาคม 2565 (PDF)",
    "url": "https://www.moac.go.th/dwl-files-451891791934"
  },
  "ops300-market": {
    "title": "กระทรวงเกษตรฯ • ตลาดนำการผลิต ตลาดนำการวิจัย (8 ตุลาคม 2569)",
    "url": "https://www.moac.go.th/news-preview-482791791301"
  },
  "ops300-syllabus": {
    "title": "ประกาศรับสมัคร สป.กษ. 14 สิงหาคม 2569 • ขอบเขตนักวิเคราะห์นโยบายและแผน หน้า 9 (PDF)",
    "url": "https://www.opsmoac.go.th/news-files-481591791935#page=9"
  }
});
 const id=n=>'ops300-'+String(n).padStart(3,'0');
 D.examSets=[
  {id:'new-1',title:'ชุด 1 • เก็งตรงประเด็นจากภาพ',description:'โจทย์ใหม่ 100 ข้อ · ตัวบท ตัวเลข แผนฯ 13 แปลงใหญ่ และ 3S',ids:Array.from({length:100},(_,i)=>id(101+i))},
  {id:'new-2',title:'ชุด 2 • สถานการณ์และจุดหลอก',description:'โจทย์ใหม่ 100 ข้อ · โอนงบ แยกกรอบแผน วิเคราะห์โครงการ และคำนวณ',ids:Array.from({length:100},(_,i)=>id(201+i))},
  {id:'original-100',title:'ชุด 3 • ทวนคลังเดิม 100 ข้อ',description:'โจทย์เดิม 60 + 40 ข้อ · เก็บประวัติและชุดค้างเดิมไว้ครบ',ids:D.questions.filter(q=>!q.id.startsWith('ops300-')).map(q=>q.id)}
 ];
 D.focusIds=[101,103,104,107,111,113,114,115,116,117,119,122,127,141,142,165,166,171,172,173].map(id);
 D.notes[0].unshift('HOPE ตามแผน สป.กษ. รายปี 2568: Honesty / Ownership / Prompt to change / Establish — อย่าสลับกับค่านิยม 4 ข้อขององค์กร');
 D.notes[1].unshift('แผนฯ 13: 4 หลักคิด = พอเพียง + ล้มแล้วลุกไว + SDGs + BCG; 5 เป้าหมายหลัก; 13 หมุดหมาย — “สังคมแห่งโอกาสและความเป็นธรรม” เป็นเป้าหมาย ไม่ใช่หนึ่งใน 4 หลักคิด');
 D.notes[2].unshift('3S ตามกรอบที่เผยแพร่ปี 2565 = Safety / Security / Sustainability; แปลงใหญ่เน้นรวมกลุ่มผลิตและตลาด ไม่ใช่เพียงมีที่ดินผืนใหญ่','ข่าว 8 ต.ค. 2569 เน้นตลาดนำการผลิต ตลาดนำการวิจัย และสินค้าเกษตรปลอดภัยมูลค่าสูง — อ่านตามวันที่ข่าว ไม่ปนกับถ้อยคำนโยบายต่างปี');
 D.notes[3].unshift('ธุรกรรมอิเล็กทรอนิกส์: ม.7 ไม่ปฏิเสธเพราะรูปแบบ; ม.8 หนังสือ; ม.9 ลายมือชื่อ; ม.10 ต้นฉบับ; ม.11 พยาน; ม.12 เก็บรักษา; ม.26 ลายมือชื่อเชื่อถือได้; ม.29 เกณฑ์ CA','งบประมาณ: ม.20 เสนอก่อนเริ่มปีอย่างน้อย 3 เดือน; ม.35 โอนข้ามหน่วย; ม.36 โอนแผน/รายการ; โครงการใหม่หรือเพิ่มราชการลับต้อง ครม.; โอนระหว่างรายการงบกลาง ผอ.โดยอนุมัตินายกฯ');
 D.notes[4].unshift('จำคู่คำ: Output = สิ่งส่งมอบ / Outcome = การเปลี่ยนแปลง; NPV = PV ประโยชน์ − PV ต้นทุน; B/C = PV ประโยชน์ ÷ PV ต้นทุน; ร้อยละเปลี่ยน = ส่วนต่าง ÷ ฐานเดิม × 100');
 D.bankCount=300;D.fullExam={count:100,pointsPerQuestion:2};D.pack300Ready=true;D.checked300='9 ตุลาคม 2569';
})();
