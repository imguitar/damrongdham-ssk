# 10 — Implementation Plan: ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด

> เอกสารฉบับนี้เป็นส่วนหนึ่งของขั้นตอน Planning Only — ยังไม่มีการเขียน Code
> อ้างอิงจาก: `01` ~ `09` Planning Documents ทั้งหมด

---

## Implementation Overview

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **จำนวน Phase** | 16 Phases (Phase 0 – Phase 15) |
| **ประเภท** | Backend-first → Frontend → Integration → Deployment |
| **กลยุทธ์** | Incremental — ทำทีละ Phase ทดสอบก่อนไป Phase ถัดไป |
| **Tech Stack** | React + Vite + MUI / Node.js + Express / MySQL 8 / Docker Compose |

### Phase Dependency Flow

```
Phase 0 (Planning) ✅ เสร็จแล้ว
    │
    ▼
Phase 1 (Project Setup)
    │
    ▼
Phase 2 (Database)
    │
    ▼
Phase 3 (Backend Core) ─────────────────────────┐
    │                                             │
    ▼                                             │
Phase 4 (Auth) ──────────────────────────┐       │
    │                                     │       │
    ▼                                     │       │
Phase 5 (Complaint CRUD) ───────┐        │       │
    │                            │        │       │
    ▼                            │        │       │
Phase 6 (Assignment/Workflow)   │        │       │
    │                            │        │       │
    ▼                            │        │       │
Phase 7 (Dashboard/Report API)  │        │       │
    │                            │        │       │
    ├────────────────────────────┘        │       │
    │                                     │       │
    ▼                                     ▼       ▼
Phase 8 (Frontend Layout) ◄──── Phase 9 (Frontend Auth)
    │
    ▼
Phase 10 (Complaint UI) ◄──── Phase 5, 6
    │
    ▼
Phase 11 (Dashboard UI) ◄──── Phase 7
    │
    ▼
Phase 12 (Notification/SLA) ◄──── Phase 6
    │
    ▼
Phase 13 (Docker Integration)
    │
    ▼
Phase 14 (Testing/Bug Fix)
    │
    ▼
Phase 15 (Production Deployment)
```

---

## Phase 0: Requirement and Architecture ✅

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | วิเคราะห์ความต้องการ ออกแบบระบบ จัดทำเอกสาร Planning ทั้งหมด |
| **สถานะ** | ✅ **เสร็จสมบูรณ์** |
| **Dependency** | ไม่มี |

### เอกสารที่จัดทำแล้ว

| # | เอกสาร | สถานะ |
|---|--------|-------|
| 01 | System Overview | ✅ |
| 02 | Requirements | ✅ |
| 03 | Roles and Permissions | ✅ |
| 04 | Complaint Workflow | ✅ |
| 05 | Database Design | ✅ |
| 06 | API Contract | ✅ |
| 07 | Frontend Pages | ✅ |
| 08 | Dashboard, Report, Notification | ✅ |
| 09 | Project & Docker Architecture | ✅ |
| 10 | Implementation Plan | ✅ (เอกสารนี้) |

> ⭐ ฟีเจอร์ Citizen Membership & Anonymous Complaint เดิมเคยแยกเป็นเอกสาร `11` — ปัจจุบัน **รวมเข้าเอกสารหลักแล้ว** (SSOT: `03` §12 และ §5.1.1) จึงไม่มีเอกสาร 11 แยกอีกต่อไป

### Acceptance Criteria
- [x] เอกสาร Planning ครบทั้ง 10 ฉบับ
- [x] ไม่มีข้อขัดแย้งระหว่างเอกสาร
- [x] พร้อมเริ่ม Implementation

### Git Commit
```
docs: complete all planning documents (01-10)
```

---

## Phase 1: Project Setup

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | สร้างโครงสร้าง Project ตั้งค่า Docker Compose ให้ทุก Service ทำงานได้ |
| **Dependency** | Phase 0 |
| **ระยะเวลาประมาณ** | 1 วัน |

### งานที่ต้องทำ

| # | งาน | ไฟล์ที่เกี่ยวข้อง |
|---|-----|-----------------|
| 1.1 | สร้างโครงสร้างโฟลเดอร์ตาม `09-project-docker-architecture.md` | ทุกโฟลเดอร์ |
| 1.2 | สร้าง `package.json` สำหรับ Frontend (React + Vite + MUI) | `frontend/package.json` |
| 1.3 | สร้าง `package.json` สำหรับ Backend (Express + mysql2) | `backend/package.json` |
| 1.4 | สร้าง Dockerfile.dev สำหรับ Frontend | `frontend/Dockerfile.dev` |
| 1.5 | สร้าง Dockerfile.dev สำหรับ Backend | `backend/Dockerfile.dev` |
| 1.6 | สร้าง `docker-compose.yml` (4 services) | `docker-compose.yml` |
| 1.7 | สร้าง `.env.example` | `.env.example`, `backend/.env.example`, `frontend/.env.example` |
| 1.8 | สร้าง `.gitignore` | `.gitignore` |
| 1.9 | สร้าง Backend entry point (Hello World API) | `backend/server.js`, `backend/src/app.js` |
| 1.10 | สร้าง Frontend entry point (Hello World Page) | `frontend/src/App.jsx`, `frontend/src/main.jsx` |
| 1.11 | อัปเดต `README.md` | `README.md` |

### ผลลัพธ์ที่ต้องส่งมอบ
- `docker compose up -d` → ทุก Service ทำงานได้
- Frontend เข้าถึงได้ที่ `http://localhost:5173`
- Backend เข้าถึงได้ที่ `http://localhost:5001/api/health`
- MySQL เชื่อมต่อได้
- phpMyAdmin เข้าถึงได้ที่ `http://localhost:8081`

### วิธีทดสอบ
1. `docker compose up -d --build`
2. เปิด `http://localhost:5173` → เห็นหน้า React
3. เปิด `http://localhost:5001/api/health` → เห็น `{ "status": "ok" }`
4. เปิด `http://localhost:8081` → เข้า phpMyAdmin ได้

### Acceptance Criteria
- [x] `docker compose up -d` สำเร็จ ไม่มี Error
- [x] Frontend แสดงหน้า Hello World
- [x] Backend ตอบ `/api/health` status 200
- [x] MySQL เชื่อมต่อได้
- [x] phpMyAdmin เข้าถึงได้
- [x] Hot reload ทำงาน (Frontend + Backend)

### ความเสี่ยง
| ความเสี่ยง | วิธีรับมือ |
|----------|----------|
| Docker version ไม่ตรง | ระบุ version ใน README |
| Port ชนกับ Service อื่น | ระบุ Port ใน .env.example |

### Git Commit
```
feat: complete phase 1 project setup with docker compose
```

---

## Phase 2: Database Schema and Seed Data

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | สร้าง MySQL Tables ทั้ง 22 ตาราง + Seed Data เริ่มต้น |
| **Dependency** | Phase 1 |
| **ระยะเวลาประมาณ** | 1 วัน |

### งานที่ต้องทำ

