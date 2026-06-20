# PROJECT_CONTEXT — ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัดศรีสะเกษ (DCMS)

> **เอกสารสรุป Context ทั้งหมด** — AI ต้องอ่านไฟล์นี้ก่อนเริ่มทุก Phase เพื่อไม่หลุดบริบท
> เป็นบทสรุปของ `01`–`10` (Single Source of Truth ฉบับย่อ) — ถ้ารายละเอียดขัดแย้งกัน ให้ยึดเอกสารต้นทางที่อ้างถึง
> อัปเดตล่าสุด: 2026-06-18 — เพิ่มฟีเจอร์ สมาชิกประชาชน (Citizen) + ปกปิดตัวตน (Anonymous) + ยื่นได้ทั้งสมาชิก/ไม่สมาชิก (ดู `03` §12 และ §5.1.1)
> อัปเดต 2026-06-19 — ขยายแบบฟอร์มร้องทุกข์: เบอร์โทรบังคับกรอก, ประเภทงานบริการ/ลักษณะเรื่อง/ประเภทผู้ร้องเรียน (Master Data), จุดเกิดเหตุ (จังหวัด/อำเภอ/ตำบล/รหัสไปรษณีย์/สถานที่) + แผนที่ Leaflet (GPS/พิกัด), ไฟล์แนบหลักฐาน, ช่องทางร้องทุกข์ครบ 9 ช่องทาง (ดู `02,04,05,06,07`)

---

## 1. Project Identity

| หัวข้อ | รายละเอียด |
|--------|-----------|
| ชื่อระบบ | ระบบรับเรื่องร้องเรียนศูนย์ดำรงธรรมจังหวัด (Damrongdham Complaint Management System) |
| ชื่อย่อ | **DCMS** |
| Repo | `damrongdham-ssk` |
| ขอบเขตจังหวัด | **ศรีสะเกษ** (province code `33`) |
| ภาษา | ไทยเป็นหลัก (ไม่มี i18n) |
| สถานะ | Phase 0 (Planning) เสร็จ — พร้อมเริ่ม Phase 1 |

**ระบบทำอะไร:** รับเรื่องร้องเรียนจากประชาชนหลายช่องทาง → คัดกรอง/จัดประเภท → ส่งต่อหน่วยงาน (พร้อม SLA) → ติดตาม/อัปเดตผล → ตรวจผล/ปิดเรื่อง → Dashboard + Report สำหรับผู้บริหาร

---

## 2. Tech Stack (ตรงกับ repo จริง)

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite 5 + MUI 5 + React Router 6 + Axios + Recharts + Day.js |
| Backend | **Node.js 20 LTS** + Express 4 + mysql2 (Raw SQL) + JWT + bcrypt + Multer + node-cron |
| Database | MySQL 8.0 (`utf8mb4` / `utf8mb4_unicode_ci`, Timezone `+07:00`) |
| Dev Container | Docker Compose (4 services) + phpMyAdmin |
| Deploy | **2 targets** (image เดียวกัน): **Railway** (primary, `Dockerfile`+`railway.toml`) + **On-premise/Ubuntu** (alternative, `docker-compose.prod.yml`+`nginx/`) |

### Ports (Dev)

| Service | Host → Container |
|---------|------------------|
| Frontend (Vite) | `5173:5173` |
| Backend (Express) | `5001:5001` |
| MySQL | `3307:3306` (host 3307 เลี่ยงชน) |
| phpMyAdmin | `8081:80` |

### Production model — 2 targets (artifact เดียวกัน)

Core artifact คือ root `Dockerfile` (multi-stage): build frontend → backend (`node:20`) serve `dist/` ที่ `./public` + `/api/*` ที่ `:5001` — ใช้กับทั้งสอง target:

- **Target A — Railway (Primary):** build จาก `Dockerfile` + `railway.toml` โดยตรง, single-container, Railway จัดการ SSL/Domain, health check `/api/health`. ⚠️ filesystem ephemeral → uploads ต้องใช้ Railway Volume/Object Storage
- **Target B — On-premise/Ubuntu (Alternative):** `docker-compose.prod.yml` รัน `app` (image เดียวกัน) + `db` (MySQL container) + `nginx` (`nginx/default.conf` ทำ SSL + reverse proxy → app:5001). uploads เก็บใน Docker volume `app_uploads` (ถาวร). ตั้ง SSL เอง (cert วางที่ `nginx/ssl/`). env จาก `.env.production`
  รัน: `docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build`

