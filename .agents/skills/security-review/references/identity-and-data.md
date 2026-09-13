# Identity, Authorization และข้อมูลอ่อนไหว

อ่านเมื่อแตะ authentication, permission, resource scope, public data, files หรือ webhook
เป็น checklist สำหรับส่วนที่เปลี่ยน ไม่ใช่คำสั่งให้ audit/harden ทั้งระบบทุกงาน

## Access model

แยก authentication (ใคร), role capability (ทำอะไร), ownership/tenant scope (กับ record ใด) และ field projection (เห็นอะไร)
ตรวจทุกเส้นทางเข้าถึงเดียวกัน เช่น detail, list, export, download, notification และ nested resources
Client-supplied ID ไม่ใช่หลักฐานสิทธิ์; nested resource ต้องเป็นของ parent จริง
Role ที่ผ่าน route guard ยังต้องผ่าน object-level check; dashboard/read-only ไม่เท่ากับสิทธิ์อ่าน PII

## Authentication และ Session

ใช้ auth/token/cookie pattern ที่ปลายทางกำหนด ตรวจ expiry, issuer/audience/principal ตามที่รองรับ
OAuth ตรวจ state/nonce/PKCE/callback/redirect allowlist ตาม flow จริง
การ link/unlink identity ต้องยืนยันบัญชีเจ้าของและป้องกันการยึดบัญชี; อย่าผูกจาก email/display name โดยเดา
แยก credential test กับของจริง; ไม่พิมพ์ env ทั้งชุดเพื่อ debug

## Privacy และ File access

ใช้ backend projection/masking; ตรวจ nested response, logs, exports และ error fields ด้วย
การ reveal ต้องตรวจ privileged role เหตุผล และ audit โดยไม่ทำให้ masking ปกติถูกปิดถาวรโดยไม่ตั้งใจ
Filename/path/mimetype จาก client ไม่เชื่อถือ ตรวจขนาดชนิดที่อนุญาต ownership และ path traversal
Security headers หรือ MIME filter อย่างเดียวไม่ใช่หลักฐานว่าไฟล์ปลอดภัยทั้งหมด
ลบไฟล์/retention เฉพาะ target ที่ resolve แล้วและไม่กระทบไฟล์ที่มี record ใช้งานอยู่

## Webhook และ Tests

ตรวจ signature จาก raw bytes ก่อนใช้ payload และเปรียบเทียบด้วยวิธีที่เหมาะสม
ทดสอบ bad/missing signature, duplicate event, replay/expiry เมื่อ flow รองรับ และ invalid event type
ทดสอบ matrix: allowed principal, denied role, different owner, missing resource, anonymous/public projection
แจ้งข้อบกพร่องนอก scope พร้อมผลกระทบ ไม่ขยายไปแก้ production หรือ redesign auth โดยพลการ