| # | งาน | ไฟล์ที่เกี่ยวข้อง |
|---|-----|-----------------|
| 2.1 | เขียน SQL CREATE TABLE ทั้ง 22 ตาราง | `db/init/01-init.sql` (ส่วน schema) |
| 2.2 | เขียน SQL Seed Data (Roles, Categories, Channels, Districts/Subdistricts, Agencies, Super Admin) | `db/init/01-init.sql` (ส่วน seed) — แยกเป็น `02-seed.sql` ได้ถ้าต้องการ |
| 2.3 | ตรวจสอบ Foreign Key ครบถ้วน | — |
| 2.4 | ตรวจสอบ Charset utf8mb4 | — |

### ตารางที่ต้องสร้าง (อ้างอิง `05-database-design.md`)

| # | ตาราง | กลุ่ม |
|---|-------|------|
| 1 | `roles` | Master |
| 2 | `users` | Transaction |
| 3 | `permissions` | Master |
| 4 | `agencies` | Master |
| 5 | `complaint_categories` | Master |
| 6 | `complaint_channels` | Master |
| 7 | `districts` | Master |
| 8 | `subdistricts` | Master |
| 9 | `complaints` | Transaction |
| 10 | `complaint_assignments` | Transaction |
| 11 | `complaint_updates` | Transaction |
| 12 | `complaint_attachments` | Transaction |
| 13 | `complaint_status_logs` | Log |
| 14 | `notifications` | Log |
| 15 | `audit_logs` | Log |
| 16 | `complaint_sequences` | System |
| 17 | `citizens` ⭐ | Transaction (สมาชิกประชาชน) |
| 18 | `anonymous_reveal_logs` ⭐ | Log (การเปิดเผยตัวตน) |
| 19 | `provinces` ⭐ | Master (จังหวัด) |
| 20 | `service_types` ⭐ | Master (ประเภทงานบริการ) |
| 21 | `complaint_natures` ⭐ | Master (ลักษณะเรื่อง) |
| 22 | `complainant_types` ⭐ | Master (ประเภทผู้ร้องเรียน) |

> ⭐ 2 ตารางใหม่จากฟีเจอร์สมาชิก + ปกปิดตัวตน + เพิ่มคอลัมน์ `complaints.citizen_id` (FK → citizens) — ดู `05` §4.9, §4.17–4.18 และ `03` §12
> ⭐ 4 ตารางใหม่จากฟีเจอร์ขยายแบบฟอร์มร้องทุกข์ + เพิ่มคอลัมน์ `districts.province_id` และ `complaints` (service_type_id, complaint_nature_id, complainant_type_id, province_id, postal_code, incident_address, latitude, longitude; `complainant_phone` NOT NULL) + `complaint_attachments` (uploaded_by nullable, uploaded_by_citizen, upload_source) — ดู `05` §4.7, §4.9, §4.12, §4.19–4.22

### Seed Data ที่ต้องมี

| ตาราง | ข้อมูล |
|-------|--------|
| `roles` | 8 Roles (super_admin, admin, officer, chief, agency_officer, agency_head, executive, public) |
| `complaint_channels` | จดหมาย, ลงพื้นที่/หน่วยเคลื่อนที่เร็ว, ตู้ราชสีห์, สายด่วน 1567, Walk In, เว็บไซต์, แอปฯ MOI1567, ผ่านหน่วยงานอื่น, อื่น ๆ (9 ช่องทาง) |
| `complaint_categories` | 5-10 ประเภทตัวอย่าง พร้อม SLA |
| `provinces` ⭐ | ศรีสะเกษ (33) — default จุดเกิดเหตุ |
| `service_types` ⭐ | ทั่วไป, สำคัญ, บัตรสนเท่ห์, ผลกระทบวงกว้าง, นโยบายสำคัญ |
| `complaint_natures` ⭐ | 8 ลักษณะเรื่อง (ดู `05` §8.2.3) |
| `complainant_types` ⭐ | บุคคลธรรมดา, นิติบุคคล |
| `districts` | อำเภอในจังหวัด (ผูก `province_id` → ศรีสะเกษ) |
| `subdistricts` | ตำบลตัวอย่าง |
| `users` | Super Admin 1 คน (admin / admin123) |
| `agencies` | หน่วยงานตัวอย่าง 3-5 หน่วยงาน |

### วิธีทดสอบ
1. `docker compose down -v` → ลบ Volume เก่า
2. `docker compose up -d` → สร้างใหม่
3. เข้า phpMyAdmin → ตรวจว่ามี 22 ตาราง
4. ตรวจว่า Seed Data ครบ
5. ทดสอบ Foreign Key (INSERT ข้อมูลที่ FK ผิด → ต้อง Error)

### Acceptance Criteria
- [ ] MySQL มีตาราง 22 ตาราง (รวม `citizens`, `anonymous_reveal_logs`, `provinces`, `service_types`, `complaint_natures`, `complainant_types`)
- [ ] ตาราง Master Data มี Seed Data ครบ
- [ ] Super Admin สร้างแล้ว (password เข้ารหัส bcrypt)
- [ ] Foreign Key ทำงานถูกต้อง
- [ ] Charset เป็น utf8mb4 ทุกตาราง
- [ ] Re-create (down -v → up) ได้โดยไม่ Error

### ความเสี่ยง
| ความเสี่ยง | วิธีรับมือ |
|----------|----------|
| SQL Script Error ตอน Init | ตรวจ Log: `docker compose logs db` |
| Foreign Key ลำดับผิด | สร้างตาราง Master ก่อน Transaction |

### Git Commit
```
feat: complete phase 2 database schema and seed data
```

---

## Phase 3: Backend Core and MySQL Connection

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | สร้าง Backend Core (Express, MySQL Pool, Middleware พื้นฐาน, Error Handler) |
| **Dependency** | Phase 2 |
| **ระยะเวลาประมาณ** | 1 วัน |

### งานที่ต้องทำ

| # | งาน | ไฟล์ที่เกี่ยวข้อง |
|---|-----|-----------------|
| 3.1 | ตั้งค่า Express App (CORS, JSON parser, Static files) | `backend/src/app.js` |
| 3.2 | สร้าง MySQL Connection Pool | `backend/src/config/database.js` |
| 3.3 | สร้าง CORS Configuration | `backend/src/config/cors.js` |
| 3.4 | สร้าง Standard Response Helper | `backend/src/utils/response.js` |
| 3.5 | สร้าง Pagination Helper | `backend/src/utils/pagination.js` |
| 3.6 | สร้าง Global Error Handler | `backend/src/middleware/errorHandler.js` |
| 3.7 | สร้าง Route Index | `backend/src/routes/index.js` |
| 3.8 | สร้าง Health Check API | `backend/src/routes/index.js` |

### วิธีทดสอบ
1. `docker compose up -d`
2. `GET /api/health` → `{ "status": "ok", "database": "connected" }`
3. ตรวจ CORS: Frontend fetch Backend ไม่มี Error
4. ตรวจ Error Handler: เข้า Route ที่ไม่มี → `{ "success": false, "error": { "code": "NOT_FOUND" } }`

### Acceptance Criteria
- [ ] Backend เชื่อมต่อ MySQL ผ่าน Connection Pool
- [ ] `/api/health` แสดงสถานะ Database
- [ ] CORS อนุญาต Frontend origin
- [ ] Error Handler จับ Error ได้ ไม่ crash
- [ ] Standard Response format ถูกต้อง

### Git Commit
```
feat: complete phase 3 backend core and mysql connection
```

---

