# 05 — Database Design Overview: ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด

> เอกสารฉบับนี้เป็นส่วนหนึ่งของขั้นตอน Planning Only — ยังไม่มีการเขียน SQL CREATE TABLE แบบสมบูรณ์
> อ้างอิงจาก: `01-system-overview.md`, `02-requirements.md`, `03-roles-permissions.md`, `04-complaint-workflow.md`

---

## 1. Database Design Goals

| # | เป้าหมาย |
|---|---------|
| DG-1 | รองรับ Workflow เรื่องร้องเรียนทั้ง 11 สถานะ |
| DG-2 | รองรับ RBAC (Role-Based Access Control) สำหรับ 8 Roles |
| DG-3 | บันทึกประวัติการเปลี่ยนสถานะทุกครั้ง (Audit Trail) |
| DG-4 | รองรับไฟล์แนบ (Attachments) |
| DG-5 | รองรับระบบแจ้งเตือน (Notifications) |
| DG-6 | ข้อมูลภาษาไทย ใช้ `utf8mb4` + `utf8mb4_unicode_ci` |
| DG-7 | ใช้ Soft Delete (ไม่ลบข้อมูลจริง) สำหรับข้อมูลสำคัญ |
| DG-8 | มี `created_at` และ `updated_at` ทุกตาราง |

---

## 2. Naming Convention

| หัวข้อ | กฎ | ตัวอย่าง |
|--------|---|---------|
| ชื่อตาราง | snake_case, พหูพจน์ | `complaints`, `users`, `agencies` |
| ชื่อ Column | snake_case | `full_name`, `created_at`, `complaint_id` |
| Primary Key | `id` (INT AUTO_INCREMENT) | `id` |
| Foreign Key | `{table_singular}_id` | `user_id`, `agency_id`, `complaint_id` |
| Boolean | `is_` prefix | `is_active`, `is_overdue`, `is_read` |
| Timestamp | `_at` suffix | `created_at`, `assigned_at`, `closed_at` |
| ENUM | ตัวพิมพ์ใหญ่ | `'NEW'`, `'HIGH'`, `'admin'` |
| Index | `idx_{table}_{column}` | `idx_complaints_status` |

---

## 3. Table Overview

ระบบมีทั้งหมด **22 ตาราง** แบ่งเป็น 4 กลุ่ม
(เพิ่ม `citizens` และ `anonymous_reveal_logs` จากฟีเจอร์สมาชิกประชาชน + ปกปิดตัวตน — ดู `03` §12)
(เพิ่ม `provinces`, `service_types`, `complaint_natures`, `complainant_types` จากฟีเจอร์ขยายแบบฟอร์มร้องทุกข์ — ดู §4.19–4.22 และ FR-007.x)
(⭐ **Phase ถัดไป:** `system_settings` สำหรับให้เจ้าหน้าที่ปรับเกณฑ์เร่งรัดอัพเดต/ค่าระบบผ่านหน้า Settings — **ยังไม่นับใน 22 ตารางของ Phase แรก** เมื่อพัฒนาแล้วจะเป็น 23 ตาราง — ดู §4.23)

### กลุ่มที่ 1: User & Role Tables (4 ตาราง)

| # | ตาราง | วัตถุประสงค์ | ประเภท |
|---|-------|------------|--------|
| 1 | `users` | เก็บข้อมูลผู้ใช้งานระบบ (เจ้าหน้าที่, หัวหน้า, ผู้บริหาร) | Transaction |
| 2 | `roles` | เก็บรายการ Role ทั้งหมด | Master Data |
| 3 | `permissions` | เก็บรายการ Permission และ Role-Permission Mapping | Master Data |
| 3.1 | `citizens` | เก็บบัญชีสมาชิกประชาชน (Auth แยกจาก `users`) ⭐ ใหม่ | Transaction |

### กลุ่มที่ 2: Master Data Tables (9 ตาราง)

| # | ตาราง | วัตถุประสงค์ | ประเภท |
|---|-------|------------|--------|
| 4 | `agencies` | เก็บข้อมูลหน่วยงานที่รับผิดชอบ | Master Data |
| 5 | `complaint_categories` | เก็บประเภทเรื่องร้องเรียน + SLA | Master Data |
| 6 | `complaint_channels` | เก็บช่องทางรับเรื่อง (Walk-in, โทรศัพท์ ฯลฯ) | Master Data |
| 7 | `provinces` | เก็บข้อมูลจังหวัด ⭐ ใหม่ | Master Data |
| 8 | `districts` | เก็บข้อมูลอำเภอ | Master Data |
| 9 | `subdistricts` | เก็บข้อมูลตำบล | Master Data |
| 9.1 | `service_types` | ประเภทงานบริการ (ทั่วไป/สำคัญ/บัตรสนเท่ห์ ฯลฯ) ⭐ ใหม่ | Master Data |
| 9.2 | `complaint_natures` | ลักษณะเรื่อง (ร้องเรียนร้องทุกข์/ขอคำปรึกษา ฯลฯ) ⭐ ใหม่ | Master Data |
| 9.3 | `complainant_types` | ประเภทผู้ร้องเรียน (บุคคลธรรมดา/นิติบุคคล) ⭐ ใหม่ | Master Data |

### กลุ่มที่ 3: Transaction Tables (4 ตาราง)

| # | ตาราง | วัตถุประสงค์ | ประเภท |
|---|-------|------------|--------|
| 9 | `complaints` | เก็บข้อมูลเรื่องร้องเรียน (ตารางหลัก) | Transaction |
| 10 | `complaint_assignments` | เก็บข้อมูลการส่งต่อเรื่องไปยังหน่วยงาน | Transaction |
| 11 | `complaint_updates` | เก็บข้อมูลการอัปเดตความคืบหน้า | Transaction |
| 12 | `complaint_attachments` | เก็บข้อมูลไฟล์แนบ | Transaction |

### กลุ่มที่ 4: Log & Notification Tables (5 ตาราง)

| # | ตาราง | วัตถุประสงค์ | ประเภท |
|---|-------|------------|--------|
| 13 | `complaint_status_logs` | เก็บประวัติการเปลี่ยนสถานะเรื่องร้องเรียน | Log |
| 14 | `notifications` | เก็บข้อมูลแจ้งเตือน | Log |
| 15 | `audit_logs` | เก็บ Log การกระทำทุกอย่างในระบบ | Log |
| 16 | `complaint_sequences` | เก็บ Running Number สำหรับเลขที่เรื่อง | System |
| 16.1 | `anonymous_reveal_logs` | เก็บ Log การเปิดเผยตัวตนของเรื่อง Anonymous (super_admin) ⭐ ใหม่ | Log |

---

## 4. Detailed Table Design

