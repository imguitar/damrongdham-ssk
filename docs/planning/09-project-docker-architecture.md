# 09 — Project Structure & Docker Architecture: ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด

> เอกสารฉบับนี้เป็นส่วนหนึ่งของขั้นตอน Planning Only — ยังไม่มีการเขียน Code
> อ้างอิงจาก: `01` ~ `08` Planning Documents

---

## 1. Project Folder Structure

```
damrongdham-ssk/
│
├── frontend/                          # React + Vite + MUI
│   ├── public/
│   │   ├── favicon.ico
│   │   └── logo.png
│   ├── src/
│   │   ├── api/                       # Axios instances + API functions
│   │   │   ├── axiosInstance.js        # Axios config (baseURL, interceptors)
│   │   │   ├── authApi.js             # Auth API calls
│   │   │   ├── complaintApi.js        # Complaint API calls
│   │   │   ├── userApi.js             # User API calls
│   │   │   ├── agencyApi.js           # Agency API calls
│   │   │   ├── categoryApi.js         # Category API calls
│   │   │   ├── dashboardApi.js        # Dashboard API calls
│   │   │   ├── reportApi.js           # Report API calls
│   │   │   ├── notificationApi.js     # Notification API calls
│   │   │   └── masterDataApi.js       # Channels, Districts API calls
│   │   │
│   │   ├── components/                # Shared/Reusable components
│   │   │   ├── layout/                # Layout components
│   │   │   │   ├── AdminLayout.jsx    # Layout หลัก (Sidebar + Topbar)
│   │   │   │   ├── PublicLayout.jsx   # Layout สำหรับหน้า Public
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Topbar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   ├── common/                # UI Components ทั่วไป
│   │   │   │   ├── StatusChip.jsx     # Chip แสดงสถานะ
│   │   │   │   ├── PriorityChip.jsx   # Chip แสดง Priority
│   │   │   │   ├── DataTable.jsx      # ตาราง MUI พร้อม Sort/Pagination
│   │   │   │   ├── ConfirmDialog.jsx  # Dialog ยืนยันการกระทำ
│   │   │   │   ├── FileUpload.jsx     # Component อัปโหลดไฟล์
│   │   │   │   ├── FilterBar.jsx      # แถบ Filter
│   │   │   │   ├── SummaryCard.jsx    # Card แสดงตัวเลขสรุป
│   │   │   │   ├── Timeline.jsx       # Timeline เหตุการณ์
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   ├── ErrorAlert.jsx
│   │   │   │   └── NotificationBadge.jsx
│   │   │   └── charts/               # Chart components
│   │   │       ├── LineChart.jsx
│   │   │       ├── PieChart.jsx
│   │   │       ├── BarChart.jsx
│   │   │       └── DonutChart.jsx
│   │   │
│   │   ├── contexts/                  # React Context providers
│   │   │   ├── AuthContext.jsx        # Authentication state
│   │   │   └── NotificationContext.jsx # Notification state
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useAuth.js             # Auth hook
│   │   │   ├── useNotification.js     # Notification hook
│   │   │   └── usePagination.js       # Pagination hook
│   │   │
│   │   ├── pages/                     # Page components (1 file = 1 route)
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── ChangePasswordPage.jsx
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.jsx
│   │   │   ├── complaints/
│   │   │   │   ├── ComplaintListPage.jsx
│   │   │   │   ├── ComplaintCreatePage.jsx
│   │   │   │   ├── ComplaintDetailPage.jsx
│   │   │   │   └── ComplaintEditPage.jsx
│   │   │   ├── reports/
│   │   │   │   └── ReportPage.jsx
│   │   │   ├── notifications/
│   │   │   │   └── NotificationPage.jsx
│   │   │   ├── users/
│   │   │   │   ├── UserListPage.jsx
│   │   │   │   ├── UserCreatePage.jsx
│   │   │   │   └── UserEditPage.jsx
│   │   │   ├── agencies/
│   │   │   │   └── AgencyListPage.jsx
│   │   │   ├── settings/
│   │   │   │   ├── CategorySettingPage.jsx
│   │   │   │   ├── ChannelSettingPage.jsx
│   │   │   │   └── DistrictSettingPage.jsx
│   │   │   ├── audit/
│   │   │   │   └── AuditLogPage.jsx
│   │   │   ├── public/
│   │   │   │   ├── PublicComplaintPage.jsx
│   │   │   │   ├── PublicTrackingPage.jsx
│   │   │   │   └── PublicSuccessPage.jsx
│   │   │   ├── profile/
│   │   │   │   └── ProfilePage.jsx
│   │   │   └── errors/
│   │   │       ├── NotFoundPage.jsx
│   │   │       └── ForbiddenPage.jsx
│   │   │
│   │   ├── routes/                    # Route configuration
│   │   │   ├── AppRoutes.jsx          # Route definitions
│   │   │   └── ProtectedRoute.jsx     # Route guard (auth + role check)
│   │   │
│   │   ├── utils/                     # Utility functions
│   │   │   ├── constants.js           # Status, Priority, Role constants
│   │   │   ├── formatters.js          # Date, number formatters
│   │   │   └── validators.js          # Validation functions
│   │   │
│   │   ├── theme/                     # MUI Theme configuration
│   │   │   └── theme.js               # Custom MUI theme
│   │   │
│   │   ├── App.jsx                    # Main App component
│   │   ├── main.jsx                   # Entry point
│   │   └── index.css                  # Global styles
│   │
│   ├── Dockerfile.dev                 # Docker for development
│   ├── Dockerfile                     # Docker for production
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── backend/                           # Node.js + Express
│   ├── src/
│   │   ├── config/                    # Configuration files
│   │   │   ├── database.js            # MySQL connection pool
│   │   │   ├── cors.js                # CORS configuration
│   │   │   └── upload.js              # Multer file upload config
│   │   │
│   │   ├── middleware/                # Express middleware
│   │   │   ├── auth.js                # JWT authentication
│   │   │   ├── authorize.js           # Role-based authorization
│   │   │   ├── validate.js            # Request validation
│   │   │   ├── errorHandler.js        # Global error handler
│   │   │   └── auditLog.js            # Audit log middleware
│   │   │
│   │   ├── routes/                    # Express route definitions
│   │   │   ├── index.js               # Route aggregator
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── agencyRoutes.js
│   │   │   ├── categoryRoutes.js
│   │   │   ├── channelRoutes.js
│   │   │   ├── districtRoutes.js
│   │   │   ├── complaintRoutes.js
│   │   │   ├── assignmentRoutes.js
│   │   │   ├── attachmentRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── reportRoutes.js
│   │   │   ├── auditLogRoutes.js
│   │   │   └── publicRoutes.js
│   │   │
│   │   ├── controllers/              # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── agencyController.js
│   │   │   ├── categoryController.js
│   │   │   ├── channelController.js
│   │   │   ├── districtController.js
│   │   │   ├── complaintController.js
│   │   │   ├── assignmentController.js
│   │   │   ├── attachmentController.js
│   │   │   ├── notificationController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── reportController.js
│   │   │   ├── auditLogController.js
│   │   │   └── publicController.js
│   │   │
│   │   ├── models/                    # Database query layer
│   │   │   ├── userModel.js
│   │   │   ├── roleModel.js
│   │   │   ├── agencyModel.js
│   │   │   ├── categoryModel.js
│   │   │   ├── channelModel.js
│   │   │   ├── districtModel.js
│   │   │   ├── complaintModel.js
│   │   │   ├── assignmentModel.js
│   │   │   ├── attachmentModel.js
│   │   │   ├── notificationModel.js
│   │   │   └── auditLogModel.js
│   │   │
│   │   ├── services/                  # Business logic layer
│   │   │   ├── authService.js
│   │   │   ├── complaintService.js    # Complaint workflow logic
│   │   │   ├── notificationService.js # Notification creation logic
│   │   │   ├── slaService.js          # SLA calculation + overdue check
│   │   │   └── reportService.js       # Report generation + Excel export
│   │   │
│   │   ├── jobs/                      # Scheduled jobs
│   │   │   ├── index.js               # Job scheduler setup (node-cron)
│   │   │   ├── overdueCheck.js        # Daily overdue check job
│   │   │   └── nearDueCheck.js        # Daily near-due check job
│   │   │
│   │   ├── utils/                     # Utility functions
│   │   │   ├── response.js            # Standard response helper
│   │   │   ├── pagination.js          # Pagination helper
│   │   │   └── complaintNumber.js     # Complaint number generator
│   │   │
│   │   └── app.js                     # Express app setup
│   │
│   ├── uploads/                       # File upload directory (runtime)
│   │   └── .gitkeep
│   │
│   ├── src/server.js                  # Entry point (start server)
│   ├── Dockerfile.dev                 # Docker for development
│   ├── package.json
│   └── .env.example
│
├── db/                                # Database scripts (mount → initdb.d)
│   └── init/                          # Initial setup scripts (run once)
│       └── 01-init.sql                # CREATE TABLE + Seed data
│
├── docs/                              # Documentation
│   ├── planning/                      # Planning documents (01-10)
│   ├── testing/                       # Test plans and results
│   └── deployment/                    # Deployment guides
│
├── prompt/                            # AI Prompt templates
│   ├── 0_Setup/
│   ├── 1_Planing/
│   ├── 2_Phase/
│   └── 3_Test-Deploy/
│
├── nginx/                             # Nginx config (on-premise prod เท่านั้น)
│   ├── default.conf                   # Reverse proxy → app:5001 + SSL
│   └── ssl/                           # cert.pem / key.pem (gitignored)
│
├── .agents/                           # Antigravity IDE skills
│   └── skills/damrongdham-dev/SKILL.md  # AI working rules
│
├── docker-compose.yml                 # Dev environment (4 services)
├── docker-compose.prod.yml            # On-premise prod (app + db + nginx)
├── Dockerfile                         # Production image (multi-stage) — ใช้ทั้ง Railway + on-prem
├── railway.toml                       # Railway deploy config
├── .env                               # Environment variables (dev)
├── .env.example                       # Dev env template
├── .env.production.example            # On-premise prod env template
├── .gitignore
└── README.md
```