## Phase 4: Authentication and Authorization

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | สร้างระบบ Login, JWT, Role-based Authorization |
| **Dependency** | Phase 3 |
| **ระยะเวลาประมาณ** | 1-2 วัน |

### งานที่ต้องทำ

| # | งาน | ไฟล์ที่เกี่ยวข้อง |
|---|-----|-----------------|
| 4.1 | สร้าง Auth Routes | `backend/src/routes/authRoutes.js` |
| 4.2 | สร้าง Auth Controller (login, me, changePassword) | `backend/src/controllers/authController.js` |
| 4.3 | สร้าง Auth Service (verify password, generate JWT) | `backend/src/services/authService.js` |
| 4.4 | สร้าง User Model (findByUsername, findById) | `backend/src/models/userModel.js` |
| 4.5 | สร้าง Auth Middleware (verify JWT) | `backend/src/middleware/auth.js` |
| 4.6 | สร้าง Authorize Middleware (check role) | `backend/src/middleware/authorize.js` |
| 4.7 | สร้าง Audit Log Middleware | `backend/src/middleware/auditLog.js` |
| 4.8 | ติดตั้ง bcrypt, jsonwebtoken | `backend/package.json` |
| 4.9 ⭐ | สร้าง Citizen Auth (register/login/me/change-password) — Service/Controller/Routes/Model แยก | `citizenAuthController.js`, `citizenModel.js`, `citizenAuthRoutes.js` |
| 4.10 ⭐ | สร้าง Citizen Auth Middleware (JWT แยก namespace `/api/citizen/*`) | `backend/src/middleware/citizenAuth.js` |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login → JWT Token |
| GET | `/api/auth/me` | ดูข้อมูลผู้ใช้ปัจจุบัน |
| PUT | `/api/auth/change-password` | เปลี่ยนรหัสผ่าน |

### วิธีทดสอบ
```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Me (ใช้ token จาก login)
curl http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer {token}"

# Access denied (ไม่มี token)
curl http://localhost:5001/api/auth/me
# → 401 Unauthorized
```

### Acceptance Criteria
- [ ] Login สำเร็จ → ได้ JWT Token
- [ ] Login ผิด → 401 Error
- [ ] `/api/auth/me` + Token → ได้ข้อมูลผู้ใช้ + Role
- [ ] API ที่ต้อง Login → ไม่มี Token = 401
- [ ] API ที่จำกัด Role → Role ผิด = 403
- [ ] เปลี่ยนรหัสผ่านสำเร็จ
- [ ] Audit Log บันทึก Login
- [ ] ⭐ Citizen สมัคร/Login ได้ + ได้ citizen JWT
- [ ] ⭐ Citizen JWT เรียก endpoint staff = 403 และ staff JWT เรียก `/api/citizen/*` = 403

### ความเสี่ยง
| ความเสี่ยง | วิธีรับมือ |
|----------|----------|
| JWT Secret หลุด | ใส่ใน .env ไม่ Commit |
| Token ไม่ Expire | ตั้ง expiresIn: '8h' |

### Git Commit
```
feat: complete phase 4 authentication and authorization
```

---

## Phase 5: Complaint CRUD API

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | สร้าง API สำหรับจัดการเรื่องร้องเรียน (CRUD + Public API) |
| **Dependency** | Phase 4 |
| **ระยะเวลาประมาณ** | 2-3 วัน |

### งานที่ต้องทำ

| # | งาน | ไฟล์ที่เกี่ยวข้อง |
|---|-----|-----------------|
| 5.1 | สร้าง Complaint Model (CRUD queries) | `backend/src/models/complaintModel.js` |
| 5.2 | สร้าง Complaint Controller | `backend/src/controllers/complaintController.js` |
| 5.3 | สร้าง Complaint Routes | `backend/src/routes/complaintRoutes.js` |
| 5.4 | สร้าง Complaint Number Generator | `backend/src/utils/complaintNumber.js` |
| 5.5 | สร้าง Request Validation Middleware | `backend/src/middleware/validate.js` |
| 5.6 | สร้าง File Upload Config (Multer) | `backend/src/config/upload.js` |
| 5.7 | สร้าง Attachment Controller/Model | `backend/src/controllers/attachmentController.js` |
| 5.8 | สร้าง Public Complaint Routes | `backend/src/routes/publicRoutes.js` |
| 5.9 | สร้าง Public Controller | `backend/src/controllers/publicController.js` |
| 5.10 | สร้าง Master Data APIs (Categories, Channels, Provinces, Districts) | `categoryRoutes.js`, `channelRoutes.js`, `provinceRoutes.js` ⭐, `districtRoutes.js` + Controllers + Models |
| 5.10.1 ⭐ | สร้าง Master Data APIs (Service Types, Complaint Natures, Complainant Types) + Public GET variants | `serviceTypeRoutes.js`, `complaintNatureRoutes.js`, `complainantTypeRoutes.js` + Controllers + Models |
| 5.6.1 ⭐ | บังคับ validation `complainant_phone` (required ทุกกรณี รวม anonymous, BR-16) + รับฟิลด์ใหม่ (service_type_id, complaint_nature_id, complainant_type_id, province_id, postal_code, incident_address, latitude, longitude) | `validate.js`, `complaintController.js` |
| 5.7.1 ⭐ | รองรับการแนบไฟล์หลักฐานตอนยื่นเรื่องผ่าน Public/Citizen (`uploaded_by` nullable, `uploaded_by_citizen`, `upload_source`) | `attachmentController.js`, `publicController.js` |
| 5.11 | สร้าง Complaint Status Log | เขียน Log ทุกครั้งที่ Status เปลี่ยน |
| 5.12 ⭐ | สร้าง Anonymity Masking ที่ระดับ Query/Serializer (mask `complainant_*` + `citizen_id` ทุก Role เมื่อ `is_anonymous`) | `complaintModel.js`, serializer/utils |
| 5.13 ⭐ | สร้าง Citizen Self-service APIs (profile, my-complaints list/detail, submit) | `citizenController.js`, `citizenComplaintRoutes.js` |
| 5.14 ⭐ | สร้าง Identity Reveal API (super_admin) + เขียน `anonymous_reveal_logs` + audit | `complaintController.js`, `anonymousRevealModel.js` |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/complaints` | รายการเรื่องร้องเรียน (Pagination + Filter) |
| GET | `/api/complaints/:id` | รายละเอียดเรื่อง |
| POST | `/api/complaints` | สร้างเรื่องใหม่ |
| PUT | `/api/complaints/:id` | แก้ไขเรื่อง |
| GET | `/api/complaints/:id/timeline` | Timeline ของเรื่อง |
| POST | `/api/public/complaints` | ประชาชนยื่นเรื่อง |
| GET | `/api/public/complaints/track/:number` | ติดตามสถานะ |
| GET | `/api/categories` | รายการประเภทเรื่อง |
| GET | `/api/channels` | รายการช่องทาง |
| GET | `/api/districts` | รายการอำเภอ |

### Acceptance Criteria
- [ ] สร้างเรื่องร้องเรียนใหม่ → ได้เลขที่เรื่อง DC-YYYYMM-XXXX
- [ ] ดูรายการ + Filter + Pagination ทำงานถูกต้อง
- [ ] ดูรายละเอียดเรื่อง → แสดงข้อมูลครบ
- [ ] แก้ไขเรื่องสำเร็จ
- [ ] อัปโหลดไฟล์แนบสำเร็จ
- [ ] Public API ยื่นเรื่องได้ (Guest)
- [ ] Public API ติดตามสถานะได้
- [ ] Role ที่ไม่มีสิทธิ์ → 403
- [ ] Agency Officer เห็นเฉพาะเรื่องของหน่วยงานตน
- [ ] Master Data APIs ทำงาน (Categories, Channels, Districts)
- [ ] ⭐ เรื่อง `is_anonymous` ถูก mask ข้อมูลผู้ร้อง + citizen_id จาก staff ทุก Role (list/detail/timeline)
- [ ] ⭐ สมาชิกยื่นเรื่อง (ผูก citizen_id) + ดู "เรื่องของฉัน" ได้
- [ ] ⭐ super_admin เปิดเผยตัวตน → ได้ข้อมูล + บันทึก `anonymous_reveal_logs` + audit

### ความเสี่ยง
| ความเสี่ยง | วิธีรับมือ |
|----------|----------|
| เลขที่เรื่องซ้ำ (Race Condition) | ใช้ Row Lock ใน complaint_sequences |
| File Upload เกิน Limit | ตรวจ Multer config + error handler |

### Git Commit
```
feat: complete phase 5 complaint crud and public api
```

---

## Phase 6: Assignment and Status Workflow API

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | สร้าง API สำหรับส่งต่อหน่วยงาน, เปลี่ยนสถานะ, อัปเดตผล |
| **Dependency** | Phase 5 |
| **ระยะเวลาประมาณ** | 2-3 วัน |

### งานที่ต้องทำ

| # | งาน | ไฟล์ที่เกี่ยวข้อง |
|---|-----|-----------------|
| 6.1 | สร้าง Assignment Model/Controller/Routes | `assignmentController.js`, `assignmentModel.js`, `assignmentRoutes.js` |
| 6.2 | สร้าง Complaint Service (Workflow Logic) | `backend/src/services/complaintService.js` |
| 6.3 | สร้าง Status Workflow APIs (screen, reject, assign, accept, return, start, resolve, review, close, send-back) | `complaintRoutes.js` |
| 6.4 | สร้าง SLA Service (คำนวณ Due Date) | `backend/src/services/slaService.js` |
| 6.5 | สร้าง Complaint Update Controller/Model | `complaintUpdateController.js` |
| 6.6 | สร้าง Agency CRUD APIs | `agencyRoutes.js`, `agencyController.js`, `agencyModel.js` |
| 6.7 | สร้าง User CRUD APIs | `userRoutes.js`, `userController.js` |
| 6.8 | สร้าง Status Transition Validation | ตรวจว่าเปลี่ยนสถานะได้ตาม `04-complaint-workflow.md` |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/complaints/:id/assign` | ส่งต่อหน่วยงาน |
| PATCH | `/api/complaints/:id/screen` | เริ่มคัดกรอง |
| PATCH | `/api/complaints/:id/reject` | ปฏิเสธเรื่อง |
| PATCH | `/api/complaints/:id/review` | เริ่มตรวจผล |
| PATCH | `/api/complaints/:id/close` | ปิดเรื่อง |
| PATCH | `/api/complaints/:id/send-back` | ส่งกลับแก้ไข |
| PATCH | `/api/assignments/:id/accept` | หน่วยงานรับเรื่อง |
| PATCH | `/api/assignments/:id/return` | หน่วยงานส่งคืน |
| PATCH | `/api/assignments/:id/start` | เริ่มดำเนินการ |
| PATCH | `/api/assignments/:id/resolve` | ส่งผลดำเนินการ |
| POST | `/api/complaints/:id/updates` | อัปเดตความคืบหน้า |
| CRUD | `/api/agencies` | จัดการหน่วยงาน |
| CRUD | `/api/users` | จัดการผู้ใช้ |