---

## 3. Constraints (ห้ามข้าม)

C-1 JS เท่านั้น (ไม่ใช้ TypeScript) · C-2 Raw SQL ผ่าน mysql2 (ไม่ใช้ ORM) · C-3 React Context (ไม่ใช้ Redux) · C-4 File upload ลง Local Disk/Volume · C-5 Notification เป็น In-app เท่านั้น (ไม่มี Email/SMS/LINE) · C-6 ไม่มี WebSocket — ใช้ Polling · C-7 ไทยเท่านั้น · C-8 Desktop-first (responsive ถึง Tablet)

> ⚠️ Railway มี ephemeral filesystem — ไฟล์แนบบน prod ต้องใช้ persistent volume หรือย้ายไป Object Storage ภายหลัง

---

## 4. Roles (8) & สิทธิ์หลัก

| Role | Login | สรุปสิทธิ์ |
|------|:---:|-----------|
| `super_admin` | ✅ | ทุกอย่าง + System Config + ลบเรื่อง (soft) |
| `admin` | ✅ | จัดการ User (ยกเว้น super_admin) + Master Data + Audit Log |
| `officer` | ✅ | รับเรื่อง คัดกรอง ส่งต่อ ตรวจผล **ปิดเรื่อง** |
| `chief` | ✅ | เหมือน officer + Dashboard/Report เต็ม |
| `agency_officer` | ✅ | เฉพาะเรื่องหน่วยงานตน: รับ/อัปเดต/ส่งผล/ส่งคืน (ไม่เห็นข้อมูลส่วนบุคคลผู้ร้อง) |
| `agency_head` | ✅ | เหมือน agency_officer + สรุปภาพรวมหน่วยงาน |
| `executive` | ✅ | Read-only: Dashboard + Report (ไม่เห็นข้อมูลส่วนบุคคล) |
| `public` | ❌ | (Guest) ยื่นเรื่อง + ติดตามสถานะด้วยเลขที่เรื่อง |

**+ Citizen Principal (ใหม่):** บัญชี **สมาชิกประชาชน** แยกจากตาราง `users`/RBAC (ตาราง `citizens`, JWT คนละชุด, namespace `/api/citizen/*`) — สมัคร/Login, ดู "เรื่องของฉัน", ตรวจสถานะ, แก้ข้อมูลส่วนตัว. **citizen ไม่ใช่ Role ใน `users`**. (ดู `03` §12)

**กฎสำคัญ:** เฉพาะ officer/chief สร้าง/ส่งต่อ/ปิดเรื่อง · เฉพาะ agency_* รับ/อัปเดต/ส่งผล · ข้อมูลส่วนบุคคลผู้ร้อง (ชื่อ/บัตร ปชช./ที่อยู่/เบอร์) เห็นเฉพาะ super_admin, admin, officer, chief · **เรื่อง `is_anonymous` → mask ข้อมูลผู้ร้อง + `citizen_id` จาก staff ทุก Role; เปิดเผยได้เฉพาะ super_admin พร้อมเหตุผล + บันทึก `anonymous_reveal_logs`** · Backend ต้อง filter ข้อมูลที่ระดับ Query ไม่ใช่ซ่อนที่ Frontend. (รายละเอียด: `03` §12, §5.1.1)

---

## 5. Workflow & สถานะ (11 สถานะ)

`NEW → SCREENING → ASSIGNED → ACCEPTED → IN_PROGRESS → RESOLVED → REVIEWING → CLOSED`
+ **กรณีศูนย์จัดการเอง (T-13/T-14):** `SCREENING → IN_PROGRESS → CLOSED` (ไม่ผ่าน ASSIGNED)
+ `REJECTED` (final), `RETURNED` (ส่งคืน → กลับ SCREENING), `OVERDUE` = **Flag** (`is_overdue`) ไม่ใช่สถานะ

Transition ที่อนุญาตดูตาราง T-01…T-14 ใน `04-complaint-workflow.md`. ห้าม: CLOSED/REJECTED → ใดๆ, IN_PROGRESS → ASSIGNED, NEW → CLOSED.

**SLA:** นับจากวันที่ **ASSIGNED** (ไม่ใช่วันรับเรื่อง) · `due_date = assigned_at + category.sla_days` · near-due ≤ 3 วัน · นับรวมวันหยุด (Phase แรก). ปิดเรื่องได้เฉพาะ officer/chief. Public เห็นสถานะแบบย่อเท่านั้น.