### 4.1 `users` — ผู้ใช้งาน

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสผู้ใช้ |
| `username` | VARCHAR(100) | NO | UQ | ชื่อผู้ใช้สำหรับ Login |
| `password_hash` | VARCHAR(255) | NO | — | รหัสผ่านเข้ารหัส (bcrypt) |
| `full_name` | VARCHAR(255) | NO | — | ชื่อ-นามสกุล |
| `email` | VARCHAR(255) | YES | UQ | อีเมล |
| `phone` | VARCHAR(20) | YES | — | เบอร์โทร |
| `role_id` | INT | NO | FK → roles | Role ของผู้ใช้ |
| `agency_id` | INT | YES | FK → agencies | หน่วยงานที่สังกัด (NULL = ศูนย์ดำรงธรรม) |
| `is_active` | BOOLEAN | NO | — | สถานะใช้งาน (Soft Delete) |
| `last_login_at` | DATETIME | YES | — | วันเวลา Login ล่าสุด |
| `created_at` | DATETIME | NO | — | วันที่สร้าง |
| `updated_at` | DATETIME | NO | — | วันที่แก้ไขล่าสุด |

### 4.2 `roles` — บทบาท

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัส Role |
| `code` | VARCHAR(50) | NO | UQ | รหัส Role (เช่น `super_admin`, `officer`) |
| `name` | VARCHAR(100) | NO | — | ชื่อ Role ภาษาไทย |
| `description` | TEXT | YES | — | คำอธิบาย |
| `is_active` | BOOLEAN | NO | — | สถานะใช้งาน |
| `created_at` | DATETIME | NO | — | วันที่สร้าง |
| `updated_at` | DATETIME | NO | — | วันที่แก้ไขล่าสุด |

### 4.3 `permissions` — สิทธิ์ + Mapping

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัส Permission |
| `role_id` | INT | NO | FK → roles | Role ที่ได้รับสิทธิ์ |
| `resource` | VARCHAR(100) | NO | — | ทรัพยากร (เช่น `complaints`, `users`, `dashboard`) |
| `action` | VARCHAR(50) | NO | — | การกระทำ (เช่น `create`, `read`, `update`, `delete`) |
| `conditions` | JSON | YES | — | เงื่อนไขเพิ่มเติม (เช่น `{"own_agency_only": true}`) |
| `created_at` | DATETIME | NO | — | วันที่สร้าง |

> **หมายเหตุ**: รวม Role-Permission เป็นตารางเดียวแทนที่จะแยก 2 ตาราง (permissions + role_permissions) เพื่อความง่ายใน Phase แรก

### 4.4 `agencies` — หน่วยงาน

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสหน่วยงาน |
| `name` | VARCHAR(255) | NO | — | ชื่อหน่วยงาน |
| `short_name` | VARCHAR(100) | YES | — | ชื่อย่อ |
| `contact_phone` | VARCHAR(20) | YES | — | เบอร์โทรหน่วยงาน |
| `contact_email` | VARCHAR(255) | YES | — | อีเมลหน่วยงาน |
| `address` | TEXT | YES | — | ที่อยู่ |
| `is_active` | BOOLEAN | NO | — | สถานะใช้งาน |
| `created_at` | DATETIME | NO | — | วันที่สร้าง |
| `updated_at` | DATETIME | NO | — | วันที่แก้ไขล่าสุด |

### 4.5 `complaint_categories` — ประเภทเรื่องร้องเรียน

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสประเภท |
| `name` | VARCHAR(255) | NO | — | ชื่อประเภท (เช่น "ที่ดิน", "สิ่งแวดล้อม") |
| `description` | TEXT | YES | — | คำอธิบาย |
| `sla_days` | INT | NO | — | จำนวนวัน SLA (เช่น 15 วัน) |
| `is_active` | BOOLEAN | NO | — | สถานะใช้งาน |
| `created_at` | DATETIME | NO | — | วันที่สร้าง |
| `updated_at` | DATETIME | NO | — | วันที่แก้ไขล่าสุด |

### 4.6 `complaint_channels` — ช่องทางรับเรื่อง

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสช่องทาง |
| `name` | VARCHAR(100) | NO | — | ชื่อช่องทาง (เช่น "มาด้วยตนเอง", "โทรศัพท์") |
| `is_active` | BOOLEAN | NO | — | สถานะใช้งาน |
| `created_at` | DATETIME | NO | — | วันที่สร้าง |
| `updated_at` | DATETIME | NO | — | วันที่แก้ไขล่าสุด |

### 4.7 `districts` — อำเภอ

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสอำเภอ |
| `province_id` | INT | NO | FK → provinces | จังหวัดที่สังกัด ⭐ ใหม่ (default = ศรีสะเกษ) |
| `name` | VARCHAR(255) | NO | — | ชื่ออำเภอ |
| `code` | VARCHAR(10) | YES | UQ | รหัสอำเภอตามมาตรฐาน |
| `is_active` | BOOLEAN | NO | — | สถานะใช้งาน |
| `created_at` | DATETIME | NO | — | วันที่สร้าง |
| `updated_at` | DATETIME | NO | — | วันที่แก้ไขล่าสุด |

### 4.8 `subdistricts` — ตำบล

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสตำบล |
| `district_id` | INT | NO | FK → districts | อำเภอที่สังกัด |
| `name` | VARCHAR(255) | NO | — | ชื่อตำบล |
| `code` | VARCHAR(10) | YES | UQ | รหัสตำบลตามมาตรฐาน |
| `is_active` | BOOLEAN | NO | — | สถานะใช้งาน |
| `created_at` | DATETIME | NO | — | วันที่สร้าง |
| `updated_at` | DATETIME | NO | — | วันที่แก้ไขล่าสุด |

