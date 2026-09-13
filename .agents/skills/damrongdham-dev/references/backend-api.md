# Backend API ของ Damrongdham

ใช้ [Backend API Development](../../backend-api-development/SKILL.md) สำหรับ contract/transaction/query ทั่วไป และใช้ข้อกำหนดระบบด้านล่างร่วมกัน

อ่านเมื่อเพิ่มหรือเปลี่ยน route/controller/service/model หรือ request/response
หลักฐาน: `backend/src/app.js`, `routes/`, `middleware/`, `utils/response.js`, module ที่แก้และ callers ใน frontend/src/api

## Contract

Express 4/CommonJS, JavaScript; mysql2 Raw SQL ไม่มี ORM
Response ใช้ helper เดิม success/data/message และ error/code/message/details ตาม consumer จริง
รักษา HTTP status และ response projection อย่าส่ง DB row ตรง ๆ ที่มี PII
ตรวจ route order, parser, signature raw body, auth และ error middleware เมื่อเปลี่ยน app.js
Citizen namespace แยกจาก staff; anonymous public endpoint ไม่ควรถูกใส่ staff auth blanket

## การเปลี่ยน Endpoint

1. ตรวจ allowed role กับ resource scope และ field-level writes ไม่ใช้ STAFF_ROLES แทน write permission โดยไม่ตรวจ intent
2. Validate body/params/query และ numeric/enum/length; allowlist sortable fields
3. ตรวจ controller→service arguments ครบ เช่น note, closed_summary, agency_id, is_public
4. ใช้ transaction ของ module ที่มีอยู่ และ release connection ใน finally
5. บันทึก status/audit/outbox เมื่อ action นั้นต้องมี ไม่สร้าง notification กับ mutation ทุกชนิดโดยไม่มีเหตุผล
6. ปรับ frontend API client, UI states และเอกสารที่เกี่ยวข้อง
7. ตรวจ allowed/forbidden/not-found/invalid/duplicate ตาม scope

## Files และ Security

Multer config อนุญาต jpg/jpeg/png/pdf/doc/docx สูงสุด 10 MB
Download/Delete ต้องตรวจ attachment complaint owner ไม่เชื่อเพียง attachment ID
ไม่ขยาย public static serving ให้ uploads ทั้งหมดเข้าถึงได้เพราะต้องการแก้ download
Parameterized SQL สำหรับ values; dynamic column/table ต้องจาก code allowlist
Logging/error ไม่แสดง token, password hash, raw PII หรือ SQL parameters อ่อนไหว

## งานข้ามส่วน

Workflow→อ่าน workflow-sla; Schema→database-migrations; LINE/Outbox→line-notifications; Role/Projection→domain-and-security
Controller เก่าบางส่วนมี query โดยตรง ไม่ย้ายทั้งหมดโดยไม่ได้อยู่ในขอบเขต refactor
