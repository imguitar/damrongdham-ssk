---
name: testing-qa
description: วางกลยุทธ์ สร้างและรัน tests, fixtures, integration/E2E และ regression พร้อมรายงานหลักฐาน ใช้กับงาน QA หรือ behavior changes ที่ต้องมีการตรวจรับ ไม่บังคับ full suite ทุกงาน
---

# Testing QA

## ขอบเขตและการใช้ซ้ำ

ใช้ได้อิสระข้ามโปรเจกต์ คัดลอกทั้งโฟลเดอร์นี้โดยไม่ต้องนำ Skill อื่นมาด้วย ใช้ภาษา framework และข้อกำหนดของปลายทาง
เมื่อมี Project Skill ให้อ่านข้อจำกัดเฉพาะงานที่เกี่ยวข้อง แต่ไม่กำหนด dependency ย้อนกลับหรือบังคับโหลดทุก Skill
คำขอผู้ใช้กำหนดขอบเขต: review/diagnose ไม่ใช่การอนุญาต implement และการแก้ไฟล์ไม่อนุญาต deploy หรือ external effects อัตโนมัติ

## เริ่มงาน

ตรวจ runner/config/helpers และ side effects ก่อนรัน ใช้ stack/testing tools ที่มีอยู่
NODE_ENV=test ไม่ยืนยันว่า database/provider เป็น test target; ห้าม cleanup ข้อมูลที่ไม่ใช่ fixture
แยก passed/failed/skipped/not run และ static/runtime evidence; test output ต้องไม่เปิดเผย secrets
ตรวจ working tree และรักษางานที่ไม่เกี่ยวข้องก่อนแก้ไฟล์
เลือก Reference ตามตารางและอ่านไฟล์ที่เลือกให้ครบก่อนทำงาน ไม่โหลดทั้งหมดโดยอัตโนมัติ

## References ตามงาน

| เมื่อ | อ่าน |
|---|---|
| เลือกชุดทดสอบหรืออ่านผล | [Strategy และ Evidence](references/strategy-and-evidence.md) |
| database, external provider หรือ concurrent tests | [Fixtures และ Integration](references/fixtures-and-integration.md) |
| user flow, UI หรือ reproduction ของบั๊ก | [Browser และ Regression](references/browser-and-regression.md) |

## ส่งมอบ

สรุปผลที่เปลี่ยน/สิ่งที่พบ พร้อมหลักฐานตรวจตามความเสี่ยงและข้อจำกัด แยกสิ่งที่ยังไม่รันออกจากสิ่งที่ผ่าน
ไม่เปลี่ยน stack หรือเพิ่มเครื่องมือเพียงเพื่อให้ตรงตัวอย่างใน Skill นี้

