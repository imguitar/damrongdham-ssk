# 00 — Tech Stack Decision: ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด

> เอกสารฉบับนี้เป็นส่วนหนึ่งของช่วงที่ 0: เตรียมกติกาและบริบท — ยังไม่มีการเขียน Code

---

## 1. Project Name

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **ชื่อโปรเจกต์** | Damrongdham SSK — ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด |
| **ชื่อย่อ** | damrongdham-ssk |
| **Repository** | `damrongdham-ssk` |

---

## 2. Purpose of the System

ระบบ Web Application สำหรับศูนย์ดำรงธรรมจังหวัด เพื่อ:

- รับเรื่องร้องเรียนจากประชาชนและหน่วยงาน
- บริหารจัดการเรื่องร้องเรียน ส่งต่อหน่วยงานที่รับผิดชอบ
- ติดตามสถานะและความคืบหน้าของเรื่องร้องเรียน
- สรุปรายงานและ Dashboard สำหรับผู้บริหาร
- ควบคุม SLA (Service Level Agreement) ของการดำเนินการ
- ให้ประชาชนติดตามสถานะเรื่องร้องเรียนของตนเองได้

---

## 3. Selected Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 18.x |
| **Build Tool** | Vite | 5.x |
| **UI Library** | MUI (Material UI) | 5.x |
| **Routing** | React Router | 6.x |
| **HTTP Client** | Axios | Latest |
| **Backend** | Node.js | 20.x LTS |
| **API Framework** | Express.js | 4.x |
| **Database** | MySQL | 8.x |
| **DB Driver** | mysql2 | Latest |
| **Auth** | JWT (jsonwebtoken) | Latest |
| **Password** | bcrypt | Latest |
| **File Upload** | Multer | Latest |
| **Container** | Docker + Docker Compose (Dev) | Latest |
| **Deploy** | Railway (Single-container Dockerfile) | — |
| **DB Admin** | phpMyAdmin (Dev only) | Latest |
| **Charts** | Recharts | Latest |
| **Excel Export** | exceljs หรือ xlsx | Latest |
| **Cron Jobs** | node-cron | Latest |
| **Date** | Day.js | Latest |

---

## 4. Reason for Each Technology

| Technology | เหตุผลที่เลือก |
|-----------|--------------|
| **React** | Component-based, Ecosystem ใหญ่, เหมาะกับ SPA ที่มีหลาย Role/Page |
| **Vite** | Build เร็วกว่า CRA มาก, Hot Module Replacement ดี, Config ง่าย |
| **MUI** | มี Component สำเร็จรูปครบ (Table, Form, Dialog, Chip), Theme System ดี, เหมาะกับระบบ Enterprise |
| **React Router** | มาตรฐานสำหรับ React SPA Routing, รองรับ Nested Routes + Guards |
| **Axios** | HTTP Client ที่รองรับ Interceptors สำหรับ Token Management |
| **Node.js + Express** | JavaScript ทั้ง Frontend/Backend (ลด context switch), Express เบาและยืดหยุ่น |
| **MySQL 8** | RDBMS ที่เสถียร, รองรับ Foreign Key, Transaction, เหมาะกับข้อมูลที่มี Relationship ซับซ้อน |
| **mysql2** | Promise-based, Connection Pool, Performance ดีกว่า mysql |
| **JWT** | Stateless Authentication, เหมาะกับ REST API |
| **Docker Compose** | จัดการทุก Service (Frontend, Backend, DB, phpMyAdmin) ด้วย Command เดียว, Dev/Prod Environment ตรงกัน |
| **phpMyAdmin** | เครื่องมือดู Database แบบ GUI สะดวกสำหรับ Development |
| **Railway** | PaaS สำหรับ Deploy — จัดการ SSL/Domain/Build ให้, รองรับ Dockerfile + MySQL plugin |
| **Recharts** | React-native chart library, ง่ายกว่า Chart.js สำหรับ React |
| **node-cron** | Scheduled Jobs ง่าย ไม่ต้องติดตั้ง Service เพิ่ม |

---

## 5. Development Environment

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **OS** | macOS / Windows / Linux |
| **Runtime** | Docker Desktop |
| **Container Orchestration** | Docker Compose |
| **Frontend Port** | `http://localhost:5173` |
| **Backend Port** | `http://localhost:5001` |
| **MySQL Port** | `localhost:3307` (host) → `3306` (container) — map เป็น 3307 เพื่อเลี่ยงชนกับ MySQL บน host |
| **phpMyAdmin Port** | `http://localhost:8081` |
| **Hot Reload** | ✅ ทั้ง Frontend (Vite HMR) และ Backend (nodemon) |
| **IDE** | VS Code (แนะนำ) |

