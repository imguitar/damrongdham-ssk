# Delivery, Outbox และ Retries

อ่านเมื่อส่งออกภายนอก ใช้ worker หรือแก้ duplicate/lost delivery

## Durable State

ระบุ state machine pending/claimed/sent/failed/cancelled ตามระบบจริง พร้อมผู้มีสิทธิ์เปลี่ยนแต่ละ state
ถ้าการสร้างงานส่งต้อง atomic กับ business mutation ใช้ transaction/outbox ที่มีอยู่
Provider call โดยทั่วไปอยู่นอก DB transaction เพื่อไม่ถือ lock ระหว่าง network wait
แยก recorded, queued, delivered และ acknowledged ตามหลักฐาน provider ไม่ใช้คำว่า delivered จาก enqueue success

## Idempotency และ Unknown Outcome

กำหนด business/delivery key ที่คงเดิมเมื่อ retry และ unique constraint/claim ที่ป้องกัน concurrent workers
Timeout อาจเกิดหลัง provider รับงานแล้ว; reconcile status หรือใช้ provider idempotency ก่อนส่งซ้ำ
หาก provider ไม่รองรับ exactly-once ให้บอก delivery guarantee จริงและ duplicate risk
ตรวจ crash ก่อน/หลัง send ก่อน/หลังบันทึกผล และ stale claim recovery
Process-local cron/lock ไม่กันซ้ำข้าม replicas

## Retry Policy

จำแนก transient/permanent/rate-limit errors ตาม contract จริง ไม่ retry ทุก 4xx/5xx แบบเหมารวม
ตั้ง timeout, bounded attempts, backoff/jitter และเคารพ retry hints เมื่อรองรับ
กำหนด terminal failure/dead-letter และ operator recovery ที่มี audit
ก่อน retry ตรวจ target/consent/preferences/ownership ที่อาจเปลี่ยน และป้องกันส่ง payload ที่ไม่ควรส่งแล้ว
Manual replay ต้องใช้ target/key ที่ตรวจแล้ว ไม่สุ่ม key ใหม่เพื่อหลบ dedup

## Observability และ Tests

บันทึก event/job/request identifiers, attempts และ error category โดยไม่ log tokens/PII
ทดสอบ duplicate/concurrent claims, restart, provider outage, recipient disabled และ cancelled jobs
ใช้ controllable clock/fake transport เพื่อไม่รอ backoff จริง
ไม่ start worker บน config จริงเพื่อ smoke test โดยไม่ได้รับอำนาจส่งออก