### 4.9 `complaints` — เรื่องร้องเรียน (ตารางหลัก) ⭐

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสเรื่อง (Internal) |
| `complaint_number` | VARCHAR(20) | NO | UQ | เลขที่เรื่อง (DC-YYYYMM-XXXX) |
| `title` | VARCHAR(500) | NO | — | หัวเรื่อง |
| `description` | TEXT | NO | — | รายละเอียดเรื่องร้องเรียน |
| `complainant_type_id` | INT | NO | FK → complainant_types | ประเภทผู้ร้องเรียน (บุคคลธรรมดา/นิติบุคคล) ⭐ ใหม่ |
| `complainant_name` | VARCHAR(255) | YES | — | ชื่อผู้ร้อง ⚠️ ข้อมูลส่วนบุคคล |
| `complainant_id_card` | VARCHAR(13) | YES | — | เลขบัตรประชาชน ⚠️ ข้อมูลส่วนบุคคล |
| `complainant_phone` | VARCHAR(20) | NO | — | เบอร์โทร ⚠️ ข้อมูลส่วนบุคคล — **บังคับกรอกเสมอ** ทั้งกรณีออกนามและปกปิดตัวตน (BR-16) |
| `complainant_address` | TEXT | YES | — | ที่อยู่ ⚠️ ข้อมูลส่วนบุคคล |
| `complainant_email` | VARCHAR(255) | YES | — | อีเมล |
| `citizen_id` | INT | YES | FK → citizens | บัญชีสมาชิกผู้ยื่น (NULL = Guest/เจ้าหน้าที่บันทึก) ⭐ ใหม่ |
| `is_anonymous` | BOOLEAN | NO | — | ร้องเรียนแบบปกปิดตัวตน — ถ้า `true` ต้อง **mask** `complainant_*` + `citizen_id` ออกจาก response ฝั่ง staff ทุก Role (ดู §7, `03` §5.1.1) · `complainant_phone` ยังถูกบันทึก (เพื่อติดต่อกลับ) แต่ก็ถูก mask เช่นกัน |
| `service_type_id` | INT | NO | FK → service_types | ประเภทงานบริการ ⭐ ใหม่ |
| `complaint_nature_id` | INT | NO | FK → complaint_natures | ลักษณะเรื่อง ⭐ ใหม่ |
| `category_id` | INT | YES | FK → complaint_categories | ประเภทเรื่อง |
| `channel_id` | INT | NO | FK → complaint_channels | ช่องทางรับเรื่อง |
| `province_id` | INT | YES | FK → provinces | จังหวัดที่เกิดเหตุ ⭐ ใหม่ (Default = ศรีสะเกษ) |
| `district_id` | INT | YES | FK → districts | อำเภอที่เกิดเหตุ |
| `subdistrict_id` | INT | YES | FK → subdistricts | ตำบลที่เกิดเหตุ |
| `postal_code` | VARCHAR(5) | YES | — | รหัสไปรษณีย์จุดเกิดเหตุ ⭐ ใหม่ |
| `incident_address` | TEXT | YES | — | สถานที่เกิดเหตุ (รายละเอียด/บ้านเลขที่/จุดสังเกต) ⭐ ใหม่ |
| `latitude` | DECIMAL(10,7) | YES | — | พิกัดละติจูดจุดเกิดเหตุ (จาก GPS/เลือกบนแผนที่ Leaflet) ⭐ ใหม่ |
| `longitude` | DECIMAL(10,7) | YES | — | พิกัดลองจิจูดจุดเกิดเหตุ ⭐ ใหม่ |
| `priority` | ENUM('HIGH','MEDIUM','LOW') | NO | — | ระดับความเร่งด่วน (Default: MEDIUM) |
| `status` | ENUM('NEW','SCREENING','ASSIGNED','ACCEPTED','IN_PROGRESS','RESOLVED','REVIEWING','CLOSED','REJECTED','RETURNED') | NO | IDX | สถานะปัจจุบัน |
| `is_overdue` | BOOLEAN | NO | — | Flag เกินกำหนด (คำนวณโดยระบบ) |
| `due_date` | DATE | YES | — | วันครบกำหนด (คำนวณจาก SLA) |
| `last_progress_at` | DATETIME | YES | — | เวลาอัพเดตความคืบหน้าล่าสุด (หรือ `accepted_at` ถ้ายังไม่เคยอัพเดต) — Anchor ของการเร่งรัดอัพเดต ⭐ ใหม่ |
| `escalation_level` | TINYINT | NO | — | ระดับการเร่งรัดอัพเดตที่ส่งไปแล้ว (0=ยังไม่ส่ง, 1=30วัน, 2=45วัน, 3=52วัน) Default 0 ⭐ ใหม่ |
| `last_escalation_at` | DATETIME | YES | — | เวลาส่งแจ้งเตือนเร่งรัดครั้งล่าสุด ⭐ ใหม่ |
| `received_by` | INT | YES | FK → users | เจ้าหน้าที่ผู้รับเรื่อง |
| `source` | ENUM('STAFF','PUBLIC') | NO | — | แหล่งที่มา (เจ้าหน้าที่บันทึก / ประชาชนยื่นเอง) |
| `rejection_reason` | TEXT | YES | — | เหตุผลในการปฏิเสธ (ถ้ามี) |
| `closed_at` | DATETIME | YES | — | วันที่ปิดเรื่อง |
| `closed_by` | INT | YES | FK → users | ผู้ปิดเรื่อง |
| `closed_summary` | TEXT | YES | — | สรุปผลการปิดเรื่อง |
| `created_at` | DATETIME | NO | — | วันที่สร้าง (= วันรับเรื่อง) |
| `updated_at` | DATETIME | NO | — | วันที่แก้ไขล่าสุด |

### 4.10 `complaint_assignments` — การส่งต่อหน่วยงาน

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสการส่งต่อ |
| `complaint_id` | INT | NO | FK → complaints | เรื่องร้องเรียน |
| `agency_id` | INT | NO | FK → agencies | หน่วยงานปลายทาง |
| `assigned_by` | INT | NO | FK → users | ผู้ส่งต่อ |
| `assigned_at` | DATETIME | NO | — | วันที่ส่งต่อ |
| `due_date` | DATE | NO | — | วันครบกำหนดของ Assignment นี้ |
| `status` | ENUM('PENDING','ACCEPTED','RETURNED') | NO | — | สถานะการรับเรื่อง |
| `accepted_at` | DATETIME | YES | — | วันที่หน่วยงานรับเรื่อง |
| `accepted_by` | INT | YES | FK → users | ผู้รับเรื่อง (ฝั่งหน่วยงาน) |
| `return_reason` | TEXT | YES | — | เหตุผลในการส่งคืน (ถ้ามี) |
| `returned_at` | DATETIME | YES | — | วันที่ส่งคืน |
| `note` | TEXT | YES | — | หมายเหตุการส่งต่อ |
| `is_active` | BOOLEAN | NO | — | Assignment ยังมีผลอยู่หรือไม่ |
| `created_at` | DATETIME | NO | — | วันที่สร้าง |
| `updated_at` | DATETIME | NO | — | วันที่แก้ไขล่าสุด |

> **หมายเหตุ**: 1 เรื่อง (complaint) สามารถมีหลาย assignment ได้ (กรณีส่งคืนแล้วส่งใหม่)

### 4.11 `complaint_updates` — การอัปเดตความคืบหน้า

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสการอัปเดต |
| `complaint_id` | INT | NO | FK → complaints | เรื่องร้องเรียน |
| `assignment_id` | INT | YES | FK → complaint_assignments | Assignment ที่เกี่ยวข้อง |
| `update_type` | ENUM('PROGRESS','RESULT','REVIEW_NOTE') | NO | — | ประเภทการอัปเดต |
| `content` | TEXT | NO | — | เนื้อหาอัปเดต |
| `updated_by` | INT | NO | FK → users | ผู้อัปเดต |
| `created_at` | DATETIME | NO | — | วันที่อัปเดต |

> **หมายเหตุ:** เมื่อมีการเพิ่มอัปเดตประเภท `PROGRESS` ระบบต้องตั้ง `complaints.last_progress_at = NOW()` และ `complaints.escalation_level = 0` เพื่อรีเซ็ตวงรอบการเร่งรัดอัพเดต (ดู `08` §4.3)