### Dev Services

```
┌──────────────────────────────────────────────┐
│          Docker Compose (Dev)                 │
│                                               │
│  frontend:5173  backend:5001  db:3307→3306    │
│  phpmyadmin:8081                              │
│                                               │
│  Network: damrongdham-network                 │
└──────────────────────────────────────────────┘
```

---

## 6. Production Environment

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Platform** | Railway (PaaS) — deploy ผ่าน `railway.toml` + `Dockerfile` |
| **Runtime** | Single Docker image (Multi-stage build) |
| **SSL / Domain** | Railway จัดการให้อัตโนมัติ (HTTPS + subdomain) |
| **Frontend** | Build เป็น Static (`npm run build`) แล้ว Backend serve จาก `./public` |
| **Backend** | Node.js + Express (Port 5001) เป็นทั้ง API และ Static Server |
| **Database** | MySQL 8 (Railway MySQL Plugin หรือ External) |
| **Health Check** | `/api/health` (กำหนดใน `railway.toml`) |
| **phpMyAdmin** | ❌ ไม่ใช้ใน Production |

> **หมายเหตุ:** Production ใช้ **Single-container model** — ไม่ใช้ Nginx Reverse Proxy แยก
> `Dockerfile` (root) ทำ Multi-stage: Stage 1 build frontend → Stage 2 backend serve `dist/` ที่ `./public` + ให้ `/api/*`

### Prod Services (Railway)

```
┌──────────────────────────────────────────────┐
│        Railway (Single Container)             │
│                                               │
│  Dockerfile (multi-stage):                    │
│   1) frontend build → dist/                   │
│   2) backend (node:20) serve:                 │
│        ./public  (static frontend)            │
│        /api/*    (Express API, :5001)         │
│                                               │
│  MySQL 8 (Railway plugin / external)          │
└──────────────────────────────────────────────┘
```

---

## 7. Tools Required

### 7.1 Development Machine

| Tool | Purpose | Required |
|------|---------|:--------:|
| Docker Desktop | Container runtime | ✅ |
| Docker Compose | Multi-container orchestration | ✅ |
| Git | Version control | ✅ |
| VS Code | IDE (แนะนำ) | ⭐ |
| Postman / Thunder Client | API Testing | ⭐ |
| Node.js 18+ | Local development (optional, ถ้าไม่ใช้ Docker) | ❌ |

### 7.2 Production (Railway)

| Tool | Purpose | Required |
|------|---------|:--------:|
| Railway Account | PaaS hosting (Build + Deploy + SSL + Domain) | ✅ |
| `railway.toml` | กำหนด build (Dockerfile) + health check `/api/health` | ✅ |
| Git / GitHub | Source สำหรับ Railway auto-deploy | ✅ |
| MySQL (Railway plugin หรือ External) | ฐานข้อมูล Production | ✅ |

---

## 8. Folder Strategy เบื้องต้น

```
damrongdham-ssk/
├── frontend/              # React + Vite + MUI
│   ├── src/
│   │   ├── api/           # Axios API calls
│   │   ├── components/    # Shared components
│   │   ├── contexts/      # React Context
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── routes/        # Route config
│   │   ├── utils/         # Utilities
│   │   └── theme/         # MUI Theme
│   ├── Dockerfile.dev
│   └── package.json
│
├── backend/               # Node.js + Express
│   ├── src/
│   │   ├── config/        # DB, CORS, Upload config
│   │   ├── middleware/     # Auth, Validate, ErrorHandler
│   │   ├── routes/        # Express routes
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Database queries
│   │   ├── services/      # Business logic
│   │   ├── jobs/          # Scheduled jobs (cron)
│   │   └── utils/         # Helpers
│   ├── uploads/           # File uploads
│   ├── src/server.js      # Backend entry point
│   ├── Dockerfile.dev
│   └── package.json
│
├── db/                    # SQL scripts (mount → /docker-entrypoint-initdb.d)
│   └── init/              # CREATE TABLE + Seed (รันครั้งแรกตอนสร้าง Volume)
│
├── docs/                  # Documentation
│   ├── planning/          # Planning documents
│   ├── testing/           # Test plans
│   └── deployment/        # Deployment guides
│
├── prompt/                # AI Prompt templates
├── .agents/               # Antigravity IDE skills (SKILL.md)
├── docker-compose.yml     # Dev environment (4 services)
├── Dockerfile             # Production (multi-stage, Railway)
├── railway.toml           # Railway deploy config
├── .env.example
├── .gitignore
└── README.md
```

---

## 9. Constraints

