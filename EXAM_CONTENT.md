# ชุดติวสามหน่วยงาน • 10 กันยายน 2569

ปรับตามภาพขอบเขตสอบที่ผู้ใช้ส่ง โดยเรียงความเร่งด่วน สตง. → สป.กษ. → กรมสรรพากร ไฟล์ของหน่วยงานที่สอบไปแล้วและหน้าอังกฤษ/กฎหมายกลาง/เปรียบเทียบคงเดิม

| หน่วยงาน | หัวข้อหลัก | ข้อฝึกหลักหลังตัดข้อซ้ำ | ชุดเพิ่มเติม 9 ก.ย. | ชุดเน้น 10 ก.ย. | บทเสริม |
|---|---:|---:|---:|---:|---:|
| สตง. | 9 | 185 | 36 | 27 | 16 ข้อ |
| สป.กษ. | 5 ที่มองเห็นในภาพ | 91 | 20 | 15 | — |
| กรมสรรพากร | 8 | 137 | 32 | 24 | — |

รวมข้อฝึกหลัก 413 ข้อ บทเสริม 16 ข้อ (ทั้งหมด 429 ข้อ) ชุดเพิ่มเติมเดิม 88 ข้อ และชุดเน้นใหม่ 66 ข้อ และคำถามเขียนทบทวนด้วยตนเอง 22 หัวข้อ ภาพระบุคะแนนเต็ม 200 แต่ไม่ได้บอกจำนวนข้อ น้ำหนักรายหัวข้อ หรือยืนยันว่าทั้งหมดเป็นปรนัย จึงใช้คำว่า “ชุดฝึก” และไม่อ้างว่าเป็นข้อสอบจริงหรือทำนายเกณฑ์ผ่าน

ภาพ สป.กษ. ถูกตัดด้านล่าง จึงไม่อ้างว่าครบประกาศที่มองไม่เห็น กฎหมายที่แนะนำในหัวข้อกฎหมายราชการไม่ได้ถือเป็นรายการปิดตายจากประกาศ

## เนื้อหาและต้นฉบับ

- เพิ่มกรณีวิเคราะห์กฎหมาย งบประมาณ นโยบาย โครงการ การจัดซื้อจัดจ้าง ภาษี และข้อมูลส่วนบุคคล พร้อมเหตุผลและแนวตอบสั้น
- แก้จริยธรรม สตง. ให้ใช้ประกาศเฉพาะ 2561/2562 ตามมาตรา 63 ไม่ใช่อ้าง พ.ร.บ.มาตรฐานจริยธรรม 2562 เป็นฐานของประกาศ 2561
- แก้สถานะ สตง. และโทษทางปกครอง มาตรา 98; มาตรา 79 การเงินการคลังให้ครบสามระบบ; แยกเกณฑ์งบลงทุนทั้งสองเงื่อนไข
- แก้ภาษีหัก ณ ที่จ่ายให้แยกนิติบุคคลตามมาตรา 69 ทวิจากบุคคลธรรมดาตามมาตรา 50(4); VAT 7% ในกรณีคำนวณระบุเป็นสมมติฐาน
- แก้ข้อยกเว้นเชิญผู้ประกอบการ มติและองค์ประชุม วันเริ่มนับเงินยืมและแจ้งจำหน่ายพัสดุ เงื่อนไขแจ้งเหตุ PDPA 72 ชั่วโมง และช่องทางอุทธรณ์ข้อมูลข่าวสาร
- ลิงก์ “อ่านฉบับเต็ม” อยู่ต้นบทกฎหมายและแท็บ “ฉบับเต็ม / แหล่งอ่าน” มีทั้ง PDF ตัวบท แหล่งรวมเอกสาร และฉบับแก้ไขที่ระบุ พร้อมลิงก์หน่วยงานสำรอง
- แผน/ข่าวระบุช่วงปีหรือวันที่ แยกเป้าหมายแผนจากผลจริง แหล่งอ่านไม่ได้อัปเดตอัตโนมัติและไม่อ้างว่ารวมทุกหนังสือเวียน

## การใช้งานและการดูแล