### 4.12 `complaint_attachments` — ไฟล์แนบ

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสไฟล์ |
| `complaint_id` | INT | NO | FK → complaints | เรื่องร้องเรียน |
| `update_id` | INT | YES | FK → complaint_updates | อัปเดตที่แนบไฟล์ (NULL = แนบตอนสร้างเรื่อง) |
| `file_name` | VARCHAR(255) | NO | — | ชื่อไฟล์ต้นฉบับ |
| `file_path` | VARCHAR(500) | NO | — | Path ที่เก็บไฟล์บน Server |
| `file_size` | INT | NO | — | ขนาดไฟล์ (bytes) |
| `file_type` | VARCHAR(50) | NO | — | MIME Type (เช่น `image/jpeg`, `application/pdf`) |
| `uploaded_by` | INT | YES | FK → users | เจ้าหน้าที่ผู้อัปโหลด (NULL = อัปโหลดโดยประชาชน/Guest) ⚠️ เดิม NOT NULL — ปรับเป็น Nullable เพื่อรองรับการแนบไฟล์ตอนยื่นเรื่องผ่าน Public/Citizen |
| `uploaded_by_citizen` | INT | YES | FK → citizens | สมาชิกผู้อัปโหลด (NULL = staff/Guest) ⭐ ใหม่ |
| `upload_source` | ENUM('STAFF','PUBLIC') | NO | — | แหล่งที่มาของการอัปโหลด ⭐ ใหม่ (Default: STAFF) |
| `created_at` | DATETIME | NO | — | วันที่อัปโหลด |

> **หมายเหตุไฟล์แนบหลักฐาน (FR-003):** รองรับการแนบหลายไฟล์ทั้งตอนยื่นเรื่อง (`update_id = NULL`) และตอนอัปเดตความคืบหน้า · จำกัด ≤ 10 MB/ไฟล์ · นามสกุล `jpg, jpeg, png, pdf, doc, docx` (BR-11)

### 4.13 `complaint_status_logs` — ประวัติการเปลี่ยนสถานะ

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัส Log |
| `complaint_id` | INT | NO | FK → complaints | เรื่องร้องเรียน |
| `from_status` | VARCHAR(20) | YES | — | สถานะเดิม (NULL = สร้างใหม่) |
| `to_status` | VARCHAR(20) | NO | — | สถานะใหม่ |
| `changed_by` | INT | YES | FK → users | ผู้เปลี่ยนสถานะ (NULL = ระบบ) |
| `note` | TEXT | YES | — | หมายเหตุ |
| `created_at` | DATETIME | NO | — | วันเวลาที่เปลี่ยน |

### 4.14 `notifications` — การแจ้งเตือน

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสแจ้งเตือน |
| `user_id` | INT | NO | FK → users | ผู้รับแจ้งเตือน |
| `complaint_id` | INT | YES | FK → complaints | เรื่องร้องเรียนที่เกี่ยวข้อง |
| `type` | VARCHAR(50) | NO | — | ประเภทแจ้งเตือน (เช่น `NEW_ASSIGNMENT`, `OVERDUE`) |
| `title` | VARCHAR(255) | NO | — | หัวข้อแจ้งเตือน |
| `message` | TEXT | NO | — | เนื้อหาแจ้งเตือน |
| `is_read` | BOOLEAN | NO | — | อ่านแล้วหรือยัง (Default: false) |
| `read_at` | DATETIME | YES | — | วันที่อ่าน |
| `created_at` | DATETIME | NO | — | วันที่สร้าง |

### 4.15 `audit_logs` — บันทึกการกระทำ

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัส Log |
| `user_id` | INT | YES | FK → users | ผู้กระทำ (NULL = ระบบ/Public) |
| `action` | VARCHAR(50) | NO | — | การกระทำ (`LOGIN`, `CREATE`, `UPDATE`, `DELETE`) |
| `resource` | VARCHAR(100) | NO | — | ทรัพยากร (เช่น `complaints`, `users`) |
| `resource_id` | INT | YES | — | ID ของทรัพยากร |
| `details` | JSON | YES | — | รายละเอียด (เช่น ค่าก่อน-หลังแก้ไข) |
| `ip_address` | VARCHAR(45) | YES | — | IP Address |
| `user_agent` | VARCHAR(500) | YES | — | Browser User Agent |
| `created_at` | DATETIME | NO | — | วันเวลา |

### 4.16 `complaint_sequences` — Running Number

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัส |
| `year_month` | VARCHAR(6) | NO | UQ | ปี-เดือน (YYYYMM) |
| `last_number` | INT | NO | — | หมายเลขล่าสุดของเดือนนั้น |
| `updated_at` | DATETIME | NO | — | วันที่อัปเดตล่าสุด |

> **วิธีใช้**: ก่อนสร้างเรื่องใหม่ ให้ UPDATE `last_number = last_number + 1` แล้วนำค่าไปสร้างเลขที่เรื่อง `DC-{year_month}-{last_number padded 4 digits}`

### 4.17 `citizens` — บัญชีสมาชิกประชาชน ⭐ ใหม่

> Auth **แยกจาก `users`** (คนละ JWT, คนละ namespace) — ดู `03` §12 และ CKD-1

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสสมาชิก |
| `email` | VARCHAR(255) | NO | UQ | อีเมล (ใช้เป็น Login ID) |
| `password_hash` | VARCHAR(255) | NO | — | รหัสผ่านเข้ารหัส (bcrypt) |
| `full_name` | VARCHAR(255) | NO | — | ชื่อ-นามสกุล |
| `phone` | VARCHAR(20) | YES | — | เบอร์โทร |
| `id_card` | VARCHAR(13) | YES | — | เลขบัตรประชาชน ⚠️ ข้อมูลส่วนบุคคล (optional) |
| `address` | TEXT | YES | — | ที่อยู่ |
| `is_active` | BOOLEAN | NO | — | สถานะใช้งาน (Soft Delete) |
| `last_login_at` | DATETIME | YES | — | วันเวลา Login ล่าสุด |
| `created_at` | DATETIME | NO | — | วันที่สร้าง |
| `updated_at` | DATETIME | NO | — | วันที่แก้ไขล่าสุด |

> **หมายเหตุ**: ข้อมูลผู้ร้องในเรื่องร้องเรียนเก็บเป็น **snapshot** ที่ตาราง `complaints` ไม่ใช่ JOIN สดจาก `citizens` (CKD-5) — แม้สมาชิกแก้โปรไฟล์ภายหลัง ข้อมูลในเรื่องเดิมไม่เปลี่ยน
> Phase แรกไม่มี email verification (ดู `03` §12.6)

### 4.18 `anonymous_reveal_logs` — Log การเปิดเผยตัวตนเรื่อง Anonymous ⭐ ใหม่

