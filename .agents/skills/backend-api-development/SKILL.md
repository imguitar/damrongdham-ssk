---
name: backend-api-development
description: พัฒนาและรีวิว API contracts, validation, business logic, transactions และ queries/exports ใช้กับ backend implementation ไม่ใช่คู่มือ deploy หรือย้าย schema
---

# Backend API Development

## ขอบเขตและการใช้ซ้ำ

ใช้ได้อิสระข้ามโปรเจกต์ คัดลอกทั้งโฟลเดอร์นี้โดยไม่ต้องนำ Skill อื่นมาด้วย ใช้ภาษา framework และข้อกำหนดของปลายทาง
เมื่อมี Project Skill ให้อ่านข้อจำกัดเฉพาะงานที่เกี่ยวข้อง แต่ไม่กำหนด dependency ย้อนกลับหรือบังคับโหลดทุก Skill
คำขอผู้ใช้กำหนดขอบเขต: review/diagnose ไม่ใช่การอนุญาต implement และการแก้ไฟล์ไม่อนุญาต deploy หรือ external effects อัตโนมัติ

## เริ่มงาน

ตรวจ callers, auth middleware, service/persistence boundary และ response helpers ของปลายทาง
รักษา object-level permission และ field projection ที่ server; valid input ไม่ใช่หลักฐานสิทธิ์
เปลี่ยน contract ต้องติดตาม consumers ที่เกี่ยวข้อง ทดสอบ allowed/denied/invalid และ rollback ตามผลกระทบ
ตรวจ working tree และรักษางานที่ไม่เกี่ยวข้องก่อนแก้ไฟล์
เลือก Reference ตามตารางและอ่านไฟล์ที่เลือกให้ครบก่อนทำงาน ไม่โหลดทั้งหมดโดยอัตโนมัติ

## References ตามงาน

| เมื่อ | อ่าน |
|---|---|
| endpoint, service หรือ state mutation | [Contracts และ Transactions](references/contracts-and-transactions.md) |
| filter, aggregate, pagination หรือ export | [Queries และ Exports](references/queries-and-exports.md) |
| failure, concurrency, timeout หรือ cleanup | [Errors และ Resource Lifetime](references/errors-and-resources.md) |

## ส่งมอบ

สรุปผลที่เปลี่ยน/สิ่งที่พบ พร้อมหลักฐานตรวจตามความเสี่ยงและข้อจำกัด แยกสิ่งที่ยังไม่รันออกจากสิ่งที่ผ่าน
ไม่เปลี่ยน stack หรือเพิ่มเครื่องมือเพียงเพื่อให้ตรงตัวอย่างใน Skill นี้