**เร่งรัดการอัพเดตสถานะ (Escalation, แยกจาก SLA):** เรื่องที่อยู่ระหว่างดำเนินการ (ACCEPTED/IN_PROGRESS) ไม่มีอัพเดตความคืบหน้า → แจ้งเตือน 3 ครั้ง: 30 วัน (เจ้าหน้าที่ผู้รับผิดชอบ) → 45 วัน (+หัวหน้าหน่วยงาน) → 52 วัน (+หัวหน้าหน่วยงาน) · นับจากอัพเดตล่าสุด/วันรับเรื่อง · มีอัพเดต → รีเซ็ต (ฟิลด์ `last_progress_at`/`escalation_level`; ดู `08` §4.3).

---

## 6. Database (22 ตาราง)

User/Role: `users`, `roles`, `permissions`, **`citizens`⭐**
Master: `agencies`, `complaint_categories`(+`sla_days`), `complaint_channels`, **`provinces`⭐**, `districts`(+`province_id`), `subdistricts`, **`service_types`⭐**, **`complaint_natures`⭐**, **`complainant_types`⭐**
Transaction: `complaints`⭐ (+`citizen_id`, `is_anonymous`, `service_type_id`, `complaint_nature_id`, `complainant_type_id`, `province_id`, `postal_code`, `incident_address`, `latitude`, `longitude`; `complainant_phone` บังคับ), `complaint_assignments`, `complaint_updates`, `complaint_attachments`(+`uploaded_by_citizen`, `upload_source`)
Log/System: `complaint_status_logs`, `notifications`, `audit_logs`, `complaint_sequences`, **`anonymous_reveal_logs`⭐**

หลักการ: INT AUTO_INCREMENT PK · ENUM สำหรับ status/priority · Soft Delete (`is_active`) · `created_at`/`updated_at` ทุกตาราง · FK ครบ · เลขที่เรื่อง `DC-YYYYMM-XXXX` ผ่าน `complaint_sequences` + row lock · 1 complaint มีได้หลาย assignment. (รายละเอียด: `05-database-design.md`)

---

## 7. API (~100 endpoints)

Base `/(api)` · JWT Bearer (expiry 8h, ไม่มี refresh) · **Citizen JWT แยก namespace `/api/citizen/*`** · Response `{success, data, message}` / error `{success:false, error:{code,message,details}}` · Pagination `?page&limit&sort&order` · ไม่มี API versioning/rate limit ใน Phase แรก · ทุก POST/PUT/PATCH/DELETE เขียน Audit Log อัตโนมัติ.

Modules: Auth, **Citizen⭐ (auth + self-service)**, Users, Agencies, Categories, Channels/Districts, Complaints(+Public + **Identity Reveal⭐**), Status Workflow, Assignment, Updates, Attachments, Notifications, Dashboard, Reports, Audit Logs. (รายละเอียด: `06-api-contract.md`)

---

## 8. Seed Data (ค่าตั้งต้น — ปรับผ่าน Master Data UI ได้)

- **Channels (9):** จดหมาย, ลงพื้นที่/หน่วยเคลื่อนที่เร็ว, ตู้ราชสีห์, สายด่วน 1567, Walk In, เว็บไซต์, แอปฯ MOI1567, ผ่านหน่วยงานอื่น, อื่น ๆ
- **Service Types (5):** ทั่วไป, สำคัญ, บัตรสนเท่ห์, ผลกระทบวงกว้าง, นโยบายสำคัญ ⭐
- **Complaint Natures (8):** เรื่องร้องเรียนร้องทุกข์, บริการเบ็ดเสร็จ, บริการข้อมูลข่าวสาร, ให้คำปรึกษา, รับ-ส่งต่อ, ตามนโยบายสำคัญ, แก้ปัญหาเฉพาะหน้า, ข้อเสนอแนะ ⭐
- **Complainant Types (2):** บุคคลธรรมดา, นิติบุคคล ⭐
- **Provinces:** ศรีสะเกษ (33) — default จุดเกิดเหตุ ⭐
- **Categories + SLA:** 11 ประเภท SLA 7–30 วัน (ดู `05` §8.3)
- **Agencies:** 10 หน่วยงานตัวอย่างของศรีสะเกษ (ดู `05` §8.4)
- **Districts:** 22 อำเภอของศรีสะเกษ (code 3301–3322) — seed ครบ
- **Subdistricts:** ตำบลครบ ≈206 ตำบล — **bulk-import จากชุดข้อมูลทางการ (กรมการปกครอง)** ใน Phase 2 (ไม่พิมพ์มือ)
- **Users:** Super Admin 1 บัญชี (`admin`) bcrypt — seed เท่านั้น

