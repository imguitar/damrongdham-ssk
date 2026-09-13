# Schema และ Migrations

อ่านเมื่อเปลี่ยน schema/index/constraint/backfill ใช้ database engine และ migration tooling จริงของปลายทาง

## ก่อนแก้

ตรวจ schema จาก migration และ query ปัจจุบัน; production schema อาจยังไม่ตรง Working Tree
ระบุขนาดข้อมูลโดยหลักฐานหากจะตัดสินใจเรื่อง lock/backfill ไม่เดาว่าตารางเล็ก
แยก fresh initialization กับ upgrade ของฐานข้อมูลเดิม และตรวจว่าสคริปต์ถูก trigger อย่างไร

## Schema และ Index Design

เลือก types/nullability/default จาก data contract และข้อมูลเดิม ไม่เลือกเพื่อให้ UI validation ผ่านเท่านั้น
ใช้ FK/unique/check constraints ตาม invariant และความสามารถ engine ตรวจ soft-delete/tenant key เมื่อออกแบบ uniqueness
Identifier ที่มีเลขศูนย์นำหน้าหรือไม่ใช่ปริมาณอาจต้องเก็บเป็นข้อความ ไม่แปลงเป็น numeric โดยไม่ดู requirement
ตรวจ collation/case sensitivity, Unicode และ timestamp/date-only semantics ของปลายทาง
ประเมิน index จาก WHERE/JOIN/ORDER และ execution plan; composite index order ต้องสัมพันธ์กับ query จริง
ชั่งประโยชน์การอ่านกับ write/storage cost และ lock ขณะสร้าง index ไม่เพิ่มทุก column เป็น index
การแก้ ORM model ไม่ยืนยันว่า schema ที่ deploy เปลี่ยนแล้ว ต้องมี migration path ตาม tooling

## Migration

1. วาง expand → backfill → enforce/contract เมื่อ deployment ต้องรองรับโค้ดเก่าและใหม่พร้อมกัน
2. เพิ่ม field แบบที่ข้อมูลเดิมยังอ่านได้ก่อนบังคับ NOT NULL/unique/FK
3. ใช้ migration history ของโครงการ; อย่าแก้ migration ที่ apply ไปแล้วเพื่อบังคับ production เปลี่ยนย้อนหลัง
4. ระบุ precondition, order, repeatability, expected row counts และ recovery เมื่อจบเพียงบางส่วน
5. ตรวจ DDL transaction/implicit commit ของ engine จริง อย่าอ้าง rollback ได้ทุกคำสั่ง
6. ทดสอบ fresh/upgrade/re-run ตามรูปแบบ tooling โดยใช้ disposable database
7. ก่อน production mutation ต้องมี authorization และ target ชัดเจน ใช้ backup/restore procedure ที่เหมาะกับขอบเขต
