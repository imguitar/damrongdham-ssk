# LINE Integration — Damrongdham SSK

คู่มือการตั้งค่าและดูแลระบบ **LINE Login (ประชาชน)** และ **LINE Notification (แจ้งเตือนความคืบหน้าผ่าน LINE Official Account)**

ระบบออกแบบแบบ *minimal-invasive*: เพิ่มเข้ากับระบบ citizen เดิม โดยไม่กระทบ staff login และ workflow เดิม

---

## 1. Architecture

### LINE Login flow (ประชาชน)
```
ประชาชน กด "เข้าสู่ระบบด้วย LINE" (frontend :5173)
      │  window.location → {VITE_API_ORIGIN}/api/citizen/auth/line
      ▼
Backend GET /api/citizen/auth/line
      │  สร้าง state+nonce → เก็บใน HttpOnly cookie (signed JWT)
      │  302 redirect
      ▼
LINE authorize (access.line.me) → ผู้ใช้ยืนยันตัวตน
      │  redirect_uri พร้อม code + state
      ▼
Backend GET /api/citizen/auth/line/callback
      │  1) ตรวจ state กับ cookie   2) แลก code → token (api.line.me)
      │  3) verify id_token (/oauth2/v2.1/verify: iss/aud/nonce/sub)
      │  4) resolveLineIdentity → citizen (มีแล้ว/สร้าง provisional)
      │  5) ออก JWT type:'citizen'
      │  302 → {FRONTEND_URL}/citizen/line/callback#token=...&provisional=0|1
      ▼
Frontend CitizenLineCallbackPage → เก็บ token → /me → เข้าระบบ
      (provisional=1 → หน้า complete-profile ก่อน)
```

### Notification flow (แจ้งเตือน)
```
เจ้าหน้าที่เปลี่ยนสถานะ / โพสต์ progress แบบ public
      ▼  (ภายใน DB transaction เดียวกัน)
complaintService.changeStatus / complaintUpdateController
      │  UPDATE complaint + INSERT status log + INSERT notification_outbox
      ▼  COMMIT
notificationOutboxJob (node-cron ทุก 1 นาที)
      │  claim pending/retry → เช็ค LINE identity + preference
      │  build template (privacy-safe) → LINE push
      ▼
LINE Messaging API (/v2/bot/message/push) → ประชาชนได้รับข้อความ
      │  บันทึก notification_logs (sent/failed)
      └  ล้มเหลว → retry (backoff, max 5) → dead-letter (status=failed)
```

---

## 2. LINE Provider

- ต้องมี **LINE Provider เดียว** ครอบทั้ง 2 channel (Login + Messaging)
- ⚠️ **สำคัญ**: `userId` (sub) ที่ได้จาก LINE Login จะใช้ push ผ่าน Messaging API ได้ **ก็ต่อเมื่อทั้งสอง channel อยู่ใต้ provider เดียวกัน** — ถ้าคนละ provider, user id จะไม่ match และ push ส่งไม่ถึง

## 3. LINE Login Channel

- ชนิด: **LINE Login**
- ใช้สำหรับปุ่ม "เข้าสู่ระบบด้วย LINE"
- ค่าใช้: `LINE_LOGIN_CHANNEL_ID`, `LINE_LOGIN_CHANNEL_SECRET`
- แท็บ **LINE Login** → ตั้ง **Callback URL** (ดู §6)
- Scope ที่ใช้: `openid profile`

## 4. LINE Official Account (OA)

- Messaging API channel จะผูกกับ OA หนึ่งบัญชี
- **Push ส่งได้เฉพาะผู้ที่เป็นเพื่อนกับ OA** → ระบบใช้ `bot_prompt=aggressive` เพื่อชวน add friend ตอน login (ดู §10)

## 5. Messaging API Channel

