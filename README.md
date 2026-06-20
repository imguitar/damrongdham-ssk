# ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัดศรีสะเกษ (DCMS)

ระบบรับเรื่องร้องเรียน ติดตาม และรายงานผลของศูนย์ดำรงธรรมจังหวัดศรีสะเกษ
พัฒนาด้วย React + Express + MySQL บน Docker

## Tech Stack

| Layer | เทคโนโลยี |
|-------|-----------|
| Frontend | React 18 + Vite 5 + MUI 5 + React Router 6 |
| Backend | Node.js 20 LTS + Express 4 |
| Database | MySQL 8.0 (utf8mb4) |
| DB Admin | phpMyAdmin |
| Container | Docker Compose |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (รวม Docker Compose v2)
- [Git](https://git-scm.com/)

> ไม่ต้องติดตั้ง Node.js หรือ MySQL บนเครื่อง — ทุกอย่างอยู่ใน Docker

## เริ่มต้นใช้งาน

```bash
# 1. Clone โปรเจกต์
git clone https://github.com/imguitar/damrongdham-ssk.git
cd damrongdham-ssk

# 2. สร้างไฟล์ .env
cp .env.example .env
# แก้ไขค่า password ใน .env ตามต้องการ

# 3. Build และเริ่ม services
docker compose up -d --build

# 4. ตรวจสอบสถานะ
docker compose ps
```

## Port Mapping (Development)

| Service | URL | Host Port |
|---------|-----|-----------|
| Frontend (Vite) | http://localhost:5173 | 5173 |
| Backend API | http://localhost:5001/api | 5001 |
| Health Check | http://localhost:5001/api/health | 5001 |
| MySQL | `mysql -h 127.0.0.1 -P 3307` | 3307 |
| phpMyAdmin | http://localhost:8081 | 8081 |

## คำสั่ง Docker ที่ใช้บ่อย

```bash
# เริ่ม (background)
docker compose up -d --build

# หยุด (เก็บข้อมูล)
docker compose down

# หยุด + ลบ Volume (ข้อมูล DB หาย)
docker compose down -v

# ดู logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend

# เข้า shell
docker compose exec backend sh
docker compose exec db mysql -u root -p

# สถานะ services
docker compose ps
```

## โครงสร้างโปรเจกต์

```
damrongdham-ssk/
├── frontend/               # React + Vite + MUI
│   ├── src/
│   │   ├── api/            # Axios instances + API functions
│   │   ├── components/     # Shared UI components
│   │   ├── contexts/       # React Context (Auth, Notification)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── routes/         # Route configuration
│   │   ├── theme/          # MUI Theme
│   │   └── utils/          # Constants, formatters
│   └── Dockerfile.dev
│
├── backend/                # Node.js + Express
│   ├── src/
│   │   ├── app.js          # Express app setup
│   │   ├── server.js       # Entry point
│   │   ├── config/         # DB, CORS, Upload config
│   │   ├── middleware/     # Auth, Validate, ErrorHandler
│   │   ├── routes/         # Express routes
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # SQL query layer
│   │   ├── services/       # Business logic
│   │   ├── jobs/           # Scheduled jobs (cron)
│   │   └── utils/          # Helper functions
│   ├── uploads/            # File upload storage (gitignored)
│   └── Dockerfile.dev
│
├── db/
│   └── init/
│       └── 01-init.sql     # SQL schema + seed data (Phase 2)
│
├── nginx/                  # On-premise prod เท่านั้น
├── Dockerfile              # Production multi-stage image
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # On-premise production
├── railway.toml            # Railway deployment config
└── .env.example            # Environment variables template
```

## Environment Variables

ดู [`.env.example`](.env.example) สำหรับ root (Docker Compose)
ดู [`backend/.env.example`](backend/.env.example) สำหรับ backend standalone
ดู [`frontend/.env.example`](frontend/.env.example) สำหรับ frontend

## Implementation Plan

ดู [`docs/planning/10-implementation-plan.md`](docs/planning/10-implementation-plan.md) สำหรับแผนการพัฒนาทั้ง 16 Phases

## สถานะการพัฒนา

| Phase | ชื่อ | สถานะ |
|:-----:|------|:-----:|
| 0 | Requirement & Architecture | ✅ |
| 1 | Project Setup | ✅ |
| 2 | Database Schema & Seed Data | ✅ |
| 3 | Backend Core & MySQL Connection | ✅ |
| 4 | Authentication & Authorization | ✅ |
| 5 | Complaint CRUD API | ✅ |
| 6 | Assignment & Status Workflow API | ✅ |
| 7 | Dashboard and Report API | ✅ |
| 8 | Frontend Layout and Routing | ✅ |
| 9 | Frontend Authentication | ✅ |
| 10 | Complaint Management UI | ✅ |
| 11–15 | ... | ⏳ |

## API Endpoints (Phase 7 เพิ่ม)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Summary Cards (total, status counts, overdue) |
| GET | `/api/dashboard/by-status` | สถิติตามสถานะสำหรับ Chart |
| GET | `/api/dashboard/by-category` | สถิติตามประเภทเรื่อง |
| GET | `/api/dashboard/by-agency` | สถิติตามหน่วยงาน |
| GET | `/api/dashboard/by-district` | สถิติตามอำเภอ |
| GET | `/api/dashboard/trend` | แนวโน้มรายเดือน (12 เดือน) |
| GET | `/api/dashboard/overdue` | รายการเรื่องเกินกำหนด |
| GET | `/api/dashboard/near-due` | รายการเรื่องใกล้ครบกำหนด (3 วัน) |
| GET | `/api/reports/monthly` | รายงานสรุปรายเดือน |
| GET | `/api/reports/by-category` | รายงานตามประเภทเรื่อง |
| GET | `/api/reports/by-agency` | รายงานตามหน่วยงาน |
| GET | `/api/reports/overdue` | รายงานเรื่องเกินกำหนด (paginated) |
| GET | `/api/reports/export/excel` | Export Excel (`?type=monthly\|by-category\|by-agency\|overdue`) |
| GET | `/api/audit-logs` | ดู Audit Log (admin เท่านั้น) |
| GET | `/api/audit-logs/:id` | ดูรายละเอียด Audit Log |

## API Endpoints (Phase 6 เพิ่ม)

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/complaints/:id/screen` | เริ่มคัดกรอง (T-01/T-12) |
| PATCH | `/api/complaints/:id/reject` | ปฏิเสธเรื่อง (T-03) |
| POST | `/api/complaints/:id/assign` | ส่งต่อหน่วยงาน (T-02) |
| PATCH | `/api/complaints/:id/review` | เริ่มตรวจผล (T-09) |
| PATCH | `/api/complaints/:id/close` | ปิดเรื่อง (T-10) |
| PATCH | `/api/complaints/:id/send-back` | ส่งกลับแก้ไข (T-11) |
| GET | `/api/complaints/:id/assignments` | ดูรายการมอบหมาย |
| POST | `/api/complaints/:id/updates` | อัปเดตความคืบหน้า |
| PATCH | `/api/assignments/:id/accept` | หน่วยงานรับเรื่อง (T-04) |
| PATCH | `/api/assignments/:id/return` | หน่วยงานส่งคืน (T-05/T-07) |
| PATCH | `/api/assignments/:id/start` | เริ่มดำเนินการ (T-06) |
| PATCH | `/api/assignments/:id/resolve` | ส่งผลดำเนินการ (T-08) |
| CRUD | `/api/agencies` | จัดการหน่วยงาน |
| CRUD | `/api/users` | จัดการผู้ใช้ |
