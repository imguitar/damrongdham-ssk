# Readiness และ Release Sequence

อ่านเมื่อ review deployment, เตรียม release หรือได้รับอนุญาต deploy

## Scope ก่อน Action

แยก review/preparation/execution พร้อม environment, target, artifact และอำนาจที่ได้รับ
คำขอเตรียม deploy ไม่อนุญาต restart/apply SQL; ถ้าอนุญาตแล้วไม่ขอซ้ำกับ operation เดิมใน scope
ตรวจ runbook/config และ current state ที่เข้าถึงได้อย่างปลอดภัย ไม่ถือไฟล์ config เป็นหลักฐานว่า host สดตรงกัน
ยืนยัน dependencies, secrets source, persistent paths, process topology และ ingress/base path

## Release Readiness

ระบุ artifact revision, reproducible build commands และ runtime requirements จาก manifest/lockfile จริง
แยก build-time กับ runtime configuration; การ restart ไม่เปลี่ยนค่าที่ฝังใน frontend bundle
ตรวจ migration order กับ old/new application compatibility และ rollback artifact ที่ใช้งานได้
รักษา uploads/database/queues ไม่ copy source ทับ persistent data
ตรวจ callbacks, cookies, proxy rewrite, static assets และ health semantics ตาม target
ไม่เรียกว่า production-ready จาก build ผ่านอย่างเดียว

## Execution Sequence

ใช้ขั้นตอนตาม runbook ไม่บังคับ deploy platform ใด
กำหนด preflight → artifact/data preparation → migration ตาม compatibility → rollout/restart ที่อนุญาต → smoke → acceptance
กำหนด stop/rollback criteria ก่อนเริ่ม โดยเฉพาะ error rate, failed health และ data integrity
ก่อนเพิ่ม replicas ตรวจ worker scheduling/locks และ event ordering ไม่ assume scale-out ปลอดภัย
ลดผลกระทบตาม infrastructure ที่มี ไม่เพิ่ม orchestration platform เพื่อทำ release ครั้งเดียว

## Handoff Preparation

ส่งลำดับคำสั่ง/target ที่ตรวจแล้ว env key changes, expected checks และ recovery approach โดยไม่มี secrets
ถ้าไม่ execute ให้ระบุว่าเป็นแผนและอะไรต้องยืนยันสดก่อนรัน
การ commit/push/publish เป็นคนละ action ใช้ตามอำนาจผู้ใช้ ไม่เป็นขั้นตอนอัตโนมัติของ review
