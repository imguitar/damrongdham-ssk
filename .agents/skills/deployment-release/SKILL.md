---
name: deployment-release
description: เตรียมและดำเนินการ release/deploy ตามอำนาจที่ได้รับ ครอบคลุม artifacts, configuration, migration ordering, smoke checks และ rollback ไม่ถือคำขอ review หรือเตรียมแผนเป็นคำสั่ง deploy จริง
---

# Deployment Release

## ขอบเขตและการใช้ซ้ำ

ใช้ได้อิสระข้ามโปรเจกต์ คัดลอกทั้งโฟลเดอร์นี้โดยไม่ต้องนำ Skill อื่นมาด้วย ใช้ภาษา framework และข้อกำหนดของปลายทาง
เมื่อมี Project Skill ให้อ่านข้อจำกัดเฉพาะงานที่เกี่ยวข้อง แต่ไม่กำหนด dependency ย้อนกลับหรือบังคับโหลดทุก Skill
คำขอผู้ใช้กำหนดขอบเขต: review/diagnose ไม่ใช่การอนุญาต implement และการแก้ไฟล์ไม่อนุญาต deploy หรือ external effects อัตโนมัติ

## เริ่มงาน

ระบุโหมด review, preparation หรือ execution พร้อม target/environment ให้แน่ชัด
ใช้ runbook และ tooling ของปลายทาง ไม่สมมติ cloud provider/process manager หรือ production host
แยก artifact rollback กับ database recovery; มีหลักฐาน backup/restore ที่เหมาะกับความเสี่ยงก่อน mutation ที่ย้อนคืนยาก
หากต้องมีอำนาจ/target เพิ่มให้หยุดก่อน external mutation แต่ทำ read-only checks ที่อยู่ใน scope ต่อได้
ตรวจ working tree และรักษางานที่ไม่เกี่ยวข้องก่อนแก้ไฟล์
เลือก Reference ตามตารางและอ่านไฟล์ที่เลือกให้ครบก่อนทำงาน ไม่โหลดทั้งหมดโดยอัตโนมัติ

## References ตามงาน

| เมื่อ | อ่าน |
|---|---|
| เตรียม release, deploy หรือ configuration | [Readiness และ Release Sequence](references/readiness-and-sequence.md) |
| smoke checks, failure, rollback หรือ operational handoff | [Verification และ Recovery](references/verification-and-recovery.md) |

## ส่งมอบ

สรุปผลที่เปลี่ยน/สิ่งที่พบ พร้อมหลักฐานตรวจตามความเสี่ยงและข้อจำกัด แยกสิ่งที่ยังไม่รันออกจากสิ่งที่ผ่าน
ไม่เปลี่ยน stack หรือเพิ่มเครื่องมือเพียงเพื่อให้ตรงตัวอย่างใน Skill นี้

