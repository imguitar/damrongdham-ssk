# Errors, Concurrency และ Resource Lifetime

อ่านเมื่อแก้ failure handling, resource cleanup, duplicate request หรือ race condition

## Error Boundary

แยก malformed input, authentication, forbidden, not-found, conflict และ infrastructure failure ตาม convention API เดิม
อย่าคืน success จาก catch ที่กลืน exception หรือเปลี่ยน business rejection เป็น 500 ทั้งหมด
Error response ต้องช่วย caller จัดการได้โดยไม่เปิดเผย SQL, credentials, filesystem paths หรือ raw PII
Log correlation/request identifier และเหตุการณ์ที่จำเป็น พร้อมรักษา redaction
เมื่อ partial side effect เกิดแล้ว ให้รายงานสถานะที่เป็นจริง ไม่อ้าง rollback สิ่งที่ออกไปภายนอกแล้ว

## Concurrency

การอ่านสถานะก่อน write ไม่เพียงพอเมื่อมี concurrent callers
ใช้ conditional update, version check, lock หรือ constraint ตาม invariant และ transaction tooling จริง
Idempotency ต้องกำหนด scope/key/TTL และผลเมื่อ key เดิมมากับ payload ต่างกัน ไม่สุ่ม key ใหม่ทุก retry
กำหนด conflict response และ recovery ให้ consumer ทำต่อได้
อย่าใช้ process-local lock อ้างความปลอดภัยข้าม replicas

## Resource Ownership

ระบุผู้เปิด/ปิด connection, transaction, stream, temp file และ background task
Release ใน failure path รวม validation ที่เกิดหลังเปิด resource และ client disconnect
External provider call ที่ช้าควรอยู่นอก transaction เมื่อ atomicity design อนุญาต; ใช้ outbox เดิมเมื่อจำเป็น
Timeout ไม่พิสูจน์ว่า remote operation ไม่สำเร็จ จึงต้อง reconcile ก่อน replay ที่ไม่ idempotent
กำหนด limits ของ body/query/page และใช้ existing timeout settings ไม่ตั้งค่าจากการเดา

## ตรวจรับ

ทดสอบ failure ก่อน/หลัง write, rollback, duplicate/concurrent calls และ cleanup เมื่อ throw
ใช้ deterministic synchronization เมื่อทดสอบ race ไม่พึ่ง sleep ระยะคงที่
ทดสอบ resource ไม่ค้างและผลที่ caller เห็นตรงกับผล persistence