### Acceptance Criteria
- [ ] Workflow สถานะเปลี่ยนถูกต้องตาม Transition Table
- [ ] Status Transition ที่ห้าม → Error 400
- [ ] ส่งต่อหน่วยงาน → คำนวณ Due Date อัตโนมัติ
- [ ] หน่วยงานรับ/ส่งคืนเรื่องได้
- [ ] อัปเดตความคืบหน้าได้
- [ ] ส่งผลดำเนินการ → ปิดเรื่องได้
- [ ] Status Log บันทึกทุกครั้งที่เปลี่ยนสถานะ
- [ ] CRUD Agency + User ทำงานถูกต้อง

### ความเสี่ยง
| ความเสี่ยง | วิธีรับมือ |
|----------|----------|
| Status Transition ผิด | สร้าง Transition Map + Validation |
| SLA คำนวณผิด | Unit Test สำหรับ SLA Service |

### Git Commit
```
feat: complete phase 6 assignment and status workflow api
```

---

## Phase 7: Dashboard and Report API

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | สร้าง API สำหรับ Dashboard, Report, Export Excel |
| **Dependency** | Phase 6 |
| **ระยะเวลาประมาณ** | 1-2 วัน |

### งานที่ต้องทำ

| # | งาน | ไฟล์ที่เกี่ยวข้อง |
|---|-----|-----------------|
| 7.1 | สร้าง Dashboard Controller/Routes | `dashboardController.js`, `dashboardRoutes.js` |
| 7.2 | สร้าง Report Controller/Routes | `reportController.js`, `reportRoutes.js` |
| 7.3 | สร้าง Report Service (Excel Export) | `backend/src/services/reportService.js` |
| 7.4 | สร้าง Audit Log Controller/Routes | `auditLogController.js`, `auditLogRoutes.js` |
| 7.5 | ติดตั้ง exceljs หรือ xlsx | `backend/package.json` |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Summary Cards |
| GET | `/api/dashboard/by-category` | สถิติตามประเภท |
| GET | `/api/dashboard/by-agency` | สถิติตามหน่วยงาน |
| GET | `/api/dashboard/by-status` | สถิติตามสถานะ |
| GET | `/api/dashboard/trend` | แนวโน้มรายเดือน |
| GET | `/api/dashboard/overdue` | เรื่องเกินกำหนด |
| GET | `/api/dashboard/near-due` | เรื่องใกล้ครบกำหนด |
| GET | `/api/reports/monthly` | รายงานรายเดือน |
| GET | `/api/reports/by-category` | รายงานตามประเภท |
| GET | `/api/reports/by-agency` | รายงานตามหน่วยงาน |
| GET | `/api/reports/overdue` | รายงานเรื่องเกินกำหนด |
| GET | `/api/reports/export/excel` | Export Excel |
| GET | `/api/audit-logs` | ดู Audit Log |

### Acceptance Criteria
- [ ] Dashboard Summary แสดงตัวเลขถูกต้อง
- [ ] Dashboard Charts ส่ง Data ถูกต้อง
- [ ] Report Monthly แสดงข้อมูลถูกต้อง
- [ ] Export Excel ดาวน์โหลดได้ เปิดไฟล์ได้
- [ ] Agency Officer เห็นเฉพาะข้อมูลหน่วยงานตน
- [ ] Audit Log แสดงรายการถูกต้อง

### Git Commit
```
feat: complete phase 7 dashboard and report api
```

---

## Phase 8: Frontend Layout and Routing

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | สร้าง Layout หลัก (Sidebar, Topbar), Routing, Theme, Shared Components |
| **Dependency** | Phase 3 (Backend running) |
| **ระยะเวลาประมาณ** | 2 วัน |

