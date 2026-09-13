---
name: integration-development
description: พัฒนาและวินิจฉัยการเชื่อมบริการภายนอก OAuth, webhooks, adapters, queues/outbox และ retry/idempotency ใช้กับ provider boundaries ไม่ใช่ CRUD ภายในหรือการอนุญาตส่งข้อความจริง
---

# Integration Development

## ขอบเขตและการใช้ซ้ำ

ใช้ได้อิสระข้ามโปรเจกต์ คัดลอกทั้งโฟลเดอร์นี้โดยไม่ต้องนำ Skill อื่นมาด้วย ใช้ภาษา framework และข้อกำหนดของปลายทาง
เมื่อมี Project Skill ให้อ่านข้อจำกัดเฉพาะงานที่เกี่ยวข้อง แต่ไม่กำหนด dependency ย้อนกลับหรือบังคับโหลดทุก Skill
คำขอผู้ใช้กำหนดขอบเขต: review/diagnose ไม่ใช่การอนุญาต implement และการแก้ไฟล์ไม่อนุญาต deploy หรือ external effects อัตโนมัติ

## เริ่มงาน

ตรวจ provider contract/version, existing adapter, credential source และ delivery semantics ของปลายทาง
ใช้เอกสารทางการปัจจุบันเมื่อรายละเอียด provider/version ไม่ได้อยู่ในข้อมูลที่ตรวจแล้ว ไม่เดา headers/error codes
ทดสอบผ่าน stub/sandbox ก่อน; start worker อาจส่งข้อมูลจริง จึงต้องยืนยัน environment และอำนาจ
รักษา identity/consent/recipient scope; retry ไม่ใช่การขยายสิทธิ์หรือเพิ่มผู้รับ
ตรวจ working tree และรักษางานที่ไม่เกี่ยวข้องก่อนแก้ไฟล์
เลือก Reference ตามตารางและอ่านไฟล์ที่เลือกให้ครบก่อนทำงาน ไม่โหลดทั้งหมดโดยอัตโนมัติ

## References ตามงาน

| เมื่อ | อ่าน |
|---|---|
| login/linking, callbacks หรือ inbound events | [OAuth และ Webhooks](references/oauth-and-webhooks.md) |
| outbox, worker, duplicate, timeout หรือ provider outage | [Delivery และ Retries](references/delivery-and-retries.md) |
| integration ใหม่, contract drift หรือทดสอบ adapter | [Provider Contract และ Sandbox](references/contracts-and-sandbox.md) |

## ส่งมอบ

สรุปผลที่เปลี่ยน/สิ่งที่พบ พร้อมหลักฐานตรวจตามความเสี่ยงและข้อจำกัด แยกสิ่งที่ยังไม่รันออกจากสิ่งที่ผ่าน
ไม่เปลี่ยน stack หรือเพิ่มเครื่องมือเพียงเพื่อให้ตรงตัวอย่างใน Skill นี้

