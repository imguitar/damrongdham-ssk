# Fixtures และ Integration Tests

อ่านก่อน tests ที่ใช้ database, filesystem, queues หรือ external services

## Isolation

อ่าน connection construction และ cleanup code ก่อนรัน ไม่ถือชื่อ DB หรือ NODE_ENV อย่างเดียวเป็นหลักฐานความปลอดภัย
ใช้ disposable resources หรือ test namespace ที่ยืนยัน target ได้
สร้าง unique fixture identifiers และ cleanup เฉพาะ records/files ที่ test เป็นเจ้าของ
Shared database tests ต้องประเมิน parallelism; rollback fixture อาจไม่ครอบคลุม connection อื่นหรือ worker
ห้ามล้างฐานข้อมูล shared เพื่อแก้ test contamination

## Layer และ Contract

Unit test ใช้ pure logic และ stub boundary; integration test ตรวจ wiring/transaction/query ที่ mock ลึกเกินไปจะพลาด
Endpoint tests ควรผ่าน middleware จริงเมื่อกำลังตรวจ auth/validation
Provider tests ใช้ fake transport หรือ sandbox ที่ได้รับอนุญาต; dummy token ไม่ป้องกัน request ออก network
ตรวจ response shape/status และ persistence/side effects ไม่ใช่ assert ว่า mock ถูกเรียกอย่างเดียว
Fixtures ต้องครอบคลุม denied principal, different owner, null/missing, duplicates และ relevant boundary

## Determinism

Freeze/inject clock เมื่อทดสอบ expiry/SLA ไม่พึ่งเวลาจริงที่ข้ามวันหรือ timezone โดยไม่ควบคุม
ใช้ barriers/events สำหรับ race tests ไม่พึ่ง arbitrary sleeps
กำหนด random seed เมื่อมี generated data และรายงานเพื่อ reproduce
Retries ของ test runner ไม่ใช่ fix ของ flaky test; หาสาเหตุและแยก environmental failure จาก product failure

## Cleanup และ Evidence

แม้ assertion ล้มเหลว cleanup ต้องยังทำงานและไม่กลบสาเหตุหลัก
เก็บ logs ที่ redacted และ identifiers พอ reproduce โดยไม่เผย secrets
รายงาน suite ที่ skip เพราะ DB/provider ไม่พร้อมแยกจาก passed
หากจำเป็นต้องเปลี่ยน environment/toolchain ให้ระบุเหตุผล ไม่อัปเกรด dependency เพื่อหลบ failure โดยไม่มี scope
