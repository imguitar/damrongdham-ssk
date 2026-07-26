# Monitoring & Maintenance Guide — DCMS

> อัปเดตล่าสุด: 2026-06-20 | Phase 15

---

## Health Check Endpoints

```bash
# ตรวจสอบสถานะระบบ (App + DB)
GET /api/health                        # Target A
GET /<subpath>/api/health              # Target B เช่น /damrongdham-ssk/api/health
→ {"status":"ok","db":"connected","timestamp":"..."}

# ตรวจสอบ uptime ผ่าน curl
curl -s https://<your-domain>/api/health | jq .
```

ถ้า response ไม่ใช่ `200 OK` → ระบบมีปัญหา ต้องตรวจสอบ logs ทันที

---

## ตรวจสอบ Logs

### On-premise (Docker Compose)

```bash
cd /opt/damrongdham-ssk

# ดู logs app แบบ real-time
docker compose -f docker-compose.prod.yml logs -f app

# ดู logs db
docker compose -f docker-compose.prod.yml logs -f db

# ดู logs nginx
docker compose -f docker-compose.prod.yml logs -f nginx

# ดู 100 บรรทัดล่าสุด
docker compose -f docker-compose.prod.yml logs --tail=100 app

# ค้นหา error ใน logs
docker compose -f docker-compose.prod.yml logs app 2>&1 | grep -i error

# ค้นหา SLA cron
docker compose -f docker-compose.prod.yml logs app 2>&1 | grep -i "SLA"
```

### Target B (pm2 + nginx subpath)

```bash
# ดู logs backend แบบ real-time
pm2 logs damrongdham-ssk-backend

# ดู 100 บรรทัดล่าสุด
pm2 logs damrongdham-ssk-backend --lines 100 --nostream

# ค้นหา error / SLA cron
pm2 logs damrongdham-ssk-backend --nostream | grep -i error
pm2 logs damrongdham-ssk-backend --nostream | grep -i "SLA"

# สถานะ process
pm2 status damrongdham-ssk-backend
```

---

## ตรวจสอบ Resource Usage

```bash
# CPU / Memory / Network
docker stats damrongdham-app damrongdham-db-prod

# Disk usage
df -h /opt/damrongdham-ssk

# ตรวจขนาด uploads
docker exec damrongdham-app du -sh /app/uploads

# ตรวจขนาด MySQL data
docker exec damrongdham-db-prod du -sh /var/lib/mysql
```

### Target B (pm2 + host MySQL)

```bash
# CPU / Memory ของ backend process
pm2 monit
pm2 show damrongdham-ssk-backend

# Disk usage
df -h /home/<user>/Documents/damrongdham-ssk

# ตรวจขนาด uploads
du -sh /home/<user>/Documents/damrongdham-ssk/backend/uploads

# ตรวจขนาด MySQL data (ทั้งเครื่อง — MySQL ไม่ได้แยก schema ต่อ volume)
sudo du -sh /var/lib/mysql
```

---

## Maintenance Tasks

### อัปเดต Application Code

```bash
cd /opt/damrongdham-ssk

# 1. ดึงโค้ดใหม่
git pull origin main

# 2. Rebuild และ restart app (ไม่กระทบ db / nginx)
docker compose -f docker-compose.prod.yml up -d --build app

# 3. ตรวจสอบ
docker compose -f docker-compose.prod.yml ps
curl -s http://localhost/api/health
```

### อัปเดต Application Code (Target B)

```bash
cd /home/<user>/Documents/damrongdham-ssk

git pull origin main
cd backend && npm install --omit=dev && pm2 restart damrongdham-ssk-backend
cd ../frontend && npm install && npm run build && cp -r dist/* /var/www/html/damrongdham-ssk/

pm2 status damrongdham-ssk-backend
curl -s http://localhost:4020/api/health
```

### Restart Services

```bash
# Target A
docker compose -f docker-compose.prod.yml restart app     # เฉพาะ app
docker compose -f docker-compose.prod.yml restart          # ทุก service (downtime ~30 วินาที)

# Target B
pm2 restart damrongdham-ssk-backend
sudo systemctl reload nginx   # ถ้าแก้ nginx config
```

