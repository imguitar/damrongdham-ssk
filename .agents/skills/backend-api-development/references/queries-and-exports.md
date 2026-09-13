# Queries, Aggregates และ Exports

อ่านเมื่อแก้ filter, pagination, query performance, KPI หรือ export โดยไม่จำเป็นต้องเปลี่ยน schema

## Query Contract

ระบุ population, scope, projection, soft-delete และ NULL semantics ก่อนแก้ SQL/ORM query
Parameterize values; dynamic identifiers/sort fields ใช้ allowlist ไม่รับจาก client ตรง
Authorization ต้องครอบคลุม list/detail/aggregate/export/download ไม่ใช่เฉพาะหน้ารายการ
Pagination ต้องมี stable ordering และ tie-breaker; total กับ rows ต้องใช้ filters เดียวกัน
ประเมิน N+1, payload และ execution plan เมื่อมีหลักฐาน performance issue; ไม่เพิ่ม index โดยไม่มีเหตุผล

## Aggregate และเวลา

แยก entity กับ event และ snapshot กับ flow; ตรวจ joins ที่คูณจำนวนแถว
กำหนด time field, timezone และ inclusive/exclusive boundary ให้ตรงข้อกำหนด
COUNT DISTINCT ไม่ใช่ยาครอบจักรวาล ต้องตรวจว่ากำลังนับ entity ถูกชนิด
ตรวจ denominator=0, missing data, weighted averages และกลุ่มซ้อนทับ
ข้อมูลตามช่วงเวลาต้องใช้ label ที่ตรงจริง ไม่เรียกรายงานตามวันปิดว่าเป็นจำนวนรับเข้า
อย่าตีความเพิ่ม/ลดว่าเป็นผลดี/ร้ายโดยไม่มี domain requirement

## Export

ใช้ applied filters และ scope/projection เดียวกับชุดข้อมูลที่ผู้ใช้คาดหวัง หรือระบุความต่างชัด
เลือก pagination/streaming ตามขนาดข้อมูล ไม่โหลดทุกแถวเข้าหน่วยความจำโดยไม่ประเมิน
รักษา identifier ที่มีเลขศูนย์นำหน้า วัน/หน่วย และชนิดข้อมูล; ป้องกัน spreadsheet formula injection จากข้อความผู้ใช้
ตรวจ access ของ generated file, expiry และ cleanup หาก export เป็น background job
อย่าบันทึก PII เพิ่มเพื่อ debug output และไม่เปลี่ยน export permissions เพื่อแก้ปุ่มที่กดไม่ได้โดยพลการ

## ตรวจรับ

ใช้ชุดข้อมูลเล็กคำนวณด้วยมือได้ มีหลาย assignments/events, soft-delete, wrong tenant, zero/null และช่วงขอบวัน
เทียบ list/card/chart/export เฉพาะที่นิยามเดียวกัน; ทดสอบ filters ผ่าน HTTP contract ไม่ใช่ service อย่างเดียว
เมื่อพบ schema impact จึงใช้คู่มือ migration ที่มีในปลายทาง ไม่สร้าง migration ทุกครั้งที่แก้ query