### งานที่ต้องทำ

| # | งาน | ไฟล์ที่เกี่ยวข้อง |
|---|-----|-----------------|
| 8.1 | ตั้งค่า MUI Theme | `frontend/src/theme/theme.js` |
| 8.2 | สร้าง AdminLayout (Sidebar + Topbar + Content) | `frontend/src/components/layout/AdminLayout.jsx` |
| 8.3 | สร้าง PublicLayout | `frontend/src/components/layout/PublicLayout.jsx` |
| 8.4 | สร้าง Sidebar (Menu items by Role) | `frontend/src/components/layout/Sidebar.jsx` |
| 8.5 | สร้าง Topbar (User info + Notification badge) | `frontend/src/components/layout/Topbar.jsx` |
| 8.6 | สร้าง Route Configuration | `frontend/src/routes/AppRoutes.jsx` |
| 8.7 | สร้าง ProtectedRoute (Auth + Role guard) | `frontend/src/routes/ProtectedRoute.jsx` |
| 8.8 | สร้าง Axios Instance | `frontend/src/api/axiosInstance.js` |
| 8.9 | สร้าง Shared Components (StatusChip, PriorityChip, DataTable, ConfirmDialog, LoadingSpinner, EmptyState, ErrorAlert) | `frontend/src/components/common/` |
| 8.10 | สร้าง Constants (Status, Priority, Role) | `frontend/src/utils/constants.js` |
| 8.11 | สร้าง Formatters (Date, Number) | `frontend/src/utils/formatters.js` |
| 8.12 | สร้าง Error Pages (404, 403) | `frontend/src/pages/errors/` |

### Acceptance Criteria
- [ ] AdminLayout แสดง Sidebar + Topbar ถูกต้อง
- [ ] PublicLayout แสดง Header + Footer ถูกต้อง
- [ ] Sidebar Menu เปลี่ยนตาม Role
- [ ] Route Guard ทำงาน (ไม่ Login → Redirect to /login)
- [ ] Route Guard ทำงาน (Role ไม่มีสิทธิ์ → /403)
- [ ] Shared Components ทำงานถูกต้อง
- [ ] Responsive (Desktop + Tablet)

### Git Commit
```
feat: complete phase 8 frontend layout and routing
```

---

## Phase 9: Frontend Authentication

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | สร้างหน้า Login, AuthContext, Token Management |
| **Dependency** | Phase 4, Phase 8 |
| **ระยะเวลาประมาณ** | 1 วัน |

### งานที่ต้องทำ

| # | งาน | ไฟล์ที่เกี่ยวข้อง |
|---|-----|-----------------|
| 9.1 | สร้าง AuthContext (login, logout, user state) | `frontend/src/contexts/AuthContext.jsx` |
| 9.2 | สร้าง useAuth Hook | `frontend/src/hooks/useAuth.js` |
| 9.3 | สร้าง Auth API | `frontend/src/api/authApi.js` |
| 9.4 | สร้าง Login Page | `frontend/src/pages/auth/LoginPage.jsx` |
| 9.5 | สร้าง Change Password Page | `frontend/src/pages/auth/ChangePasswordPage.jsx` |
| 9.6 | สร้าง Profile Page | `frontend/src/pages/profile/ProfilePage.jsx` |
| 9.7 | ตั้งค่า Axios Interceptor (ใส่ Token อัตโนมัติ) | `frontend/src/api/axiosInstance.js` |
| 9.8 | จัดการ Token Expired (Redirect to Login) | Axios interceptor |

### Acceptance Criteria
- [ ] Login สำเร็จ → Redirect ไป Dashboard
- [ ] Login ผิด → แสดง Error Alert
- [ ] Logout → ลบ Token + Redirect ไป Login
- [ ] Token หมดอายุ → Redirect ไป Login
- [ ] เปลี่ยนรหัสผ่านได้
- [ ] ดูข้อมูล Profile ได้

### Git Commit
```
feat: complete phase 9 frontend authentication
```

---

## Phase 10: Complaint Management UI

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | สร้างหน้าจอจัดการเรื่องร้องเรียน (List, Create, Detail, Edit, Workflow Actions) |
| **Dependency** | Phase 5, Phase 6, Phase 9 |
| **ระยะเวลาประมาณ** | 3-4 วัน |

### งานที่ต้องทำ

| # | งาน | ไฟล์ที่เกี่ยวข้อง |
|---|-----|-----------------|
| 10.1 | สร้าง Complaint API functions | `frontend/src/api/complaintApi.js` |
| 10.2 | สร้าง Master Data API functions | `frontend/src/api/masterDataApi.js` |
| 10.3 | สร้าง Complaint List Page (Table + Filter + Search) | `ComplaintListPage.jsx` |
| 10.4 | สร้าง Complaint Create Page (Form + Validation) | `ComplaintCreatePage.jsx` |
| 10.5 | สร้าง Complaint Detail Page (Info + Timeline + Actions) | `ComplaintDetailPage.jsx` |
| 10.6 | สร้าง Complaint Edit Page | `ComplaintEditPage.jsx` |
| 10.7 | สร้าง Workflow Action Dialogs (Assign, Reject, Close, Accept, Return, Resolve, Send-back) | ใน `ComplaintDetailPage.jsx` |
| 10.8 | สร้าง File Upload Component | `FileUpload.jsx` |
| 10.9 | สร้าง Timeline Component | `Timeline.jsx` |
| 10.10 | สร้าง FilterBar Component | `FilterBar.jsx` |
| 10.11 | สร้าง Public Complaint Page | `PublicComplaintPage.jsx` |
| 10.12 | สร้าง Public Tracking Page | `PublicTrackingPage.jsx` |
| 10.13 | สร้าง Public Success Page | `PublicSuccessPage.jsx` |
| 10.14 | สร้าง User Management Pages | `UserListPage.jsx`, `UserCreatePage.jsx`, `UserEditPage.jsx` |
| 10.15 | สร้าง Agency Management Page | `AgencyListPage.jsx` |
| 10.16 | สร้าง Settings Pages (Categories, Channels, Provinces, Districts, Service Types, Complaint Natures, Complainant Types) | `CategorySettingPage.jsx`, `ChannelSettingPage.jsx`, `ProvinceSettingPage.jsx` ⭐, `DistrictSettingPage.jsx`, `ServiceTypeSettingPage.jsx` ⭐, `ComplaintNatureSettingPage.jsx` ⭐, `ComplainantTypeSettingPage.jsx` ⭐ |
| 10.17 ⭐ | สร้าง CitizenAuthContext + Citizen API + Citizen Layout/Guard | `contexts/CitizenAuthContext.jsx`, `api/citizenApi.js`, `layout/CitizenLayout.jsx`, `routes/CitizenProtectedRoute.jsx` |
| 10.18 ⭐ | สร้าง Citizen Pages (Register, Login, My Complaints, Complaint Form/Detail, Profile) | `pages/citizen/*` |
| 10.19 ⭐ | เพิ่ม Checkbox "ปกปิดตัวตน" ในฟอร์มยื่นเรื่องทุกตัว + ป้าย "ปกปิดตัวตน" และปุ่ม "เปิดเผยตัวตน" (super_admin) ใน Detail | `ComplaintCreatePage.jsx`, `PublicComplaintPage.jsx`, `ComplaintDetailPage.jsx` |
| 10.20 ⭐ | ติดตั้ง `leaflet` + `react-leaflet` และสร้าง `LocationMapPicker` (ปุ่ม GPS + เลือกพิกัดบนแผนที่) ใช้ในฟอร์มยื่นเรื่องทุกตัว | `components/LocationMapPicker.jsx`, `ComplaintCreatePage.jsx`, `PublicComplaintPage.jsx`, `pages/citizen/*` |
| 10.21 ⭐ | เพิ่มฟิลด์ใหม่ในฟอร์มยื่นเรื่องทุกตัว: ประเภทงานบริการ, ลักษณะเรื่อง, ประเภทผู้ร้องเรียน, จุดเกิดเหตุ (จังหวัด/อำเภอ/ตำบล/รหัสไปรษณีย์/สถานที่), เบอร์โทรบังคับ, ไฟล์แนบหลักฐาน | ฟอร์มยื่นเรื่องทั้งหมด |