> ใช้เมื่อ `super_admin` เปิดเผยตัวตนของเรื่องที่ `is_anonymous = true` (CKD-3) — บันทึกทุกครั้ง

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัส Log |
| `complaint_id` | INT | NO | FK → complaints | เรื่องที่ถูกเปิดเผย |
| `revealed_by` | INT | NO | FK → users | ผู้เปิดเผย (super_admin) |
| `reason` | TEXT | NO | — | เหตุผลในการเปิดเผย (บังคับกรอก) |
| `created_at` | DATETIME | NO | — | วันเวลาที่เปิดเผย |

> นอกจากบันทึกตารางนี้แล้ว ต้องเขียน `audit_logs` (action = `REVEAL_IDENTITY`) คู่กันด้วย

### 4.19 `provinces` — จังหวัด ⭐ ใหม่

> รองรับการระบุ "จังหวัด" ของจุดเกิดเหตุ (FR-007.4) — ขอบเขตระบบคือจังหวัดศรีสะเกษ แต่เก็บเป็น Master Data เพื่อความยืดหยุ่นและรองรับเรื่องที่เกิดข้ามจังหวัด

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสจังหวัด |
| `name` | VARCHAR(255) | NO | — | ชื่อจังหวัด |
| `code` | VARCHAR(2) | YES | UQ | รหัสจังหวัดตามมาตรฐาน (ศรีสะเกษ = `33`) |
| `is_active` | BOOLEAN | NO | — | สถานะใช้งาน |
| `created_at` | DATETIME | NO | — | วันที่สร้าง |
| `updated_at` | DATETIME | NO | — | วันที่แก้ไขล่าสุด |

### 4.20 `service_types` — ประเภทงานบริการ ⭐ ใหม่

> ค่าตาม ศูนย์ดำรงธรรม (ทั่วไป / สำคัญ / บัตรสนเท่ห์ / ผลกระทบวงกว้าง / นโยบายสำคัญ) — แก้ไขผ่านหน้า Master Data Settings ได้

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสประเภทงานบริการ |
| `name` | VARCHAR(255) | NO | — | ชื่อประเภทงานบริการ |
| `description` | TEXT | YES | — | คำอธิบาย |
| `is_active` | BOOLEAN | NO | — | สถานะใช้งาน |
| `created_at` | DATETIME | NO | — | วันที่สร้าง |
| `updated_at` | DATETIME | NO | — | วันที่แก้ไขล่าสุด |

### 4.21 `complaint_natures` — ลักษณะเรื่อง ⭐ ใหม่

> ลักษณะของเรื่อง (เรื่องร้องเรียนร้องทุกข์ / การให้บริการแบบเบ็ดเสร็จ / บริการข้อมูลข่าวสาร / บริการให้คำปรึกษา / บริการรับ-ส่งต่อ / ดำเนินการตามนโยบายสำคัญ / แก้ไขปัญหาเฉพาะหน้า / ข้อเสนอแนะ) — แก้ไขผ่าน Master Data Settings ได้

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสลักษณะเรื่อง |
| `name` | VARCHAR(255) | NO | — | ชื่อลักษณะเรื่อง |
| `description` | TEXT | YES | — | คำอธิบาย |
| `is_active` | BOOLEAN | NO | — | สถานะใช้งาน |
| `created_at` | DATETIME | NO | — | วันที่สร้าง |
| `updated_at` | DATETIME | NO | — | วันที่แก้ไขล่าสุด |

### 4.22 `complainant_types` — ประเภทผู้ร้องเรียน ⭐ ใหม่

> ประเภทผู้ร้องเรียน (บุคคลธรรมดา / นิติบุคคล) — แก้ไขผ่าน Master Data Settings ได้

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัสประเภทผู้ร้องเรียน |
| `name` | VARCHAR(100) | NO | — | ชื่อประเภทผู้ร้องเรียน |
| `is_active` | BOOLEAN | NO | — | สถานะใช้งาน |
| `created_at` | DATETIME | NO | — | วันที่สร้าง |
| `updated_at` | DATETIME | NO | — | วันที่แก้ไขล่าสุด |

### 4.23 `system_settings` — ค่าตั้งค่าระบบ (Key-Value) ⭐ Phase ถัดไป

> **ยังไม่สร้างใน Phase แรก** — ใช้รองรับการให้เจ้าหน้าที่ปรับ **เกณฑ์การเร่งรัดการอัพเดตสถานะ** (และค่าระบบอื่น ๆ) ผ่านหน้า Settings โดยไม่ต้องแก้โค้ด. ใน Phase แรกค่าเกณฑ์ 30/15/7 วันเป็นค่าคงที่ (constant) ในโค้ด — เมื่อพัฒนาตารางนี้แล้ว ให้ cron อ่านค่าจากตารางนี้แทน

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| `id` | INT AUTO_INCREMENT | NO | PK | รหัส |
| `setting_key` | VARCHAR(100) | NO | UQ | คีย์การตั้งค่า |
| `setting_value` | VARCHAR(255) | NO | — | ค่า (เก็บเป็น string แล้ว cast ตาม `value_type`) |
| `value_type` | ENUM('INT','STRING','BOOLEAN','JSON') | NO | — | ชนิดข้อมูลของค่า |
| `description` | VARCHAR(255) | YES | — | คำอธิบาย/ป้ายแสดงในหน้า Settings |
| `updated_by` | INT | YES | FK → users | ผู้แก้ไขล่าสุด |
| `updated_at` | DATETIME | NO | — | วันที่แก้ไขล่าสุด |

**คีย์สำหรับการเร่งรัดการอัพเดตสถานะ (Escalation):**

| `setting_key` | `value_type` | ค่าเริ่มต้น | ความหมาย |
|---------------|:---:|:---:|---------|
| `escalation_enabled` | BOOLEAN | `true` | เปิด/ปิดการเร่งรัดทั้งระบบ |
| `escalation_l1_days` | INT | `30` | จำนวนวันก่อนแจ้งครั้งที่ 1 (นับจาก Anchor) |
| `escalation_l2_offset_days` | INT | `15` | จำนวนวันหลังครั้งที่ 1 ก่อนแจ้งครั้งที่ 2 |
| `escalation_l3_offset_days` | INT | `7` | จำนวนวันหลังครั้งที่ 2 ก่อนแจ้งครั้งที่ 3 |

> เกณฑ์สะสม = L1, L1+L2offset, L1+L2offset+L3offset (ค่าเริ่มต้น 30 / 45 / 52 วัน) — ดู `08` §4.3

---

## 5. Table Relationships (ER Diagram)

```
roles ──────────────┐
                     │ 1:N
                     ▼
agencies ──┐      users ──────────────────────┐
           │ 1:N    │                          │
           │        │ 1:N                      │
           │        ▼                          │
           │   complaints ◄──── complaint_channels
           │     │  │  │
           │     │  │  ├── complaint_categories
           │     │  │  ├── districts ── subdistricts
           │     │  │  │
           │     │  │  ├─────► complaint_status_logs (1:N)
           │     │  │  ├─────► complaint_attachments (1:N)
           │     │  │  └─────► notifications (1:N)
           │     │  │
           │     │  └─────────► complaint_updates (1:N)
           │     │
           └─────┼────────────► complaint_assignments (1:N)
                 │
                 └── audit_logs
```

