# Post-Deployment Checklist — DCMS

> อัปเดตล่าสุด: 2026-06-20 | Phase 15
> ใช้ทุกครั้งหลัง deploy ขึ้น production ครั้งแรก หรือ deploy ครั้งใหญ่

---

## ก่อน Deploy

- [ ] Backup database ล่าสุดแล้ว (ดู `BACKUP_RESTORE.md`)
- [ ] ตรวจสอบ `.env.production` ครบถ้วน ไม่มีค่า default ที่ไม่ปลอดภัย
- [ ] `JWT_SECRET` ยาวพอ (อย่างน้อย 32 chars) และไม่ใช่ค่าตัวอย่าง
- [ ] `CORS_ORIGIN` ตรงกับ domain จริง (ไม่ใช่ `*`)
- [ ] `NODE_ENV=production` ตั้งค่าแล้ว
- [ ] Firewall: เปิดเฉพาะ port 80 (HTTP) และ 443 (HTTPS) สำหรับ public

---

## หลัง Deploy — Infrastructure

- [ ] **Health Check ผ่าน**
  ```bash
  curl https://<domain>/api/health
  # Expected: {"status":"ok","db":"connected"}
  ```

- [ ] **SSL Certificate ทำงาน** (HTTPS ไม่มี warning)
  ```bash
  curl -I https://<domain>
  # ต้องเห็น: HTTP/2 200 และ Strict-Transport-Security
  ```

- [ ] **HTTP → HTTPS Redirect ทำงาน**
  ```bash
  curl -I http://<domain>
  # ต้องเห็น: 301 Moved Permanently → https://
  ```

- [ ] **Docker containers ทุกตัว running**
  ```bash
  docker compose -f docker-compose.prod.yml ps
  # State: Up (healthy) สำหรับ db, Up สำหรับ app และ nginx
  ```

---

## หลัง Deploy — Authentication

- [ ] **Admin login สำเร็จ**
  ```bash
  curl -s -X POST https://<domain>/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"<admin-password>"}' | jq .
  # Expected: success: true, token: "..."
  ```

- [ ] **Token ใช้งานได้** (ทดสอบ endpoint ที่ต้องการ auth)
  ```bash
  TOKEN="<token-from-login>"
  curl -s https://<domain>/api/complaints \
    -H "Authorization: Bearer $TOKEN" | jq .success
  # Expected: true
  ```

- [ ] **Role-based access ทำงาน** — ทดสอบ login ด้วย officer, agency_head

---

## หลัง Deploy — Core Features

- [ ] **สร้างเรื่องร้องเรียน** (POST /api/complaints) สำเร็จ
- [ ] **ค้นหา/กรองเรื่อง** (GET /api/complaints?status=NEW) สำเร็จ
- [ ] **Dashboard** โหลดข้อมูลได้ (GET /api/dashboard/summary)
- [ ] **Public tracking** ทำงาน (GET /public/complaints/track/:number)
- [ ] **Master data** โหลดได้ (GET /public/master-data/categories)

---

## หลัง Deploy — ตรวจสอบ Data

- [ ] **Seed data ครบถ้วน**
  ```bash
  docker exec damrongdham-db-prod \
    mysql -u damrongdham_user -p"<password>" damrongdham_db \
    -e "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM complaint_categories; SELECT COUNT(*) FROM districts;"
  ```

- [ ] **ไม่มีข้อมูล test/dummy ใน production** (ตรวจ complaints table)
  ```bash
  docker exec damrongdham-db-prod \
    mysql -u damrongdham_user -p"<password>" damrongdham_db \
    -e "SELECT COUNT(*) as total FROM complaints;"
  # ควรเป็น 0 สำหรับ production ใหม่
  ```

---

## หลัง Deploy — Security

- [ ] **phpMyAdmin ไม่เปิด public** (port 8081 ปิด หรือ bind localhost เท่านั้น)
- [ ] **Backend port 5001 ไม่เปิด public** (ต้องผ่าน nginx เท่านั้น)
- [ ] **`.env.production` ไม่ commit ใน git**
  ```bash
  cat .gitignore | grep .env.production
  # ต้องเห็น: .env.production
  ```
- [ ] **Rate limit API ทำงาน** (ลอง login ผิดหลายครั้ง)
- [ ] **ตรวจสอบ CORS** — เรียก API จาก domain อื่นต้องถูก block

---

## หลัง Deploy — Operations

- [ ] **Backup cron ตั้งค่าแล้ว** (ดู `BACKUP_RESTORE.md` Auto Backup section)
- [ ] **SLA cron ทำงาน** (ตรวจ logs หา "SLA check scheduled")
- [ ] **Uptime monitor ตั้งค่าแล้ว** (UptimeRobot หรือเทียบเท่า)
- [ ] **ทีม Admin รู้รหัสผ่านและวิธี login** แล้ว
- [ ] **เอกสาร Deployment / Backup / Monitoring แจกจ่ายให้ทีมแล้ว**

---

## Sign-off

| รายการ | ผู้ตรวจสอบ | วันที่ | ผ่าน/ไม่ผ่าน |
|--------|----------|-------|------------|
| Infrastructure | | | |
| Authentication | | | |
| Core Features | | | |
| Data | | | |
| Security | | | |
| Operations | | | |

**Deploy ถือว่าสมบูรณ์เมื่อ checklist ทุกหมวดผ่านและมีลายเซ็น**
