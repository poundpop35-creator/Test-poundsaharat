/* Shared navigation only. Question banks and study records remain in each app.
   โครงข้อมูลเดียวที่หน้าแรกและแถบเมนูทุกหน้าใช้ร่วมกัน

   แต่ละหน่วยงาน = 1 รายการ และมี resources คือ "สิ่งที่ทำได้ในหน่วยงานนี้"
   โดยใช้คำเรียกชุดเดียวกันทุกหน่วยงาน เพื่อไม่ให้สับสนว่าอันไหนคืออะไร

     kind:'read'   อ่านเนื้อหา        สรุปบทเรียน + ข้อสอบท้ายบท
     kind:'drill'  ฝึกรายหมวด        คลังข้อสอบแยกหมวด ทำซ้ำเฉพาะจุดที่ยังไม่แม่น
     kind:'mock'   ชุดจำลองสอบ       ชุดเต็มเสมือนสอบจริง
     kind:'memo'   จุดต้องท่อง       ตัวเลข มาตรา คำนิยามที่ออกสอบบ่อย
     kind:'source' ตัวบทฉบับเต็ม     ลิงก์กฎหมายต้นฉบับ
     kind:'plan'   แผนอ่าน           ลำดับการอ่านและตารางเวลา
     kind:'write'  ฝึกเขียนตอบ       ข้อเขียน/อัตนัย                                   */