### Relationship Summary

| ตาราง A | ความสัมพันธ์ | ตาราง B | FK อยู่ที่ |
|---------|-------------|---------|-----------|
| `roles` | 1:N | `users` | `users.role_id` |
| `roles` | 1:N | `permissions` | `permissions.role_id` |
| `agencies` | 1:N | `users` | `users.agency_id` |
| `agencies` | 1:N | `complaint_assignments` | `complaint_assignments.agency_id` |
| `complaint_categories` | 1:N | `complaints` | `complaints.category_id` |
| `complaint_channels` | 1:N | `complaints` | `complaints.channel_id` |
| `service_types` | 1:N | `complaints` | `complaints.service_type_id` ⭐ |
| `complaint_natures` | 1:N | `complaints` | `complaints.complaint_nature_id` ⭐ |
| `complainant_types` | 1:N | `complaints` | `complaints.complainant_type_id` ⭐ |
| `provinces` | 1:N | `districts` | `districts.province_id` ⭐ |
| `provinces` | 1:N | `complaints` | `complaints.province_id` ⭐ |
| `districts` | 1:N | `complaints` | `complaints.district_id` |
| `districts` | 1:N | `subdistricts` | `subdistricts.district_id` |
| `subdistricts` | 1:N | `complaints` | `complaints.subdistrict_id` |
| `citizens` | 1:N | `complaint_attachments` | `complaint_attachments.uploaded_by_citizen` ⭐ |
| `users` | 1:N | `complaints` | `complaints.received_by` |
| `citizens` | 1:N | `complaints` | `complaints.citizen_id` (NULL = Guest/Staff) |
| `complaints` | 1:N | `anonymous_reveal_logs` | `anonymous_reveal_logs.complaint_id` |
| `users` | 1:N | `anonymous_reveal_logs` | `anonymous_reveal_logs.revealed_by` |
| `complaints` | 1:N | `complaint_assignments` | `complaint_assignments.complaint_id` |
| `complaints` | 1:N | `complaint_updates` | `complaint_updates.complaint_id` |
| `complaints` | 1:N | `complaint_attachments` | `complaint_attachments.complaint_id` |
| `complaints` | 1:N | `complaint_status_logs` | `complaint_status_logs.complaint_id` |
| `complaints` | 1:N | `notifications` | `notifications.complaint_id` |
| `complaint_updates` | 1:N | `complaint_attachments` | `complaint_attachments.update_id` |
| `users` | 1:N | `notifications` | `notifications.user_id` |
| `users` | 1:N | `audit_logs` | `audit_logs.user_id` |

---

## 6. Indexing Considerations

| ตาราง | Index | ประเภท | เหตุผล |
|-------|-------|--------|--------|
| `complaints` | `idx_complaints_status` | INDEX | กรองตามสถานะ (ใช้บ่อย) |
| `complaints` | `idx_complaints_priority` | INDEX | กรองตาม Priority |
| `complaints` | `idx_complaints_due_date` | INDEX | ค้นหาเรื่อง Overdue |
| `complaints` | `idx_complaints_category` | INDEX | กรองตามประเภท |
| `complaints` | `idx_complaints_district` | INDEX | กรองตามพื้นที่ |
| `complaints` | `idx_complaints_service_type` | INDEX | กรองตามประเภทงานบริการ ⭐ |
| `complaints` | `idx_complaints_nature` | INDEX | กรองตามลักษณะเรื่อง ⭐ |
| `complaints` | `idx_complaints_created_at` | INDEX | เรียงตามวันที่ |
| `complaints` | `idx_complaints_escalation` | INDEX | คิวรีงานเร่งรัดอัพเดต (status + last_progress_at + escalation_level) ⭐ |
| `districts` | `idx_districts_province` | INDEX | กรองอำเภอตามจังหวัด ⭐ |
| `complaint_assignments` | `idx_assignments_agency` | INDEX | กรองตามหน่วยงาน |
| `complaint_assignments` | `idx_assignments_status` | INDEX | กรองตามสถานะ Assignment |
| `notifications` | `idx_notifications_user_read` | INDEX | ค้นหาแจ้งเตือนที่ยังไม่อ่าน |
| `audit_logs` | `idx_audit_resource` | INDEX | ค้นหา Log ตามทรัพยากร |
| `users` | `idx_users_username` | UNIQUE | Login |

---

## 7. Personal Data & Privacy Considerations

| # | ข้อพิจารณา | รายละเอียด |
|---|-----------|-----------|
| PD-1 | **Field ที่เป็นข้อมูลส่วนบุคคล** | `complainant_name`, `complainant_id_card`, `complainant_phone`, `complainant_address`, `complainant_email` |
| PD-2 | **การจำกัดสิทธิ์** | Backend API ต้อง Filter Field เหล่านี้ออกสำหรับ Role ที่ไม่มีสิทธิ์ (Agency, Executive, Public) |
| PD-2.1 | **เรื่องปกปิดตัวตน (Anonymous)** | เมื่อ `is_anonymous = true` ต้อง **mask** `complainant_*` (รวม `complainant_phone`) + `citizen_id` ออกจาก response ของ staff **ทุก Role** (รวม officer/chief/admin) ที่ระดับ Query/Serializer — ข้อมูลยังคงอยู่ใน DB. เฉพาะ `super_admin` เปิดเผยผ่าน `reveal-identity` ได้ + ลง `anonymous_reveal_logs` (ดู `03` §5.1.1) |
| PD-2.2 | **เบอร์โทรบังคับกรอก** | `complainant_phone` บังคับกรอกเสมอทั้งกรณีออกนามและปกปิดตัวตน (BR-16) เพื่อให้ติดต่อกลับได้ — แต่เมื่อปกปิดตัวตนยังคงถูก mask จาก staff เช่นเดียวกับข้อมูลส่วนบุคคลอื่น |
| PD-3 | **การเข้ารหัส** | `complainant_id_card` ควรเข้ารหัส (Encrypt) ก่อนบันทึก ใน Phase แรกอาจเก็บแบบ Plain แต่ต้อง Encrypt ใน Phase ถัดไป |
| PD-4 | **Soft Delete** | ข้อมูลเรื่องร้องเรียนใช้ Soft Delete ไม่ลบจริง เพื่อรักษา Audit Trail |
| PD-5 | **Data Retention** | กำหนดนโยบายเก็บข้อมูลย้อนหลัง (เช่น 5 ปี) — ต้องถามผู้ใช้จริง |
| PD-6 | **Backup** | ข้อมูลที่มีข้อมูลส่วนบุคคล ต้อง Backup อย่างปลอดภัย |

---

## 8. Seed Data

