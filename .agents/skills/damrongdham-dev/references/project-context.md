# บริบทและแผนที่แหล่งข้อมูล

อ่านเมื่อเริ่มงานที่ไม่คุ้นระบบ อธิบายฟีเจอร์หรือพบเอกสารไม่ตรงกัน Path ใน backtick ของชุด Reference นี้อ้างจาก repository root; Markdown links อ้างจากไฟล์ที่มีลิงก์

## สถานะและขอบเขต

Damrongdham SSK / DCMS / Sisaket E-CMS คือระบบรับเรื่องร้องเรียนจังหวัดศรีสะเกษ มี Staff, Guest, Citizen และ LINE OA ใช้ข้อมูลกลางและ Workflow เดียวกัน
README ระบุ Phase 0–15 เสร็จแล้ว งานใหม่จึงควบคุมตามคำขอ ไม่จำเป็นต้องเปิด Phase ใหม่
สถานะใน repository ไม่ใช่หลักฐานว่าฟีเจอร์ทุกอย่าง deploy แล้ว; ตรวจ runbook/runtime เมื่อคำขอเกี่ยวกับระบบจริง

## แหล่งข้อมูล

| เรื่อง | เอกสาร | ตรวจยืนยันใน |
|---|---|---|
| ภาพรวม | `docs/manual/SYSTEM_OVERVIEW.md` | routes/pages/services ที่ใช้งานจริง |
| Role และบัญชีทดสอบ | `docs/manual/ROLES_AND_TEST_ACCOUNTS.md` | auth middleware, routes, models; ไม่เผยแพร่บัญชี seed ในคู่มือทั่วไป |
| Workflow | `docs/manual/COMPLAINT_SUBMISSION_FLOW.md` | complaintService, assignmentController |
| SLA/Escalation | `docs/manual/SLA_AND_ESCALATION.md`, `docs-requirement/REQ-02-status-update-escalation.md` | jobs, settingModel, dashboardController |
| Form intake | `docs-requirement/REQ-01-complaint-intake.md` | ComplaintForm, public/citizen controllers, validation |
| LINE | `docs/LINE_COMPLAINTS.md`, `docs/LINE_INTEGRATION.md`, `docs/LINE_TESTING.md` | line services, controllers, tests |
| Deployment | `docs/deployment/DEPLOYMENT.md` | Dockerfile, compose, vite config, main, app |
| Backup/Operations | `docs/deployment/BACKUP_RESTORE.md`, `docs/deployment/MONITORING_MAINTENANCE.md` | target/environment ที่ผู้ใช้ระบุ |
| UAT | `docs/testing/TESTING_PLAN.md`, `docs/testing/UAT_PLAN.md` | test scripts/config/helper |

Planning ใน `docs/planning/` ใช้ดูเหตุผลการออกแบบและ contract ที่ตั้งใจไว้ ไม่ใช้ประกาศ current state โดยอัตโนมัติ
`PROJECT_CONTEXT.md` ยังมีข้อจำกัดเก่าเรื่อง Railway, LINE, rate limit, จำนวนตาราง และ Escalation
Manual ก็อาจคลาดเคลื่อน เช่นระบุไม่มี social login แต่มี LINE Login หรือระบุเกณฑ์ escalation คงที่แม้โค้ดปรับค่าได้
เมื่อพบข้อขัดแย้งให้ระบุ current behavior และ intended rule แยกกัน แก้เอกสารในขอบเขตงาน ไม่ปรับระบบกลับไปตามข้อความเก่าโดยพลการ

## Stack และแหล่ง Config

Frontend: React 18/Vite 5/MUI 5, JSX, Context, Axios, Recharts, Leaflet
Backend: Node.js 20/Express 4, CommonJS, mysql2, JWT, bcrypt, Multer, node-cron, ExcelJS
Database: MySQL 8, utf8mb4/utf8mb4_unicode_ci, timezone +07:00 ตาม config
อ่าน package.json/lockfile เมื่อต้องการ version แน่นอน ไม่ใช้ version ของ Skill ตัดสินใจอัปเกรด dependency
Layer ที่ตั้งใจคือ Route/Middleware → Controller → Service → Model → DB; โค้ดเก่าบางจุดมี SQL ใน Controller ไม่ refactor ทั้งระบบเพียงเพื่อให้ตรง diagram

