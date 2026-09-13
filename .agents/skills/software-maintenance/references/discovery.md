# Discovery และขอบเขตการเปลี่ยนแปลง

อ่านเมื่อเริ่มงานที่ยังไม่รู้โครงสร้าง วิเคราะห์ requirement หรือวางแผน feature หลายส่วน
ผลที่ต้องได้คือขอบเขตงาน เส้นทางข้อมูล จุดที่จะเปลี่ยน และเกณฑ์ที่พิสูจน์ความสำเร็จได้ ไม่จำเป็นต้องสร้างไฟล์แผนสำหรับงานเล็ก

## หลักฐานเริ่มต้น

- ตรวจ root, Git status, คำแนะนำ repository, manifest/lockfile และ entrypoints; อย่าสรุป stack จาก README เพียงอย่างเดียว
- ระบุเส้นทางจาก UI/consumer → API → service → storage → background side effects เฉพาะส่วนที่เกี่ยวข้อง
- อ่าน config/test helper ก่อนรันทดสอบที่อาจเปิด network หรือแก้ฐานข้อมูล
- ตรวจคำขอก่อนหน้าและ changes ที่ค้างว่าเป็นของผู้ใช้หรือเป็นงานต่อเนื่อง อย่าทิ้งเพราะยังไม่ commit

## แยกความจริงกับความตั้งใจ

บันทึกสั้น ๆ ว่า Requirement ต้องการอะไร โค้ดทำอะไร Tests ยืนยันอะไร และส่วนใดยังไม่ตรวจ
เมื่อแหล่งข้อมูลไม่ตรงกัน อย่าเลือกตามวันที่อย่างเดียว: Tests อาจยืนยันบั๊ก และคู่มืออาจเป็นแผนที่ยังไม่ implement
เรื่องที่เป็น behavior change ให้ยึดคำขอที่อนุมัติ; เรื่องบั๊กให้หาข้อกำหนดที่รองรับ expected behavior
ถ้ายังคลุมเครือในสิทธิ์หรือกฎธุรกิจ ให้เสนอทางเลือกพร้อมผลกระทบ แต่อย่าหยุดงานตรวจแบบ read-only ที่ทำต่อได้

## วางแผนตามผลกระทบ

- Input/output: fields ใหม่, default, nullability, validation, error shape
- Consumers: UI, API clients, exports, integrations และ deep links
- Data: schema, existing rows, indexes, transition atomicity
- Security: identity, role, resource scope, public projection
- Operations: jobs, queues, retries, environment, upgrade order
- Acceptance: ตัวอย่าง happy path และ failure/boundary ที่สำคัญ

## การใช้กับโปรเจกต์อื่น

ค้นหา equivalent ของ concern ไม่ใช่บังคับชื่อโฟลเดอร์ เช่น persistence อาจเป็น ORM/repository ไม่ใช่ Model
หากปลายทางไม่มี tests ให้ใช้ reproduction หรือ manual check ที่ทำซ้ำได้ ไม่ติดตั้ง framework ใหม่เพียงเพื่อทำตาม Reference นี้
ไม่อ้างว่าระบบจริงใช้งานเวอร์ชันเดียวกับ Working Tree หากไม่ได้ตรวจ deployment
