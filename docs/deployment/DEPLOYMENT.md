# Deployment Guide — ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด (DCMS)

> อัปเดตล่าสุด: 2026-07-26 | Phase 15

ระบบรองรับ 2 deployment target:

| Target | เหมาะสำหรับ | SSL | DB | Process manager |
|--------|------------|-----|-----|-----|
| **A — On-premise Docker** | Server ของหน่วยงานที่มีเครื่องแยกให้ทั้งระบบ | nginx + Certbot (ใน compose) | MySQL container | Docker |
| **B — Shared Server (pm2 + nginx subpath)** | เครื่อง server ที่มีแอปอื่นรันอยู่ร่วมกัน แชร์ nginx/MySQL ตัวเดียว | nginx ของ host (ตัวเดียวกับแอปอื่น) | MySQL บนเครื่อง host | pm2 |

Target B คือรูปแบบที่ใช้ deploy จริงบน production server ปัจจุบัน (`thaidevhub.site` ที่ path `/damrongdham-ssk/`) — รูปแบบเดียวกับที่ใช้ deploy `simple-pos` บนเครื่องเดียวกัน

---

## Target A — On-premise Docker (เครื่องแยกทั้งระบบ)

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
sudo git clone https://github.com/imguitar/damrongdham-ssk.git
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

### คำสั่ง Target A ที่ใช้บ่อย

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

## Target B — Shared Server (pm2 + nginx subpath)

ใช้เมื่อ server มีแอปอื่นรันอยู่ร่วมกันแล้ว (nginx / MySQL ตัวเดียวใช้ร่วมกันหลายโปรเจกต์) ไม่ containerize —
รันตรงบน host ด้วย pm2 เหมือนโปรเจกต์ `simple-pos` บนเครื่องเดียวกัน

โครงสร้างที่ได้:
- Backend รันด้วย pm2 (fork mode) ต่อกับ MySQL ที่ติดตั้งบนเครื่อง host โดยตรง (ไม่ใช่ container)
- Frontend build เป็น static files วางไว้ใต้ `/var/www/html/<app-name>/`
- nginx (ตัวที่ระบบใช้ร่วมกันทั้งเครื่อง — `/etc/nginx/sites-available/default`) เป็นคนเดียวที่เปิด port 80/443 ทำ subpath routing ไปแต่ละแอป

### Prerequisites
- Node.js 20+ และ npm ติดตั้งบนเครื่อง (ไม่ใช้ Docker)
- MySQL 8.0 รันเป็น system service อยู่แล้วบนเครื่อง (`systemctl status mysql`)
- pm2 ติดตั้ง global (`npm install -g pm2`) และตั้ง `pm2 startup` ไว้แล้ว
- nginx ติดตั้งเป็น system service ใช้ร่วมกับแอปอื่น ๆ บนเครื่อง

### ขั้นตอน Deploy

#### 1. Clone Repository
```bash
cd /home/<user>/Documents   # หรือ path ที่ใช้เก็บโปรเจกต์อื่นบนเครื่องนี้
git clone https://github.com/imguitar/damrongdham-ssk.git
cd damrongdham-ssk
```

#### 2. สร้าง MySQL database + user (บน MySQL ของเครื่อง host)
```sql
CREATE DATABASE damrongdham_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'damrongdham_user'@'localhost' IDENTIFIED BY '<strong-password>';
GRANT ALL PRIVILEGES ON damrongdham_db.* TO 'damrongdham_user'@'localhost';
FLUSH PRIVILEGES;
```

```bash
mysql -u damrongdham_user -p damrongdham_db < db/init/01-init.sql
mysql -u damrongdham_user -p damrongdham_db < db/init/02-line-notification.sql
mysql -u damrongdham_user -p damrongdham_db < db/init/03-staff-line.sql
mysql -u damrongdham_user -p damrongdham_db < db/init/04-line-complaints.sql
mysql -u damrongdham_user -p damrongdham_db < db/init/05-user-agency-affiliations.sql
```

> ไฟล์ `02`–`05` เป็น migration แบบ idempotent — รันซ้ำบน DB ที่มีข้อมูลอยู่แล้วได้อย่างปลอดภัย
> โดยไฟล์ `02`–`04` รองรับระบบ LINE และไฟล์ `05` ปรับหน่วยงานสังกัดของผู้ใช้เดิม

#### 3. Backend — ตั้งค่าและรันด้วย pm2
เลือก port ว่างบนเครื่อง (เช็คด้วย `ss -ltnp`) แล้วสร้าง `backend/.env`:
```env
NODE_ENV=production
PORT=<เลือก port ว่าง เช่น 4020>

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=damrongdham_user
DB_PASSWORD=<password ที่สร้างไว้ข้างบน>
DB_NAME=damrongdham_db

JWT_SECRET=<random 64 chars>
JWT_EXPIRES_IN=8h

UPLOAD_DIR=./uploads
UPLOAD_MAX_SIZE=10485760

CORS_ORIGIN=https://<domain>

# ── LINE (ใส่ค่าจริงที่นี่เท่านั้น — backend/.env อยู่ใน .gitignore) ───────────
# URL ต้องรวม subpath เพราะแอปอยู่ใต้ /<subpath>/
FRONTEND_URL=https://<domain>/<subpath>
BACKEND_URL=https://<domain>/<subpath>

# LINE Login channel (ประชาชน/เจ้าหน้าที่ผูกบัญชี)
LINE_LOGIN_CHANNEL_ID=
LINE_LOGIN_CHANNEL_SECRET=
LINE_LOGIN_CALLBACK_URL=https://<domain>/<subpath>/api/citizen/auth/line/callback
LINE_LOGIN_BOT_PROMPT=aggressive

# LINE Messaging API channel (รับเรื่องผ่านแชต + แจ้งเตือน)
# Webhook URL ที่ตั้งใน LINE Console: https://<domain>/<subpath>/api/line/webhook
LINE_MESSAGING_CHANNEL_ACCESS_TOKEN=
LINE_MESSAGING_CHANNEL_SECRET=
# เว้นว่าง = ใช้หน้า /public/privacy ของระบบ
LINE_PRIVACY_NOTICE_URL=
```

