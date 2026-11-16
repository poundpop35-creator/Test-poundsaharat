/* Run from the repository root: node practice500/build.cjs */
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto');
const txt=f=>fs.readFileSync(f,'utf8'),base={},bag={},seen={},meta={};const ids=['dmh','drr','namban','rd','opsmoac'];for(const k of ids){bag[k]=[];seen[k]=new Set}
function pack(files,name){const c={window:{}};for(const f of files)vm.runInNewContext(txt(f+'.js'),c);return c.window[name]}
function legacy(k,book=false){if(!fs.existsSync(k+'.html'))return [];let s=txt(k+'.html'),n=book?'BOOK_TOPICS':'TOPICS',m=s.match(new RegExp('(?:var|const) '+n+'\\s*=\\s*\\['));return m?vm.runInNewContext(s.slice(m.index,s.indexOf('\n];',m.index)+3)+';'+n):[]}
const norm=s=>s.normalize('NFKC').replace(/[\s“”‘’"'?.ฯ:]/g,'');
function put(k,t,x,src='',ref=''){let {q,c,a}=x,e=x.e||x.feedback?.[a];if(!q||!t||c?.length!==4||new Set(c.map(norm)).size!==4||!Number.isInteger(a)||!c[a]||!e||seen[k].has(norm(q)))return;seen[k].add(norm(q));bag[k].push({id:k+'-'+crypto.createHash('sha1').update(q).digest('hex').slice(0,11),q,c,a,e,t,src,ref:x.reference||x.ref||ref});}
const sprint={rd:pack(['rd-sprint-data','rd-sprint-1','rd-sprint-2','rd-sprint-3','rd-sprint-4','rd-sprint-b'],'ROLE_SPRINT'),opsmoac:pack(['opsmoac-sprint-data','opsmoac-sprint-extra','opsmoac-sprint-a1','opsmoac-sprint-a2','opsmoac-sprint-b1','opsmoac-sprint-b2','opsmoac-sprint-300'],'OPS_SPRINT')};
const co=pack(['coj-quiz-data','coj-extra','coj-hard','coj-topics'],'ROLE_SYLLABUS');
for(const k of ids){
 const d=['dmh','drr'].includes(k)?pack([k+'-syllabus-data'],'ROLE_SYLLABUS'):null;
 meta[k]=d?.topics||legacy(k).map(t=>t.title);
 if(d)for(const x of d.questions)put(k,d.topics[x.topic-1],x,d.sources[x.sources[0]]?.url);
 for(const t of [...legacy(k),...legacy(k,true)])for(const x of t.q)put(k,t.title,x,'',t.title);
 const sp=sprint[k];if(sp)for(const x of sp.questions)put(k,sp.topics[x.topic-1],x,sp.sources?.[x.sources?.[0]]?.url);
 base[k]=bag[k].length;
}
const proc='https://cpb.ddc.moph.go.th/ddc-pic/law/act-2560',bb='https://www.bb.go.th/',plan='https://doi.org/10.1787/632da462-en',dmh='https://dmh.go.th/WebDMH/ViewTable.aspx?indotype=15',ground='https://www.dgr.go.th/gwcr/th/about/289';
function transfer(k,t,xs,url){for(const x of xs){if(bag[k].length>=500)break;if(/กรมส่งเสริมอุตสาหกรรม|สตง\.|คตง\.|สป\.กษ\.|กรมสรรพากร|ศาลยุติธรรม|ประธานศาล|ศาลฎีกา|นายกรัฐมนตรีคนปัจจุบัน/.test([x.q,x.c,x.e].join(' ')))continue;put(k,meta[k][t-1],x,url,'คลังวิชาร่วม • '+meta[k][t-1]);}}
function extract(f,ns,b){return legacy(f,b).filter(t=>ns.includes(t.id)).flatMap(t=>t.q)}
for(const [f,n,b] of [['sao',[6],true],['sao',[9,10],false],['opsmoac',[5,10],true],['opsmoac',[5],false],['diprom',[10],false]])for(const [k,t] of [['dmh',7],['namban',2]])transfer(k,t,extract(f,n,b),plan);
transfer('dmh',8,extract('sao',[7],true),'https://www.cgd.go.th/');
transfer('namban',5,[...extract('sao',[3],true),...extract('sao',[3]),...extract('rd',[5],true)],bb);
transfer('namban',3,extract('diprom',[8],true).filter(x=>!/ปัจจุบัน|ล่าสุด|ปีนี้/.test(x.q)),'https://www.bot.or.th/');
for(const k of ['drr','rd'])transfer(k,1,[...extract('diprom',[5],true),...extract('rd',[1]),...extract('rd',[3,9,12],true),...co.questions.filter(x=>x.topic===6&&!x.id.startsWith('coj-hard-')&&!x.q.includes('ศาล')),...sprint.rd.questions.filter(x=>x.topic===3),...co.questions.filter(x=>x.topic===6&&x.id.startsWith('coj-hard-1'))],proc);
for(const k of ['namban','drr'])transfer(k,k==='drr'?4:6,[...extract('rd',[6]),...extract('rd',[6],true),...sprint.rd.questions.filter(x=>x.topic===6)],bb);
transfer('namban',5,sprint.rd.questions.filter(x=>x.topic===5),bb);
for(const [k,t] of [['dmh',7],['namban',2]])for(const x of sprint.opsmoac.questions.filter(x=>x.topic===5&&!/เกษตร|ชาวนา|ชาวไร่|พืช|ปศุสัตว์/.test(x.q)))transfer(k,t,[x],sprint.opsmoac.sources[x.sources?.[0]]?.url||plan);
const add=(k,t,q,c,a,e,src,ref)=>put(k,meta[k][t-1],{q,c,a,e},src,ref);
add('opsmoac',5,'สองหน่วยติดตามได้ 240 และ 180 ครัวเรือน ซ้ำกัน 65 ครัวเรือน ถ้าเป้าหมายคือ 400 ครัวเรือนที่ไม่ซ้ำกัน รายงานผลได้เท่าใด',['88.75%','105.00%','72.50%','86.25%'],0,'(240 + 180 − 65) ÷ 400 × 100 = 88.75% การรวมสองทะเบียนต้องตัดครัวเรือนซ้ำ',plan,'การติดตามผลผลิต');
console.log('เดิม',base,'หลังคัดข้อร่วม',Object.fromEntries(ids.map(k=>[k,bag[k].length])));
const sao=pack(['sao-sprint-data'],'SAO_SPRINT');
for(const x of sao.questions.filter(x=>[6,9].includes(x.topic)))transfer('dmh',x.topic===6?1:7,[x],sao.sources[x.topic]?.url);
transfer('dmh',1,extract('sao',[6]).concat(extract('sao',[5],true)).filter(x=>/ยุทธศาสตร์ชาติ|แผนแม่บท/.test(x.q)&&!/ฉบับที่ 13/.test(x.q)),'https://www.nesdc.go.th/');
for(const x of [...extract('diprom',[6]),...extract('rd',[7]),...extract('rd',[8],true)].filter(x=>/ข้อมูลส่วนบุคคล|PDPA|ข้อมูลสุขภาพ/.test(x.q)))transfer('dmh',9,[x],'https://www.pdpc.or.th/');
transfer('dmh',7,extract('namban',[2]),plan);transfer('dmh',7,extract('diprom',[10],true),plan);
for(const x of sao.questions.filter(x=>x.topic===3))transfer('namban',5,[x],bb);
const en=txt('english-course.html'),start=en.indexOf('const MODULES ='),mods=vm.runInNewContext(en.slice(start,en.indexOf('\n];',start)+3)+';MODULES');
for(const m of mods.filter(m=>['write','gram'].includes(m.key)))for(const u of m.units)for(const x of u.quiz||[])if(!x.au&&!['listen','passage'].includes(x.t))transfer('namban',4,[x],'');
function groups(keys,lines){const rows=lines.trim().split('\n').map(l=>l.split('|'));if(rows.length%4)throw Error('group');for(let i=0;i<rows.length;i++){const row=rows[i],options=rows.slice(i-i%4,i-i%4+4).map(v=>v[1]);for(const [k,t] of keys)if(bag[k].length<500)add(k,t,row[0],options,i%4,row[2],'','แบบฝึกประยุกต์ • '+meta[k][t-1]);}}
groups([['dmh',9],['drr',5]],`
ต้องนับเฉพาะรายการของเขตเหนือที่มีสถานะเสร็จสิ้น โดยไม่สนใจยอดเงิน ควรเลือกเครื่องมือใด|COUNTIFS|นับแถวที่ตรงเงื่อนไขทั้งเขตและสถานะพร้อมกัน
ต้องรวมยอดเบิกเฉพาะงานในเดือนที่กำหนดของหน่วยเดียวจากหลายร้อยแถว ควรใช้ฟังก์ชันใด|SUMIFS|รวมคอลัมน์ยอดเงินโดยกรองทั้งหน่วยงานและช่วงวัน
ต้องนำรหัสโครงการไปค้นชื่อในทะเบียนหลักแบบตรงกันทุกตัว โดยรหัสไม่ได้เรียงลำดับ เลือกเครื่องมือใด|XLOOKUP แบบตรงกัน|เป็นการค้นกุญแจหนึ่งค่าเพื่อคืนชื่อจากแถวเดียวกัน
ต้องจัดตารางสรุปไขว้จำนวนเรื่องแยกตามเขตและสถานะโดยลากเปลี่ยนแกนได้ ควรเลือกอะไร|PivotTable|เปลี่ยนมิติแถวและคอลัมน์พร้อมสรุปข้อมูลโดยไม่แก้ข้อมูลต้นทาง
ต้องการให้หัวกระดาษแนวนอนอยู่เฉพาะหน้าตารางกลางรายงาน Word ควรแบ่งส่วนด้วยอะไร|Section Break|การตั้งค่าแนวกระดาษเป็นคุณสมบัติของ section จึงต้องแยกส่วนก่อนและหลังหน้าเป้าหมาย
ต้องการขึ้นหน้าใหม่โดยยังใช้หัวกระดาษ ระยะขอบ และเลขหน้าแบบเดิม ควรใช้สิ่งใด|Page Break|ขึ้นหน้าใหม่ใน section เดิม จึงไม่เพิ่มส่วนจัดรูปแบบโดยไม่จำเป็น
เอกสารต้องเปลี่ยนแบบหัวข้อทั้งเล่มและสร้างสารบัญที่อัปเดตได้ ควรใช้สิ่งใด|Heading Styles|กำหนดระดับหัวข้อเชิงโครงสร้างเพื่อปรับรูปแบบและสร้างสารบัญอัตโนมัติ
ผู้ทบทวนสองคนต้องเสนอแก้ถ้อยคำให้เจ้าของเอกสารรับหรือปฏิเสธทีละจุด ใช้สิ่งใด|Track Changes|เก็บร่องรอยการเพิ่มและลบเนื้อหาให้ตัดสินใจเป็นรายการ
ต้องแก้ตำแหน่งโลโก้ในทุกสไลด์ที่ใช้เค้าโครงเดียวกัน ควรแก้ที่ใด|Slide Master|แก้แม่แบบหรือเค้าโครงต้นทางเพียงครั้งเดียว
วิทยากรต้องเห็นบันทึกย่อและหน้าถัดไป แต่ผู้ฟังเห็นเฉพาะสไลด์ปัจจุบัน ใช้สิ่งใด|Presenter View|แยกหน้าจอควบคุมของผู้นำเสนอจากภาพที่ฉาย
ต้องนำเสนอเฉพาะสไลด์สำหรับผู้บริหารโดยเก็บสไลด์ทั้งหมดในไฟล์เดิมและตั้งชุดเรียกซ้ำ ใช้สิ่งใด|Custom Slide Show|กำหนดชุดและลำดับสไลด์เฉพาะกลุ่มโดยไม่ทำสำเนาไฟล์
ต้องให้ผู้ใช้โปรแกรมอ่านหน้าจอเข้าใจความหมายของแผนภาพที่ไม่มีข้อความบรรยาย ใช้อะไร|Alt Text|ข้อความทางเลือกสื่อสารสาระของภาพให้เทคโนโลยีช่วยอ่าน
แบ่งปันรายงานให้ผู้รับอ่านหนึ่งเดือนแต่ห้ามแก้ต้นฉบับ ควรตั้งค่าใด|กำหนดสิทธิ์อ่านพร้อมวันหมดอายุ|จำกัดทั้งขอบเขตสิทธิ์และระยะเวลาที่จำเป็น
ส่งตารางเพื่อสาธิตวิธีวิเคราะห์โดยไม่ต้องใช้ข้อมูลผู้รับบริการจริง ควรเลือกวิธีใด|สร้างชุดข้อมูลสมมติที่มีโครงสร้างเดียวกัน|ใช้ข้อมูลสังเคราะห์แทนการเสี่ยงเปิดเผยตัวบุคคล
ระบบให้ดาวน์โหลดไฟล์สองฉบับชื่อเดียวกัน ต้องตรวจว่าเนื้อหาตรงกันระดับไบต์ ควรตรวจอย่างไร|เปรียบเทียบค่าแฮชด้วยอัลกอริทึมเดียวกัน|ชื่อไฟล์และขนาดเท่ากันยังไม่ยืนยันว่าเนื้อหาเหมือนกัน
รายงานกลางถูกเขียนทับเมื่อวาน ต้องกู้เนื้อหาก่อนแก้โดยยังเก็บฉบับปัจจุบัน ใช้สิ่งใด|คัดสำเนาจากประวัติเวอร์ชัน|ทำให้เก็บหลักฐานทั้งก่อนและหลังการเปลี่ยนแปลง
`);
for(const t of [6,8,10,11,12,14])transfer('drr',1,co.questions.filter(x=>x.topic===t),proc);
for(const x of sprint.opsmoac.questions.filter(x=>x.topic===2&&/ยุทธศาสตร์ชาติ|แผนแม่บท/.test(x.q)&&!/เกษตร|พืช|ประมง|ปศุสัตว์/.test([x.q,x.c,x.e].join(' '))))transfer('dmh',1,[x],'https://www.nesdc.go.th/');
console.log('remaining',Object.fromEntries(ids.map(k=>[k,500-bag[k].length])));
groups([['dmh',7],['namban',2]],`
ปีแรกนับครั้งบริการ ปีถัดมานับคนไม่ซ้ำ หากจะตรวจแนวโน้มควรทำอะไรเป็นลำดับแรก|สร้างอนุกรมย้อนหลังด้วยนิยามเดียวกัน|หน่วยนับเปลี่ยนจึงยังแปลผลต่างเป็นการเปลี่ยนของบริการจริงไม่ได้
โครงการเริ่มทุกพื้นที่พร้อมกันและมีข้อมูลรายเดือนย้อนหลังหลายปี วิธีประเมินใดตรวจการเปลี่ยนระดับและแนวโน้มได้|วิเคราะห์อนุกรมเวลาที่มีจุดแทรกแซง|เทียบระดับและความชันก่อนและหลังจุดเริ่ม พร้อมตรวจฤดูกาลและเหตุการณ์ร่วม
พื้นที่นำร่องและพื้นที่เปรียบเทียบมีแนวโน้มก่อนเริ่มขนานกัน มีข้อมูลก่อนและหลังทั้งคู่ ควรประมาณผลอย่างไร|เทียบผลต่างของการเปลี่ยนแปลงสองพื้นที่|หักการเปลี่ยนที่เกิดร่วมในพื้นที่เปรียบเทียบออกจากการเปลี่ยนในพื้นที่นำร่อง
รายงานรวมบอกว่าดีขึ้นแต่ทุกกลุ่มอายุแย่ลง ข้อมูลดิบครบและนิยามไม่เปลี่ยน ควรตรวจอะไร|ตรวจน้ำหนักประชากรของแต่ละกลุ่มอายุ|สัดส่วนกลุ่มที่เปลี่ยนสามารถทำให้ทิศทางภาพรวมตรงข้ามกับผลรายกลุ่ม
ทีมต้องรู้ว่าเหตุใดผู้เข้าร่วมจึงไม่กลับมาตามนัด แม้ทะเบียนยืนยันอัตราขาดนัดแล้ว ควรเก็บอะไรเพิ่ม|สัมภาษณ์ผู้ที่ขาดนัดด้วยคำถามปลายเปิด|ตัวเลขบอกขนาดปัญหา ส่วนการสัมภาษณ์ช่วยค้นกลไกและอุปสรรคที่ยังไม่ทราบ
ข้อมูลมีพื้นที่ห่างไกลจำนวนน้อยและต้องการประมาณค่าของพื้นที่เหล่านี้แยกต่างหาก ควรเลือกตัวอย่างอย่างไร|แบ่งชั้นพื้นที่และสุ่มเพิ่มในชั้นที่มีขนาดเล็ก|ทำให้ชั้นที่สนใจมีตัวอย่างพอ และต้องถ่วงน้ำหนักกลับเมื่อนำเสนอภาพรวม
ผู้ตรวจสองคนจำแนกผลรายการเดียวกันเป็นผ่านหรือไม่ผ่าน ต้องการวัดความสอดคล้องที่หักส่วนบังเอิญ ใช้อะไร|ค่าสัมประสิทธิ์แคปปา|แคปปาเปรียบเทียบความสอดคล้องที่สังเกตกับที่คาดจากโอกาส
ค่าเฉลี่ยระยะรอเพิ่มมากเพราะมีบางรายรอนานผิดปกติ ต้องการรายงานค่ากึ่งกลางของผู้รับบริการ ใช้อะไร|มัธยฐานของระยะเวลารอ|มัธยฐานเป็นค่าตำแหน่งกลางที่ไม่ได้ถูกดึงด้วยขนาดของค่าสุดโต่งเหมือนค่าเฉลี่ย
`);
const dossiers={dmh:['ติดตามหลังส่งต่อ','เครือข่ายที่ปรึกษาวัยเรียน','ติดตามผู้ดูแลในชุมชน','การเข้าถึงช่องทางปรึกษา','อบรมทีมปฏิบัติงานระดับอำเภอ','นิเทศหน่วยบริการเครือข่าย','ติดตามผลการฝึกทักษะชีวิต','โครงการสนับสนุนทีมสหวิชาชีพ','พัฒนาระบบนัดติดตาม'],namban:['ติดตามบ่อสังเกตการณ์','สำรวจความต้องการของชุมชน','ติดตามระบบประปาบาดาล']};
for(const [k,names] of Object.entries(dossiers))for(const [i,name] of names.entries()){
 const a=48+i*3,b=36+i*4,over=12+i,u=a+b-over,target=125+i*5,pre=60+i*2,post=pre+12+i,m=3+i,cp=50+i,ct=cp+m;
 function metric(q,v,w,e){if(bag[k].length>=500)return;let c=[...new Set([v,...w].map(x=>Number(x.toFixed(2))))];for(let j=1;c.length<4;j++){let d=Number((v+j).toFixed(2));if(!c.includes(d))c.push(d);}add(k,k==='dmh'?7:2,'แฟ้ม'+name+' (ข้อมูลสมมติ): '+q,c.map(String),0,e,'','การวิเคราะห์แผนงาน • ข้อมูลสมมติ');}
 metric('ทะเบียนสองช่องทางมี '+a+' และ '+b+' ราย พบซ้ำ '+over+' ราย หากเป้าหมาย '+target+' ราย ผลงานที่ไม่นับซ้ำคิดเป็นกี่เปอร์เซ็นต์ (ทศนิยมสองตำแหน่ง)',u/target*100,[(a+b)/target*100,(a-over)/target*100,u/(a+b)*100],'จำนวนไม่ซ้ำ = '+a+' + '+b+' − '+over+' = '+u+' นำไปหารเป้าหมาย '+target+' แล้วคูณ 100');
 metric('สุ่มตรวจ '+target+' แฟ้ม พบขาดลายเซ็น '+a+' แฟ้ม ขาดวันที่ '+b+' แฟ้ม ขาดทั้งคู่ '+over+' แฟ้ม ที่ครบทั้งสองรายการมีกี่แฟ้ม',target-u,[target-a-b,target-over,u],'จำนวนแฟ้มบกพร่องอย่างน้อยหนึ่งรายการ = '+u+' เหลือครบถ้วน '+(target-u)+' แฟ้ม');
 metric('พื้นที่นำร่องเปลี่ยนจาก '+pre+'% เป็น '+post+'% พื้นที่เปรียบเทียบเปลี่ยนจาก '+cp+'% เป็น '+ct+'% ผลต่างของการเปลี่ยนแปลงเท่ากับกี่จุดร้อยละ',post-pre-m,[post-pre+m,post-pre,post-ct],'ผลต่างของผลต่าง = ('+post+' − '+pre+') − ('+ct+' − '+cp+')');
 metric('กลุ่มแรกติดตามได้ '+a+' จาก '+target+' ราย กลุ่มสองได้ '+b+' จาก '+(target+50)+' ราย ทั้งสองกลุ่มไม่ซ้ำกัน อัตรารวมเป็นกี่เปอร์เซ็นต์ (ทศนิยมสองตำแหน่ง)',(a+b)/(2*target+50)*100,[(a/target+b/(target+50))*50,(a+b)/(2*target)*100,(a+b)/(target+50)*100],'รวมตัวเศษและตัวส่วนของทั้งสองกลุ่มก่อนหาร ห้ามเฉลี่ยสองเปอร์เซ็นต์โดยให้น้ำหนักเท่ากัน');
 metric('ต้นงวดค้าง '+over+' เรื่อง รับใหม่ '+a+' เรื่อง ปิดได้ '+b+' เรื่อง และส่งคืนเรื่องซ้ำอีก '+m+' เรื่องซึ่งยังไม่นับในยอดปิด คงค้างปลายงวดกี่เรื่อง',over+a-b-m,[over+a-b+m,over+a-b,a-b-m],'ปลายงวด = ค้างเดิม + รับใหม่ − ปิด − ส่งคืนเรื่องซ้ำ');
 metric('ใช้งบ '+(a*1000)+' บาทเป็นต้นทุนคงที่ และ '+(b*100)+' บาทต่อรอบ จัด '+m+' รอบ ได้ผลผลิตที่ผ่านเกณฑ์ '+over+' หน่วย ต้นทุนต่อหน่วยที่ผ่านเป็นกี่บาท (ทศนิยมสองตำแหน่ง)',(a*1000+b*100*m)/over,[(a*1000+b*100)/over,(a*1000+b*100*m)/m,a*1000/over],'ต้นทุนรวมต้องรวมต้นทุนผันแปรทุกรอบ แล้วหารเฉพาะหน่วยที่ผ่านเกณฑ์');
 metric('จัดสรร '+(target*10)+' พันบาท จ่ายแล้ว '+(a*10)+' พันบาท และมีภาระผูกพันที่ยังไม่จ่าย '+(b*10)+' พันบาท ยอดที่ยังไม่จ่ายและยังไม่ผูกพันเหลือกี่พันบาท',(target-a-b)*10,[(target-a)*10,(target-b)*10,(a+b)*10],'หักทั้งยอดจ่ายจริงและยอดผูกพันค้างจ่ายจากยอดจัดสรร เพราะสองยอดนี้ไม่ซ้อนกัน');
 metric('ตรวจรอบแรก '+target+' ราย ผ่าน '+a+' ราย รอบสองแก้ไขจนผ่านเพิ่มเติม '+over+' รายจากผู้ไม่ผ่านเดิม ยังเหลือผู้ไม่ผ่านกี่ราย',target-a-over,[target-a+over,target-a,a+over],'รวมเฉพาะผู้ผ่านเดิมและผู้ผ่านเพิ่ม แล้วหักออกจากจำนวนตรวจทั้งหมด');
}
for(const k of ids){if(bag[k].length!==500)throw Error(k+' '+bag[k].length);fs.writeFileSync('practice500/'+k+'.json.gz',z.gzipSync(JSON.stringify(bag[k]),{level:9}));}