> **หมายเหตุโครงสร้างจริง:** โฟลเดอร์ DB ใช้ชื่อ `db/` (ไม่ใช่ `database/`) และไฟล์ init รวมเป็น `01-init.sql` ไฟล์เดียว
>
> **Deployment รองรับ 2 targets** (ใช้ **image แอปเดียวกัน** จาก root `Dockerfile`):
> 1. **Railway (Primary)** — `Dockerfile` + `railway.toml` แบบ single-container, Railway จัดการ SSL/Domain
> 2. **On-premise / Ubuntu (Alternative)** — `docker-compose.prod.yml` รัน app (image เดียวกัน) + MySQL + **Nginx** (`nginx/default.conf`) ทำ SSL/reverse proxy บนเครื่อง Server ของหน่วยงานเอง

---

## 2. Folder Description

### 2.1 Frontend (`frontend/`)

| Folder | วัตถุประสงค์ |
|--------|------------|
| `src/api/` | รวม Axios instance และ API functions ทุก Module แยกเป็นไฟล์ |
| `src/components/layout/` | Layout หลัก (AdminLayout, PublicLayout, Sidebar, Topbar) |
| `src/components/common/` | UI Components ที่ใช้ร่วมกันหลายหน้า |
| `src/components/charts/` | Chart components สำหรับ Dashboard |
| `src/contexts/` | React Context สำหรับ Global State (Auth, Notification) |
| `src/hooks/` | Custom Hooks ที่ใช้ร่วมกัน |
| `src/pages/` | Page Components แยกตาม Feature (1 folder = 1 module) |
| `src/routes/` | Route configuration + Protected Route guard |
| `src/utils/` | Constants, Formatters, Validators |
| `src/theme/` | MUI Theme customization |

