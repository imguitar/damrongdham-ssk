---
name: database-migrations
description: ออกแบบและปรับ schema, constraints, indexes, migrations และ backfills พร้อมตรวจ compatibility และ recovery ใช้กับการเปลี่ยนโครงสร้าง/ย้ายข้อมูล ไม่ใช้กับ query/report change ที่ไม่มี schema impact
---

# Database Migrations

## ขอบเขตและการใช้ซ้ำ

ใช้ได้อิสระข้ามโปรเจกต์ คัดลอกทั้งโฟลเดอร์นี้โดยไม่ต้องนำ Skill อื่นมาด้วย ใช้ภาษา framework และข้อกำหนดของปลายทาง
เมื่อมี Project Skill ให้อ่านข้อจำกัดเฉพาะงานที่เกี่ยวข้อง แต่ไม่กำหนด dependency ย้อนกลับหรือบังคับโหลดทุก Skill
คำขอผู้ใช้กำหนดขอบเขต: review/diagnose ไม่ใช่การอนุญาต implement และการแก้ไฟล์ไม่อนุญาต deploy หรือ external effects อัตโนมัติ

## เริ่มงาน

ยืนยัน engine/version, migration runner, target และ schema state จริงก่อนเลือกคำสั่ง
แยกการเขียน migration กับการ apply; งานเขียนไฟล์ไม่อนุญาตให้เปลี่ยน production data
ใช้ disposable database ตรวจ fresh/upgrade ตามผลกระทบ ระบุ partial failure และข้อจำกัด rollback ของ engine
ตรวจ working tree และรักษางานที่ไม่เกี่ยวข้องก่อนแก้ไฟล์
เลือก Reference ตามตารางและอ่านไฟล์ที่เลือกให้ครบก่อนทำงาน ไม่โหลดทั้งหมดโดยอัตโนมัติ

## References ตามงาน

| เมื่อ | อ่าน |
|---|---|
| schema, index, constraint หรือ upgrade | [Schema และ Migration](references/schema-and-migrations.md) |
| existing data, large update หรือ failure กลางทาง | [Backfill และ Recovery](references/backfill-and-recovery.md) |

## ส่งมอบ

สรุปผลที่เปลี่ยน/สิ่งที่พบ พร้อมหลักฐานตรวจตามความเสี่ยงและข้อจำกัด แยกสิ่งที่ยังไม่รันออกจากสิ่งที่ผ่าน
ไม่เปลี่ยน stack หรือเพิ่มเครื่องมือเพียงเพื่อให้ตรงตัวอย่างใน Skill นี้