| # | ข้อจำกัด |
|---|---------|
| C-1 | ใช้ JavaScript เท่านั้น (ไม่ใช้ TypeScript ใน Phase แรก) |
| C-2 | ไม่ใช้ ORM (Sequelize/Prisma) — ใช้ Raw SQL ผ่าน mysql2 |
| C-3 | ไม่ใช้ State Management ภายนอก (Redux/Zustand) ใน Phase แรก — ใช้ React Context |
| C-4 | File Upload เก็บบน Local Disk (ไม่ใช้ Cloud Storage) |
| C-5 | Notification เป็นระบบภายใน (ไม่มี Email/SMS/LINE) |
| C-6 | ไม่มี Real-time (WebSocket) — ใช้ Polling |
| C-7 | ภาษาไทยเป็นหลัก (ไม่มี i18n) |
| C-8 | Desktop-first (Responsive สำหรับ Tablet, ไม่เน้น Mobile) |

---

## 10. Assumptions

| # | สมมติฐาน |
|---|---------|
| A-1 | Developer มีความรู้ Docker เบื้องต้น |
| A-2 | Development ใช้ Docker Compose เท่านั้น (ไม่ต้องติดตั้ง Node/MySQL บนเครื่อง) |
| A-3 | Production deploy บน Railway (build จาก Dockerfile, ไม่ต้องจัดการ Server เอง) |
| A-4 | ผู้ใช้งานระบบเป็นเจ้าหน้าที่ราชการ (ไม่คุ้นเทคโนโลยีมาก — UI ต้องง่าย) |
| A-5 | จำนวนผู้ใช้งานพร้อมกัน ≤ 50 คน |
| A-6 | จำนวนเรื่องร้องเรียน ≤ 10,000 เรื่องต่อปี |
| A-7 | Database Init Scripts รันครั้งเดียวตอนสร้าง Volume ใหม่ |

---

## 11. Open Questions

| # | คำถาม | ส่งผลต่อ | สถานะ |
|---|-------|---------|-------|
| Q-1 | ชื่อจังหวัดที่ใช้ระบบคือจังหวัดอะไร? | Seed Data (อำเภอ/ตำบล), ชื่อระบบ | ✅ **ศรีสะเกษ** |
| Q-2 | Domain name ของระบบคืออะไร? | CORS, SSL | ✅ ใช้ Railway subdomain (auto), custom domain ภายหลัง |
| Q-3 | Server specification (RAM, CPU, Disk)? | Resource limits | ✅ Railway จัดการ (เริ่ม plan พื้นฐาน) |
| Q-4 | ต้องการ CI/CD (GitHub Actions) หรือไม่? | Deployment automation | ✅ ใช้ Railway auto-deploy จาก GitHub (ยังไม่ต้องมี GH Actions) |
| Q-5 | ต้องการ TypeScript ในอนาคตหรือไม่? | Code structure, Build config | ❓ รอตอบ |
| Q-6 | ต้องการ Email/LINE Notification ในอนาคตหรือไม่? | Notification architecture | ❓ รอตอบ |

---

## 12. Key Decisions

| # | การตัดสินใจ | เหตุผล |
|---|-----------|--------|
| KD-1 | ใช้ **JavaScript** ไม่ใช่ TypeScript | ลด Learning Curve, เร็วกว่าสำหรับทีมขนาดเล็ก, สามารถ Migrate เป็น TS ทีหลังได้ |
| KD-2 | ใช้ **Raw SQL** ไม่ใช่ ORM | ควบคุม Query ได้เต็มที่, Performance ดีกว่า, เหมาะกับ Schema ที่ซับซ้อน |
| KD-3 | ใช้ **React Context** ไม่ใช่ Redux | State ไม่ซับซ้อนมาก (Auth + Notification), ลด Dependency |
| KD-4 | ใช้ **Docker Compose** เป็นหลัก | Dev/Prod Environment ตรงกัน, ติดตั้งง่าย, ไม่ต้องติดตั้ง Node/MySQL |
| KD-5 | **Backend-first** Development | สร้าง API ให้เสร็จก่อน แล้วสร้าง Frontend เชื่อมต่อ |
| KD-6 | ใช้ **Local File Storage** ไม่ใช่ Cloud | ลดความซับซ้อน, เหมาะกับ Phase แรก |
| KD-7 | ใช้ **Polling** ไม่ใช่ WebSocket | ง่ายกว่า, เพียงพอสำหรับ Notification ที่ไม่ต้อง Real-time |
| KD-8 | **เอกสาร Planning ทั้งหมดต้องเสร็จก่อนเริ่ม Implementation** | ป้องกัน Scope Creep, AI ทำงานตรงเป้า |

---

> **ขั้นตอนถัดไป:** สร้าง `docs/planning/00-ai-working-rules.md`