### 2.2 Backend (`backend/`)

| Folder | วัตถุประสงค์ |
|--------|------------|
| `src/config/` | Database connection, CORS, File upload config |
| `src/middleware/` | Auth, Authorization, Validation, Error handling, Audit |
| `src/routes/` | Express Route definitions (URL → Controller mapping) |
| `src/controllers/` | Request handlers (รับ Request → เรียก Service → ส่ง Response) |
| `src/models/` | Database query layer (SQL queries) |
| `src/services/` | Business logic layer (Workflow, SLA, Notification logic) |
| `src/jobs/` | Scheduled jobs (Cron) สำหรับ Overdue/Near-due check |
| `src/utils/` | Helper functions (Response format, Pagination, Number generator) |
| `uploads/` | เก็บไฟล์แนบที่อัปโหลด (mount เป็น Docker Volume) |

### 2.3 Database (`db/`)

| Folder | วัตถุประสงค์ |
|--------|------------|
| `init/` | SQL scripts สำหรับสร้างตารางและ Seed Data — mount เข้า `/docker-entrypoint-initdb.d` (รันครั้งแรกตอนสร้าง Volume) ปัจจุบันคือ `01-init.sql` |

### 2.4 Production — 2 Targets (image แอปเดียวกัน)

| ไฟล์ | ใช้กับ | วัตถุประสงค์ |
|------|--------|------------|
| `Dockerfile` (root) | **ทั้งคู่** | Multi-stage: build frontend → backend serve `dist/` ที่ `./public` + `/api/*` (artifact เดียว) |
| `railway.toml` | Railway | build (Dockerfile) + health check `/api/health` + restart policy |
| `docker-compose.prod.yml` | On-premise | รัน `app` (image เดียวกัน) + `db` (MySQL) + `nginx` |
| `nginx/default.conf` | On-premise | Reverse proxy ทุก request → `app:5001`, SSL termination, `client_max_body_size 10M` |
| `.env.production` | On-premise | env vars (DB, JWT) — บน Railway ตั้งใน Dashboard แทน |