> **ขอบเขตจังหวัด:** ระบบนี้ใช้สำหรับ **ศูนย์ดำรงธรรมจังหวัดศรีสะเกษ** (province code `33`)
> ค่าด้านล่างเป็น **ค่าตั้งต้นที่เสนอ (proposed defaults)** ทุกตาราง Master Data แก้ไขได้ผ่านหน้า Settings — ควรยืนยันกับเจ้าหน้าที่จริงก่อน Go-live

### 8.1 `roles` (8 records)

super_admin, admin, officer, chief, agency_officer, agency_head, executive, public

### 8.2 `complaint_channels` (ปรับให้ครบตามช่องทางจริงของศูนย์ดำรงธรรม)

| # | ช่องทาง |
|---|---------|
| 1 | จดหมาย |
| 2 | การลงพื้นที่ / หน่วยเคลื่อนที่เร็ว |
| 3 | ตู้ราชสีห์ |
| 4 | สายด่วน 1567 |
| 5 | เข้ามารับบริการด้วยตนเอง (Walk In) |
| 6 | เว็บไซต์ |
| 7 | แอปพลิเคชัน MOI1567 |
| 8 | ร้องเรียนผ่านหน่วยงานอื่น |
| 9 | ช่องทางอื่น ๆ |

> ช่องทางเหล่านี้ใช้ได้ทั้งฝั่งเจ้าหน้าที่ (บันทึกเรื่องแทนประชาชน, `source = STAFF`) — เจ้าหน้าที่เลือกช่องทางที่รับเรื่องมา · การยื่นผ่านเว็บฝั่งประชาชน (Public/Citizen) ใช้ช่องทาง "เว็บไซต์" เป็นค่าเริ่มต้น (CKD-6)

### 8.2.1 `provinces` ⭐ ใหม่

ศรีสะเกษ (code `33`) — seed เป็นจังหวัดเริ่มต้น/ค่า default ของจุดเกิดเหตุ (เพิ่มจังหวัดอื่นได้ผ่าน Master Data)

### 8.2.2 `service_types` — ประเภทงานบริการ ⭐ ใหม่

ทั่วไป, สำคัญ, บัตรสนเท่ห์, ผลกระทบวงกว้างต่อประชาชน/ประเด็นที่สังคมสนใจ, นโยบายสำคัญของรัฐบาล/กระทรวงมหาดไทย

### 8.2.3 `complaint_natures` — ลักษณะเรื่อง ⭐ ใหม่

เรื่องร้องเรียนร้องทุกข์, การให้บริการแบบเบ็ดเสร็จ, บริการด้านข้อมูลข่าวสารของทางราชการ, บริการให้คำปรึกษา, บริการรับ-ส่งต่อ, ดำเนินการตามนโยบายสำคัญของรัฐบาล, แก้ไขปัญหาความเดือดร้อนเฉพาะหน้า, ข้อเสนอแนะ

### 8.2.4 `complainant_types` — ประเภทผู้ร้องเรียน ⭐ ใหม่

บุคคลธรรมดา, นิติบุคคล

### 8.3 `complaint_categories` (พร้อม SLA — เสนอ 11 ประเภท)

| ประเภทเรื่อง | `sla_days` (เสนอ) |
|--------------|:---:|
| ที่ดิน / ที่สาธารณประโยชน์ | 15 |
| สิ่งแวดล้อม / มลพิษ (เสียง กลิ่น ฝุ่น น้ำเสีย) | 7 |
| สาธารณูปโภค (ไฟฟ้า ประปา ถนน) | 10 |
| ความสงบเรียบร้อย / ความปลอดภัยในชีวิตและทรัพย์สิน | 7 |
| ทุจริต / ประพฤติมิชอบของเจ้าหน้าที่รัฐ | 30 |
| ยาเสพติด / อบายมุข | 15 |
| หนี้สิน / การเงินนอกระบบ | 15 |
| คุ้มครองผู้บริโภค / สินค้าและบริการ | 15 |
| แรงงาน / สวัสดิการ | 15 |
| ขอความช่วยเหลือ / สงเคราะห์ผู้เดือดร้อน | 10 |
| ร้องทุกข์ทั่วไป / อื่นๆ | 15 |

> SLA นับจากวันที่ส่งต่อหน่วยงาน (`ASSIGNED`) ตาม BR-02 / SLA-01

### 8.4 `agencies` (หน่วยงานตัวอย่าง — ปรับได้)

สำนักงานที่ดินจังหวัดศรีสะเกษ, สนง.ทรัพยากรธรรมชาติและสิ่งแวดล้อมจังหวัดศรีสะเกษ, สนง.โยธาธิการและผังเมืองจังหวัดศรีสะเกษ, การไฟฟ้าส่วนภูมิภาคจังหวัดศรีสะเกษ, การประปาส่วนภูมิภาคสาขาศรีสะเกษ, ที่ทำการปกครองจังหวัดศรีสะเกษ, สนง.สาธารณสุขจังหวัดศรีสะเกษ, ตำรวจภูธรจังหวัดศรีสะเกษ, องค์การบริหารส่วนจังหวัดศรีสะเกษ, เทศบาลเมืองศรีสะเกษ

### 8.5 `districts` — 22 อำเภอของจังหวัดศรีสะเกษ (seed ครบ)

> ทุกอำเภอผูก `province_id` → จังหวัดศรีสะเกษ (§8.2.1) ⭐

| code | อำเภอ | code | อำเภอ |
|:---:|------|:---:|------|
| 3301 | เมืองศรีสะเกษ | 3312 | ห้วยทับทัน |
| 3302 | ยางชุมน้อย | 3313 | โนนคูณ |
| 3303 | กันทรารมย์ | 3314 | ศรีรัตนะ |
| 3304 | กันทรลักษ์ | 3315 | น้ำเกลี้ยง |
| 3305 | ขุขันธ์ | 3316 | วังหิน |
| 3306 | ไพรบึง | 3317 | ภูสิงห์ |
| 3307 | ปรางค์กู่ | 3318 | เมืองจันทร์ |
| 3308 | ขุนหาญ | 3319 | เบญจลักษ์ |
| 3309 | ราษีไศล | 3320 | พยุห์ |
| 3310 | อุทุมพรพิสัย | 3321 | โพธิ์ศรีสุวรรณ |
| 3311 | บึงบูรพ์ | 3322 | ศิลาลาด |

### 8.6 `subdistricts` — ตำบลครบ (≈206 ตำบล)

ผู้ใช้เลือก **seed ตำบลครบทุกอำเภอ** ของจังหวัดศรีสะเกษ (รวมประมาณ 206 ตำบล)

> **วิธีจัดทำใน Phase 2:** เพื่อความถูกต้อง ให้ **bulk-import จากชุดข้อมูลทางการ** (กรมการปกครอง / Thai administrative open data) แล้ว generate เป็น `INSERT` ลง `db/init/` แทนการพิมพ์มือ (ลดความผิดพลาดชื่อ/รหัสตำบล) — map `district_id` ตามรหัสอำเภอในตาราง 8.5
> Dev/Demo สามารถเริ่มด้วยตำบลของอำเภอเมืองศรีสะเกษก่อน แล้วเติมให้ครบเมื่อได้ไฟล์ข้อมูลทางการ

