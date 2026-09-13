# Browser Flows และ Regression

อ่านเมื่อทดสอบ user journey, UI changes หรือยืนยันบั๊กที่แก้แล้ว

## เลือก Flow

เลือก task ที่ได้รับผลจริง เช่น filter→detail→Back, form→validation→submit หรือ login→protected page
ตรวจ allowed และ denied roles ที่เกี่ยวข้อง ไม่ต้องทุก role ทุก viewport ทุกครั้ง
ใช้ stable semantic selectors เมื่อ tooling รองรับ ไม่ผูก test กับ DOM nesting หรือ class สำหรับ styling
รอ observable state/network completion ที่เกี่ยวข้อง ไม่เพิ่ม sleep คงที่เพื่อให้ผ่าน

## UI Matrix

ตรวจ loading, empty, failed response, expired session และ long content ตาม change
Responsive ตรวจ viewport แคบ/กว้างและ overflow; visual layout ต้องเปิดดู ไม่อ้างจาก build
Keyboard ตรวจ focus order, dialog return focus, labels และ controls หลัก
Screenshot เป็นหลักฐานของ state/viewport นั้นเท่านั้น ไม่พิสูจน์ API correctness หรือ accessibility ทั้งหมด
เมื่อใช้ browser tool อ่านคู่มือของเครื่องมือที่มีใน environment ไม่บังคับติดตั้ง plugin ใหม่ทุกงาน

## Regression ที่มีความหมาย

ระบุ invariant ที่บั๊กทำลายและตัวอย่าง input/sequence ที่กระตุ้น
เมื่อทำได้อย่างปลอดภัย ยืนยัน test จับพฤติกรรมเดิมได้โดยไม่ย้อนทับ working tree ของผู้ใช้
อย่าเขียน test ที่เพียงค้นชื่อฟังก์ชัน/heading หรือ copy algorithm เดิมมาเป็น expected
ทดสอบ failure boundary ใกล้จุดแก้ด้วย ไม่เพิ่ม end-to-end suite ทั้งระบบเพียงเพราะแก้ field เดียว

## Documentation/Skill Changes

ตรวจ frontmatter, links, references ที่เข้าถึงได้และความถูกต้องของคำสั่งที่อ้าง
ลอง scenario เพื่อดู scope/การเลือกคำแนะนำ โดยแยก manual tabletop ออกจาก model/runtime evaluation
ไม่รัน application DB suite เพียงเพราะแก้ Markdown ถ้าไม่ได้เปลี่ยน behavior แอป

## ส่งมอบ

ระบุ command/browser/viewport/role และผลจริงตามที่เกี่ยวข้อง
บอกสิ่งที่ไม่ได้ทดสอบกับผลกระทบ ไม่ใช้คำว่า E2E ผ่านจาก unit/build เท่านั้น