> **Railway:** Express serve static + API เอง, Railway จัดการ SSL/Domain — **ไม่ใช้ Nginx**
> **On-premise:** Nginx อยู่หน้าสุด (SSL + proxy) → app (Express ตัวเดิม) → MySQL container; ไฟล์แนบเก็บใน Docker volume `app_uploads`

---

## 3. Architecture Pattern

### 3.1 Backend: 3-Layer Architecture

```
Request → Route → Controller → Service → Model → Database
                                  ↑
                             Middleware
                        (Auth, Validate, Audit)
```

| Layer | หน้าที่ | ตัวอย่าง |
|-------|--------|---------|
| **Route** | กำหนด URL + HTTP Method + Middleware | `router.get('/complaints', auth, authorize(['officer']), controller.list)` |
| **Controller** | รับ Request, เรียก Service, ส่ง Response | Parse query params → call service → send JSON |
| **Service** | Business Logic, Workflow Logic | ตรวจ Status Transition, คำนวณ SLA, สร้าง Notification |
| **Model** | SQL Query, Database Access | `SELECT * FROM complaints WHERE ...` |

### 3.2 Frontend: Page-based Structure

```
App → Router → Layout → Page → Components
                  ↑                  ↑
              Context            API Layer
         (Auth, Notification)    (Axios)
```

---

## 4. Docker Architecture

### 4.1 Development Environment

```
┌─────────────────────────────────────────────────┐
│           Docker Compose (Development)           │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ frontend │  │ backend  │  │    db     │       │
│  │ (Vite)   │  │ (Express)│  │  (MySQL)  │       │
│  │ :5173    │  │ :5001    │  │3307→3306  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │             │
│  ┌────┴──────────────┴──────────────┴──────┐     │
│  │           damrongdham-network            │     │
│  └──────────────────────────────────────────┘     │
│                                                  │
│  ┌──────────┐                                    │
│  │phpmyadmin│                                    │
│  │ :8081    │                                    │
│  └──────────┘                                    │
└─────────────────────────────────────────────────┘
```

### 4.2 Production Environment — 2 Targets

**Target A: Railway (Primary)** — single container, Railway จัดการ SSL/Domain

```
┌─────────────────────────────────────────────────┐
│              Railway Platform                    │
│   (HTTPS + Domain + Build managed by Railway)    │
│                                                  │
│  ┌────────────────────────────────────────┐     │
│  │   App Container (Dockerfile multi-stage)│     │
│  │   Express (node:20) @ :5001              │     │
│  │     ├─ /        → ./public (React dist)  │     │
│  │     └─ /api/*   → REST API               │     │
│  └───────────────────┬──────────────────────┘     │
│              ┌────────┴─────────┐                 │
│              │  MySQL 8 (plugin) │                 │
│              └───────────────────┘                 │
└─────────────────────────────────────────────────┘
```

**Target B: On-premise / Ubuntu (Alternative)** — `docker-compose.prod.yml`

