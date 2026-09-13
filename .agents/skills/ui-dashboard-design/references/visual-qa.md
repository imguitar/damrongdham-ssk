# Visual QA และ Handoff

อ่านเมื่อรีวิวหน้าจอ ตรวจ implementation ใน browser หรือส่งมอบ design/prototype

## กำหนดขอบเขตหลักฐาน

- Screenshot review ตรวจ hierarchy/alignment/สี/ข้อความที่เห็นได้ แต่ไม่พิสูจน์ interaction, responsive ทุกขนาด, API correctness หรือ permission
- Code review ตรวจ implementation และความเสี่ยงที่อนุมานได้ แต่ไม่ยืนยันว่าภาพ render ถูกต้อง
- Browser check ยืนยัน state/viewport/role ที่ทดสอบจริง ไม่ถือว่าครอบคลุมทุกกรณี
- Build/lint/tests เป็นหลักฐานอีกชั้น ไม่ทดแทนการเปิดดู UI

ใช้ browser tooling ที่มีใน environment และอ่าน skill ของเครื่องมือนั้นเมื่อใช้ ไม่บังคับติดตั้ง browser/plugin ใหม่ทุกงาน
ใช้ environment และบัญชีทดสอบที่ได้รับอนุญาต หลีกเลี่ยง production writes และไม่เก็บ screenshot ที่มี secret/PII โดยไม่จำเป็น

## วาง Test Matrix ตามความเสี่ยง

เลือกตัวแทนจาก viewport, role, data state, interaction และ theme ที่ได้รับผลกระทบ ไม่ต้องทดสอบ Cartesian product ทั้งหมด
งานหน้าใหม่ควรมี wide/narrow, normal/empty/error, long labels/large values และ task หลัก
งานเปลี่ยนสี component เดียวเน้น contrast, focus และ state ของ component ไม่ต้องทดสอบ workflow ทั้งระบบ
งานปรับ global theme/layout เพิ่มหน้าตัวแทนที่ไม่ใช่หน้าเป้าหมายเพื่อตรวจผลข้างเคียง

## Browser Review Loop

1. เปิด route จริงด้วยข้อมูลทดสอบที่ควบคุมได้ บันทึก viewport, role และ filters ที่ใช้
2. ตรวจภาพรวม: งานหลักเด่นหรือไม่ grouping/spacing/alignment สมเหตุผลหรือไม่
3. ตรวจจุดเสี่ยง: overflow, clipping, chart dimensions, sticky overlap, dialog และชื่อยาว
4. ใช้ task หลักจริง: filter→ผลลัพธ์→detail→Back หรือกรอก→validate→submit ตาม scope
5. ตรวจ loading/empty/error และ keyboard; ตรวจ console/network errors ที่เกี่ยวกับการเปลี่ยนแปลง
6. แก้เฉพาะปัญหาที่อยู่ใน scope แล้วตรวจ state ที่ได้รับผลซ้ำ อย่าหยุดเพียง screenshot แรกที่ดูดี

ถ้า browser/server/auth ใช้ไม่ได้ ให้ทำ static checks ที่ยังทำได้และบอก blocker; อย่าใช้ mock screenshot อ้างว่าเป็นหน้าจอจริง

## รีวิวให้แก้ได้

ระบุปัญหา ตำแหน่ง state/viewport ผลต่อผู้ใช้ และแนวทางแก้พร้อมหลักฐาน
จัดความสำคัญจากผลกระทบ: เข้าใจตัวเลขผิด/ข้อมูลรั่ว/ทำ task ไม่ได้ สำคัญกว่าระยะห่างไม่เท่ากันเล็กน้อย
แยก defect ที่พิสูจน์ได้ออกจากข้อเสนอด้านรสนิยม และอย่ารายงานความชอบส่วนตัวเป็น requirement
เมื่อผู้ใช้ขอ review อย่างเดียว ให้รายงานผลโดยไม่แก้โค้ดหรือ publish

## Handoff ตามชนิดงาน

Design proposal: สรุป audience/task, โครงสร้างที่เสนอ, metric/filter contract, states และสิ่งที่ต้องยืนยันก่อน implement
Prototype: ระบุ sample data, interaction ที่ทำงานจริง/จำลอง และข้อจำกัด ไม่อ้าง production-ready
Implementation: แจ้งไฟล์ที่เปลี่ยน พฤติกรรมที่คงไว้/เปลี่ยน ผลตรวจจริง และรายการที่ยังไม่ได้ตรวจ
แนบ screenshot หรือไฟล์เฉพาะเมื่อช่วยตรวจผล ไม่สร้างเอกสาร QA เพิ่มโดยไม่มีประโยชน์ต่อขนาดงาน
ห้ามรายงานว่า responsive/accessibility/data correctness ผ่านทั้งหมดเมื่อทดสอบเพียงบางส่วน
