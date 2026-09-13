# Verification และ Recovery

อ่านเมื่อ smoke test, rollout failure, rollback หรือส่งมอบงาน release

## Verify ตามผลกระทบ

ตรวจ health semantics รวม dependency ที่ endpoint รายงาน ไม่ดู HTTP status อย่างเดียว
ตรวจ direct route/refresh, API request path, login/session/callback, static files และ download ตามสิ่งที่เปลี่ยน
ตรวจ migrations และ row invariants เมื่อมี data change ไม่ดู process running อย่างเดียว
ตรวจ worker/queue state โดยไม่ส่งข้อความจริงถึงผู้ใช้เพื่อทดสอบโดยพลการ
เปรียบเทียบ runtime artifact/config ที่ตรวจได้กับ intended revision โดยไม่เปิดเผย credentials

## Failure Decision

แยก app bug, misconfiguration, dependency outage และ migration incompatibility ก่อนเลือกแก้
เมื่อ stop criteria เกิด ให้หยุด rollout เพิ่มและเก็บ evidence ที่ redacted
ไม่ retry deploy/restart วนไม่จำกัดโดยไม่มี state change หรือสมมติฐานใหม่
อย่าลบ volumes, queues หรือ database เพื่อทำ health กลับมาเขียว

## Recovery

Code rollback อาจใช้กับ schema ใหม่ไม่ได้ ต้องตรวจ compatibility ที่วางไว้
Database restore ไม่ใช่ down migration และอาจทิ้ง writes หลัง backup ระบุ data-loss window
ใช้ forward-fix เมื่อ rollback ย้อนข้อมูลไม่ได้ตามแผนที่อนุมัติ ไม่ประดิษฐ์ destructive repair ระหว่าง incident
Manual queue replay ต้องตรวจ recipients/idempotency และผลหลัง provider timeout
Recovery action ที่ขยายจาก target/อำนาจเดิมต้องได้รับ direction ก่อนดำเนินการ

## Completion

รายงาน artifact/target, commands/checks และผลจริง แยก deployed, healthy, smoke-tested และยังไม่ยืนยัน
ระบุ migration/runtime/provider checks ที่ skipped หรือ not run ไม่รับรองจาก static configuration
การ monitor ต่อเนื่องใช้กลไก scheduled/wait ที่ environment รองรับเฉพาะเมื่อผู้ใช้ขอ ไม่สร้าง monitor อัตโนมัติจากงาน release