```
┌──────────────────────────────────────────────────────┐
│        Ubuntu Server (Docker Compose)                 │
│                                                        │
│  ┌──────────┐   :80/:443                               │
│  │  nginx   │ ← SSL termination + reverse proxy        │
│  └────┬─────┘                                          │
│       │ proxy_pass → app:5001                          │
│       ▼                                                │
│  ┌────────────────────────┐   ┌──────────────┐         │
│  │ app (Dockerfile เดิม)   │──►│  MySQL 8      │         │
│  │ Express serve / + /api  │   │ (container)   │         │
│  │ volume: app_uploads     │   │ vol: mysql    │         │
│  └────────────────────────┘   └──────────────┘         │
│            damrongdham-network (internal)              │
└──────────────────────────────────────────────────────┘
```

> ทั้งสอง target รัน **artifact เดียวกัน** (root `Dockerfile`) — ต่างกันแค่ชั้นห่อ (Railway managed vs Nginx+Compose)

---

## 5. Docker Services

### 5.1 Development (`docker-compose.yml`)

| Service | Image | Container Port | Host Port | Description |
|---------|-------|:--------------:|:---------:|-------------|
| `frontend` | Custom (Vite dev) | 5173 | 5173 | React + Vite dev server |
| `backend` | Custom (Node.js 20) | 5001 | 5001 | Express API server |
| `db` | `mysql:8.0` | 3306 | 3307 | MySQL database (host 3307 เลี่ยงชน) |
| `phpmyadmin` | `phpmyadmin:latest` | 80 | 8081 | Database admin tool |

### 5.2 Production — Target A: Railway (`Dockerfile` + `railway.toml`)

| Stage / Service | Image | Description |
|-----------------|-------|-------------|
| Build stage | `node:20-alpine` | `npm run build` ของ frontend → `dist/` |
| Runtime | `node:20-alpine` | Backend serve `./public` + `/api/*` ที่ `:5001` |
| Database | MySQL 8 (Railway plugin / external) | เชื่อมผ่าน env (`DB_HOST` ฯลฯ) |

Railway build จาก `Dockerfile` โดยตรง — ไม่ใช้ compose/nginx

### 5.3 Production — Target B: On-premise (`docker-compose.prod.yml`)

| Service | Image | Host Port | Description |
|---------|-------|:---------:|-------------|
| `nginx` | `nginx:alpine` | 80, 443 | Reverse proxy + SSL termination → `app:5001` |
| `app` | build จาก root `Dockerfile` | — (expose 5001) | Express serve frontend + `/api` (image เดียวกับ Railway) |
| `db` | `mysql:8.0` | — (internal) | MySQL, init จาก `db/init`, volume `mysql_data_prod` |

Volumes: `app_uploads` (ไฟล์แนบถาวร), `mysql_data_prod` (ข้อมูล DB)
รัน: `docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build`

---

## 6. Docker Network

| Network | Type | Purpose |
|---------|------|---------|
| `damrongdham-network` | bridge | เชื่อมต่อทุก Container ภายในกัน |

**Container Communication:**

| From | To | ใช้ Hostname | Port |
|------|----|-------------|------|
| `backend` | `db` | `db` | 3306 |
| `frontend` (browser) | `backend` | `localhost:5001` (dev) / `/api` (prod) | 5001 |
| `phpmyadmin` | `db` | `db` | 3306 |

> **Railway:** Railway route traffic เข้า container เดียว (Express ที่ :5001) — ไม่มี Nginx
> **On-premise:** `nginx` → `app:5001` → `db:3306` ทั้งหมดอยู่ใน `damrongdham-network` (internal), เปิด host เฉพาะ 80/443 ที่ nginx

---

## 7. Docker Volumes

| Volume | Mount Point | Purpose |
|--------|------------|---------|
| `mysql-data` | `/var/lib/mysql` | Persist MySQL data (ไม่หายเมื่อ restart) |
| `./db/init` | `/docker-entrypoint-initdb.d` | Auto-run SQL scripts on first start |
| `./backend/uploads` | `/app/uploads` | File upload storage |
| `./backend/src` | `/app/src` | Hot reload (dev only) |
| `./frontend/src` | `/app/src` | Hot reload (dev only) |

---

## 8. Environment Variables

### 8.1 Backend (`backend/.env`)

