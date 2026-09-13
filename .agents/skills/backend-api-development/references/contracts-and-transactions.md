# API Contracts และ Business Transactions

อ่านเมื่อเปลี่ยน endpoint, business service หรือ workflow

## Contract และ Boundary

- ระบุ method/path, identity, scope, input/output, errors และ side effects ก่อนเปลี่ยน
- ใช้ layer ของโปรเจกต์ ไม่เพิ่ม abstraction ทุกชั้นหากไม่ได้ลดความซับซ้อน
- แยก parsing/HTTP concern ออกจาก business decision และ persistence เท่าที่โครงสร้างรองรับ
- Validate enum, range, identifier, pagination และ sort allowlist; อย่าให้ client กำหนด owner/role ผ่าน mass assignment
- รักษา status/error shape และ backward compatibility; เปลี่ยน contract ที่ได้รับมอบหมายให้ครอบคลุม callers

## Transaction และ Workflow

ตรวจสถานะก่อนเปลี่ยนภายใต้ concurrency control ที่เหมาะสม ไม่พึ่ง read แล้ว write แบบไม่มีการป้องกัน
บันทึก state change และรายการที่ต้อง atomic ใน transaction เดียวกัน
ตรวจ rollback/release เมื่อ exception เกิดกลางทาง
การ retry ต้องไม่สร้าง record หรือผลข้างเคียงซ้ำ; ใช้ business key/unique constraint/idempotency key ตามกรณี
ไม่ถือการบันทึกข้อมูลสำเร็จเท่ากับการส่ง notification สำเร็จ ให้แยกสถานะที่ผู้ใช้เข้าใจได้

## ตรวจรับ

Happy path, malformed input, unauthenticated, forbidden, missing resource, duplicate request และ rollback ตามผลกระทบ
ตรวจ logging ที่มี request/event identifier โดยไม่มี credential/PII
ใช้ provider stub หรือ sandbox สำหรับ tests ไม่ส่งข้อความจริงจาก unit test
