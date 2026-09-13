# Threat-oriented Review และ Findings

อ่านเมื่อกำหนดขอบเขต security review หรือจัดทำ findings ที่ตรวจสอบได้

## Scope และ Threat Model

ระบุ asset ที่ปกป้อง actors/roles, entrypoints, trust boundaries และ actions ที่อนุญาตให้ตรวจ
เริ่มจากเส้นทางข้อมูลที่ผู้ใช้ระบุ ไม่ถือการแตะ auth เป็นคำสั่ง audit ทั้ง repository
ตรวจ implementation/callers/tests และ deployment assumptions ที่เกี่ยวข้อง
แยก authentication, authorization, integrity, confidentiality และ availability เพื่อไม่แก้ผิดชั้น
ถ้ามี requirement ตามมาตรฐาน ให้ตรวจแหล่งทางการปัจจุบันก่อนอ้าง compliance; checklist นี้ไม่ใช่ใบรับรอง

## Abuse Cases

พิจารณา cross-owner/cross-tenant access, nested ID mismatch, mass assignment และ public projection
ตรวจทางเข้าซ้ำ list/detail/export/download/notification ไม่ใช่เฉพาะ UI route
สำหรับ files ตรวจ traversal, content/size limits และ access หลัง upload; extension allowlist อย่างเดียวไม่พอ
สำหรับ outbound URLs ตรวจ trust boundary และข้อจำกัดปลายทางเมื่อมี user-supplied URLs
สำหรับ session/OAuth ตรวจ replay/expiry/redirect และ account linking ตาม flow จริง
ไม่ทำ exploit กับบัญชี/ข้อมูลจริงของบุคคลอื่น ใช้ synthetic fixtures หรือ reasoning ที่ระบุข้อจำกัด

## Finding Format

บันทึก location, preconditions, attack/error sequence, observed evidence, user impact และ remediation ที่อยู่ใน scope
กำหนด severity จาก exploitability และผลกระทบ ไม่ตั้งระดับสูงสุดกับทุก missing defense
แยก confirmed issue, plausible risk และ defense-in-depth recommendation
ข้อมูลที่แสดงในรายงานต้อง redacted; อย่าใส่ secret เพื่อพิสูจน์ว่ามี secret
ถ้าไม่พบ actionable findings ให้ระบุขอบเขตและ coverage gaps ไม่สรุปว่าระบบปลอดภัยทั้งหมด

## หลังแก้เมื่อได้รับมอบหมาย

ตรวจ positive access ยังใช้ได้และ denied paths ถูกปฏิเสธจาก server
เพิ่ม regression ที่ครอบคลุมช่องทางที่มีปัญหา ไม่แก้ด้วยปิด UI อย่างเดียว
อย่าเปลี่ยน authentication architecture/rotate credentials/deploy โดยไม่อยู่ในอำนาจที่ได้รับ