### หยุดระบบชั่วคราว / กลับมาทำงาน

```bash
# Target A
docker compose -f docker-compose.prod.yml stop
docker compose -f docker-compose.prod.yml start

# Target B
pm2 stop damrongdham-ssk-backend
pm2 start damrongdham-ssk-backend
```

### เพิ่ม/แก้ Admin Account ผ่าน MySQL

```bash
# เข้า MySQL shell
docker exec -it damrongdham-db-prod mysql -u damrongdham_user -p damrongdham_db   # Target A
mysql -u damrongdham_user -p damrongdham_db                                       # Target B

# ดู accounts
SELECT id, username, full_name, role, is_active FROM users;

# ปิดการใช้งาน user
UPDATE users SET is_active = 0 WHERE username = '<username>';
```

---

## SLA Cron Monitoring

SLA cron รันทุกวัน 08:00 Asia/Bangkok โดยอัตโนมัติ (ผ่าน `node-cron` ในตัว app)

```bash
# ตรวจสอบว่า SLA cron ทำงาน
docker compose -f docker-compose.prod.yml logs app | grep "SLA"   # Target A
pm2 logs damrongdham-ssk-backend --nostream | grep "SLA"           # Target B
# ควรเห็น: "SLA check scheduled: daily 08:00 Asia/Bangkok"

# ดูจำนวน complaint ที่ is_overdue = 1
docker exec damrongdham-db-prod \
  mysql -u damrongdham_user -p"<password>" damrongdham_db \
  -e "SELECT COUNT(*) as overdue FROM complaints WHERE is_overdue = 1 AND status NOT IN ('CLOSED', 'REJECTED');"   # Target A

mysql -u damrongdham_user -p damrongdham_db \
  -e "SELECT COUNT(*) as overdue FROM complaints WHERE is_overdue = 1 AND status NOT IN ('CLOSED', 'REJECTED');"   # Target B
```

---

## Common Issues & Solutions

| อาการ | สาเหตุที่เป็นไปได้ | วิธีแก้ |
|------|------------------|--------|
| `/api/health` → 503 | App/process down | Target A: `docker compose restart app` / Target B: `pm2 restart damrongdham-ssk-backend` |
| `/api/health` db: error | MySQL down / password ผิด | Target A: `docker compose logs db` / Target B: `systemctl status mysql`, ตรวจ `backend/.env` |
| ล็อกอินไม่ได้ | JWT_SECRET เปลี่ยน | ตรวจ `.env.production` (Target A) หรือ `backend/.env` (Target B) |
| อัปโหลดไฟล์ล้มเหลว | uploads เต็ม/พาธผิด | `df -h`, ตรวจ mount (Target A) หรือ `backend/uploads/` permissions (Target B) |
| nginx 502 | Backend ไม่ตอบสนอง | Target A: `docker compose restart app` / Target B: `pm2 restart damrongdham-ssk-backend` |
| หน้าเว็บ 404 ทุกเส้นทางที่ไม่ใช่ root (Target B) | ลืม subpath ใน `location` block หรือ frontend build ผิด `base` | ตรวจ `try_files ... /<subpath>/index.html` ใน nginx config และ `vite.config.js` |

---

## Scheduled Maintenance Window แนะนำ

- **อัปเดต app**: วันอาทิตย์ 01:00–02:00 น. (traffic ต่ำสุด)
- **Backup**: ทุกวัน 02:00 น. (หลังอัปเดต)
- **SSL renew**: ทุกวันที่ 1 เวลา 03:00 น. (ผ่าน cron)
- **ทบทวน logs**: ทุกสัปดาห์

---

## Alert แนะนำ (เพิ่มเติมได้ภายหลัง)

แนะนำตั้ง uptime monitor ด้วยบริการฟรี เช่น [UptimeRobot](https://uptimerobot.com) ให้ตรวจ `GET /api/health` ทุก 5 นาที และส่ง email/LINE เมื่อ down