เป็น static HTML/JS แบบเดิม ไม่เพิ่ม framework, backend หรือบริการภายนอกใหม่ บทเรียนอยู่ `data/sao.js`, `data/opsmoac.js`, `data/rd.js`; หน้าติวใช้ `exam-tutor.js`, `exam-core.js`, `exam-tutor.css` ร่วมกัน

บันทึกความคืบหน้าและคำตอบใน `localStorage` แยกหน่วยงานด้วย `exam-tutor-v1:<agency>` เป็นข้อมูลเฉพาะเบราว์เซอร์/อุปกรณ์ ไม่มีการซิงก์ข้ามเครื่อง หากบันทึกไม่ได้จะมีข้อความแจ้งและยังฝึกต่อได้

ชุดรวม 30 ข้อกระจายครบหัวข้อหลัก เฉลยเมื่อจบชุด ส่วนฝึกรายหัวข้อแสดงเหตุผลทันที ทวนข้อผิดใช้ผลล่าสุด และทำชุดเดิมซ้ำคงกลุ่มคำถามเดิมพร้อมสลับตัวเลือกใหม่ บทเสริมไม่นับในชุดรวม

เมื่อปรับคำถามให้รักษา `id` เดิมหากยังเป็นคำถามเดิม เพื่อไม่ล้างความคืบหน้า ตรวจ `a` ให้ชี้คำตอบถูกใน `c` และเพิ่มแหล่งใน `sources` พร้อม `fullUrl`/`fullType` สำหรับตัวบทฉบับเต็ม

ตรวจด้วย `node --test tests/exam-core.test.js` ครอบคลุมขอบเขตและลำดับหัวข้อ ความสมบูรณ์ของข้อฝึก แหล่งอ่าน การสุ่ม/สลับเฉลย การทวนข้อผิด ข้อมูลบันทึกไม่สมบูรณ์ และไฟล์ที่แต่ละหน้าใช้ ไม่มีการทดสอบด้วยเบราว์เซอร์ในงานนี้

## ชุดเน้นสอบ 10 กันยายน 2569

- 66 ข้อใหม่ ครบหัวข้อที่มองเห็น 9/5/8 หัวข้อ โดยแต่ละหัวข้อมี 3 ข้อ สัดส่วนนี้เพื่อกระจายการฝึก ไม่ใช่ประมาณน้ำหนักข้อสอบจริง
- คัดจากขอบเขตในภาพ ประเด็นที่สัมพันธ์กับงานตำแหน่ง และจุดที่ต้องแยกเงื่อนไข/ข้อยกเว้น ไม่อ้างสถิติข้อสอบเก่า ความถี่ หรือเปอร์เซ็นต์ที่จะออก และไม่ใช้ชุดขายข้อสอบเป็นหลักฐานเฉลย
- ทุกข้อมี `focus`, `skill`, `reference`, `verifiedAt` และ `choiceReasons` 4 รายการ อธิบายด้วยข้อความตัวเลือกแทนการอ้าง ก/ข/ค/ง เพื่อให้สลับตำแหน่งได้โดยไม่ทำให้เหตุผลผิดข้อ
- เปิดได้จากการ์ดหน้าแรก ปุ่มชุดเน้นสอบ และปุ่มฝึกเฉพาะหัวข้อ มีทั้งเฉลยทันทีและเฉลยท้ายชุด พร้อมปุ่มเปิดต้นฉบับทุกข้อ ใช้รหัสคำถามเดิมและข้อมูลความคืบหน้าเดิมต่อได้
- ตรวจมาตรา 89, 95, 99, 103 ของ พ.ร.ป.ตรวจเงินแผ่นดิน; มาตรา 20, 27, 79 วินัยการคลัง; มาตรา 40, 43, 45–47 วิธีการงบประมาณ; ข้อ 27 จริยธรรมตามฉบับแก้ไข 2562
- ตรวจมาตรา 50(4), 54 ของประมวลรัษฎากรจากตัวบทกรมสรรพากร; ข้อ 20, 27 ระเบียบพัสดุ; ข้อ 65, 76, 78–79 ระเบียบเบิกเงิน; มาตรา 18 ข้อมูลข่าวสาร และมาตรา 24, 37, 40 PDPA
- ระเบียบบริหารงบประมาณ ข้อ 3, 7–9 ตรวจสำเนาภาพสแกนจาก สป.สาธารณสุขหน้าที่ 2–3 และพบต้นฉบับดาวน์โหลดของสำนักงบประมาณ จึงเปลี่ยนปุ่มกฎหมายงบประมาณเป็น PDF โดยตรงพร้อมหน้าหน่วยงานสำรอง
- เป้าหมายแผนพัฒนาฯ 13 และการเชื่อมแผนตรวจประกอบส่วน 2 ของแผน สป.กษ. 2568; วิสัยทัศน์/พันธกิจใช้ส่วน 4 พร้อมระบุปี ไม่อ้างว่าเป็นโครงสร้างล่าสุดโดยไม่มีเอกสารยืนยัน
- ข่าวกระทรวงเกษตรฯ 3 ก.ย.2569 และ D-MyTax 14 ม.ค.2569 ใช้เป็นกรณีอ่านข่าวอย่างมีเงื่อนไข ไม่สรุปว่ามติคณะกรรมการเท่ากับกฎหมายมีผลแล้ว ส่วนกรอบประเมินใช้ OECD Evaluation Criteria

