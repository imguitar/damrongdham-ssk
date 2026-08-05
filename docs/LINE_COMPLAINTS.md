# LINE Complaint Intake — Damrongdham SSK

โมดูล **รับเรื่องร้องเรียนผ่าน LINE Official Account** ที่ต่อเข้ากับระบบศูนย์ดำรงธรรมเดิม

ระบบเดิมยังเป็น **Single Source of Truth**: เลขที่เรื่อง สถานะ การมอบหมาย ไฟล์แนบ และผลการพิจารณา
อยู่ในตาราง `complaints` เดิมทั้งหมด — LINE เป็นเพียง "ช่องทาง" (channel = `LINE Official Account`)

> เอกสารนี้ต่อยอดจาก [`LINE_INTEGRATION.md`](LINE_INTEGRATION.md) (LINE Login + Notification)
> และ [`LINE_TESTING.md`](LINE_TESTING.md) (วิธีทดสอบ)

---

## 1. ภาพรวมสถาปัตยกรรม

```
ประชาชนในแอป LINE
   │  (แชต 1:1 กับ Official Account / Rich Menu)
   ▼
LINE Messaging API  ──►  POST /api/line/webhook   (ตรวจ X-Line-Signature ทุกครั้ง)
                              │  ตอบ 200 ทันที แล้วประมวลผลแบบ async
                              │  dedupe ด้วย webhookEventId (line_webhook_events)
                              ▼
                     lineWebhookService
                       ├── source.type = 'user'  → lineBotService (บทสนทนาประชาชน)
                       └── source.type = 'group' → จับคู่กลุ่มเจ้าหน้าที่ (ของเดิม)
                              │
              lineFlowMachine (pure state machine)  ──► lineIntakeService
                              │                              │
                    line_conversations (ร่างชั่วคราว)         ▼
                                                     complaintModel.create()  ← ระบบเดิม
                                                     complaint_sequences → DC-YYYYMM-XXXX
                                                     complaint_attachments (private storage)
                              ▼
                     ตอบ "เลขที่รับเรื่อง" กลับทางแชต (เฉพาะเมื่อบันทึกสำเร็จ)

เจ้าหน้าที่ (ระบบหลังบ้านเดิม)
   │  แท็บ "LINE" ในหน้ารายละเอียดเรื่อง
   ├── ขอข้อมูล/เอกสารเพิ่มเติม → complaint_info_requests → notification_outbox
   ├── ดูประวัติข้อความ / เอกสารที่ประชาชนส่ง / ส่งข้อความใหม่
   ▼
notificationOutboxJob (cron ทุก 1 นาที) → LINE push → notification_logs
```

## 2. สิ่งที่ LINE ทำได้ (5 ภารกิจหลัก)

| # | ภารกิจ | ทางเข้า | ปลายทางในระบบเดิม |
|---|---|---|---|
| 1 | รับเรื่องร้องเรียนแบบมีขั้นตอนแนะนำ | Rich Menu "แจ้งเรื่องร้องเรียน" | `complaints` (+ `complaint_attachments`) |
| 2 | แจ้งเลขที่รับเรื่อง | ตอบกลับอัตโนมัติหลังบันทึกสำเร็จ | `complaints.complaint_number` |
| 3 | ติดตามสถานะ | Rich Menu "ติดตามสถานะ" | `complaints.status` + `complaint_updates(is_public=1)` |
| 4 | ขอ/ส่งข้อมูลเอกสารเพิ่มเติม | เจ้าหน้าที่กดในระบบหลังบ้าน → ประชาชนตอบในแชต | `complaint_info_requests` / `complaint_info_responses` |
| 5 | แจ้งผลการดำเนินการ | อัตโนมัติเมื่อสถานะเปลี่ยน + ปุ่มส่งซ้ำ | `notification_outbox` → `notification_logs` |

## 3. ขั้นตอนรับเรื่อง (wizard)