- ชนิด: **Messaging API**
- ใช้สำหรับ push แจ้งเตือน
- ค่าใช้จริงในโค้ด: **`LINE_MESSAGING_CHANNEL_ACCESS_TOKEN`** (Channel access token — long-lived)
  - ออกที่ แท็บ **Messaging API → Channel access token → Issue**
  - `LINE_MESSAGING_CHANNEL_ID` / `LINE_MESSAGING_CHANNEL_SECRET` **ไม่ถูกใช้โดย push** (เก็บไว้เผื่อ webhook signature ในอนาคต)

---

## 6. Callback URL

ต้องลงทะเบียนใน **LINE Login channel → แท็บ LINE Login → Callback URL** ให้ **ตรงเป๊ะ** กับ `LINE_LOGIN_CALLBACK_URL`

| Environment | Callback URL |
|---|---|
| Local dev | `http://localhost:5001/api/citizen/auth/line/callback` |
| Production | `https://<your-domain>/api/citizen/auth/line/callback` |

ข้อควรระวัง: ห้ามมี `/` ต่อท้าย, ต้องมี `/api/`, ตรง scheme/host/port

---

## 7. Environment Variables

ตั้งใน `.env` (root — gitignored) หรือ Railway env. **ห้าม commit ค่าจริง / ห้าม expose ด้วย `VITE_` ยกเว้น origin สาธารณะ**

```dotenv
# LINE Login channel
LINE_LOGIN_CHANNEL_ID=
LINE_LOGIN_CHANNEL_SECRET=
LINE_LOGIN_CALLBACK_URL=http://localhost:5001/api/citizen/auth/line/callback
LINE_LOGIN_BOT_PROMPT=aggressive        # normal | aggressive

# Messaging API channel (push)
LINE_MESSAGING_CHANNEL_ACCESS_TOKEN=

# URLs (redirect กลับ frontend + deep link ในข้อความ)
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5001
```

Frontend (`frontend/.env` — gitignored):
```dotenv
# origin ของ backend สำหรับปุ่ม LINE (ต้องเป็น origin เดียวกับ callback)
VITE_API_ORIGIN=http://localhost:5001    # prod: เว้นว่าง (same origin)
```

docker-compose ส่งค่าเหล่านี้เข้า backend container ผ่าน block `environment:` โดยอ้าง `${...}` จาก `.env` (ไม่มีค่าจริงใน compose)

---

## 8. Local Development

1. ตั้งค่า `.env` + `frontend/.env` ตาม §7
2. `docker compose up -d` (ครั้งแรก) หรือ `docker compose up -d --force-recreate backend` (เมื่อแก้ env)
   - ⚠️ backend ใช้ `environment:` list — **แก้ `.env` แล้วต้อง recreate** ถึงจะโหลดค่าใหม่ (nodemon reload แค่โค้ด ไม่ reload env)
3. ลงทะเบียน Callback URL ใน LINE Console (§6)
4. ทดสอบ: `curl -i http://localhost:5001/api/citizen/auth/line` → ควรได้ **302 → access.line.me**

**localhost callback ใช้ได้** เพราะ redirect เป็น browser-based (เครื่องผู้ใช้เป็นคน redirect ไม่ใช่ server ของ LINE) — แต่ต้องลงทะเบียน URL ตรงเป๊ะ

หากต้องการ callback ผ่าน HTTPS จริง (เช่นทดสอบข้ามเครื่อง) ให้ใช้ public HTTPS tunnel ชี้มา `:5001` แล้วตั้ง `LINE_LOGIN_CALLBACK_URL`, `BACKEND_URL`, `VITE_API_ORIGIN` เป็น URL ของ tunnel + ลงทะเบียน callback เดียวกัน (ห้าม hardcode URL tunnel ในโค้ด)

---

## 9. Production Deployment (Railway)

1. ตั้ง LINE env vars ทั้งหมดบน Railway (ไม่ใช้ `.env` ไฟล์)
2. `LINE_LOGIN_CALLBACK_URL` / `FRONTEND_URL` / `BACKEND_URL` = โดเมนจริง (https)
3. `VITE_API_ORIGIN` **เว้นว่าง** (frontend + backend เสิร์ฟจาก origin เดียวกันใน single container)
4. ลงทะเบียน production Callback URL ใน LINE Console
5. cookie `secure` เปิดอัตโนมัติเมื่อ `NODE_ENV=production` (+ `trust proxy` ตั้งไว้แล้ว)

