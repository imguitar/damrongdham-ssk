# Complaint Workflow, SLA และ Escalation

อ่านก่อนเปลี่ยน state, assignment, progress, close, cron, escalation settings หรือ dashboard ที่นับสถานะ
หลักฐาน: `backend/src/services/complaintService.js`, `controllers/assignmentController.js`, `controllers/complaintUpdateController.js`, `jobs/slaJob.js`, `jobs/escalationJob.js`, `models/settingModel.js`

## Transition ที่ต้องรักษาหรือเปลี่ยนโดยเจตนา

| จาก | Action | ไป |
|---|---|---|
| NEW | ศูนย์เริ่มคัดกรอง | SCREENING |
| SCREENING | ส่งหน่วยงาน / ศูนย์ทำเอง / ปฏิเสธ | ASSIGNED / IN_PROGRESS / REJECTED |
| ASSIGNED | หน่วยงานรับ / ส่งคืน | ACCEPTED / RETURNED |
| ACCEPTED | เริ่มงาน / ส่งคืน | IN_PROGRESS / RETURNED |
| RETURNED | ศูนย์คัดกรองใหม่ | SCREENING |
| IN_PROGRESS | หน่วยงานส่งผล | RESOLVED |
| RESOLVED | ศูนย์ตรวจผล | REVIEWING |
| REVIEWING | ปิด / ส่งแก้ไข | CLOSED / IN_PROGRESS |
| IN_PROGRESS ของศูนย์ | ศูนย์ปิด | CLOSED |

CLOSED/REJECTED เป็น final; ไม่มี Reopen ใน workflow ปัจจุบัน
ศูนย์ทำเองสร้าง assignment ของหน่วยงาน is_center; อย่าใช้เพียงสถานะ IN_PROGRESS ตัดสินว่าเป็นศูนย์ทำเอง
ตรวจ role, active assignment และ ownership ภายใน backend action พร้อมกัน
ส่งคืน/ปฏิเสธ/ส่งแก้ไข/ปิด ต้องตรวจว่าข้อมูลเหตุผลหรือสรุปส่งถึง service และ persisted จริง ไม่พึ่ง required field ใน UI

## Atomicity และเลขเรื่อง

เลข `DC-YYYYMM-XXXX` ใช้ complaint_sequences และ transaction/lock ตาม utility เดิม
ตรวจ complaint, assignment, status log, result update และ outbox ที่ต้อง atomic เมื่อเปลี่ยน workflow
การกดซ้ำหรือสองคนเปลี่ยนเรื่องเดียวกันต้องไม่สร้าง active assignment/เลขเรื่องซ้ำ
Internal workflow กับสถานะย่อของ public อาจต่างกัน ตรวจ mapping ทั้ง backend/frontend

## SLA

due_date อิงวันที่มอบหมายหรือศูนย์เริ่มทำเองบวก category SLA; ตรวจ fallback ใน service (เดิม 15 วัน)
นับ calendar days ไม่ตัดวันหยุด ไม่มีการอนุมัติให้เปลี่ยนเป็น business days อัตโนมัติ
Overdue เป็น flag ไม่ใช่ workflow state
job รัน 08:00 Asia/Bangkok: near-due notification ใช้เหลือ 3 วันพอดี ส่วน dashboard list อาจใช้ช่วง 0–3 วัน จึงอย่ารวมเป็น predicate เดียวโดยไม่ตรวจ
ตรวจ terminal status, NULL due_date และวันที่ข้ามเที่ยงคืนในการทดสอบ

## Escalation และ Settings

Current job ตรวจ ASSIGNED/ACCEPTED/IN_PROGRESS และนับจาก COALESCE(last_progress_at, created_at)
Requirement เก่าระบุ accepted_at และขอบเขตต่างกัน นี่คือข้อแตกต่างที่ต้องรายงาน ไม่เปลี่ยน anchor โดยไม่มีโจทย์รองรับ
Default: L1=30, L2 offset=15, L3 offset=7 → cumulative 30/45/52
settingModel อ่าน system_settings และมี fallback เมื่อยังไม่มีตาราง; write ต้องมี migration ใช้งานแล้ว
Settings API อนุญาต admin/super_admin; ตรวจ boolean, integer range, allowlisted keys และ cumulative labels
Progress update รีเซ็ตระดับตาม logic เดิม ไม่ถือ status change ทุกชนิดเป็น progress โดยอัตโนมัติ
ปิด escalation หมายถึงหยุด job ตามโค้ด ไม่แปลว่าลบ notification เก่าหรือ reset level ทั้งหมด

## ตรวจรับ

Transition allowed/denied, assigned ownership, center self-handle, required reason, progress reset
วันก่อน/ตรง/หลัง threshold, disabled settings, missing table fallback, duplicate cron และ label dashboard ตรง settings
ทดสอบด้วย controllable time/fake provider ไม่รัน cron จริงที่ส่ง LINE เพื่อเช็กตัวเลข