> URL ทุกตัวต้อง **ตรงเป๊ะ** กับที่ลงทะเบียนใน LINE Developers Console (scheme/host/subpath — มี `www.` หรือไม่มี ต้องเหมือนกัน)
> แก้ `backend/.env` แล้วต้อง `pm2 restart damrongdham-ssk-backend` ทุกครั้ง (ไม่โหลด env ใหม่เอง)

```bash
cd backend
npm install --omit=dev
pm2 start src/server.js --name damrongdham-ssk-backend
pm2 save
```

#### 4. Frontend — build เป็น static แล้ว deploy ใต้ subpath
ต้อง build ด้วย `base` ตรงกับ subpath ที่จะ mount (เช่น `/damrongdham-ssk/`) — ดูตัวอย่างการตั้งค่าที่ `frontend/vite.config.js` (`base: command === 'build' ? '/damrongdham-ssk/' : '/'`)
และ `frontend/src/main.jsx` (`<BrowserRouter basename={import.meta.env.BASE_URL}>`)

สร้าง `frontend/.env.production`:
```env
VITE_API_BASE_URL=/damrongdham-ssk/api
VITE_APP_TITLE=ศูนย์ดำรงธรรมจังหวัดศรีสะเกษ
VITE_API_ORIGIN=
```

```bash
cd frontend
npm install
npm run build
mkdir -p /var/www/html/damrongdham-ssk
cp -r dist/* /var/www/html/damrongdham-ssk/
```

> หมายเหตุ ARM64: ถ้า build fail ด้วย `Cannot find module @rollup/rollup-linux-*` ให้ลบ `node_modules` + `package-lock.json` แล้ว `npm install` ใหม่ (npm optional-dependency bug กับ rollup)

#### 5. nginx — เพิ่ม subpath routing
เพิ่มใน `location` block ของไฟล์ nginx config ที่ใช้ร่วมกันทั้งเครื่อง (เช่น `/etc/nginx/sites-available/default`):
```nginx
location /damrongdham-ssk/ {
    root /var/www/html;
    index index.html;
    try_files $uri $uri/ /damrongdham-ssk/index.html;
}

location /damrongdham-ssk/api/ {
    proxy_pass http://localhost:4020/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### คำสั่ง Target B ที่ใช้บ่อย

```bash
# ดู logs
pm2 logs damrongdham-ssk-backend

# Restart backend
pm2 restart damrongdham-ssk-backend

# Update โค้ด
cd damrongdham-ssk
git pull origin main
cd backend && npm install --omit=dev && pm2 restart damrongdham-ssk-backend
cd ../frontend && npm install && npm run build && cp -r dist/* /var/www/html/damrongdham-ssk/

# หยุด backend
pm2 stop damrongdham-ssk-backend

# เข้า MySQL shell
mysql -u damrongdham_user -p damrongdham_db
```

---

## ตรวจสอบหลัง Deploy (ทั้ง 2 Target)

```bash
# 1. Health check
GET /api/health → {"status":"ok","db":"connected"}
# Target B: GET /<subpath>/api/health

# 2. Login ทดสอบ
POST /api/auth/login
{"username":"admin","password":"<set-in-seed>"}

# 3. ตรวจ SLA Cron
docker logs <app-container> | grep "SLA"      # Target A
pm2 logs damrongdham-ssk-backend | grep "SLA"  # Target B
# ต้องเห็น: "SLA check scheduled: daily 08:00 Asia/Bangkok"
```

---

## Environment Variables Reference

| Variable | Required | Description | ตัวอย่าง |
|----------|----------|-------------|---------|
| `NODE_ENV` | ✅ | Environment | `production` |
| `PORT` | ✅ | Backend port | `5001` (Target A) / port ว่างบนเครื่อง (Target B) |
| `DB_HOST` | ✅ | MySQL host | `db` (Target A compose) / `127.0.0.1` (Target B) |
| `DB_PORT` | ✅ | MySQL port | `3306` |
| `DB_USER` | ✅ | MySQL user | `damrongdham_user` |
| `DB_PASSWORD` | ✅ | MySQL password | *(strong password)* |
| `DB_NAME` | ✅ | MySQL database | `damrongdham_db` |
| `JWT_SECRET` | ✅ | JWT signing key | *(64 chars random)* |
| `JWT_EXPIRES_IN` | — | Token expiry | `8h` |
| `CORS_ORIGIN` | — | Allowed origin | `https://domain.go.th` |
| `MYSQL_ROOT_PASSWORD` | ✅ (Target A) | MySQL root pw | *(strong password)* |
| `MYSQL_DATABASE` | ✅ (Target A) | DB name | `damrongdham_db` |
| `MYSQL_USER` | ✅ (Target A) | DB user | `damrongdham_user` |
| `MYSQL_PASSWORD` | ✅ (Target A) | DB password | *(strong password)* |
| `VITE_API_BASE_URL` | — (Target B) | Frontend API base path | `/damrongdham-ssk/api` |
