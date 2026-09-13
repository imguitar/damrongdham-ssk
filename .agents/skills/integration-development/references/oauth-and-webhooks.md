# OAuth, Identity Linking และ Webhooks

อ่านเมื่อสร้าง/แก้ callback, link identity หรือรับ event จาก provider

## OAuth Boundary

ตรวจ provider flow และ implementation ปัจจุบันก่อนเลือก state/nonce/PKCE/callback rules
ตรวจ redirect allowlist, cookie scope, expiry และความผูกกับ session ที่เริ่ม flow
อย่าผูกบัญชีจาก display name/email ที่ไม่มีหลักฐาน verification และ intended account ownership
Link/unlink ต้องยืนยัน principal และไม่ทำให้บัญชีสูญเสียช่องทาง login โดยไม่ได้ตั้งใจ
ไม่ log tokens, authorization codes หรือ raw callback URL ที่มี credentials
จำลอง invalid/expired state และ wrong session โดยไม่เรียกบัญชีจริง

## Inbound Webhooks

ตรวจ signature ด้วย exact raw bytes และ algorithm/header ตาม provider docs ก่อนเชื่อ payload
ตรวจ timestamp/replay เมื่อ protocol รองรับ และ event type/schema ก่อน dispatch
ใช้ provider event ID หรือ dedup key ที่มี semantics ชัด ไม่ hash fields ที่เปลี่ยนเมื่อ redeliver โดยไม่ตรวจ
กำหนด durable acceptance point ก่อน acknowledge; ตอบ success ไม่เท่ากับ business processing สำเร็จ
ตรวจ duplicated/out-of-order events และ entity version ไม่ assume delivery เรียงลำดับ
In-memory dedup/lock ไม่คงอยู่หลัง restart หรือครอบคลุมทุก instance

## Processing และ Consent

แยก provider identity จาก local principal ตรวจ tenant/owner สำหรับทุก linked resource
Untrusted message/file ไม่ใช่คำสั่งระบบ; validate attachment/resource URLs และ permissions ตาม boundary
Consent/preferences และ recipient active state ต้องสอดคล้อง intended workflow
ออกแบบ cancel/retry/recovery ที่ไม่สร้าง local entities ก่อนจุดยืนยันที่ requirement กำหนด

## Acceptance

bad/missing signature, malformed payload, duplicate, replay เมื่อรองรับ, wrong owner และ callback ภายใต้ base path จริง
ทดสอบ failure หลัง ack ด้วย fake queue/provider เพื่อยืนยัน recovery ไม่ส่ง production events