การตรวจงานรอบนี้: Node ตรวจความสมบูรณ์คลัง 429 ข้อ การคัดชุดเน้น 66 ข้อ ความครอบคลุม สลับคำตอบพร้อมเหตุผล ทำซ้ำ ทวนข้อผิด ความคืบหน้า และความถูกต้องของไฟล์ที่หน้าเว็บเรียกใช้ ไม่ได้ทดสอบหน้าจอด้วยเบราว์เซอร์ และไม่ใช้คะแนนชุดฝึกเป็นหลักฐานทำนายผลสอบ

การทวนข้อเดิมที่เกี่ยวข้อง: ปรับคำถามและข้อความการเบิกเหลื่อมปีให้ระบุเงื่อนไขมาตรา 43 ชัดเจน โดยคงรหัสคำถาม และตัดคำอ้าง “ยอดฮิต” ที่ไม่มีหลักฐานความถี่ในคำอธิบายเดิมสองจุด การตรวจอัตโนมัติรอบนี้ผ่าน 11 รายการ


## Energy specialist addition — 2026-09-14

Added `energy.html` and `data/energy.js` for นักวิชาการพลังงานปฏิบัติการ, สำนักงานปลัดกระทรวงพลังงาน. Scope is transcribed from the user's IMG_0870.png: general knowledge 50 points (organization, energy fundamentals, civil-service ethics), and role-specific knowledge 150 points (energy planning, fuels/gas/electricity and testing, renewable energy/efficiency, and five named Acts). Eleven lessons split the five Acts into individual study topics.

The 48 original four-choice practice questions comprise 12 general and 36 role-specific questions. Every question has explanations for all four choices, a stable agency-specific ID, document references and clickable sources. The complete practice exam uses all 48 questions to retain the 1:3 section ratio. This is a practice design based on the score split, not a claim about actual question counts, topic frequency, pass marks, or a guaranteed prediction. Other agencies retain their existing 30-question selection and progress IDs.

Primary legal PDFs were retrieved and checked from `law.energy.go.th/laws/detail/32730` (fuel control), `32729` (fuel trade), `32732` (conservation, incorporating the 2550 amendment), `32728` (energy industry), and `32740` (oil fuel fund). Links open the actual PDF, with a separate publisher/amendments link. The Office's organization sources include the 2562 regulation and amendments in 2566 and 2567; the latter was visually checked because its extracted text is garbled. Office/ministry strategy material is explicitly labeled by its 2566–2570 plan edition. No current price, officeholder, draft energy-plan target or examination date is presented as settled fact.

Content review corrected the Oil Fuel Fund Office's legal-status reference to section 18 (section 17 concerns meeting allowances). Fuel inspection scenarios explain general evidence quality; they do not invent sampling quantities or claim to replace official laboratory procedures. Numerical questions state hypothetical inputs and explain the calculation.

