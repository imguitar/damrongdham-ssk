# LINE Login, Intake และ Notifications

ใช้ [Integration Development](../../integration-development/SKILL.md) สำหรับ provider contracts/OAuth/webhook/retry ทั่วไป ส่วน LINE-specific rules อยู่ด้านล่าง

อ่านเมื่อแตะ LINE, identity linking, webhook, info requests, staff groups หรือ Outbox
ก่อนแก้ให้เปิด `docs/LINE_INTEGRATION.md`, `docs/LINE_COMPLAINTS.md` เฉพาะเรื่องที่เกี่ยวข้องและ test ของ module

## เส้นทางข้อมูลที่ต้องติดตาม

| งาน | จุดตรวจใน backend/src |
|---|---|
| Login/link/unlink | controllers/lineAuthController.js, services/lineLoginService.js, identity models |
| Webhook | controllers/lineWebhookController.js, services/lineWebhookService.js, lineMessagingService.js |
| Intake | services/lineBotService.js, lineIntakeService.js, utils/lineFlowMachine.js |
| ขอข้อมูลเพิ่ม | controllers/lineComplaintController.js, models/infoRequestModel.js |
| Staff/group | services/staffLineNotifier.js, controllers/lineGroupAdminController.js |
| ส่งข้อความ | services/notificationOutboxService.js, jobs/notificationOutboxJob.js, outbox/log models |
| Retention | jobs/lineMaintenanceJob.js, lineConversationModel.js |

## Login และ Identity

Login/Messaging channel ภายใต้ Provider เดียวกันตาม setup ระบบนี้
ตรวจ state/cookie/callback และการใช้ Citizen principal; display name ไม่ใช่หลักฐาน ownership
Link ต้องทำกับบัญชีที่ authenticate แล้วและยืนยัน flow เดิม; unlink ต้องไม่ทำให้บัญชีไม่มีวิธีเข้าถึงโดยไม่ตั้งใจ
OA friendship true/false/unknown ต่างกัน: unknown ไม่แปลว่าเป็นเพื่อน
บันทึก Consent/provisional account ตาม flow ไม่สร้างบัญชีก่อนผู้ใช้ยินยอมเพียงเพราะ received event

## Webhook และ Intake

ตรวจ X-Line-Signature บน raw bytes ด้วย HMAC/timing-safe comparison ก่อนเชื่อ payload
เก็บ/check webhook event ID กันซ้ำ และตรวจ failure หลัง ack ว่าระบบ recover อย่างไร
In-memory ordering/rate limit ไม่ใช่ global guarantee เมื่อหลาย process
รักษา cancel/back/restart, draft expiry และการยืนยันก่อนสร้างเรื่อง
LINE เรื่องใหม่ใช้เลข sequence เดียวกับเว็บ; source/channel/citizen linkage ต้องตรง controller
โทรบังคับแม้ Anonymous; แชตไม่ขอบัตรประชาชน; file จำกัดชนิด/ขนาดและจำนวนตาม config/flow ปัจจุบัน

## ข้อมูลเพิ่มเติมและ Privacy

Request/response ต้องอยู่ใต้ complaint ที่ผู้ใช้มีสิทธิ์ รวม resend/cancel
ประชาชนตอบเฉพาะคำขอที่ผูกบัญชีตน; attachments ต้องผูกเรื่อง/คำขอถูกต้อง
Manual notify ส่งสถานะปัจจุบัน ไม่เปลี่ยน workflow
Push ใช้ public-safe content; ไม่ใส่ internal notes หรือผู้ถูกร้องที่อ่อนไหว
Anonymous masking ครอบคลุมชื่อ LINE และ identity linkage ในแผงเจ้าหน้าที่

## Outbox และ Retention

enqueue ใช้ idempotency key ที่คงเดิมเมื่อ retry; ห้ามสุ่ม key ใหม่ทุกครั้งเพื่อหลบ duplicate
ตรวจ recipient type citizen/user/group, preferences และ active target ก่อน delivery
ตรวจ sent/failed/retry/cancelled, max attempts/backoff, stale processing และ provider error classification
worker เดิมรันรายนาที; maintenance ทุก 15 นาที; ค่าระยะเวลาให้อ่าน job ไม่ hardcode ลง business layer เพิ่ม
Draft/temporary file cleanup ต้องไม่ลบ attachments ที่ผูก complaint แล้ว
การเปลี่ยน worker หรือเริ่ม backend อาจส่งข้อความจริงถ้าใช้ production configuration

## ตรวจรับ

bad signature, duplicated event, wrong owner, anonymous projection, consent, file limit, retry, unlink/preferences, expired draft และ incomplete profile ตาม scope
ใช้ fake provider/tokens; Integration tests อาจต้อง DB และอาจ skip เมื่อ DB ไม่พร้อม