---

## 10. Add Friend Flow

- `LINE_LOGIN_BOT_PROMPT=aggressive` → หลังยินยอม login LINE จะแสดงหน้าชวนเพิ่มเพื่อน OA ทันที
- เหตุผลที่เลือก aggressive สำหรับระบบภาครัฐ: การแจ้งเตือนความคืบหน้าเป็นประโยชน์ต่อประชาชน และ push ทำงานได้เฉพาะเพื่อน OA — ผู้ใช้ยังกดข้ามได้
- ถ้าผู้ใช้ไม่ได้เป็นเพื่อน OA → push จะล้มเหลว (LINE 403) และถูกบันทึกใน `notification_logs`

---

## 11. Notification Flow (รายละเอียด)

- **Event ที่สร้าง outbox**: ทุก status transition (`COMPLAINT_STATUS_CHANGED`, `COMPLAINT_CLOSED`) + progress ที่ `is_public=1` (`COMPLAINT_PROGRESS_UPDATED`)
- **Public vs Internal**: เจ้าหน้าที่ toggle "แสดงต่อประชาชน" ตอนโพสต์ → `PROGRESS`+`is_public=1` (แจ้ง) / ปิด → `REVIEW_NOTE`+`is_public=0` (ไม่แจ้ง)
- **Preference**: ประชาชนคุม on/off รายเหตุการณ์ที่หน้า "ตั้งค่าการแจ้งเตือน" (`notification_preferences`)
- **Idempotency**: `notification_outbox.idempotency_key` (UNIQUE) + `X-Line-Retry-Key` (UUID derive จาก key) — กันส่งซ้ำสองชั้น
- **Retry**: retryable (429/5xx/network) → backoff `1m,5m,15m,1h,3h` สูงสุด 5 ครั้ง → `failed` (dead-letter). Non-retryable (4xx) → `failed` ทันที
- **Privacy (§18)**: ข้อความมีแค่ **เลขที่เรื่อง + สถานะ + ลิงก์** — ไม่มีบัตร ปชช./ข้อมูลอ่อนไหว/ชื่อผู้ถูกร้อง/internal note

---

## 11b. Account Linking (ผูก LINE กับบัญชีเดิม)

ผู้ใช้ที่สมัครด้วย email/password สามารถ**ผูกบัญชี LINE ภายหลัง**ได้ (Option C §9) แบบ explicit —
ระบบ**ไม่ auto-merge** ด้วยชื่อ/อีเมล (PDPA)

```
ผู้ใช้ล็อกอิน email/password (มี citizen JWT)
      │  กด "ผูกบัญชี LINE" ที่หน้า ตั้งค่าการแจ้งเตือน
      ▼
POST /api/citizen/line/link/init  (authenticated)
      │  ฝัง citizen_id ลง signed state cookie (linkCitizenId)
      │  → { authorizeUrl }
      ▼
frontend redirect → LINE → callback
      │  state มี linkCitizenId → LINK MODE (ไม่สร้างบัญชีใหม่)
      │  - sub ผูกกับคนอื่นแล้ว → line_identity_conflict
      │  - บัญชีนี้ผูก LINE อื่นแล้ว → line_already_linked
      │  - ว่าง → INSERT citizen_identities(citizen_id, 'line', sub)
      ▼
redirect → /citizen/notifications?line_linked=1
```

**ความปลอดภัย:** `citizen_id` ถูกผูกใน signed state cookie **ตอน init ที่ผ่าน auth แล้ว** — callback เชื่อค่าจาก
token ที่ลงนาม ไม่ใช่จาก client → กัน account takeover. หนึ่งบัญชีผูกได้หนึ่ง LINE; ต้อง unlink ก่อนผูกใหม่