### Acceptance Criteria
- [ ] ดูรายการเรื่องร้องเรียน + Filter + Search + Pagination ได้
- [ ] สร้างเรื่องใหม่ + ได้เลขที่เรื่อง
- [ ] ดูรายละเอียด + Timeline ได้
- [ ] แก้ไขเรื่องได้
- [ ] ส่งต่อหน่วยงาน → สถานะเปลี่ยน
- [ ] หน่วยงานรับเรื่อง / ส่งคืนได้
- [ ] อัปเดตความคืบหน้า + แนบไฟล์ได้
- [ ] ส่งผลดำเนินการ → ตรวจผล → ปิดเรื่องได้
- [ ] Public: ประชาชนยื่นเรื่องได้ (Guest)
- [ ] Public: ติดตามสถานะด้วยเลขที่เรื่องได้
- [ ] CRUD User, Agency, Master Data ทำงานถูกต้อง
- [ ] Confirm Dialog ก่อน Action สำคัญ
- [ ] ⭐ สมาชิก: สมัคร/Login/ดูเรื่องของฉัน/ยื่นเรื่อง/แก้ไขโปรไฟล์ ได้
- [ ] ⭐ Checkbox ปกปิดตัวตนทำงาน + เรื่อง anonymous แสดงป้ายแทนข้อมูลผู้ร้อง
- [ ] ⭐ super_admin เปิดเผยตัวตนผ่าน UI (กรอกเหตุผล) ได้
- [ ] ⭐ ฟอร์มยื่นเรื่องบังคับกรอกเบอร์โทร (รวมกรณีปกปิดตัวตน) + เลือกประเภทงานบริการ/ลักษณะเรื่อง/ประเภทผู้ร้องเรียนได้
- [ ] ⭐ ระบุจุดเกิดเหตุ (จังหวัด/อำเภอ/ตำบล/รหัสไปรษณีย์/สถานที่) + ปักหมุดบนแผนที่ Leaflet (GPS/เลือกพิกัด) ได้
- [ ] ⭐ แนบไฟล์หลักฐานตอนยื่นเรื่องได้ทั้งฝั่งเจ้าหน้าที่และประชาชน
- [ ] ⭐ CRUD Master Data ใหม่ (Provinces, Service Types, Complaint Natures, Complainant Types) ทำงานถูกต้อง

### ความเสี่ยง
| ความเสี่ยง | วิธีรับมือ |
|----------|----------|
| Form Validation ซับซ้อน | ใช้ React Hook Form + Yup |
| Workflow Actions หลาย Dialog | แยก Component ชัดเจน |

### Git Commit
```
feat: complete phase 10 complaint management ui
```

---

## Phase 11: Dashboard and Report UI

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | สร้างหน้า Dashboard (Cards + Charts + Tables), Report Page, Export Excel |
| **Dependency** | Phase 7, Phase 9 |
| **ระยะเวลาประมาณ** | 2 วัน |

### งานที่ต้องทำ

| # | งาน | ไฟล์ที่เกี่ยวข้อง |
|---|-----|-----------------|
| 11.1 | สร้าง Dashboard API functions | `frontend/src/api/dashboardApi.js` |
| 11.2 | สร้าง Report API functions | `frontend/src/api/reportApi.js` |
| 11.3 | สร้าง Dashboard Page (Summary Cards + Charts + Tables) | `DashboardPage.jsx` |
| 11.4 | สร้าง Chart Components (Line, Pie, Bar, Donut) | `frontend/src/components/charts/` |
| 11.5 | สร้าง SummaryCard Component | `SummaryCard.jsx` |
| 11.6 | สร้าง Report Page (Tabs + Tables + Export) | `ReportPage.jsx` |
| 11.7 | สร้าง Audit Log Page | `AuditLogPage.jsx` |
| 11.8 | ติดตั้ง Recharts หรือ Chart.js | `frontend/package.json` |

### Acceptance Criteria
- [ ] Dashboard แสดง 6 Summary Cards ถูกต้อง
- [ ] Charts 4 แบบแสดงข้อมูลถูกต้อง
- [ ] ตาราง Overdue + Near Due แสดงถูกต้อง
- [ ] Click Card → Navigate ไป Complaint List + Filter
- [ ] Report 4 Tabs ทำงานถูกต้อง
- [ ] Export Excel ดาวน์โหลดได้
- [ ] Dashboard Filter (ปี/เดือน) ทำงาน
- [ ] Audit Log แสดงรายการ + Filter ได้

### Git Commit
```
feat: complete phase 11 dashboard and report ui
```

---

## Phase 12: Notification and SLA Alert

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | สร้างระบบแจ้งเตือน + Scheduled Job สำหรับ SLA |
| **Dependency** | Phase 6 |
| **ระยะเวลาประมาณ** | 2 วัน |

### งานที่ต้องทำ

| # | งาน | ไฟล์ที่เกี่ยวข้อง |
|---|-----|-----------------|
| 12.1 | สร้าง Notification Model/Controller/Routes | `notificationController.js`, `notificationModel.js`, `notificationRoutes.js` |
| 12.2 | สร้าง Notification Service (สร้าง Notification อัตโนมัติ) | `backend/src/services/notificationService.js` |
| 12.3 | เรียก NotificationService จากทุก Workflow Action | แก้ไข `complaintService.js` |
| 12.4 | สร้าง Scheduled Jobs (Overdue + Near Due check) | `backend/src/jobs/` |
| 12.4.1 ⭐ | สร้าง Scheduled Job เร่งรัดการอัพเดตสถานะ (`check_no_update_escalation`) — ตรวจ 30/45/52 วัน → สร้าง N-10/11/12 + อัปเดต `escalation_level` | `backend/src/jobs/escalationJob.js` |
| 12.4.2 ⭐ | รีเซ็ต `last_progress_at`/`escalation_level` เมื่อมีอัปเดตความคืบหน้า (PROGRESS) | แก้ไข `complaintService.js` / updates handler |
| 12.4.3 ⭐ (Phase ถัดไป) | ทำเกณฑ์เร่งรัดให้ปรับได้ผ่าน Settings: ตาราง `system_settings` + API `GET/PUT /api/settings` + หน้า `/settings/escalation` + ให้ cron อ่านค่าจาก settings (ค่า default 30/15/7, `escalation_enabled`) | `settingModel.js`, `settingController.js`, `settingRoutes.js`, `EscalationSettingPage.jsx`, แก้ `escalationJob.js` |
| 12.5 | ติดตั้ง node-cron | `backend/package.json` |
| 12.6 | สร้าง Notification Page (Frontend) | `NotificationPage.jsx` |
| 12.7 | สร้าง NotificationContext + Polling | `NotificationContext.jsx` |
| 12.8 | สร้าง Notification Badge ใน Topbar | แก้ไข `Topbar.jsx` |
| 12.9 | สร้าง Notification Dropdown | ใน `Topbar.jsx` |