```
เมนู → ประกาศความเป็นส่วนตัว (ยอมรับ/ไม่ยอมรับ)
     → ประเภทเรื่อง → อำเภอ (พิมพ์ชื่อ หรือแชร์ตำแหน่ง) → ตำบล (ข้ามได้)
     → สถานที่เพิ่มเติม (ข้ามได้) → หัวข้อ → รายละเอียด
     → ผู้เกี่ยวข้อง (ข้ามได้) → สิ่งที่ต้องการให้ช่วยเหลือ (ข้ามได้)
     → เปิดเผย/ไม่เปิดเผยตัวตน → ชื่อ-นามสกุล (ข้ามเมื่อปกปิดตัวตน) → เบอร์โทร
     → แนบไฟล์ (สูงสุด 5 ไฟล์) → สรุปข้อมูล → ยืนยัน → บันทึก → แจ้งเลขที่รับเรื่อง
```

- **ยกเลิก / ย้อนกลับ / เริ่มใหม่** ใช้ได้ทุกขั้นตอน (พิมพ์ "ยกเลิก", "ย้อนกลับ", "เริ่มใหม่" หรือกดปุ่ม)
- **หยุดสนทนากลางคัน**: ร่างเก็บใน `line_conversations` และหมดอายุใน **60 นาที**
  (`lineMaintenanceJob` ลบร่าง + ไฟล์ที่ยังไม่ผูกกับเรื่องทุก 15 นาที)
- **เบอร์โทรบังคับกรอกทุกกรณี** ตามกฎเดิมของระบบ (BR-16) รวมถึงเรื่องปกปิดตัวตน
- ระบบ **ไม่ขอเลขบัตรประชาชน** ทางแชต และไม่บันทึกลง `complainant_id_card`
- ประเภทงานบริการ/ลักษณะเรื่อง/ประเภทผู้ร้อง ใช้ค่าเริ่มต้น (ทั่วไป / เรื่องร้องเรียนร้องทุกข์ / บุคคลธรรมดา)
  เจ้าหน้าที่แก้ไขได้ในระบบหลังบ้านตอนคัดกรอง

## 4. การยืนยันตัวตนและการติดตามสถานะ

- LINE userId ที่มากับ webhook **ผ่านการตรวจลายเซ็น** (`X-Line-Signature`) แล้ว จึงใช้เป็นหลักฐานตัวตนได้
- ผูกกับผู้ร้องผ่านตาราง `citizen_identities` เดิม (provider = `line`)
  — เป็นตัวเดียวกับ LINE Login เพราะ **Login channel และ Messaging channel อยู่ภายใต้ provider เดียวกัน**
  (ดู `LINE_INTEGRATION.md` §2)
- บัญชีผู้ร้องจะถูกสร้าง (provisional) **ต่อเมื่อผู้ใช้กดยอมรับประกาศความเป็นส่วนตัว** เท่านั้น
  และบันทึกเวลายินยอมไว้ที่ `citizens.consent_at`
- **การติดตามสถานะแสดงเฉพาะเรื่องของบัญชี LINE ที่ผูกไว้** — ไม่มีช่องทางดูรายละเอียดเรื่อง
  จากการรู้เลขที่เรื่องเพียงอย่างเดียว และข้อความปฏิเสธไม่บอกว่า "ไม่มีสิทธิ์" เพื่อไม่ให้เดาเลขที่เรื่องได้
- ข้อมูลละเอียดส่งเป็นลิงก์เข้าหน้าติดตามที่ต้องเข้าสู่ระบบ (`/citizen/complaints/:number`)

## 5. Endpoint ที่เพิ่มใหม่

| Method | Endpoint | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| POST | `/api/line/webhook` | public (ตรวจลายเซ็น) | รับ event จาก LINE (มีอยู่เดิม — ขยายให้รับ event ของประชาชน) |
| GET | `/api/complaints/:id/line` | staff (หน่วยงาน = เฉพาะเรื่องตน) | ข้อมูลแผง LINE: การผูกบัญชี, log ข้อความ, คำขอ, เอกสาร |
| GET | `/api/complaints/:id/info-requests` | staff | รายการคำขอข้อมูลเพิ่มเติม + คำตอบ |
| POST | `/api/complaints/:id/info-requests` | ศูนย์ + หน่วยงานที่ถือเรื่อง | สร้างคำขอ + ส่งเข้าคิวแจ้ง LINE |
| POST | `/api/complaints/:id/info-requests/:reqId/resend` | ศูนย์ + หน่วยงานที่ถือเรื่อง | ส่งคำขอซ้ำ (มี audit log) |
| PATCH | `/api/complaints/:id/info-requests/:reqId/cancel` | ศูนย์ + หน่วยงานที่ถือเรื่อง | ยกเลิกคำขอ |
| POST | `/api/complaints/:id/line/notify` | ศูนย์ | ส่งแจ้งสถานะปัจจุบันซ้ำ (ไม่เปลี่ยนสถานะเรื่อง) |
| GET | `/public/privacy` (frontend) | public | ประกาศความเป็นส่วนตัวฉบับเต็มที่ลิงก์จากแชต |