| Variable | Description | Dev Value | Prod Value |
|----------|-------------|-----------|------------|
| `NODE_ENV` | Environment | `development` | `production` |
| `PORT` | Backend port | `5001` | `5001` |
| `DB_HOST` | MySQL hostname | `db` | `db` |
| `DB_PORT` | MySQL port | `3306` | `3306` |
| `DB_USER` | MySQL username | `damrongdham_user` | `damrongdham_user` |
| `DB_PASSWORD` | MySQL password | `password123` | `(strong password)` |
| `DB_NAME` | Database name | `damrongdham_db` | `damrongdham_db` |
| `JWT_SECRET` | JWT signing key | `dev-secret-key-change-in-production` | `(random 64 chars)` |
| `JWT_EXPIRES_IN` | Token expiry | `8h` | `8h` |
| `UPLOAD_DIR` | Upload path | `./uploads` | `/app/uploads` |
| `UPLOAD_MAX_SIZE` | Max file size (bytes) | `10485760` | `10485760` |
| `CORS_ORIGIN` | Allowed origin | `http://localhost:5173` | `https://{domain}` |

### 8.2 Frontend (`frontend/.env`)

| Variable | Description | Dev Value | Prod Value |
|----------|-------------|-----------|------------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5001/api` | `/api` |
| `VITE_APP_TITLE` | App title | `ศูนย์ดำรงธรรม (Dev)` | `ศูนย์ดำรงธรรมจังหวัด` |

### 8.3 MySQL (`docker-compose.yml`)

| Variable | Description | Value |
|----------|-------------|-------|
| `MYSQL_ROOT_PASSWORD` | Root password | `root_password` |
| `MYSQL_DATABASE` | Database name | `damrongdham_db` |
| `MYSQL_USER` | App user | `damrongdham_user` |
| `MYSQL_PASSWORD` | App password | `password123` |

### 8.4 phpMyAdmin (`docker-compose.yml`)

| Variable | Description | Value |
|----------|-------------|-------|
| `PMA_HOST` | MySQL host | `db` |
| `PMA_PORT` | MySQL port | `3306` |

---

## 9. Docker Compose Configuration (Design)

### 9.1 Development (`docker-compose.yml`)

```yaml
# Design only — ยังไม่ใช่ Code จริง
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports: ["5173:5173"]
    volumes:
      - ./frontend/src:/app/src        # Hot reload
      - /app/node_modules              # Exclude node_modules
    environment:
      - VITE_API_BASE_URL=http://localhost:5001/api
    depends_on: [backend]

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports: ["5001:5001"]
    volumes:
      - ./backend/src:/app/src          # Hot reload
      - ./backend/uploads:/app/uploads  # File uploads
      - /app/node_modules
    env_file: ./backend/.env
    depends_on:
      db:
        condition: service_healthy

  db:
    image: mysql:8.0
    ports: ["3307:3306"]   # host 3307 เลี่ยงชนกับ MySQL บนเครื่อง
    volumes:
      - mysql-data:/var/lib/mysql
      - ./db/init:/docker-entrypoint-initdb.d
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: damrongdham_db
      MYSQL_USER: damrongdham_user
      MYSQL_PASSWORD: password123
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  phpmyadmin:
    image: phpmyadmin/phpmyadmin:latest
    ports: ["8081:80"]
    environment:
      PMA_HOST: db
      PMA_PORT: 3306
    depends_on: [db]

volumes:
  mysql-data:

networks:
  default:
    name: damrongdham-network
```

### 9.2 Production — Target A: Railway (`Dockerfile` + `railway.toml`)

Railway build จาก `Dockerfile` (root) โดยตรง (ไม่ใช้ compose):

```dockerfile
# Dockerfile (root) — Production multi-stage
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Backend + serve frontend
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ .
COPY --from=frontend-build /app/frontend/dist ./public
EXPOSE 5001
CMD ["node", "src/server.js"]
```

```toml
# railway.toml
[build]
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### 9.3 Production — Target B: On-premise (`docker-compose.prod.yml`)

ใช้ **image แอปเดียวกัน** (root `Dockerfile`) แต่เพิ่ม Nginx + MySQL container:

