# Deployment Guide — ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด (DCMS)

> อัปเดตล่าสุด: 2026-06-20 | Phase 15

ระบบรองรับ 2 deployment target จาก **image เดียวกัน** (root `Dockerfile`):

| Target | เหมาะสำหรับ | SSL | DB |
|--------|------------|-----|-----|
| **A — Railway** | Cloud, ทดสอบเร็ว, ไม่มี server เอง | Railway จัดการ | Railway Plugin / External |
| **B — On-premise Ubuntu** | Server ของหน่วยงาน, ข้อมูลอยู่ภายใน | nginx + Certbot | MySQL container ใน compose |

---

## Target A — Railway (Primary / Cloud)

### Prerequisites
- บัญชี [Railway](https://railway.app) (free tier ได้ แต่ production ควรใช้ Hobby/Pro)
- Railway CLI (optional แต่แนะนำ): `npm install -g @railway/cli`
- Git repository บน GitHub / GitLab

### ขั้นตอน Deploy

#### 1. สร้าง Project ใน Railway
```
railway login
railway init   # เลือก "Empty Project"
```
หรือเปิด railway.app → New Project → Deploy from GitHub repo

#### 2. ตั้ง Environment Variables ใน Railway Dashboard
ไปที่ Service → Variables → Add ตามนี้ทุกตัว:

```
NODE_ENV=production
PORT=5001
MYSQL_HOST=<railway-mysql-host>
MYSQL_PORT=<railway-mysql-port>
MYSQL_DATABASE=damrongdham_db
MYSQL_USER=damrongdham_user
MYSQL_PASSWORD=<strong-password>
JWT_SECRET=<random-64-chars>
JWT_EXPIRES_IN=8h
CORS_ORIGIN=https://<your-railway-domain>.up.railway.app
```

> สร้าง JWT_SECRET แบบ random:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

#### 3. เพิ่ม MySQL Plugin
Railway Dashboard → New → Database → MySQL → เชื่อมกับ Service

Railway จะ inject `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` ให้อัตโนมัติ **หรือ** ใส่ค่าเอง (ตามข้อ 2)

> ⚠️ ตรวจสอบชื่อ env var ที่ Railway inject ให้ตรงกับ `backend/src/config/db.js`
> ปัจจุบัน backend ใช้: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

ถ้า Railway ใช้ชื่อต่างกัน ให้ map ใน Variables:
```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
```

#### 4. Deploy
```bash
# ผ่าน Git push (Railway CI auto-build)
git push origin main

# หรือ ผ่าน CLI
railway up
```

#### 5. ตรวจสอบ
```bash
# Health check
curl https://<your-domain>.up.railway.app/api/health

# Logs
railway logs
```

### ⚠️ ข้อจำกัด Railway
- **Ephemeral filesystem** — ไฟล์แนบใน `/app/uploads` หายเมื่อ redeploy
- แก้ไข: ใช้ **Railway Volume** (mount ที่ `/app/uploads`) หรือย้ายไป S3/Object Storage ภายหลัง
- ไม่มี `docker-compose.prod.yml` บน Railway — Railway ใช้ `Dockerfile` + `railway.toml` โดยตรง

---

## Target B — On-premise / Ubuntu Server

### Prerequisites
- Ubuntu 22.04 LTS (หรือ 20.04+)
- Docker Engine 24+ และ Docker Compose v2
- Domain name (สำหรับ HTTPS) หรือ IP address
- SSL certificate (Let's Encrypt แนะนำ)

### ขั้นตอน Deploy

#### 1. ติดตั้ง Docker บน Ubuntu Server
```bash
# ติดตั้ง Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# ตรวจสอบ
docker --version
docker compose version
```

#### 2. Clone Repository
```bash
cd /opt
sudo git clone https://github.com/<your-repo>/damrongdham-ssk.git
sudo chown -R $USER:$USER /opt/damrongdham-ssk
cd /opt/damrongdham-ssk
```

#### 3. สร้างไฟล์ .env.production
```bash
cp .env.production.example .env.production
nano .env.production
```

แก้ค่าทุกตัว (อย่าใช้ค่า default):
```env
MYSQL_ROOT_PASSWORD=<strong-root-password>
MYSQL_DATABASE=damrongdham_db
MYSQL_USER=damrongdham_user
MYSQL_PASSWORD=<strong-password>
JWT_SECRET=<random-64-chars>
JWT_EXPIRES_IN=8h
CORS_ORIGIN=https://damrongdham.sisaket.go.th
```

#### 4. ตั้งค่า Nginx (ชื่อ domain)
```bash
nano nginx/default.conf
# แก้ server_name ให้ตรงกับ domain จริง
# บรรทัด: server_name _;  → server_name damrongdham.sisaket.go.th;
```

#### 5. Build และ Start
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

#### 6. ตรวจสอบ Services
```bash
docker compose -f docker-compose.prod.yml ps
# ต้องเห็น: damrongdham-app (Up), damrongdham-db-prod (Up/healthy), damrongdham-nginx (Up)

# Health check
curl http://localhost/api/health
```

#### 7. ตั้ง HTTPS ด้วย Let's Encrypt (แนะนำ)
```bash
# ติดตั้ง Certbot
sudo apt install certbot -y

# ออก certificate (หยุด nginx ชั่วคราว)
docker compose -f docker-compose.prod.yml stop nginx
sudo certbot certonly --standalone -d damrongdham.sisaket.go.th

# Copy cert ไปยัง nginx/ssl/
sudo cp /etc/letsencrypt/live/damrongdham.sisaket.go.th/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/damrongdham.sisaket.go.th/privkey.pem nginx/ssl/key.pem

# เปิด HTTPS block ใน nginx/default.conf (ปลด comment)
nano nginx/default.conf

# Restart nginx
docker compose -f docker-compose.prod.yml start nginx
```

#### 8. ตั้ง Auto-renew SSL Certificate
```bash
# เพิ่ม cron job
sudo crontab -e
# เพิ่มบรรทัด:
0 3 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/damrongdham.sisaket.go.th/fullchain.pem /opt/damrongdham-ssk/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/damrongdham.sisaket.go.th/privkey.pem /opt/damrongdham-ssk/nginx/ssl/key.pem && docker compose -f /opt/damrongdham-ssk/docker-compose.prod.yml restart nginx
```

### คำสั่ง On-premise ที่ใช้บ่อย

```bash
cd /opt/damrongdham-ssk

# ดู logs
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f db

# Restart service
docker compose -f docker-compose.prod.yml restart app

# Update โค้ด
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build app

# หยุดระบบ (เก็บข้อมูล)
docker compose -f docker-compose.prod.yml down

# เข้า MySQL shell
docker exec -it damrongdham-db-prod mysql -u damrongdham_user -p damrongdham_db
```

---

## ตรวจสอบหลัง Deploy (ทั้ง 2 Target)

```bash
# 1. Health check
GET /api/health → {"status":"ok","db":"connected"}

# 2. Login ทดสอบ
POST /api/auth/login
{"username":"admin","password":"<set-in-seed>"}

# 3. ตรวจ SLA Cron
docker logs <app-container> | grep "SLA"
# ต้องเห็น: "SLA check scheduled: daily 08:00 Asia/Bangkok"
```

---

## Environment Variables Reference

| Variable | Required | Description | ตัวอย่าง |
|----------|----------|-------------|---------|
| `NODE_ENV` | ✅ | Environment | `production` |
| `PORT` | ✅ | Backend port | `5001` |
| `DB_HOST` | ✅ | MySQL host | `db` (compose) |
| `DB_PORT` | ✅ | MySQL port | `3306` |
| `DB_USER` | ✅ | MySQL user | `damrongdham_user` |
| `DB_PASSWORD` | ✅ | MySQL password | *(strong password)* |
| `DB_NAME` | ✅ | MySQL database | `damrongdham_db` |
| `JWT_SECRET` | ✅ | JWT signing key | *(64 chars random)* |
| `JWT_EXPIRES_IN` | — | Token expiry | `8h` |
| `CORS_ORIGIN` | — | Allowed origin | `https://domain.go.th` |
| `MYSQL_ROOT_PASSWORD` | ✅ (compose) | MySQL root pw | *(strong password)* |
| `MYSQL_DATABASE` | ✅ (compose) | DB name | `damrongdham_db` |
| `MYSQL_USER` | ✅ (compose) | DB user | `damrongdham_user` |
| `MYSQL_PASSWORD` | ✅ (compose) | DB password | *(strong password)* |