Response format เป็นแบบเดียวกับระบบเดิม (`{ success, data }` / `{ success, error: { code, message } }`)

## 6. Database changes (migration `db/init/04-line-complaints.sql`)

| ตาราง | ชนิด | คำอธิบาย |
|---|---|---|
| `complaint_channels` | seed | เพิ่มช่องทาง `LINE Official Account` (idempotent) |
| `line_webhook_events` | ใหม่ | PK = `webhook_event_id` → กัน webhook redelivery ซ้ำ |
| `line_conversations` | ใหม่ | สถานะบทสนทนา + ร่างชั่วคราว (มี `expires_at`) |
| `complaint_info_requests` | ใหม่ | คำขอข้อมูล/เอกสารเพิ่มเติมจากเจ้าหน้าที่ |
| `complaint_info_responses` | ใหม่ | ข้อความ/ไฟล์ที่ประชาชนส่งกลับตามคำขอ |
| `complaint_attachments` | ALTER | `+info_request_id`, `upload_source` เพิ่มค่า `LINE` |

ไม่มีการแก้/ลบข้อมูลเดิม ทุกคำสั่งเขียนแบบ idempotent (รันซ้ำได้) และไม่แตะโครงสร้าง `complaints`
— เรื่องจาก LINE = `source='PUBLIC'` + `channel_id` ของ LINE + `citizen_id` ที่ผูกกับ LINE

**รันบน DB ที่มีข้อมูลอยู่แล้ว:**
```bash
docker compose exec -T db mysql -u root -p damrongdham_db < db/init/04-line-complaints.sql
```
(Target B / pm2: `mysql -u <user> -p damrongdham_db < db/init/04-line-complaints.sql`)

## 7. ตั้งค่า LINE Official Account

1. **LINE Developers Console → Provider เดียวกับ LINE Login channel** (สำคัญ — ถ้าคนละ provider จะ push ไม่ถึง)
2. สร้าง/เลือก **Messaging API channel** ที่ผูกกับ Official Account ของหน่วยงาน
3. แท็บ **Messaging API**
   - **Channel access token (long-lived)** → Issue → ใส่ใน `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN`
   - **Webhook URL** → `https://<domain>/api/line/webhook` → กด **Verify** ต้องได้ Success
   - **Use webhook** = เปิด
   - **Auto-reply messages / Greeting messages** = ปิด (ให้ระบบตอบเอง)
4. แท็บ **Basic settings → Channel secret** → ใส่ใน `LINE_MESSAGING_CHANNEL_SECRET` (ใช้ตรวจลายเซ็น)
5. **Rich Menu**: เตรียมภาพ 2500×1686 px แล้วรัน
   ```bash
   node backend/scripts/setupLineRichMenu.js ./richmenu.png docs/line/richmenu.json
   ```
   (payload ของแต่ละปุ่มดูที่ [`docs/line/postback-payloads.md`](line/postback-payloads.md))

### Environment variables

```dotenv
LINE_MESSAGING_CHANNEL_ACCESS_TOKEN=   # Messaging API → Issue
LINE_MESSAGING_CHANNEL_SECRET=         # Basic settings → Channel secret
LINE_PRIVACY_NOTICE_URL=               # เว้นว่าง = ใช้ {FRONTEND_URL}/public/privacy
FRONTEND_URL=https://<domain>
BACKEND_URL=https://<domain>
```

⚠️ เก็บใน `.env` / `.env.production` / `backend/.env` เท่านั้น (gitignored) — **ห้าม commit ค่าจริง**
และห้าม expose ด้วย `VITE_`