---

## 9. โครงสร้างโฟลเดอร์จริง

```
damrongdham-ssk/
├── frontend/   # React+Vite (src/api, components, contexts, hooks, pages, routes, utils, theme)
├── backend/    # Express (src/config, middleware, routes, controllers, models, services, jobs, utils, server.js)
├── db/init/    # 01-init.sql (schema + seed) → mount initdb.d   ⚠️ ชื่อ db/ ไม่ใช่ database/
├── docs/{planning,testing,deployment}/
├── prompt/     # AI prompt templates
├── .agents/skills/damrongdham-dev/SKILL.md
├── nginx/default.conf      # on-premise reverse proxy + SSL (nginx/ssl/ gitignored)
├── docker-compose.yml      # dev (frontend, backend, db, phpmyadmin)
├── docker-compose.prod.yml # on-premise prod (app + db + nginx)
├── Dockerfile              # prod multi-stage — ใช้ทั้ง Railway + on-prem
├── railway.toml            # Railway deploy config
└── .env / .env.example / .env.production.example
```

Backend = 3-Layer: Route → Controller → Service → Model → DB (middleware: auth/authorize/validate/errorHandler/auditLog).

---

## 10. Phase Plan (16 phases, Backend-first, ~23–29 วัน)

0 Planning ✅ · 1 Project Setup · 2 DB Schema+Seed · 3 Backend Core+MySQL · 4 Auth (**+Citizen Auth⭐**) · 5 Complaint CRUD+Public (**+Anonymity mask, Citizen self-service, Reveal API⭐**) · 6 Assignment/Workflow · 7 Dashboard/Report API · 8 FE Layout/Routing · 9 FE Auth · 10 Complaint UI (**+Citizen UI, ปกปิดตัวตน⭐**) · 11 Dashboard/Report UI · 12 Notification/SLA(cron) · 13 Docker/Railway Integration · 14 Testing/Bug fix · 15 Deployment docs. ฟีเจอร์ Citizen/Anonymous เป็น cross-cutting กระจายใน Phase 2/4/5/10/14 (+3–4 วัน). (รายละเอียด: `10` และ `03` §12)

---

## 11. กฎการทำงานของ AI (สรุป)

1. ทำเฉพาะ Phase ที่กำหนด **ห้ามทำเกิน Phase** · 2. ห้ามเพิ่ม Feature นอก Planning · 3. ห้ามเปลี่ยน Tech Stack/Architecture โดยไม่แจ้งเหตุผล · 4. ทุก Phase ต้องมีวิธีรัน + วิธีทดสอบ + Acceptance Criteria + Git commit · 5. อ่าน `PROJECT_CONTEXT.md` + `10-implementation-plan.md` + `SKILL.md` ก่อนเริ่มทุก Phase. (รายละเอียด: `00-ai-working-rules.md`)

---

## 12. ของที่ยังค้าง (ยืนยันก่อน Go-live)

- ยืนยันรายการประเภทเรื่อง/SLA/หน่วยงาน กับเจ้าหน้าที่ศูนย์ดำรงธรรมจริง
- หาไฟล์ข้อมูลตำบลทางการของศรีสะเกษสำหรับ seed (Phase 2)
- กลยุทธ์ไฟล์แนบบน Railway (persistent volume / object storage)
- Backup strategy ของ MySQL บน Railway (Phase 15)
- Approval step ของ Chief ก่อนส่งต่อ (ยังไม่ทำใน Phase แรก) · Reopen เรื่องที่ปิดแล้ว (ไม่อนุญาต) · Multi-role (ไม่รองรับ Phase แรก)
- **Citizen (ใหม่):** Phase แรกไม่มี email verification/OTP, ไม่มีแจ้งเตือนถึงสมาชิก (in-app/email), ไม่มี social login, ลบบัญชีใช้ Soft Delete (ดู `03` §12.6)
- **เร่งรัดอัพเดต (Escalation):** Phase แรกเกณฑ์ 30/15/7 วันเป็นค่าคงที่ · **Phase ถัดไป** ให้ปรับผ่านหน้า Settings (ตาราง `system_settings`, ดู `05` §4.23, `08` §4.3.5, `10` งาน 12.4.3)