```yaml
services:
  app:                       # build จาก root Dockerfile (เหมือน Railway)
    build: { context: ., dockerfile: Dockerfile }
    environment: [NODE_ENV=production, PORT=5001, DB_HOST=db, "DB_PORT=3306", ...]
    volumes: ["app_uploads:/app/uploads"]   # ไฟล์แนบถาวร
    depends_on: { db: { condition: service_healthy } }
    expose: ["5001"]                         # ไม่เปิด host port

  db:                        # MySQL internal only
    image: mysql:8.0
    volumes: ["mysql_data_prod:/var/lib/mysql", "./db/init:/docker-entrypoint-initdb.d"]

  nginx:                     # SSL + reverse proxy → app:5001
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: ["./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro", "./nginx/ssl:/etc/nginx/ssl:ro"]
    depends_on: [app]

volumes: { mysql_data_prod: {}, app_uploads: {} }
```

รัน: `docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build`
(ดูไฟล์เต็มที่ root: `docker-compose.prod.yml` + `nginx/default.conf`)

> Backend ต้อง `express.static('public')` เพื่อ serve frontend และมี fallback ไป `index.html` สำหรับ SPA routing
> MySQL ใช้ Railway MySQL plugin (หรือ external) เชื่อมผ่าน env vars

---

## 10. SPA + Static Serving (Production)

Express serve frontend ที่ build แล้วจาก `./public` (ไม่ใช้ Nginx):

```js
// backend/src/app.js (production)
app.use(express.static(path.join(__dirname, '../public')));
// API routes อยู่ใต้ /api/*
// SPA fallback: ทุก path ที่ไม่ใช่ /api ส่ง index.html
app.get(/^\/(?!api).*/, (req, res) =>
  res.sendFile(path.join(__dirname, '../public/index.html'))
);
```

---

## 11. Dockerfile Designs