## 8. Build / Run / Deploy

```bash
# Dev (Docker)
cp .env.example .env          # ใส่ค่า LINE
docker compose up -d --build
docker compose exec -T db mysql -u root -p damrongdham_db < db/init/04-line-complaints.sql   # DB เดิมที่มีข้อมูลแล้ว

# ทดสอบ webhook จากเครื่อง dev (LINE ต้องเรียกเข้ามาได้ → ใช้ public HTTPS tunnel)
curl -i https://<tunnel>/api/health
```

```bash
# Test (backend)
cd backend && npm test
```

Deploy: ไม่มี dependency ใหม่ ไม่เปลี่ยน stack — ขั้นตอน deploy เดิมทั้ง Target A (Docker) และ Target B (pm2 + nginx)
ใช้ได้ตามเดิม เพิ่มแค่ (1) รัน migration 04 (2) ตั้ง env ของ Messaging API (3) ตั้ง Webhook URL ใน Console
รายละเอียดดู [`docs/deployment/DEPLOYMENT.md`](deployment/DEPLOYMENT.md)

> nginx ต้องส่ง path `/api/line/webhook` ต่อไปยัง backend และ**ไม่แก้ไข body**
> (ลายเซ็นคำนวณจาก raw body — ระบบเก็บ raw body ไว้ตรวจใน `app.js` แล้ว)

## 9. ความปลอดภัยและข้อมูลส่วนบุคคล

- ตรวจ `X-Line-Signature` ด้วย HMAC-SHA256 + `timingSafeEqual` ทุก request; ลายเซ็นไม่ถูกต้อง → 401
- ตอบ HTTP 200 ทันที แล้วประมวลผล async (LINE ต้องการ ack เร็ว)
- Idempotency 3 ชั้น: `line_webhook_events` (event), `notification_outbox.idempotency_key` (ข้อความ),
  `X-Line-Retry-Key` (ฝั่ง LINE)
- Rate limit ต่อ LINE user (30 event/นาที) นอกเหนือจาก rate limit ระดับ IP ของระบบเดิม
- ประมวลผล event **เรียงตามลำดับต่อผู้ใช้หนึ่งคน** (คิวใน memory) — กันกรณีผู้ใช้พิมพ์รัวแล้ว
  สถานะบทสนทนาถูกเขียนทับกัน (มีเทสกำกับใน `lineWebhookFlow.integration.test.js`)
- ไฟล์แนบ: ดาวน์โหลดผ่าน channel token ฝั่ง server → ตรวจ MIME + ขนาด (≤10 MB, jpg/png/pdf/doc/docx)
  → **เปลี่ยนชื่อไฟล์ที่ระบบสร้างเอง** → เก็บใน private storage เดิม → **ไม่มี public URL**
  ดาวน์โหลดได้เฉพาะเจ้าหน้าที่ที่ผ่าน auth เท่านั้น
- ข้อความ push มีเฉพาะเลขที่เรื่อง + สถานะ + ลิงก์ (ไม่มีชื่อผู้ถูกร้อง ข้อมูลอ่อนไหว หรือบันทึกภายใน)
- เรื่องปกปิดตัวตน: ชื่อบัญชี LINE ไม่แสดงต่อผู้ที่ไม่มีสิทธิ์เห็นข้อมูลผู้ร้อง
- Log ไม่มี access token / channel secret / เนื้อหาข้อความของผู้ร้อง (บันทึกเฉพาะประเภท event + error)
- Audit log: `LINE_COMPLAINT_CREATED`, `INFO_REQUEST_CREATED/RESENT/CANCELLED`,
  `LINE_INFO_RESPONSE_SUBMITTED`, `LINE_NOTIFY_RESENT`
- Retention: ร่างบทสนทนา 60 นาที · webhook event id 30 วัน · แถวบทสนทนาที่ไม่ใช้งาน 90 วัน

## 10. การทดสอบ

```bash
cd backend && npm test
```