### Acceptance Criteria
- [ ] Notification สร้างอัตโนมัติเมื่อ Workflow Action เกิดขึ้น
- [ ] Notification Badge แสดง Unread Count
- [ ] Click Notification → ไปหน้า Complaint Detail
- [ ] Mark as Read / Mark All as Read ทำงาน
- [ ] Scheduled Job: ตรวจ Overdue ทุกวัน 08:00
- [ ] Scheduled Job: ตรวจ Near Due ทุกวัน 08:00
- [ ] is_overdue Flag อัปเดตอัตโนมัติ
- [ ] ⭐ Scheduled Job: เร่งรัดการอัพเดตสถานะ — ส่ง N-10 (30 วัน → เจ้าหน้าที่ผู้รับผิดชอบ), N-11 (45 วัน → +หัวหน้าหน่วยงาน), N-12 (52 วัน → +หัวหน้าหน่วยงาน) ครั้งเดียวต่อระดับ
- [ ] ⭐ มีการอัปเดตความคืบหน้า → รีเซ็ต `last_progress_at`/`escalation_level` และเริ่มนับ 30 วันใหม่

### Git Commit
```
feat: complete phase 12 notification and sla alert
```

---

## Phase 13: Docker Integration

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | ตรวจสอบและแก้ไข Docker Compose ให้ทุกอย่างทำงานร่วมกันได้สมบูรณ์ |
| **Dependency** | Phase 12 |
| **ระยะเวลาประมาณ** | 1 วัน |

### งานที่ต้องทำ

| # | งาน | ไฟล์ที่เกี่ยวข้อง |
|---|-----|-----------------|
| 13.1 | ตรวจสอบ docker-compose.yml ล่าสุด (dev, 4 services) | `docker-compose.yml` |
| 13.2 | ตรวจสอบ/ปรับ Production `Dockerfile` (multi-stage) — ใช้ทั้ง 2 target | `Dockerfile` |
| 13.3 | ตั้งค่า Express ให้ serve `./public` + SPA fallback | `backend/src/app.js` |
| 13.4 | ตรวจสอบ `railway.toml` (Target A: build + health check `/api/health`) | `railway.toml` |
| 13.5 | ตรวจสอบ `docker-compose.prod.yml` + `nginx/default.conf` (Target B: app+db+nginx) | `docker-compose.prod.yml`, `nginx/default.conf` |
| 13.6 | ตรวจสอบ Volume/Network/Env: dev + `.env.production` (on-prem) + Env vars บน Railway | `.env.production.example` |
| 13.7 | ทดสอบ Clean Start (down -v → up) | — |
| 13.8 | ทดสอบ Production Build (`docker build` จาก root Dockerfile) ทั้ง 2 path | — |

### Acceptance Criteria
- [ ] `docker compose up -d` (dev) ทำงานสมบูรณ์
- [ ] `docker build -f Dockerfile .` (prod image) build ผ่าน + รัน container ได้
- [ ] Frontend + Backend + MySQL + phpMyAdmin เชื่อมกันได้ (Dev)
- [ ] Production container: เปิด `/` เห็น React, `/api/health` ตอบ 200
- [ ] Target B: `docker compose -f docker-compose.prod.yml up -d` (app+db+nginx) ทำงาน, เข้าผ่าน nginx :80 ได้
- [ ] Hot Reload ทำงาน (Dev)
- [ ] File Upload Volume persist ข้อมูล (Dev + on-prem `app_uploads`)
- [ ] MySQL Volume persist ข้อมูล
- [ ] Railway deploy สำเร็จ (health check `/api/health` ผ่าน)

### Git Commit
```
feat: complete phase 13 docker integration
```

---

## Phase 14: Testing and Bug Fix

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | ทดสอบระบบทั้งหมด แก้ Bug ตรวจ Security เบื้องต้น |
| **Dependency** | Phase 13 |
| **ระยะเวลาประมาณ** | 2-3 วัน |

### งานที่ต้องทำ

| # | งาน |
|---|-----|
| 14.1 | ทดสอบ API ทุก Endpoint ตาม `06-api-contract.md` |
| 14.2 | ทดสอบ Workflow ทั้งหมดตาม `04-complaint-workflow.md` |
| 14.3 | ทดสอบ Role-based Access ทุก Role |
| 14.4 | ทดสอบ Frontend ทุกหน้า |
| 14.5 | ทดสอบ Dashboard ตัวเลขถูกต้อง |
| 14.6 | ทดสอบ Notification ทุกประเภท |
| 14.7 | ทดสอบ SLA Alert |
| 14.8 | ทดสอบ Export Excel |
| 14.9 | ทดสอบ Public Pages (Guest) |
| 14.9A ⭐ | ทดสอบ Citizen flow (สมัคร/Login/เรื่องของฉัน/โปรไฟล์) + แยก scope จาก staff |
| 14.9B ⭐ | ทดสอบ Anonymity: เรื่อง anonymous ถูก mask ทุก Role, ข้อมูลยังอยู่ใน DB, reveal โดย super_admin + audit |
| 14.10 | ตรวจ Security เบื้องต้น (SQL Injection, XSS, Auth) |
| 14.11 | แก้ Bug ทั้งหมด |
| 14.12 | อัปเดต README.md |

### Acceptance Criteria
- [ ] ทุก API Endpoint ทำงานตาม Contract
- [ ] Workflow ทำงานถูกต้องครบทุกสถานะ
- [ ] ทุก Role เข้าถึงได้เฉพาะหน้า/ข้อมูลที่มีสิทธิ์
- [ ] ไม่มี Critical/High Bug เหลือ
- [ ] Security เบื้องต้นผ่าน
- [ ] README.md ครบถ้วน

### Git Commit
```
fix: complete phase 14 testing and bug fixes
```

---

## Phase 15: Production Deployment Guide

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **เป้าหมาย** | จัดทำเอกสาร Deployment, Backup, Monitoring |
| **Dependency** | Phase 14 |
| **ระยะเวลาประมาณ** | 1 วัน |

### งานที่ต้องทำ

| # | งาน | ไฟล์ที่เกี่ยวข้อง |
|---|-----|-----------------|
| 15.1 | สร้าง Deployment Guide | `docs/deployment/DEPLOYMENT.md` |
| 15.2 | สร้าง Backup & Restore Plan | `docs/deployment/BACKUP_RESTORE.md` |
| 15.3 | สร้าง Monitoring & Maintenance Plan | `docs/deployment/MONITORING_MAINTENANCE.md` |
| 15.4 | สร้าง Post-deployment Checklist | `docs/deployment/POST_DEPLOYMENT_CHECKLIST.md` |
| 15.5 | สร้าง UAT Plan | `docs/testing/UAT_PLAN.md` |
| 15.6 | สร้าง .env.example สำหรับ Production | `.env.production.example` |
| 15.7 | อัปเดต README.md (Final) | `README.md` |

