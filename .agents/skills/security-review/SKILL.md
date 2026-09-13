---
name: security-review
description: รีวิวความปลอดภัยตามขอบเขต โดยตรวจ authentication, authorization, object scope, PII และ input/file boundaries ใช้เมื่อผู้ใช้ขอ security review หรือการเปลี่ยนแปลงมีความเสี่ยงที่ต้องตรวจเฉพาะ ไม่อนุญาตแก้หรือทดสอบโจมตีระบบจริงโดยปริยาย
---

# Security Review

## ขอบเขตและการใช้ซ้ำ

ใช้ได้อิสระข้ามโปรเจกต์ คัดลอกทั้งโฟลเดอร์นี้โดยไม่ต้องนำ Skill อื่นมาด้วย ใช้ภาษา framework และข้อกำหนดของปลายทาง
เมื่อมี Project Skill ให้อ่านข้อจำกัดเฉพาะงานที่เกี่ยวข้อง แต่ไม่กำหนด dependency ย้อนกลับหรือบังคับโหลดทุก Skill
คำขอผู้ใช้กำหนดขอบเขต: review/diagnose ไม่ใช่การอนุญาต implement และการแก้ไฟล์ไม่อนุญาต deploy หรือ external effects อัตโนมัติ

## เริ่มงาน

เริ่มจาก assets, entrypoints, trust boundaries และขอบเขตที่ได้รับอนุญาต ไม่ audit ทั้งระบบจากการแตะ field เล็กน้อย
Review/diagnose ให้ตรวจแบบ read-only; implement เฉพาะเมื่อคำขอรวมการแก้ไข
ใช้ fixture/stub และตัวอย่างที่ไม่อ่อนไหว ไม่ดึงข้อมูลจริงของผู้ใช้อื่นเพื่อพิสูจน์การเข้าถึง
แยก finding ที่ยืนยันแล้วจากข้อสงสัยและข้อจำกัด ไม่รับรองความปลอดภัยทั้งหมดจาก checklist
ตรวจ working tree และรักษางานที่ไม่เกี่ยวข้องก่อนแก้ไฟล์
เลือก Reference ตามตารางและอ่านไฟล์ที่เลือกให้ครบก่อนทำงาน ไม่โหลดทั้งหมดโดยอัตโนมัติ

## References ตามงาน

| เมื่อ | อ่าน |
|---|---|
| login, access control, PII, files หรือ webhook | [Identity และ Data Boundaries](references/identity-and-data.md) |
| วางขอบเขต audit, พิสูจน์ประเด็น หรือรายงานผล | [Threat Review และ Findings](references/review-and-findings.md) |

## ส่งมอบ

สรุปผลที่เปลี่ยน/สิ่งที่พบ พร้อมหลักฐานตรวจตามความเสี่ยงและข้อจำกัด แยกสิ่งที่ยังไม่รันออกจากสิ่งที่ผ่าน
ไม่เปลี่ยน stack หรือเพิ่มเครื่องมือเพียงเพื่อให้ตรงตัวอย่างใน Skill นี้