Validation: `node --test tests/*.test.js` — 15 passing tests, including all 11 pre-existing checks and four energy coverage/integrity/calculation/link/progress checks. JavaScript syntax checked. No browser interaction test was performed. The existing agency data files and completed-agency pages are unchanged.
# Research expansion — 11 October 2026

Current priority roles: Revenue Department procurement academic officer and Office of the Permanent Secretary, Ministry of Energy, energy academic officer. Each role now has two distinct 100-question sets (200 questions per role, 400 total). Set A preserves all original question IDs and content; set B adds original scenario, interpretation and multistep calculation questions with explanations and source links. The briefing is available at `rd-sprint.html#briefing` and `energy-sprint.html#briefing`, including from the original `study.html?page=energy#read` entry point.

## Scope and prediction method

- RD: official recruitment notice dated 7 August 2569, PDF page 16, confirms eight syllabus headings. The 12/8/35/15/10/8/5/7 allocation in each 100-question set is an editorial practice allocation, not a published topic weighting.
- OPS Energy: official recruitment notice dated 2 September 2569, PDF page 10, specifies general 50 points and role-specific 150 points. Each practice set has 25 general and 75 specific questions at two practice points each. The announcement does not establish that the actual examination must contain exactly 100 questions.
- Thammasat is the stated examination setter in the user's information. Public procurement evidence found in OPS Energy's January 2568 monthly report, page 2 item 7, records Thammasat as the selected contractor for the specific-knowledge examination, contract 84/2568 dated 30 January 2568. This confirms a previous engagement, not the contents of the current test. No authenticated publicly released paper for the two current roles was located. No invented TU-specific frequency or guaranteed predictions are used.
- Searches covered official recruitment pages/PDFs, legislation and amendments, agency plans/news, procurement records, technical agencies/standards publishers, public forum/social search results and commercial preparation listings. Secondary claims and material for different positions were not treated as authenticated past papers.

## Content checks and updates

The RD briefing distinguishes procurement authorization ceilings (200/100/50 million baht for the three methods) from method-selection thresholds, different appeal stages and working/calendar days, unanimous inspection decisions, treasury timelines, tax bases and budget allocation exceptions. It links the procurement regulation's 2569 amendment and the official index for September 2569 e-GP circulars; it does not invent unverified effective dates for those circulars. The July 2569 VAT news is explicitly a report of Cabinet approval in principle of a draft, not itself the enacted Royal Decree. GloBE MCAA coverage follows the RD September news release.

Energy adds calculations of NPV, net payback, LCOE, SEC, interacting savings measures, three-phase power, PF, PV self-consumption, usable storage, COP, pumps and heat balances. Inputs and formulas are stated where needed. Fuel-testing questions distinguish properties, sampling, repeatability/bias and decision rules; they do not reproduce paid ASTM standards or prescribe unverified laboratory procedures. Legal questions use the five agency-hosted Acts and DEDE's 2569 notice. Draft PDP targets are not presented as final adopted policy.

Source catalogs contain 32 RD and 44 energy entries (some entries concern copies or complementary sources, so this is not a claim of 76 independent authorities). Source names, exact URLs, dates and relevant provisions are attached to questions and briefing cards.

## Compatibility and validation

LocalStorage keys and bank version identifiers are retained, so existing 100-question sessions, answer order, bookmarks, history and progress remain valid. Full-set and 20-question practice use the selected A/B set; topic drills span both. A missing data part blocks launching rather than silently using an incomplete bank.

`node --test tests/role-research.test.js`: seven passing tests covering bank integrity, disjoint sets, energy score allocation, legacy-session compatibility, completion/retry behavior and independently recomputed numerical answers. Existing `energy.test.js` and `exam-core.test.js`: 13 passing, two pre-existing failures also reproduced at the unchanged baseline `8f4e75b` (obsolete homepage link expectation and a dynamic-template URL interpreted as a local file). These baseline failures are separate from the new feature tests.

Browser verification passed for both roles with Chromium: 320/390/1280 px layout, A/B selection, 100-question exam completion and score breakdown, old-session resume, reload persistence, wrong-answer retry, navigation from the original study URL, missing-part protection, and no JavaScript errors. Screenshots were visually inspected and remain QA intermediates, not application dependencies.

---
