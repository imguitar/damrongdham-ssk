# Deployment และ Operations ของ Damrongdham

ใช้ [Deployment Release](../../deployment-release/SKILL.md) สำหรับ readiness/sequence/recovery คู่กับ target และ runbook เฉพาะด้านล่าง

อ่านเมื่อแตะ base path, proxy, env, OAuth cookie/callback, Docker, migration หรือ uploads
ก่อน action เปิด `docs/deployment/DEPLOYMENT.md` และส่วน backup/monitoring ที่เกี่ยวข้อง Target ตาม runbook ไม่ใช่การยืนยันสถานะ host สด

## สอง Target

| Concern | On-premise Docker | Shared Server |
|---|---|---|
| Artifact | root Dockerfile multi-stage | frontend static + backend บน host |
| Runtime | docker-compose.prod.yml: app/db/nginx | PM2 + host MySQL + shared Nginx |
| Env | .env.production ตาม compose | backend env และ frontend production build env |
| Storage | persistent uploads volume | backend/uploads บน host |
| URL | ตาม Nginx target | subpath ตาม location ของแอป |

ไม่ถือ railway.toml ที่ยังอยู่เป็น production หลักโดยอัตโนมัติ
ตรวจ build artifact/base path และ migration status ก่อนสรุปว่าฟีเจอร์ใน source เปิดใช้แล้ว

## เมื่อเปลี่ยน URL/Auth

ตรวจ Vite base, router basename, VITE_API_BASE_URL, backend mount และ proxy rewrite
ตรวจ frontend/backend URL ที่ใช้สร้าง OAuth redirect และ LINE push link; callback ต้องตรง configuration จริง
ตรวจ cookie path/secure/same-site และ trust proxy ตาม HTTPS termination
ทดสอบ direct deep link/refresh, 401 redirect, citizen callback, static assets และ file download ภายใต้ target path
แก้ env ของ Vite ต้อง rebuild ไม่ใช่ restart backend อย่างเดียว

## Release และ Data

ระบุ migration ที่ต้อง apply กับฐานข้อมูลเดิมก่อน/หลัง code ตาม compatibility
เก็บ uploads/database ถาวร ห้าม deploy ทับ directory ข้อมูลเพราะ copy source ทั้งโฟลเดอร์
ตรวจ PM2/replica count กับ cron/outbox/event ordering ไม่เพิ่มหลาย process โดยคิดว่า job กันซ้ำข้าม process แล้ว
Health API ต้องดู database status ใน body ไม่ใช้ HTTP 200 อย่างเดียวสรุปว่าพร้อม
Rollback artifact และ data เป็นคนละเรื่อง ใช้ runbook backup/restore และอธิบาย data-loss window เมื่อเกี่ยวข้อง
Commit/push/deploy/restart หรือ apply SQL จริงต้องอยู่ใน scope ที่ผู้ใช้อนุมัติ; การตรวจ config ทำแบบ read-only ได้

## ตรวจรับ

Build, route smoke, health+DB, login/principal separation และ persistence ตามสิ่งที่เปลี่ยน
LINE push จริงเฉพาะ test recipient ที่ได้รับอนุญาต ไม่ส่งถึงประชาชนหรือกลุ่มจริงเพื่อทดสอบโดยพลการ
บันทึก command/target/result ที่ไม่มี secret พร้อมข้อที่ตรวจ runtime ไม่ได้