Endpoints (ทั้งหมด authenticated ด้วย citizen JWT):
```
POST   /api/citizen/line/link/init   → { authorizeUrl } + set state cookie
GET    /api/citizen/line/link        → { linked, displayName, linkedAt }
DELETE /api/citizen/line/link        → unlink (audit: LINE_IDENTITY_UNLINKED)
```
Unlink ได้เสมอเพราะบัญชี email ยังล็อกอินด้วย password ได้ (ไม่ทำให้ล็อกอินไม่ได้)

### Staff notifications (Hybrid: กลุ่ม + รายคน)
- **กลุ่ม**: bind กลุ่ม LINE ต่อหน่วยงานด้วย pairing code (webhook) → รับแจ้งเตือน เรื่องใหม่/ส่งต่อ/SLA/escalation
- **รายคน**: เจ้าหน้าที่ผูก LINE ส่วนตัวที่หน้า Profile → รับ DM งานที่เกี่ยวข้อง (คุม on/off รายเหตุการณ์)
  - `POST /api/auth/line/link/init` · `GET/DELETE /api/auth/line/link` · `GET/PATCH /api/auth/line/preferences` (staff auth)
  - callback ตัวเดียวกันจับ mode จาก signed state: `linkUserId` (staff) / `linkCitizenId` (citizen) / login
  - DM ส่งได้เฉพาะเจ้าหน้าที่ที่ผูก LINE + add friend OA + เปิด preference; ข้อความใช้ template เดียวกับกลุ่ม (ไม่มี PII)

### Credential management (บัญชี citizen)
- บัญชี email/password: เปลี่ยนรหัสผ่าน — `PUT /api/citizen/auth/change-password` (ต้องมีรหัสผ่านปัจจุบัน)
- บัญชี LINE ที่ยังไม่มีอีเมล/รหัสผ่าน: เพิ่มอีเมล+รหัสผ่านเพื่อเปิดใช้ email login (สำรอง) —
  `POST /api/citizen/auth/set-credentials` (เฉพาะบัญชีที่ยังไม่มีรหัสผ่าน, กันอีเมลซ้ำ)
- `GET /me` คืน `has_password` เพื่อให้ frontend เลือกฟอร์มที่ถูก (เปลี่ยน vs เพิ่ม); UI อยู่หน้า Profile

---

## 12. Troubleshooting

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| `curl /api/citizen/auth/line` ได้ 503 `LINE_NOT_CONFIGURED` | ยังไม่มี `LINE_LOGIN_CHANNEL_ID/SECRET/CALLBACK_URL` หรือ container ยังไม่ recreate หลังแก้ `.env` |
| LINE alert **400 Invalid redirect_uri** | Callback URL ใน Console ไม่ตรงกับ `LINE_LOGIN_CALLBACK_URL` (เช็ค `/` ท้าย, port, `/api/`) |
| callback เด้งกลับ `?line_error=line_invalid_state` | cookie state หมดอายุ/หาย — ปุ่มต้องไป **backend origin เดียวกับ callback** (ตั้ง `VITE_API_ORIGIN`); หรือลอง login ใหม่ |
| callback `?line_error=line_token_exchange_failed` | `LINE_LOGIN_CHANNEL_SECRET` ผิด/เก่า (เช่นหลัง rotate ยังไม่อัปเดต+recreate) |
| `notification_logs` = failed, error `HTTP_403` | ผู้ใช้ยังไม่เป็นเพื่อน OA **หรือ** Login/Messaging channel คนละ provider |
| push log ว่า sent แต่ไม่ได้รับ | ตรวจว่า add friend OA แล้ว + provider เดียวกัน |
| outbox ค้าง `pending` ไม่ส่ง | `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` ยังไม่ตั้ง (worker skip ทั้ง batch) |
| outbox `cancelled` (last_error `no_line_identity`) | เรื่องเป็นของ citizen ที่ยังไม่ผูก LINE |
| outbox `cancelled` (last_error `preference_disabled`) | ผู้ใช้ปิดการแจ้งเตือนเหตุการณ์นั้น (พฤติกรรมถูกต้อง) |

ดู log: `docker logs -f damrongdham-backend | grep OutboxJob`