### 11.1 Frontend — Development (`frontend/Dockerfile.dev`)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### 11.2 Backend — Development (`backend/Dockerfile.dev`)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5001
CMD ["npx", "nodemon", "src/server.js"]
```

### 11.3 Production — Single `Dockerfile` (root)

Production ใช้ Dockerfile เดียวแบบ multi-stage (ดูฉบับเต็มใน §9.2):
Stage 1 build frontend → Stage 2 (`node:20-alpine`) backend serve `dist/` ที่ `./public` + `/api/*`
**ไม่มี Frontend/Backend Dockerfile แยกสำหรับ production** — แอปทั้งหมดอยู่ใน image เดียว
(บน on-premise มี Nginx เป็น service แยกใน `docker-compose.prod.yml` แต่ image ของแอปเองไม่ได้ฝัง Nginx)

---

## 12. CORS Configuration

| Environment | Frontend Origin | Backend CORS Setting |
|-------------|----------------|---------------------|
| Development | `http://localhost:5173` | `cors({ origin: 'http://localhost:5173' })` |
| Production | Railway domain (frontend served same-origin) | `cors({ origin: process.env.CORS_ORIGIN })` — same-origin จึงแทบไม่ต้องใช้ CORS |

**CORS Rules:**
- อนุญาตเฉพาะ Origin ที่กำหนดใน `CORS_ORIGIN`
- อนุญาต Methods: `GET, POST, PUT, PATCH, DELETE`
- อนุญาต Headers: `Content-Type, Authorization`
- Credentials: `true` (สำหรับ Cookies/Auth)

---

## 13. Database Connection

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Library** | `mysql2` (Promise-based) |
| **Connection** | Connection Pool (ไม่ใช่ Single Connection) |
| **Pool Size** | `connectionLimit: 10` (Dev), `connectionLimit: 20` (Prod) |
| **Charset** | `utf8mb4` |
| **Timezone** | `+07:00` (Thailand) |
| **Host** | `db` (Docker Container Name) |
| **Retry** | Backend ต้อง Retry Connection ถ้า MySQL ยังไม่พร้อม |

---

## 14. File Upload Configuration

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Library** | `multer` |
| **Storage** | Local Disk (`/app/uploads/`) |
| **Max Size** | 10 MB per file |
| **Allowed Types** | `jpg, jpeg, png, pdf, doc, docx` |
| **File Naming** | `{timestamp}-{random}.{ext}` |
| **Directory Structure** | `/uploads/{year}/{month}/` |
| **Volume** | Docker Volume mount → Persist data |
| **Serve Files** | Backend serve ผ่าน Express Static (`express.static`) |

---

## 15. Development Workflow Commands

| Command | Description |
|---------|-------------|
| `docker compose up -d` | เริ่มทุก Service |
| `docker compose up -d --build` | Build ใหม่ + เริ่ม |
| `docker compose down` | หยุดทุก Service |
| `docker compose logs -f backend` | ดู Log ของ Backend |
| `docker compose logs -f frontend` | ดู Log ของ Frontend |
| `docker compose exec backend sh` | เข้า Shell ของ Backend Container |
| `docker compose exec db mysql -u root -p` | เข้า MySQL CLI |
| `docker compose down -v` | หยุด + ลบ Volume (⚠️ ข้อมูลหาย) |

---

## 16. Port Summary

| Port | Service | Dev (Host) | Prod |
|------|---------|:---:|:----:|
| 5173 | Frontend Vite | ✅ | — (build เป็น static) |
| 5001 | Backend API + Static | ✅ | Railway expose / on-prem internal (ผ่าน nginx) |
| 3307 → 3306 | MySQL | ✅ | internal ทั้งสอง target |
| 8081 → 80 | phpMyAdmin | ✅ | ❌ |
| 80 / 443 | Nginx (on-premise) | — | ✅ on-prem / Railway auto |

---

## 17. Security Considerations

| # | ข้อพิจารณา | Dev | Prod |
|---|-----------|:---:|:----:|
| S-1 | MySQL ไม่เปิด Host Port | ❌ เปิด (สะดวก) | ✅ ปิด |
| S-2 | phpMyAdmin ไม่เปิดใน Prod | ❌ เปิด | ✅ ปิด |
| S-3 | ใช้ HTTPS | ❌ | ✅ |
| S-4 | CORS จำกัด Origin | ⚠️ localhost | ✅ domain จริง |
| S-5 | JWT Secret ใช้ค่าปลอดภัย | ⚠️ dev key | ✅ random 64 chars |
| S-6 | .env ไม่ Commit | ✅ .gitignore | ✅ .gitignore |

---

## 18. .gitignore Essentials

```
# Dependencies
node_modules/

# Environment
.env
.env.production
.env.db.production

# Build
frontend/dist/
backend/dist/

# Uploads
backend/uploads/*
!backend/uploads/.gitkeep

# Docker
mysql-data/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

---

## 19. Assumptions

| # | สมมติฐาน |
|---|---------|
| A-1 | Development ใช้ Docker Compose เท่านั้น (ไม่ติดตั้ง Node/MySQL บนเครื่อง) |
| A-2 | Production รองรับ 2 targets: **Railway (primary)** + **On-premise/Ubuntu via `docker-compose.prod.yml` (alternative)** — ใช้ image แอปเดียวกัน |
| A-3 | File uploads: Railway = ephemeral (ต้องใช้ Railway Volume/Object Storage); On-premise = Docker volume `app_uploads` (ถาวรบนดิสก์เครื่อง) |
| A-4 | SSL/Domain: Railway จัดการให้อัตโนมัติ; On-premise ตั้ง Nginx + cert เอง (เช่น Let's Encrypt/Certbot วางที่ `nginx/ssl/`) |
| A-5 | Database Init Scripts รันครั้งเดียวตอนสร้าง Volume ใหม่ (Dev); Prod ใช้ migration/import แยก |

---

## 20. Open Questions

| # | คำถาม | ส่งผลต่อ |
|---|-------|---------|
| Q-1 | Domain name ของระบบคืออะไร? | CORS + SSL — ✅ Railway subdomain ก่อน, custom domain ภายหลัง |
| Q-2 | Server specification (RAM, CPU, Disk)? | ✅ Railway จัดการ (เลือก plan ตามการใช้งาน) |
| Q-3 | ต้องการ CI/CD (GitHub Actions) หรือไม่? | ✅ Railway auto-deploy จาก GitHub branch |
| Q-4 | Backup strategy — backup ไปที่ไหน? | ⏳ กำหนดใน Phase 15 (Railway DB backup / mysqldump cron) |
| Q-5 | File upload บน Railway (ephemeral FS) จัดการอย่างไร? | ⏳ ใช้ Railway Volume หรือย้ายไป Object Storage |

---

> **เอกสารถัดไป:** `docs/planning/10-implementation-plan.md` — Implementation Plan