### 8.7 `users` — Super Admin เริ่มต้น

1 บัญชี (`username: admin`) password เข้ารหัส bcrypt — สร้างตอน seed เท่านั้น (สร้างจาก UI ไม่ได้, ดู A-3 ใน `03-roles-permissions.md`)

### 8.8 `citizens` — บัญชีสมาชิกทดสอบ (Dev/Demo)

แนะนำ seed 1 บัญชีสมาชิกตัวอย่างสำหรับ Dev/Demo (เช่น `citizen@example.com` / รหัสผ่าน bcrypt) — Production ให้ประชาชนสมัครเอง ไม่ seed

---

## 9. Assumptions

| # | สมมติฐาน |
|---|---------|
| A-1 | ใช้ AUTO_INCREMENT INT เป็น Primary Key (ไม่ใช่ UUID) เพื่อ Performance |
| A-2 | ไฟล์แนบเก็บบน File System (Local Volume) เก็บเฉพาะ Path ใน Database |
| A-3 | 1 เรื่องร้องเรียนมีได้หลาย Assignment (กรณีส่งคืนแล้วส่งใหม่) |
| A-4 | Complaint Sequence ใช้ Row Lock เพื่อป้องกัน Duplicate Number |
| A-5 | ENUM ใช้สำหรับค่าที่ไม่เปลี่ยนบ่อย (Status, Priority) |

---

## 10. Open Questions

| # | คำถาม | ส่งผลต่อ |
|---|-------|---------|
| Q-1 | ต้องเก็บประวัติแก้ไขข้อมูลเรื่องร้องเรียน (ค่าก่อน-หลัง) หรือแค่เก็บสถานะ? | audit_logs design |
| Q-2 | ต้องรองรับ Multi-tenant (หลายจังหวัด) ในอนาคตหรือไม่? | Database schema |
| Q-3 | ต้องการเข้ารหัสข้อมูลส่วนบุคคล (Encryption at rest) ตั้งแต่ Phase แรกหรือไม่? | Security implementation |
| Q-4 | อำเภอ/ตำบลใช้ข้อมูลจังหวัดไหน? | ✅ **จังหวัดศรีสะเกษ** — 22 อำเภอ + ตำบลครบ (ดู §8.5–8.6) |

---

## 11. Key Decisions

| # | การตัดสินใจ | เหตุผล |
|---|-----------|--------|
| KD-1 | ใช้ INT AUTO_INCREMENT แทน UUID | Performance ดีกว่าสำหรับ MySQL Index |
| KD-2 | ใช้ ENUM สำหรับ Status | จำกัดค่าที่ระดับ Database ป้องกันข้อมูลผิด |
| KD-3 | แยก complaint_assignments ออกจาก complaints | รองรับการส่งต่อหลายครั้ง (ส่งคืนแล้วส่งใหม่) |
| KD-4 | ใช้ตาราง complaint_sequences สำหรับ Running Number | ป้องกัน Race Condition ด้วย Row Lock |
| KD-5 | Audit Log ใช้ JSON Column สำหรับ details | ยืดหยุ่น ไม่ต้อง Alter Table เมื่อเพิ่ม Field ใหม่ |
| KD-6 | รวม permissions เข้ากับ role_permissions | ลดความซับซ้อนใน Phase แรก สามารถแยกได้ภายหลัง |
| KD-7 | แยกตาราง `citizens` ออกจาก `users` | บัญชีประชาชนไม่ปนกับ RBAC ของเจ้าหน้าที่ ลดความเสี่ยงด้านสิทธิ์ (CKD-1, ดู `03` §12) |
| KD-8 | เก็บข้อมูลผู้ร้องเป็น snapshot ที่ `complaints` (ไม่ JOIN สดจาก `citizens`) | เรื่องร้องเรียนเป็นหลักฐาน ต้องคงข้อมูล ณ เวลายื่น (CKD-5) |
| KD-9 | Anonymous = mask ที่ Backend ทุก Role + เปิดเผยได้เฉพาะ super_admin พร้อม log | ตรงตาม requirement และตรวจสอบย้อนหลังได้ (CKD-2, CKD-3) |
| KD-10 | ประเภทงานบริการ / ลักษณะเรื่อง / ประเภทผู้ร้องเรียน เป็น **ตาราง Master Data แยก** (ไม่ใช่ ENUM) | เจ้าหน้าที่แก้ไข/เพิ่ม-ลดรายการผ่านหน้า Settings ได้โดยไม่ต้อง ALTER TABLE (สอดคล้อง categories/channels) |
| KD-11 | เพิ่มตาราง `provinces` + `districts.province_id` + `complaints.province_id` (default ศรีสะเกษ) | รองรับการระบุจังหวัดของจุดเกิดเหตุให้ครบถ้วน และเผื่อเรื่องข้ามจังหวัดในอนาคต |
| KD-12 | เก็บพิกัด `latitude`/`longitude` เป็น `DECIMAL(10,7)` บน `complaints` | รองรับการปักหมุดจุดเกิดเหตุผ่าน GPS/แผนที่ Leaflet — ความละเอียด ~1 ซม. เพียงพอ |
| KD-13 | `complainant_phone` บังคับกรอกเสมอ (ระดับ Validation) ทั้งออกนาม/ปกปิดตัวตน | ให้ศูนย์ติดต่อกลับได้เสมอ ตาม BR-16 — ที่ระดับ DB คอลัมน์เป็น NOT NULL สำหรับเรื่องที่ยื่นผ่าน Public/Citizen |
| KD-14 | `complaint_attachments.uploaded_by` ปรับเป็น Nullable + เพิ่ม `uploaded_by_citizen` และ `upload_source` | รองรับการแนบไฟล์หลักฐานตอนยื่นเรื่องโดยประชาชน/Guest ที่ไม่มี `user_id` |
| KD-15 | เพิ่ม `complaints.last_progress_at` + `escalation_level` + `last_escalation_at` แทนการสร้างตารางใหม่ | รองรับการเร่งรัดอัพเดต 3 ระดับ (30/45/52 วัน) แบบ idempotent โดยใช้ `escalation_level` กันส่งซ้ำ และรีเซ็ตเมื่อมีอัพเดต (ดู `08` §4.3) |
| KD-16 | ใช้ตาราง `system_settings` (key-value) สำหรับเกณฑ์เร่งรัดที่ปรับได้ — **Phase ถัดไป** | ให้เจ้าหน้าที่แก้เกณฑ์ 30/15/7 วันผ่านหน้า Settings ได้โดยไม่แก้โค้ด; Phase แรกใช้ค่าคงที่ก่อน (ดู §4.23) |

---

> **เอกสารถัดไป:** `docs/planning/06-api-contract.md` — REST API Contract Overview
