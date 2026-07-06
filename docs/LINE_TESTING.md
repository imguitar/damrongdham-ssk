# LINE Testing Guide — Damrongdham SSK

วิธีทดสอบ **LINE Login** และ **LINE Notification** ทั้งแบบ manual และแนวทาง automated

> ทุกคำสั่งรันจาก root ของโปรเจกต์ สมมติ dev ผ่าน Docker Compose (backend `damrongdham-backend`)

---

## 0. เตรียมความพร้อม

- ตั้ง `.env` + `frontend/.env` ครบ (ดู [LINE_INTEGRATION.md §7](./LINE_INTEGRATION.md))
- `docker compose up -d --force-recreate backend` (โหลด env ใหม่)
- ลงทะเบียน Callback URL ใน LINE Console
- add friend OA (สำหรับทดสอบ push)

ตรวจว่า configured:
```bash
docker exec damrongdham-backend node -e \
  'const l=require("./src/config/line");const m=require("./src/services/lineMessagingService");
   console.log("login configured:", l.isConfigured(), "| messaging configured:", m.isConfigured())'
```

---

## 1. Manual — LINE Login

### 1.1 endpoint start
```bash
curl -i http://localhost:5001/api/citizen/auth/line
```
คาดหวัง: **302** + `Location: https://access.line.me/oauth2/v2.1/authorize?...` + `Set-Cookie: line_oauth=...; HttpOnly; SameSite=Lax`

### 1.2 callback error handling (ไม่มี state/cookie)
```bash
curl -i "http://localhost:5001/api/citizen/auth/line/callback?code=x&state=y"
```
คาดหวัง: **302** → `/citizen/login?line_error=line_invalid_state`

### 1.3 browser end-to-end
1. เปิด `http://localhost:5173/citizen/login`
2. กด "เข้าสู่ระบบด้วย LINE" → ยืนยันที่ LINE
3. ครั้งแรก → หน้า "ยืนยันข้อมูลผู้ใช้" (กรอก + consent) → เข้า "เรื่องของฉัน"
4. login ซ้ำ → เข้าตรง ไม่สร้าง citizen ซ้ำ (ยืนยัน: `SELECT COUNT(*) FROM citizen_identities WHERE provider_user_id=...` = 1)

### 1.4 regression — login เดิมต้องไม่พัง
```bash
# staff
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5001/api/auth/login \
  -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}'   # 200
# local citizen
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5001/api/citizen/auth/login \
  -H 'Content-Type: application/json' -d '{"email":"citizen@example.com","password":"Citizen@123"}'  # 200
```

---

## 2. Manual — Notification (push จริง)

ต้องมี: citizen ที่ผูก LINE + เป็นเพื่อน OA, `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` ตั้งแล้ว

ขั้นตอน:
1. หา citizen ที่มี LINE identity:
   ```bash
   docker exec damrongdham-backend node -e \
     'const p=require("./src/config/database");(async()=>{const[r]=await p.query(
      "SELECT citizen_id,provider_user_id FROM citizen_identities WHERE provider=\"line\"");console.log(r);await p.end();})()'
   ```
2. สร้างเรื่องของ citizen นั้น (ผ่าน UI: login LINE → "ยื่นเรื่องใหม่") **หรือ** ให้เจ้าหน้าที่เปลี่ยนสถานะเรื่องที่ citizen เป็นเจ้าของ
3. เปลี่ยนสถานะ (UI เจ้าหน้าที่) หรือโพสต์ progress แบบ **"แสดงต่อประชาชน"**
4. รอ worker (ทุก 1 นาที) หรือรันทันที:
   ```bash
   docker exec damrongdham-backend node -e 'require("./src/jobs/notificationOutboxJob").runOnce()'
   ```
5. ตรวจผล:
   ```bash
   docker exec damrongdham-backend node -e \
     'const p=require("./src/config/database");(async()=>{
       const[o]=await p.query("SELECT id,event_type,status,attempt_count,last_error FROM notification_outbox ORDER BY id DESC LIMIT 5");
       const[l]=await p.query("SELECT status,provider_message_id,error_code FROM notification_logs ORDER BY id DESC LIMIT 5");
       console.log("outbox",o);console.log("logs",l);await p.end();})()'
   ```
   คาดหวัง: outbox `status=sent`, log `status=sent` + มี `provider_message_id`, และได้รับข้อความใน LINE