---

## 13. Security Notes

- state (crypto 32B) + nonce ป้องกัน CSRF/replay; เก็บใน **HttpOnly, SameSite=Lax** cookie (signed JWT, อายุ 10 นาที, path จำกัด)
- verify id_token ผ่าน endpoint ทางการ + re-check `iss/aud/nonce/sub`
- **ไม่เชื่อ** LINE profile จาก frontend; identity = `sub` เท่านั้น (displayName ใช้แค่ UX)
- **ไม่ log** access token / id token / channel secret
- IDOR/ownership: ประชาชนเห็นเฉพาะเรื่องของตน (enforce ที่ backend); deep link ตรวจสิทธิ์ซ้ำเสมอ
- rate limit: login/register/LINE endpoints (per IP, 429 + Retry-After)
- ไม่ merge บัญชีอัตโนมัติด้วยชื่อ/displayName (PDPA); provisional user ต้องกรอกโปรไฟล์ + consent ก่อนใช้งาน

---

## 14. Secret Rotation

1. LINE Console → channel → **Basic settings → Channel secret → Issue/Reissue** (ค่าเก่าใช้ไม่ได้ทันที)
2. อัปเดตค่าใหม่ใน `.env` (`LINE_LOGIN_CHANNEL_SECRET` และ/หรือ `LINE_MESSAGING_CHANNEL_SECRET`)
3. `docker compose up -d --force-recreate backend` (หรืออัปเดตบน Railway)
4. Channel access token (Messaging) rotate แยก: แท็บ **Messaging API → Revoke** เก่า → **Issue** ใหม่ → อัปเดต `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` + recreate
5. ⚠️ ทำตอนพร้อมอัปเดต env ทันที เพื่อลด downtime ของ login/verify

---

## 15. Rollback

การถอน LINE integration ออกโดยไม่กระทบระบบเดิม:

- **ปิด LINE Login ชั่วคราว**: ลบ/เว้นว่าง `LINE_LOGIN_CHANNEL_*` → endpoint คืน 503, ปุ่มยังโชว์แต่กดแล้วขึ้น error ที่เป็นมิตร (staff + local citizen login ไม่กระทบ)
- **ปิด Notification ชั่วคราว**: ลบ `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` → worker skip, outbox ค้าง `pending` (ไม่ error, ส่งต่อเมื่อใส่ token คืน)
- **ถอน schema** (ถ้าจำเป็นจริง): ตาราง `citizen_identities`, `notification_preferences`, `notification_outbox`, `notification_logs` เป็นส่วนเสริม ลบได้โดยไม่กระทบ `complaints`; คอลัมน์ `citizens.is_provisional/consent_at`, `complaint_updates.is_public` มี default ปลอดภัย
- การ enqueue outbox เป็น fire-safe (no owner → no-op) และ push แยกจาก request transaction → **LINE ล่มไม่ทำให้การเปลี่ยนสถานะล้มเหลว**

---

## ไฟล์ที่เกี่ยวข้อง (อ้างอิงโค้ด)

| ส่วน | ไฟล์ |
|---|---|
| Config | `backend/src/config/line.js` |
| LINE Login | `backend/src/services/lineLoginService.js`, `backend/src/controllers/lineAuthController.js` |
| Identity | `backend/src/services/identityService.js`, `backend/src/models/citizenIdentityModel.js` |
| Messaging | `backend/src/services/lineMessagingService.js`, `backend/src/utils/lineMessageTemplate.js` |
| Outbox | `backend/src/services/notificationOutboxService.js`, `backend/src/models/outboxModel.js`, `backend/src/jobs/notificationOutboxJob.js` |
| Preferences | `backend/src/models/notificationPrefModel.js` |
| Migration | `db/init/02-line-notification.sql` |
| Frontend | `frontend/src/pages/citizen/CitizenLoginPage.jsx`, `CitizenLineCallbackPage.jsx`, `CitizenCompleteProfilePage.jsx`, `CitizenNotificationSettingsPage.jsx` |
