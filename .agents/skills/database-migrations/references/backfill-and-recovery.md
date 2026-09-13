# Backfill, Compatibility และ Recovery

อ่านเมื่อมีข้อมูลเดิม ปรับ constraints หรือ migration อาจจบเพียงบางส่วน

## Preflight

ยืนยัน engine/version, current migration history และ schema ที่ target ไม่อนุมานจาก init files อย่างเดียว
ตรวจ duplicate/null/orphan rows และ counts ด้วย read-only queries ที่มี scope ชัด
ประเมิน table size, lock duration และ replication/load เมื่อมีสิทธิ์ตรวจจริง; หากไม่ทราบให้บอกข้อจำกัด
กำหนด invariant หลังย้ายและเกณฑ์ abort ก่อนเขียน script
แยก backup ที่มีไฟล์อยู่กับ restore ที่เคยทดสอบใช้ได้; ข้อมูลจริงไม่ใช่ fixture

## Expand → Backfill → Enforce

เพิ่ม schema ที่ code เก่าและใหม่อ่านได้ก่อนเมื่อ release ต้อง overlap
Backfill แบบ batches ที่มี stable cursor/checkpoint ไม่ใช้ offset อย่างเดียวเมื่อข้อมูลเปลี่ยนระหว่างรัน
กำหนด idempotent update condition ไม่ overwrite user edits ที่เกิดหลังเริ่ม backfill
Dual-write/dual-read ใช้เมื่อจำเป็น พร้อมช่วงเลิกใช้และวิธีตรวจ consistency ไม่ทิ้งสอง sources of truth ไม่มีกำหนด
ก่อน NOT NULL/UNIQUE/FK ตรวจ violation เป็นศูนย์ตาม semantics ของ engine
แยก drop/rename ที่ทำให้ code เก่าใช้ไม่ได้เป็น contract phase หลังยืนยัน consumers

## Failure และ Recovery

ระบุว่า step ใด atomic, auto-commit หรือย้อนคืนไม่ได้ตาม engine
Checkpoint ต้องแยก done/partial/failed และรันต่อได้โดยไม่ทำข้อมูลซ้ำ
Rollback schema ไม่ได้คืนค่าข้อมูลที่ backfill ทับเสมอ ต้องมี forward-fix หรือ backup strategy
Restore อาจทิ้ง writes หลัง backup; ระบุ data-loss window และวิธี reconcile
หยุดเมื่อ target ไม่ชัด backup ที่จำเป็นไม่มี หรือ precondition ไม่ผ่าน ไม่ใช้ DROP/TRUNCATE เพื่อให้ script ผ่าน

## Acceptance

ทดสอบบน disposable DB ทั้ง fresh และ upgrade จาก schema ก่อนหน้า
มี fixture null/duplicate/orphan, Unicode และข้อมูลที่แก้ระหว่าง backfill เมื่อเกี่ยวข้อง
ทดสอบ interruption/resume, rerun ตาม runner semantics และ row integrity ไม่ดู exit code อย่างเดียว
ส่ง apply order, pre/post checks, expected counts/invariants และ recovery notes โดยไม่ใส่ credentials