### Acceptance Criteria
- [ ] เอกสาร Deployment ครบถ้วน ทำตามได้จริง
- [ ] Backup & Restore ทดสอบได้
- [ ] Post-deployment Checklist ครบ
- [ ] UAT Plan พร้อมให้ผู้ใช้ทดสอบ
- [ ] README.md สมบูรณ์

### Git Commit
```
docs: complete phase 15 production deployment guide
```

---

## Feature Add-on: Citizen Membership & Anonymous Complaint ⭐

ฟีเจอร์ใหม่ (สมาชิกประชาชน + ปกปิดตัวตน + ยื่นได้ทั้งสมาชิก/ไม่สมาชิก) เป็นงาน **cross-cutting** กระจายในเฟสที่มีอยู่แล้ว ไม่เพิ่มเฟสใหม่ เพื่อคงลำดับ Backend-first:

| เฟส | งานที่เพิ่ม (⭐) | อ้างอิง |
|:---:|------------------|---------|
| Phase 2 | ตาราง `citizens`, `anonymous_reveal_logs`, คอลัมน์ `complaints.citizen_id` | 2 (ข้างบน), `05` |
| Phase 4 | Citizen Auth + middleware แยก namespace | 4.9–4.10 |
| Phase 5 | Anonymity masking, Citizen self-service APIs, Identity reveal API | 5.12–5.14 |
| Phase 10 | Citizen UI (Context/Layout/Pages), Checkbox ปกปิดตัวตน, ปุ่มเปิดเผยตัวตน | 10.17–10.19 |
| Phase 14 | ทดสอบ Citizen flow + Anonymity | 14.9A–14.9B |

> รายละเอียดการออกแบบทั้งหมด (SSOT): `03-roles-permissions.md` §12 (Citizen + Anonymous) และ §5.1.1 (การ mask/เปิดเผยตัวตน); Workflow การยื่น: `04` §5 Step 0
> เพิ่มประมาณ **+3–4 วัน** จาก baseline (กระจายใน Phase 4/5/10)

### Acceptance Criteria (ระดับฟีเจอร์ Citizen + Anonymous)

- [ ] ประชาชนสมัครสมาชิก + Login ด้วยอีเมล/รหัสผ่านได้
- [ ] สมาชิกดูรายการ "เรื่องของฉัน" + สถานะ + Timeline ย่อ ได้
- [ ] สมาชิกแก้ไขข้อมูลส่วนตัว + เปลี่ยนรหัสผ่านได้
- [ ] ยื่นเรื่องใหม่ได้ทั้งแบบสมาชิก (ผูกบัญชี) และแบบ Guest (ไม่ Login)
- [ ] เลือก "ปกปิดตัวตน" ได้ทุกช่องทางการยื่น
- [ ] เรื่อง anonymous: staff ทุก Role **ไม่เห็น**ข้อมูลผู้ร้องและ citizen_id ใน list/detail/timeline/export/dashboard
- [ ] เรื่อง anonymous: ข้อมูลผู้ร้องยังถูกบันทึกครบใน DB
- [ ] สมาชิกที่ยื่น anonymous ยังเห็นเรื่องของตนใน "เรื่องของฉัน"
- [ ] super_admin เปิดเผยตัวตนได้ + ระบบบันทึก `anonymous_reveal_logs` + `audit_logs` ทุกครั้ง
- [ ] Citizen JWT เรียก endpoint ฝั่ง staff ไม่ได้ (403) และกลับกัน

---

## Phase Summary Table

| Phase | ชื่อ | Dependency | ระยะเวลา | ประเภท |
|:-----:|------|-----------|:--------:|--------|
| 0 | Requirement and Architecture | — | ✅ เสร็จ | Planning |
| 1 | Project Setup | Phase 0 | 1 วัน | Setup |
| 2 | Database Schema and Seed Data | Phase 1 | 1 วัน | Database |
| 3 | Backend Core and MySQL Connection | Phase 2 | 1 วัน | Backend |
| 4 | Authentication and Authorization | Phase 3 | 1-2 วัน | Backend |
| 5 | Complaint CRUD API | Phase 4 | 2-3 วัน | Backend |
| 6 | Assignment and Status Workflow API | Phase 5 | 2-3 วัน | Backend |
| 7 | Dashboard and Report API | Phase 6 | 1-2 วัน | Backend |
| 8 | Frontend Layout and Routing | Phase 3 | 2 วัน | Frontend |
| 9 | Frontend Authentication | Phase 4, 8 | 1 วัน | Frontend |
| 10 | Complaint Management UI | Phase 5, 6, 9 | 3-4 วัน | Frontend |
| 11 | Dashboard and Report UI | Phase 7, 9 | 2 วัน | Frontend |
| 12 | Notification and SLA Alert | Phase 6 | 2 วัน | Full-stack |
| 13 | Docker Integration | Phase 12 | 1 วัน | DevOps |
| 14 | Testing and Bug Fix | Phase 13 | 2-3 วัน | QA |
| 15 | Production Deployment Guide | Phase 14 | 1 วัน | Docs |
| | **รวม** | | **~26-33 วัน** (รวม Citizen/Anonymous add-on +3–4 วัน) | |

---

## Risk Summary

| # | ความเสี่ยง | ระดับ | Phase | วิธีรับมือ |
|---|----------|------|-------|----------|
| R-1 | Database Schema เปลี่ยนกลางคัน | Medium | Phase 2-6 | ใช้ Migration scripts |
| R-2 | Workflow Logic ซับซ้อนเกินคาด | Medium | Phase 6 | แยก Service Layer ชัดเจน |
| R-3 | CORS Error ระหว่าง Frontend/Backend | Low | Phase 3, 8 | ตั้งค่า CORS ตั้งแต่ Phase 3 |
| R-4 | Docker Container ไม่เชื่อมกัน | Low | Phase 1, 13 | ใช้ Docker Network + Health Check |
| R-5 | Performance ช้าเมื่อข้อมูลเยอะ | Low | Phase 7, 11 | ใส่ Index + Pagination |
| R-6 | File Upload ใหญ่เกินไป | Low | Phase 5 | Multer limit + Frontend validation |

---

## Important Rules for Implementation

| # | กฎ |
|---|---|
| IR-1 | ทำเฉพาะ Phase ที่กำหนด **ห้ามทำเกิน Phase** |
| IR-2 | ห้ามเพิ่ม Feature นอกเหนือจาก Planning Documents |
| IR-3 | ห้ามเปลี่ยน Tech Stack, Architecture โดยไม่มีเหตุผล |
| IR-4 | ถ้าจำเป็นต้องเปลี่ยนจากแผนเดิม **ต้องแจ้งเหตุผลก่อน** |
| IR-5 | ทุก Phase ต้องมีวิธีรัน + วิธีทดสอบ + Acceptance Criteria |
| IR-6 | ทุก Phase ต้องมี Git Commit Message |
| IR-7 | หลังจบ Phase ต้องสรุป Phase Completion Report |
| IR-8 | อ้างอิง `PROJECT_CONTEXT.md` ก่อนเริ่มทุก Phase |

---

> **Phase 0 เสร็จสมบูรณ์** — พร้อมเริ่ม Phase 1: Project Setup
