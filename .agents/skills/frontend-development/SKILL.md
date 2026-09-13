---
name: frontend-development
description: พัฒนาและแก้ไข frontend components, forms, state, routing และ API clients ใน stack เดิม ใช้กับ implementation หรือ technical review; การออกแบบภาพอย่างเดียวไม่ใช่งานหลักของ Skill นี้
---

# Frontend Development

## ขอบเขตและการใช้ซ้ำ

ใช้ได้อิสระข้ามโปรเจกต์ คัดลอกทั้งโฟลเดอร์นี้โดยไม่ต้องนำ Skill อื่นมาด้วย ใช้ภาษา framework และข้อกำหนดของปลายทาง
เมื่อมี Project Skill ให้อ่านข้อจำกัดเฉพาะงานที่เกี่ยวข้อง แต่ไม่กำหนด dependency ย้อนกลับหรือบังคับโหลดทุก Skill
คำขอผู้ใช้กำหนดขอบเขต: review/diagnose ไม่ใช่การอนุญาต implement และการแก้ไฟล์ไม่อนุญาต deploy หรือ external effects อัตโนมัติ

## เริ่มงาน

ตรวจ routes, reusable components, state ownership และ API contracts ก่อนแก้; รักษา design system และ framework เดิม
การซ่อนปุ่มไม่ทดแทน server authorization; ทดสอบ API error และ denied access ตามส่วนที่เปลี่ยน
เมื่อเปลี่ยนภาพ/interaction ต้องตรวจ browser ตามความเสี่ยง ไม่อ้างว่า build ผ่านคือ visual QA ผ่าน
ตรวจ working tree และรักษางานที่ไม่เกี่ยวข้องก่อนแก้ไฟล์
เลือก Reference ตามตารางและอ่านไฟล์ที่เลือกให้ครบก่อนทำงาน ไม่โหลดทั้งหมดโดยอัตโนมัติ

## References ตามงาน

| เมื่อ | อ่าน |
|---|---|
| components, forms, route หรือ API client | [Implementation และ regression](references/implementation.md) |
| async requests, cache, pagination หรือ session | [State และ Server Data](references/state-and-data.md) |
| deep link, base path, rendering หรือ bundle | [Routing และ Performance](references/routing-and-performance.md) |

## ส่งมอบ

สรุปผลที่เปลี่ยน/สิ่งที่พบ พร้อมหลักฐานตรวจตามความเสี่ยงและข้อจำกัด แยกสิ่งที่ยังไม่รันออกจากสิ่งที่ผ่าน
ไม่เปลี่ยน stack หรือเพิ่มเครื่องมือเพียงเพื่อให้ตรงตัวอย่างใน Skill นี้

