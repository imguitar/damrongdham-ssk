# Responsive, Accessibility และ Localization

อ่านเมื่อสร้างหรือเปลี่ยน layout, interactive controls, chart และการรองรับหลายภาษา/ขนาดจอ

## Responsive ตาม Content

ใช้ breakpoints ของระบบและตรวจช่วงระหว่าง breakpoint ไม่ทดสอบเฉพาะ device preset
กำหนดลำดับการ stack จากความสำคัญ ไม่ใช่ลำดับที่จัดง่ายใน CSS; DOM/focus order ต้องยังมีเหตุผล
Card grid ต้องรองรับ label ยาวและค่าหลายหลัก ไม่ใช้ fixed height จนตัดข้อมูลสำคัญ
Chart container ต้องมีขนาดที่คำนวณได้และปรับเมื่อ sidebar เปิด/ปิดหรือ tab เปลี่ยน
เมื่อพื้นที่แคบให้ปรับ legend, label density หรือชนิด presentation แทนย่อทุกอย่างจนอ่านไม่ได้
ตารางอาจใช้ horizontal scroll, priority columns หรือ detail view ตามงาน; อย่าซ่อนข้อมูลที่จำเป็นโดยไม่มีทางเข้าถึง
Dialog/filter drawer ต้องเลื่อนเนื้อหาได้ ปุ่มหลักไม่ถูก virtual keyboard หรือ sticky footer บัง
ตรวจ zoom/text scaling, landscape และเนื้อหาล้น โดยไม่ปิด user zoom

## Keyboard และ Focus

ทำ task หลักได้โดย keyboard: เปิด filter เลือกค่า apply เปิด detail ปิด dialog และกลับตำแหน่งเดิม
Focus ต้องมองเห็นได้และไม่ถูก sticky header/overlay บัง; หลีกเลี่ยง positive tabindex เพื่อแก้ลำดับ DOM ที่ผิด
Dialog จัด focus ภายในและคืนสู่ trigger เมื่อปิด ใช้พฤติกรรมมาตรฐานของ component library
Hover-only actions ต้องมีทางเข้าถึงเมื่อ focus/touch; อย่าฝากข้อมูลสำคัญไว้ใน tooltip อย่างเดียว
Disabled action ควรมีคำอธิบายที่เข้าถึงได้เมื่อเหตุผลไม่ชัด โดยไม่ทำให้ปุ่ม disabled เป็นทางเดียวที่จะอ่านคำอธิบาย

## Semantics และ Assistive Technology

ใช้ heading hierarchy, landmarks, labels และ table headers ตามหน้าที่ ไม่เลือก heading เพียงเพื่อขนาดฟอนต์
Icon-only button ต้องมีชื่อ; input error ต้องเชื่อมกับ field; required ต้องไม่สื่อด้วยสีหรือดอกจันอย่างเดียว
แจ้ง loading/result/error ผ่านกลไกที่เหมาะสมโดยไม่ announce ทุก animation หรือทุก keystroke
Chart มีชื่อ คำอธิบายใจความ และวิธีอ่านข้อมูลเทียบเท่า เช่น ตาราง เมื่อ interaction ของ library เข้าไม่ถึง
Status/series ใช้ข้อความ รูปร่าง หรือ pattern เสริมสีตามความเหมาะสม
เคารพ reduced motion และไม่ทำ auto-refresh ขโมย focus หรือ reset สิ่งที่กำลังอ่าน
การตรวจด้วยเครื่องมืออย่างเดียวไม่พิสูจน์ accessibility ทั้งหมด ต้องตรวจ task ด้วย keyboard และวิธี manual ที่เกี่ยวข้อง
ถ้างานกำหนดมาตรฐาน/ระดับ compliance ให้ตรวจเอกสารทางการที่เป็นปัจจุบันตามเกณฑ์นั้นก่อนรับรอง ไม่อ้างว่าผ่านมาตรฐานจาก screenshot เพียงอย่างเดียว

## ภาษาและ Locale

แยกภาษาของ UI จาก locale/date/calendar/timezone ตามข้อมูลที่ระบบกำหนด
ทดสอบข้อความจริงที่ยาว ตัวเลขใหญ่ วันที่ และชื่อบุคคล/หน่วยงาน; ข้อมูลตัวอย่างสั้นไม่พอสำหรับตรวจ overflow
สำหรับภาษาไทย ตรวจสระ/วรรณยุกต์ line-height และการตัดคำ; อย่าแทนเลขปี ค.ศ./พ.ศ. ด้วยการบวกปีใน string โดยไม่ดู data contract
สำหรับหลายภาษา ใช้ formatter/i18n เดิม ไม่ต่อประโยคจาก fragment ที่แปลแล้วจนลำดับคำเสีย
ถ้ารองรับ RTL ตรวจ alignment, icon direction และ navigation ตามบริบท ไม่ mirror กราฟ/ตัวเลขทุกอย่างโดยอัตโนมัติ
Label ที่ย่อเพื่อประหยัดพื้นที่ต้องยังเข้าใจได้และมีทางอ่านชื่อเต็ม

## ชุดตรวจขั้นต่ำตามผลกระทบ

ตรวจ viewport แคบและกว้างของหน้าที่เปลี่ยน พร้อม keyboard, long content และ loading/error
เมื่อแก้ shared layout/theme ให้เพิ่มหน้าตัวแทนที่ใช้ component เดียวกัน
บันทึกสิ่งที่ตรวจจริงและข้อจำกัดของ assistive-technology testing แยกจากผล responsive
