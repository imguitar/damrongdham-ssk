# Monitoring & Maintenance Guide — DCMS

> อัปเดตล่าสุด: 2026-06-20 | Phase 15

---

## Health Check Endpoints

```bash
# ตรวจสอบสถานะระบบ (App + DB)
GET /api/health
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

### Railway

```bash
# ผ่าน CLI
railway logs

# ผ่าน Dashboard: Project → Service → Logs tab
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

### Restart Services

```bash
# Restart เฉพาะ app
docker compose -f docker-compose.prod.yml restart app

# Restart ทุก service (downtime ~30 วินาที)
docker compose -f docker-compose.prod.yml restart
```

### หยุดระบบชั่วคราว / กลับมาทำงาน

```bash
# หยุด (เก็บ volumes ไว้)
docker compose -f docker-compose.prod.yml stop

# กลับมาทำงาน
docker compose -f docker-compose.prod.yml start
```

### เพิ่ม/แก้ Admin Account ผ่าน MySQL

```bash
# เข้า MySQL shell
docker exec -it damrongdham-db-prod mysql -u damrongdham_user -p damrongdham_db

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
docker compose -f docker-compose.prod.yml logs app | grep "SLA"
# ควรเห็น: "SLA check scheduled: daily 08:00 Asia/Bangkok"

# ดูจำนวน complaint ที่ is_overdue = 1
docker exec damrongdham-db-prod \
  mysql -u damrongdham_user -p"<password>" damrongdham_db \
  -e "SELECT COUNT(*) as overdue FROM complaints WHERE is_overdue = 1 AND status NOT IN ('CLOSED', 'REJECTED');"
```

---

## Common Issues & Solutions

| อาการ | สาเหตุที่เป็นไปได้ | วิธีแก้ |
|------|------------------|--------|
| `/api/health` → 503 | App container down | `docker compose restart app` |
| `/api/health` db: error | MySQL down / password ผิด | ตรวจ `docker compose logs db` |
| ล็อกอินไม่ได้ | JWT_SECRET เปลี่ยน | ตรวจ `.env.production` |
| อัปโหลดไฟล์ล้มเหลว | uploads volume เต็ม/ขาด | `df -h`, ตรวจ mount |
| nginx 502 | App ไม่ตอบสนอง | `docker compose restart app` |
| สูญเสียไฟล์แนบ (Railway) | Ephemeral FS | ใช้ Railway Volume |

---

## Scheduled Maintenance Window แนะนำ

- **อัปเดต app**: วันอาทิตย์ 01:00–02:00 น. (traffic ต่ำสุด)
- **Backup**: ทุกวัน 02:00 น. (หลังอัปเดต)
- **SSL renew**: ทุกวันที่ 1 เวลา 03:00 น. (ผ่าน cron)
- **ทบทวน logs**: ทุกสัปดาห์

---

## Alert แนะนำ (เพิ่มเติมได้ภายหลัง)

แนะนำตั้ง uptime monitor ด้วยบริการฟรี เช่น [UptimeRobot](https://uptimerobot.com) ให้ตรวจ `GET /api/health` ทุก 5 นาที และส่ง email/LINE เมื่อ down