---

## 3. Automated Tests (แนวทาง — Phase L10)

ยังไม่มี test framework ในโปรเจกต์ แนะนำ **Vitest** (เบา, ESM/CJS ได้) เพิ่มใน `backend`:
```jsonc
// backend/package.json (scripts)
"test": "vitest run"
```
Mock LINE API ทุกจุด — **ห้ามเรียก LINE production จริงใน test**

### Unit
- `lineLoginService`: generateSecret, state token roundtrip + reject ปลอม, buildAuthorizationUrl (scope %20, bot_prompt)
- `verifyIdToken`: mock verify endpoint → aud/iss/nonce mismatch โยน error
- `identityService.resolveLineIdentity`: identity ใหม่ (provisional) / มีอยู่ / duplicate race
- `lineMessageTemplate`: มีเลขเรื่อง+สถานะ+URL, **ไม่มี PII**, buildByEvent unknown→null
- `lineMessagingService`: retry classification (429/5xx/network→retry, 4xx→ไม่), 409→success, retry key UUID stable
- `notificationOutboxJob.isEnabled`: preference on/off, ไม่มี pref → default on
- `rateLimit`: เกิน max → 429 + Retry-After, IP อื่นไม่บล็อก, reset หลัง window

### Integration (mock fetch + DB ทดสอบ)
- callback success (mock token+verify) → สร้าง identity + JWT
- callback invalid state / token exchange fail / invalid id_token
- status change → สร้าง status log + outbox row (ใน transaction เดียว)
- public progress → outbox `COMPLAINT_PROGRESS_UPDATED`; internal note → ไม่มี outbox
- worker: sent / preference off→cancelled / no identity→cancelled / retryable→retry+backoff / exhausted→failed
- preference GET/PATCH (whitelist), complete-profile (consent required, email conflict)

### Security
- forged callback / state mismatch / missing code → error ที่เป็นมิตร
- IDOR: citizen A เข้าถึงเรื่อง citizen B → 403
- mass-assignment: PATCH preferences แนบ `is_provisional/id` → ถูกเมิน
- ไม่มี secret/token ใน log

---

## 4. Test Data Cleanup

ลบข้อมูลทดสอบ (ตัวอย่างเรื่องที่ขึ้นต้น `LINE-`/`TEST-`):
```bash
docker exec damrongdham-backend node -e \
  'const p=require("./src/config/database");(async()=>{
    const[c]=await p.query("SELECT id FROM complaints WHERE complaint_number LIKE \"LINE-%\" OR complaint_number LIKE \"TEST-%\"");
    for(const {id} of c){
      await p.query("DELETE FROM notification_logs WHERE complaint_id=?",[id]);
      await p.query("DELETE FROM notification_outbox WHERE complaint_id=?",[id]);
      await p.query("DELETE FROM complaint_status_logs WHERE complaint_id=?",[id]);
      await p.query("DELETE FROM complaint_assignments WHERE complaint_id=?",[id]);
      await p.query("DELETE FROM complaints WHERE id=?",[id]);
    }
    console.log("cleaned",c.length,"complaints");await p.end();})()'
```

---

## 5. Checklist ก่อน production

- [ ] rotate channel secret ทั้ง 2 channel (หากเคยใช้ค่า dev)
- [ ] callback URL production (https) ลงทะเบียนใน Console
- [ ] LINE env vars ตั้งบน Railway (ไม่ใช้ `.env` ไฟล์)
- [ ] `VITE_API_ORIGIN` เว้นว่าง (same origin)
- [ ] add friend OA ใช้งานได้ + provider เดียวกัน
- [ ] ทดสอบ login + push จริงบน staging
- [ ] ไม่มี secret ใน git (`git grep` channel id/secret = ไม่พบ)
