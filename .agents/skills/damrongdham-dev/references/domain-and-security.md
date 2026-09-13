# Identity, Role, Ownership และ PII

อ่านก่อนเปลี่ยน auth, query scope, complaint response, public/citizen pages, attachment หรือ export
ใช้ข้อกำหนดเฉพาะนี้ทุกครั้งที่เปลี่ยน boundary ที่เกี่ยวข้อง; เมื่อเป็น security review หรือมีความเสี่ยงที่ต้องตรวจเฉพาะ ให้ใช้ [Security Review](../../security-review/SKILL.md) เพิ่ม ไม่เปิด audit ทั้งระบบโดยอัตโนมัติ

## หลักฐานที่ต้องเปิด

`backend/src/middleware/auth.js`, `citizenAuth.js`, `authorize.js`, `complaintAccess.js`
routes/controllers/models ของ resource ที่แก้ และ `frontend/src/routes/AppRoutes.jsx`
ตรวจ `docs/manual/ROLES_AND_TEST_ACCOUNTS.md` สำหรับ intent และ known mismatch ไม่ใช้ตาราง role เพียงอย่างเดียวรับรอง API

## Access matrix

| Principal | ขอบเขตที่ตั้งใจ | จุดที่ต้องทดสอบ |
|---|---|---|
| Guest | ยื่นเรื่องและ public tracking projection | ไม่เห็น PII/internal update จากเลขเรื่องอย่างเดียว |
| Citizen | บัญชี/เรื่องตนเอง ใช้ JWT แยก | เปลี่ยน complaint number แล้วไม่อ่านของคนอื่น |
| officer/chief | งานศูนย์ รับ/คัดกรอง/ส่งต่อ/ตรวจผล/ปิด | transition และเหตุผลที่บังคับ |
| admin/super_admin | จัดการระบบและ center actions ตาม implementation | admin ไม่จัดการ super_admin; ลบเรื่อง/reveal จำกัด super_admin |
| agency_officer/agency_head | เรื่องของหน่วยงานที่รับผิดชอบ | ข้าม agency, nested resource, download/export |
| executive | Dashboard/Report read-only ไม่มี PII | direct API/URL ไม่เพิ่มสิทธิ์เพราะ frontend ซ่อนปุ่ม |

ตารางระบุ expected boundary ไม่รับรองว่า implementation ทุกจุดตรงกัน เช่น Staff CRUD และ Report export เคยมี UI/API mismatch ต้องตรวจปัจจุบันก่อนแก้หรืออ้างว่าปลอดภัย
Agency scope เป็นเงื่อนไขจำเป็น ไม่ได้แปลว่ามีสิทธิ์แก้ทุก field ในเรื่องที่ตนรับผิดชอบ
อย่าใช้ agency ID ตายตัว; ศูนย์ใช้ `is_center`; ตรวจ migration 05 และ user/agency models ก่อนเปลี่ยนสังกัด

## Anonymous และ Snapshot

- `is_anonymous` Mask ชื่อ บัตร ที่อยู่ โทร และ identity linkage ตาม response policy จาก Backend รวม nested LINE identity
- Staff ทุก role ถูก Mask ตามปกติ เฉพาะ super_admin ขอ reveal พร้อมเหตุผลและบันทึกประวัติ
- อย่าแก้ is_anonymous=false เพื่อเปิดเผยชั่วคราว
- Citizen เจ้าของเรื่องยังเข้าถึงเรื่องตนได้; public tracking ไม่เท่ากับ authenticated citizen detail
- Profile ใหม่ไม่เปลี่ยน complainant snapshot ของเรื่องที่ส่งไปแล้ว
- Public update ต้องอ้าง is_public และ projection จริง; ความสำเร็จในการส่ง LINE ไม่อนุญาตเปิด internal note

## ตรวจรับ

เลือก allowed/denied role, wrong principal token, different citizen/agency, anonymous detail/list/timeline/LINE/download/export และ reveal audit ตามส่วนที่เปลี่ยน
เปิด `backend/tests/security/` และ integration identity/linking tests ที่เกี่ยวข้อง
ทดสอบด้วย synthetic PII และ fake tokens ไม่คัดลอกข้อมูลผู้ร้องจริง