window.STUDY_CATALOG = [
  {
    id:'energy',group:'agencies',short:'สป.พลังงาน',title:'สำนักงานปลัดกระทรวงพลังงาน',
    role:'นักวิชาการพลังงานปฏิบัติการ',icon:'พน.',color:'energy',
    priority:true,priorityRank:1,exam:'',examPending:true,bank:243,
    sprint:'energy-sprint.html',sprintKey:'energy100:v1',sprintTopics:11,sprintCount:200,
    research:'energy-sprint.html#dashboard',
    total:943,
    headline:'ส่วนที่ 2 มี 150 จาก 200 คะแนน — ลงเวลาที่แผนพลังงาน น้ำมัน-ก๊าซ-ไฟฟ้า การทดสอบตรวจสอบ และการอนุรักษ์พลังงาน',
    description:'คลังหลัก 243 ข้อ + ชุดเข้มข้น 500 ข้อ + ชุดเก็ง 200 ข้อ ครบ 11 หัวข้อตามประกาศ',
    search:'energy พลังงาน สป.พน. นักวิชาการพลังงาน',
    actions:['read','practice','sources'],
    resources:[
      {kind:'read', label:'อ่านเนื้อหา',  meta:'11 บท · 48 ข้อท้ายบท', file:'energy.html', hash:'read'},
      {kind:'drill',label:'ฝึกรายหมวด',   meta:'10 หมวด · 195 ข้อ',    file:'energy.html', hash:'practice'},
      {kind:'mock', label:'จำลองสอบ · ชุดเข้มข้น', meta:'5 ชุด · 500 ข้อ', file:'energy-intensive.html', strong:true},
      {kind:'mock', label:'จำลองสอบ · ชุดเก็ง',   meta:'2 ชุด · 200 ข้อ', file:'energy-sprint.html'}
    ],
    extras:[
      {label:'จุดต้องท่อง',    file:'energy.html', hash:'summary'},
      {label:'ตัวบทฉบับเต็ม',  file:'energy.html', hash:'sources'},
      {label:'คู่มืออ่าน',      file:'energy-study-guide.html'}
    ]
  },
  {
    id:'rd',group:'agencies',short:'สรรพากร',title:'กรมสรรพากร',
    role:'นักวิชาการพัสดุปฏิบัติการ',icon:'ภษ.',color:'rd',
    priority:true,priorityRank:2,exam:'',examPending:true,bank:298,
    sprint:'rd-sprint.html',sprintKey:'rd100:v1',sprintTopics:8,sprintCount:200,
    research:'rd-sprint.html#briefing',
    total:498,
    headline:'จัดซื้อจัดจ้างคือหัวใจของตำแหน่ง ให้ลงเวลามากที่สุด แล้วค่อยไล่ไปการเบิกจ่าย ประมวลรัษฎากร และงบประมาณ',
    description:'คลังหลัก 298 ข้อ + ชุดเก็ง 200 ข้อ — จัดซื้อจัดจ้าง ประมวลรัษฎากร การเงินการคลัง งบประมาณ ควบคุมภายใน และ PDPA',
    search:'rd ภาษี พัสดุ สรรพากร จัดซื้อจัดจ้าง',
    actions:['read','practice','sources'],
    resources:[
      {kind:'read', label:'อ่านเนื้อหา', meta:'8 บท · 81 ข้อท้ายบท', file:'rd.html', hash:'read'},
      {kind:'drill',label:'ฝึกรายหมวด',  meta:'14 หมวด · 217 ข้อ',   file:'rd.html', hash:'practice'},
      {kind:'mock', label:'จำลองสอบ · ชุดเก็ง', meta:'2 ชุด · 200 ข้อ', file:'rd-sprint.html', strong:true}
    ],
    extras:[
      {label:'จุดต้องท่อง',   file:'rd.html', hash:'summary'},
      {label:'ตัวบทฉบับเต็ม', file:'rd.html', hash:'sources'}
    ]
  },
  {
    id:'dmh',group:'agencies',short:'กรมสุขภาพจิต',title:'กรมสุขภาพจิต',
    role:'นักวิเคราะห์นโยบายและแผนปฏิบัติการ',icon:'สจ.',color:'dmh',
    priorityRank:3,bank:78,total:78,
    flag:'ขอบเขตยังไม่ยืนยันกับประกาศ',
    headline:'สร้างจากแกนร่วมของตำแหน่ง ยังไม่ได้เทียบกับประกาศ 12 ต.ค. 2569 — เปิดประกาศแล้วค่อยเติมส่วนเฉพาะของกรม',
    description:'แกนร่วมของตำแหน่ง 78 ข้อ — แผน 3 ระดับ แผน 13 ระเบียบราชการ งบประมาณ ประเมินผล และ PDPA',
    search:'dmh สุขภาพจิต นักวิเคราะห์นโยบายและแผน',
    actions:['read','practice','sources'],
    resources:[
      {kind:'read', label:'อ่านเนื้อหา', meta:'6 บท · 48 ข้อท้ายบท', file:'dmh.html', hash:'read'},
      {kind:'drill',label:'ฝึกรายหมวด',  meta:'3 หมวด · 30 ข้อ',     file:'dmh.html', hash:'practice'}
    ],
    extras:[
      {label:'จุดต้องท่อง',   file:'dmh.html', hash:'summary'},
      {label:'ตัวบทฉบับเต็ม', file:'dmh.html', hash:'sources'}
    ]
  },

  /* ---- คลังกลาง: ใช้ได้มากกว่าหนึ่งหน่วยงาน ---- */
  {
    id:'exam-14',group:'resources',short:'ติว 14 วัน',title:'ติว 14 วัน · สรรพากร + พลังงาน',
    role:'ตารางอ่านรายวัน · วันละ 3–4 ชั่วโมง',icon:'book',color:'rd',standalone:true,
    headline:'ใช้เมื่ออยากให้มีคนจัดลำดับให้ว่าวันนี้อ่านอะไร',
    description:'28 บทอ่าน · โจทย์รายวัน · ฝึกเขียน 28 กรณี พร้อมทวนข้อผิดและบันทึกคำตอบ',
    search:'14 วัน สรรพากร พลังงาน เขียน อัตนัย ตาราง แผนติว',actions:[],
    resources:[
      {kind:'plan', label:'เปิดแผน 14 วัน', meta:'28 บทอ่าน · 28 กรณีเขียน', file:'exam-14.html', strong:true}
    ]
  },
  {
    id:'laws',group:'resources',short:'กฎหมายกลาง',title:'กฎหมายกลางที่ใช้สอบร่วมกัน',
    role:'สรุป + แบบฝึกหัด ใช้ได้หลายหน่วยงาน',icon:'book',color:'laws',total:93,
    headline:'กฎหมายชุดที่ออกสอบซ้ำแทบทุกสนาม อ่านรอบเดียวใช้ได้หลายหน่วยงาน',
    description:'ระเบียบบริหารราชการแผ่นดิน บ้านเมืองที่ดี งบประมาณ วินัยการเงินการคลัง ข้อมูลข่าวสาร และ PDPA',
    search:'พรบ พ.ร.บ. ระเบียบ กฎหมายกลาง',actions:['read','exam','sources'],
    resources:[
      {kind:'read', label:'อ่านเนื้อหา', meta:'13 บท · 93 ข้อ', file:'laws.html', hash:'read', strong:true}
    ],
    extras:[{label:'จำลองสอบ', file:'laws.html', hash:'exam'},{label:'ตัวบทฉบับเต็ม', file:'laws.html', hash:'sources'}]
  },
  {
    id:'law-sources',group:'resources',short:'ตัวบทฉบับเต็ม',title:'ตัวบทฉบับเต็มและเอกสารอ้างอิง',
    role:'รวมลิงก์กฎหมายต้นฉบับ แยกตามหน่วยงาน',icon:'file',color:'law-sources',
    headline:'ใช้ยืนยันตัวเลขและมาตราก่อนสอบ ทุกลิงก์ชี้ไปเว็บไซต์ราชการต้นทาง',
    description:'ค้นชื่อกฎหมายหรือเอกสาร แล้วกดเปิดต้นฉบับจากแหล่งเผยแพร่',
    search:'พรบ พ.ร.บ. PDF กฎหมาย ลิงก์ ตัวบท',actions:[],
    resources:[
      {kind:'source', label:'เปิดคลังตัวบท', meta:'93 แหล่ง · 7 กลุ่ม', file:'law-sources.html', strong:true}
    ]
  },
  {
    id:'compare',group:'resources',short:'เทียบขอบเขตสอบ',title:'เทียบขอบเขตสอบข้ามหน่วยงาน',
    role:'ดูว่าอ่านอะไรแล้วใช้ได้หลายสนาม',icon:'layers',color:'compare',
    headline:'ใช้ตอนวางแผนว่าจะอ่านอะไรก่อน เมื่อสมัครหลายหน่วยงานพร้อมกัน',
    description:'ตารางเทียบแกนร่วมและส่วนต่างของแต่ละหน่วยงาน เพื่อจัดลำดับการอ่าน',
    search:'ตาราง แผน เทียบ ขอบเขต',actions:[],
    resources:[
      {kind:'plan', label:'เปิดตารางเทียบ', meta:'แกนร่วม + ส่วนต่าง', file:'compare.html', strong:true}
    ]
  },

  /* ---- ภาษาอังกฤษ ---- */
  {
    id:'english-course',group:'english',short:'คอร์สภาษาอังกฤษ',title:'ภาษาอังกฤษแบบเป็นคอร์ส',
    role:'เรียนทีละบทและฝึกต่อเนื่อง',icon:'Aa',color:'english-course',
    description:'เลือกหมวด เรียนเนื้อหา แล้วฝึกแบบทดสอบประจำบท',
    search:'english course อังกฤษ คอร์ส',actions:[],
    resources:[{kind:'read', label:'เปิดคอร์ส', meta:'เรียนเป็นลำดับบท', file:'english-course.html', strong:true}]
  },
  {
    id:'english',group:'english',short:'อังกฤษพื้นฐาน',title:'ภาษาอังกฤษพื้นฐาน',
    role:'บทเรียนสั้นพร้อมแบบฝึกหัด',icon:'Hi',color:'english',
    description:'ทวนคำศัพท์ ประโยค และการออกเสียงในบทเรียนที่ต้องการ',
    search:'english อังกฤษ พื้นฐาน คำศัพท์',actions:[],
    resources:[{kind:'read', label:'เปิดบทเรียน', meta:'เลือกอ่านทีละเรื่อง', file:'english.html', strong:true}]
  },

  /* ---- สอบไปแล้ว: เก็บไว้ทวน ---- */
  {
    id:'sao',group:'archive',short:'สตง.',title:'สำนักงานการตรวจเงินแผ่นดิน',
    role:'นักวิเคราะห์นโยบายและแผน',icon:'สตง.',color:'sao',
    sprint:'sao-sprint.html',sprintKey:'sao48:v1',sprintTopics:9,total:614,
    description:'คลังใหญ่ที่สุดของตำแหน่งนักวิเคราะห์นโยบายและแผน ใช้ทวนข้ามหน่วยงานได้',
    search:'sao ตรวจเงิน สตง.',actions:['read','practice','sources'],
    resources:[
      {kind:'read', label:'อ่านเนื้อหา', meta:'10 บท · 153 ข้อท้ายบท', file:'sao.html', hash:'read'},
      {kind:'drill',label:'ฝึกรายหมวด',  meta:'9 หมวด · 401 ข้อ',     file:'sao.html', hash:'practice'},
      {kind:'mock', label:'จำลองสอบ · โค้งสุดท้าย', meta:'3 ชุด · 60 ข้อ', file:'sao-sprint.html'}
    ],
    extras:[{label:'จุดต้องท่อง', file:'sao.html', hash:'summary'},{label:'ตัวบทฉบับเต็ม', file:'sao.html', hash:'sources'}]
  },
  {
    id:'opsmoac',group:'archive',short:'สป.เกษตร',title:'สำนักงานปลัดกระทรวงเกษตรและสหกรณ์',
    role:'นักวิเคราะห์นโยบายและแผน',icon:'กษ.',color:'opsmoac',
    sprint:'opsmoac-sprint.html',sprintKey:'opsmoac60:v1',sprintTopics:5,sprintCount:300,total:499,
    description:'เก็ง 300 ข้อ แบ่ง 3 ชุด ชุดละ 100 พร้อมเฉลยและตัวบท และมีชุดฝึกเขียนตอบ',
    search:'opsmoac สป.กษ. เกษตร',actions:['read','practice','sources'],
    resources:[
      {kind:'read', label:'อ่านเนื้อหา', meta:'5 บท · 56 ข้อท้ายบท', file:'opsmoac.html', hash:'read'},
      {kind:'drill',label:'ฝึกรายหมวด',  meta:'10 หมวด · 143 ข้อ',   file:'opsmoac.html', hash:'practice'},
      {kind:'mock', label:'จำลองสอบ · ชุดเก็ง', meta:'3 ชุด · 300 ข้อ', file:'opsmoac-sprint.html'}
    ],
    extras:[
      {label:'ฝึกเขียนตอบ',   file:'opsmoac-writing.html'},
      {label:'ข้อเขียน 5 ข้อ', file:'opsmoac-five-essays.html'},
      {label:'ตัวบทฉบับเต็ม',  file:'opsmoac.html', hash:'sources'}
    ]
  },
  {
    id:'diprom',group:'archive',short:'กรมส่งเสริมอุตสาหกรรม',title:'กรมส่งเสริมอุตสาหกรรม',
    role:'คลังเนื้อหาที่สอบไปแล้ว',icon:'กสอ.',color:'diprom',total:989,
    description:'คลังเดิมขนาดใหญ่ กลับมาอ่านเนื้อหาและฝึกโจทย์ได้ทุกเมื่อ',
    search:'diprom อุตสาหกรรม กสอ.',actions:['read','practice','sources'],
    resources:[
      {kind:'read', label:'อ่านเนื้อหา', meta:'13 บท · 629 ข้อท้ายบท', file:'diprom.html', hash:'read'},
      {kind:'drill',label:'ฝึกรายหมวด',  meta:'10 หมวด · 360 ข้อ',    file:'diprom.html', hash:'practice'}
    ],
    extras:[{label:'ตัวบทฉบับเต็ม', file:'diprom.html', hash:'sources'}]
  },
  {
    id:'namban',group:'archive',short:'กรมทรัพยากรน้ำบาดาล',title:'กรมทรัพยากรน้ำบาดาล',
    role:'คลังเนื้อหาที่สอบไปแล้ว',icon:'นบ.',color:'namban',total:95,
    description:'เก็บบทอ่าน แบบทดสอบ และเอกสารเดิมไว้ให้กลับมาทบทวน',
    search:'namban น้ำบาดาล',actions:['read','exam','sources'],
    resources:[
      {kind:'read', label:'อ่านเนื้อหา', meta:'6 บท · 95 ข้อ', file:'namban.html', hash:'read', strong:true}
    ],
    extras:[{label:'ตัวบทฉบับเต็ม', file:'namban.html', hash:'sources'}]
  },

  /* ---- หน้าย่อยของหน่วยงาน: ไม่แสดงเป็นการ์ดของตัวเองในหน้าแรก
         แต่ยังอยู่ในแคตาล็อกเพื่อให้แถบเมนูและ breadcrumb ของทุกหน้ารู้จัก ---- */
  {
    id:'energy-intensive',group:'agencies',parent:'energy',hub:false,
    short:'พลังงาน · ชุดเข้มข้น 500 ข้อ',title:'พลังงานเข้มข้น 5 ชุด',
    role:'นักวิชาการพลังงานปฏิบัติการ',icon:'book',color:'energy',standalone:true,priorityRank:1.5,
    description:'5 ชุด × 100 ข้อ ครบ 11 หัวข้อ ทั่วไป 25/เฉพาะ 75 พร้อมเหตุผลทุกตัวเลือกและแหล่งอ้างอิง',
    search:'energy พลังงาน 500 5 ชุด เข้มข้น',actions:[]
  }
]
.map(item => ({...item, file: item.file || item.id + '.html'}))
.sort((a,b) => (a.priorityRank||99) - (b.priorityRank||99));