| ชุดทดสอบ | ไฟล์ | ต้องมี DB |
|---|---|---|
| ขั้นตอนสนทนา (ยกเลิก/ย้อนกลับ/validate) | `tests/lineFlowMachine.test.js` | ไม่ |
| ข้อความ/ความเป็นส่วนตัวของ template | `tests/lineBotMessages.test.js` | ไม่ |
| รับไฟล์แนบจาก LINE (ชนิด/ขนาด/ชื่อไฟล์) | `tests/lineFileIntake.test.js` | ไม่ |
| ลายเซ็น webhook | `tests/security/lineWebhook.security.test.js` | ไม่ |
| สร้างเรื่อง + idempotency + retention | `tests/integration/lineIntake.integration.test.js` | ใช่ |
| ขอ/ตอบข้อมูลเพิ่มเติม + audit | `tests/integration/lineInfoRequest.integration.test.js` | ใช่ |
| E2E ตั้งแต่แชตจนได้เลขที่เรื่องและส่งเอกสาร | `tests/integration/lineWebhookFlow.integration.test.js` | ใช่ |
| สิทธิ์เข้าถึง/IDOR/ปกปิดตัวตน | `tests/security/lineComplaints.security.test.js` | ใช่ |

เทสที่ต้องใช้ DB จะ **ข้ามอัตโนมัติ** เมื่อต่อฐานข้อมูลไม่ได้ (ดูวิธีตั้ง test DB ใน `LINE_TESTING.md` §3)

## 11. Troubleshooting

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| Webhook verify ใน Console ไม่ผ่าน | URL ต้องเป็น HTTPS สาธารณะ + `LINE_MESSAGING_CHANNEL_SECRET` ตรงกับ channel + nginx ต้องไม่แก้ body |
| บอทไม่ตอบอะไรเลย | ยังไม่ตั้ง `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` (reply/push จะเงียบ) หรือปิด "Use webhook" |
| บอทตอบข้อความอัตโนมัติของ LINE แทน | ยังไม่ปิด Auto-reply/Greeting ใน Official Account Manager |
| กด "ติดตามสถานะ" แล้วไม่พบเรื่อง | บัญชี LINE ยังไม่ผูกกับผู้ร้อง (เรื่องยื่นผ่านช่องทางอื่น) — ต้องยืนยันตัวตนกับเจ้าหน้าที่ |
| ส่งไฟล์แล้วขึ้น "ประเภทไฟล์ไม่รองรับ" | รองรับ jpg/png/pdf/doc/docx ≤10 MB ตามข้อกำหนดเดิมของระบบ |
| `notification_logs` = failed 403 | ผู้ร้องบล็อก/ไม่ได้เป็นเพื่อนกับ OA หรือ Login/Messaging คนละ provider |
| เรื่องซ้ำจาก redelivery | ตรวจว่าตาราง `line_webhook_events` ถูกสร้างแล้ว (migration 04) |

## 12. ข้อจำกัด / สิ่งที่ควรพัฒนาต่อ

- ยังไม่รองรับ **LIFF form** — การกรอกทั้งหมดทำผ่านแชต (เหมาะกับเรื่องทั่วไป
  เรื่องที่ซับซ้อนควรให้ประชาชนใช้ฟอร์มเว็บที่มีอยู่แล้วผ่านลิงก์)
- ยังไม่แจ้งเจ้าหน้าที่ทาง **LINE** เมื่อประชาชนส่งข้อมูลเพิ่มเติม (แจ้งผ่านการแจ้งเตือนในระบบเท่านั้น)
- ข้อความเป็น text + quick reply ยังไม่ได้ใช้ Flex Message (อ่านง่ายบนทุกเครื่อง แต่ตกแต่งได้น้อยกว่า)
- การผูกบัญชีของผู้ที่เคยยื่นเรื่องผ่านช่องทางอื่นต้องให้เจ้าหน้าที่ช่วยยืนยันตัวตน
  (ยังไม่มี OTP/Account Linking อัตโนมัติในแชต)
- rate limit และคิวจัดลำดับ event ของบอทเก็บใน memory — ถ้าขยายเป็นหลาย instance
  ต้องย้ายไป Redis หรือใช้ row lock บน `line_conversations` (สถาปัตยกรรมปัจจุบันรัน instance เดียว)
- ยังไม่รองรับข้อความเสียง/วิดีโอ (LINE ส่งได้แต่ระบบยังไม่รับ)
