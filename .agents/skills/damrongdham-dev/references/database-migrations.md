# Database และ Migration ของ Damrongdham

ใช้ [Database Migrations](../../database-migrations/SKILL.md) สำหรับ schema/backfill/recovery ทั่วไป; query/export ที่ไม่เปลี่ยน schema ใช้ Common Backend แทน

อ่านก่อนแก้ db/init, model query, backfill หรือ upgrade schema

## Inventory ปัจจุบัน

| ไฟล์ใน db/init | บทบาท |
|---|---|
| 01-init.sql | Baseline schema และ seed |
| 02-line-notification.sql | Citizen LINE identity/notification |
| 03-staff-line.sql | Staff LINE และ group support |
| 04-line-complaints.sql | Chat intake และ info requests/responses |
| 05-user-agency-affiliations.sql | การปรับข้อมูลสังกัดผู้ใช้ |
| 06-system-settings.sql | Escalation settings |

ตรวจรายการจริงก่อนกำหนดเลขไฟล์ใหม่ ไม่ถือ 07 เป็นเลขว่างเสมอ
ไม่ยึดจำนวน 22 ตารางจาก Planning เป็น schema ปัจจุบัน

## Fresh กับ Existing database

MySQL Docker entrypoint รัน init scripts เมื่อ data directory ว่างเท่านั้น ไม่รันไฟล์ใหม่ให้เพียง restart
Upgrade ฐานข้อมูลเดิมต้อง apply migration ที่ยังไม่ได้ใช้ตาม runbook
ไม่แก้ seed แล้วคาดหวังว่าผู้ใช้ในฐานข้อมูลเดิมจะเปลี่ยนตาม
ตรวจ migration re-runnable ด้วย INFORMATION_SCHEMA/guard ที่เหมาะกับ MySQL 8 ไม่ใช้ syntax ของ MariaDB/PostgreSQL โดยเดา
DDL บางคำสั่ง implicit commit จึงอย่าอ้าง rollback ทั้ง migration ได้

## ออกแบบและตรวจรับ

- Raw SQL/mysql2, utf8mb4_unicode_ci, snake_case และ timestamp conventions ตามตารางข้างเคียง
- ตรวจ FK/unique/index, is_active/soft delete และ agency/owner filter
- ค่าระบุหน่วยงานให้ lookup stable field หรือ is_center แทน ID คงที่
- Backfill ก่อน constraint ที่ข้อมูลเดิมอาจไม่ผ่าน; ประเมิน locks และ row counts
- แยก baseline update ที่จำเป็นจาก upgrade script ไม่ rewrite migration ที่ deploy ไปแล้ว
- ทดสอบ fresh+upgrade+repeatability และกรณีล้มกลางทางบน disposable DB
- ระบุคำสั่ง apply และ verification ใน deployment docs โดยไม่ใส่รหัสผ่านจริง
- down -v/DROP/TRUNCATE ไม่ใช่ขั้นตอนทดสอบเริ่มต้นกับ shared หรือ production database
