# 06 — REST API Contract Overview: ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด

> เอกสารฉบับนี้เป็นส่วนหนึ่งของขั้นตอน Planning Only — ยังไม่มีการเขียน Code
> อ้างอิงจาก: `01` ~ `05` Planning Documents

---

## 1. API Standards

### 1.1 Base URL

```
Development:  http://localhost:5001/api
Production:   https://{domain}/api
```

### 1.2 API Response Standard (Success)

```json
{
  "success": true,
  "data": { ... },
  "message": "ดำเนินการสำเร็จ"
}
```

### 1.3 API Response Standard (List with Pagination)

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 1.4 Error Response Standard

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ข้อมูลไม่ถูกต้อง",
    "details": [
      { "field": "title", "message": "กรุณาระบุหัวเรื่อง" }
    ]
  }
}
```

### 1.5 HTTP Status Codes

| Code | ใช้เมื่อ |
|------|---------|
| `200` | สำเร็จ (GET, PUT, PATCH) |
| `201` | สร้างข้อมูลสำเร็จ (POST) |
| `400` | Request ไม่ถูกต้อง (Validation Error) |
| `401` | ไม่ได้ Login (Unauthorized) |
| `403` | ไม่มีสิทธิ์ (Forbidden) |
| `404` | ไม่พบข้อมูล |
| `409` | ข้อมูลซ้ำ (Conflict) |
| `500` | Server Error |

### 1.6 Pagination Standard

```
GET /api/complaints?page=1&limit=20&sort=created_at&order=desc
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | INT | 1 | หน้าที่ต้องการ |
| `limit` | INT | 20 | จำนวนรายการต่อหน้า (max: 100) |
| `sort` | STRING | `created_at` | Field ที่ใช้เรียงลำดับ |
| `order` | STRING | `desc` | ทิศทาง (`asc` / `desc`) |

### 1.7 Filter & Search Standard

```
GET /api/complaints?status=IN_PROGRESS&category_id=1&priority=HIGH&search=ที่ดิน&date_from=2026-01-01&date_to=2026-06-30
```

### 1.8 Authentication

- ใช้ **JWT Bearer Token**
- ส่งผ่าน Header: `Authorization: Bearer {token}`
- Token Expiry: 8 ชั่วโมง
- Refresh Token: ไม่มีใน Phase แรก

### 1.9 File Upload

- ใช้ `multipart/form-data`
- ขนาดไฟล์สูงสุด: 10 MB ต่อไฟล์
- นามสกุลที่อนุญาต: `jpg`, `jpeg`, `png`, `pdf`, `doc`, `docx`

---

## 2. Module 1: Auth

| Method | Endpoint | Description | Auth | Roles | หมายเหตุ |
|--------|----------|-------------|:----:|-------|---------|
| POST | `/api/auth/login` | เข้าสู่ระบบ | ❌ | ทุก Role | Request: `{ username, password }` → Response: `{ token, user }` |
| POST | `/api/auth/logout` | ออกจากระบบ | ✅ | ทุก Role | ฝั่ง Client ลบ Token |
| GET | `/api/auth/me` | ดูข้อมูลผู้ใช้ปัจจุบัน | ✅ | ทุก Role | Response: `{ user, role, permissions }` |
| PUT | `/api/auth/change-password` | เปลี่ยนรหัสผ่าน | ✅ | ทุก Role | Request: `{ current_password, new_password }` |

---

## 2A. Module 1A: Citizen (สมาชิกประชาชน) ⭐ ใหม่

> Auth **แยกจาก staff** — ใช้ JWT คนละชุดและ middleware `citizenAuth`. Token ของ citizen เรียกได้เฉพาะ namespace `/api/citizen/*` (เรียก endpoint ฝั่ง staff = 403 และกลับกัน). ดู `03` §12

### 2A.1 Citizen Auth

| Method | Endpoint | Description | Auth | หมายเหตุ |
|--------|----------|-------------|:----:|---------|
| POST | `/api/citizen/auth/register` | สมัครสมาชิก | ❌ | Request: `{ email, password, full_name, phone?, id_card?, address? }` → Response: `{ token, citizen }` |
| POST | `/api/citizen/auth/login` | เข้าสู่ระบบสมาชิก | ❌ | Request: `{ email, password }` → Response: `{ token, citizen }` |
| POST | `/api/citizen/auth/logout` | ออกจากระบบ | ✅ (citizen) | ฝั่ง Client ลบ Token |
| GET | `/api/citizen/auth/me` | ดูข้อมูลบัญชีตนเอง | ✅ (citizen) | Response: `{ citizen }` |
| PUT | `/api/citizen/auth/change-password` | เปลี่ยนรหัสผ่าน | ✅ (citizen) | Request: `{ current_password, new_password }` |

### 2A.2 Citizen Self-service

| Method | Endpoint | Description | Auth | หมายเหตุ |
|--------|----------|-------------|:----:|---------|
| PUT | `/api/citizen/profile` | แก้ไขข้อมูลส่วนตัว | ✅ (citizen) | Request: `{ full_name?, phone?, id_card?, address? }` |
| POST | `/api/citizen/complaints` | ยื่นเรื่องแบบสมาชิก (ผูก `citizen_id`) | ✅ (citizen) | สร้างพร้อมสถานะ NEW, source = PUBLIC, รองรับ `is_anonymous` |
| GET | `/api/citizen/complaints` | "เรื่องของฉัน" — รายการเรื่องที่ตนเองยื่น | ✅ (citizen) | เห็นเฉพาะเรื่องของตน (รวมเรื่อง anonymous ของตน), Pagination |
| GET | `/api/citizen/complaints/:complaint_number` | สถานะ/Timeline ย่อ ของเรื่องตนเอง | ✅ (citizen) | แสดงสถานะแบบย่อเหมือน Public Tracking |

> **การยื่นแบบสมาชิก**: ระบบ pre-fill ข้อมูลผู้ร้องจากโปรไฟล์ (แก้ก่อนส่งได้) และเก็บเป็น snapshot ที่ `complaints` (CKD-5)
> **Anonymous + สมาชิก**: `citizen_id` ยังถูกบันทึก (ให้ติดตามใน "เรื่องของฉัน") แต่ถูก mask จาก staff (CKD-4)

---

## 3. Module 2: Users

| Method | Endpoint | Description | Auth | Roles | หมายเหตุ |
|--------|----------|-------------|:----:|-------|---------|
| GET | `/api/users` | ดูรายการผู้ใช้ทั้งหมด | ✅ | super_admin, admin | Pagination + Filter by role, agency, is_active |
| GET | `/api/users/:id` | ดูข้อมูลผู้ใช้ | ✅ | super_admin, admin | — |
| POST | `/api/users` | สร้างผู้ใช้ใหม่ | ✅ | super_admin, admin | Request: `{ username, password, full_name, role_id, agency_id, ... }` |
| PUT | `/api/users/:id` | แก้ไขข้อมูลผู้ใช้ | ✅ | super_admin, admin | admin ห้ามแก้ super_admin |
| PATCH | `/api/users/:id/status` | เปิด/ปิดใช้งานผู้ใช้ | ✅ | super_admin, admin | Request: `{ is_active: true/false }` |

---

## 4. Module 3: Agencies

| Method | Endpoint | Description | Auth | Roles | หมายเหตุ |
|--------|----------|-------------|:----:|-------|---------|
| GET | `/api/agencies` | ดูรายการหน่วยงาน | ✅ | ทุก Role (Login) | Filter: `is_active` |
| GET | `/api/agencies/:id` | ดูข้อมูลหน่วยงาน | ✅ | ทุก Role (Login) | — |
| POST | `/api/agencies` | สร้างหน่วยงานใหม่ | ✅ | super_admin, admin | — |
| PUT | `/api/agencies/:id` | แก้ไขหน่วยงาน | ✅ | super_admin, admin | — |
| PATCH | `/api/agencies/:id/status` | เปิด/ปิดใช้งานหน่วยงาน | ✅ | super_admin, admin | Soft Delete |

---

## 5. Module 4: Complaint Categories

| Method | Endpoint | Description | Auth | Roles | หมายเหตุ |
|--------|----------|-------------|:----:|-------|---------|
| GET | `/api/categories` | ดูรายการประเภทเรื่อง | ✅ | ทุก Role (Login) | รวม `sla_days` |
| GET | `/api/categories/:id` | ดูข้อมูลประเภทเรื่อง | ✅ | ทุก Role (Login) | — |
| POST | `/api/categories` | สร้างประเภทเรื่อง | ✅ | super_admin, admin | Request: `{ name, sla_days, description }` |
| PUT | `/api/categories/:id` | แก้ไขประเภทเรื่อง | ✅ | super_admin, admin | — |
| PATCH | `/api/categories/:id/status` | เปิด/ปิดใช้งาน | ✅ | super_admin, admin | — |

---

## 6. Module 5: Master Data (Channels, Districts, Subdistricts)

### 6.1 Channels

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|:----:|-------|
| GET | `/api/channels` | ดูรายการช่องทาง | ✅ | ทุก Role |
| POST | `/api/channels` | สร้างช่องทาง | ✅ | super_admin, admin |
| PUT | `/api/channels/:id` | แก้ไขช่องทาง | ✅ | super_admin, admin |
| PATCH | `/api/channels/:id/status` | เปิด/ปิดใช้งาน | ✅ | super_admin, admin |

### 6.2 Provinces, Districts & Subdistricts

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|:----:|-------|
| GET | `/api/provinces` | ดูรายการจังหวัด ⭐ | ✅ | ทุก Role |
| GET | `/api/provinces/:id/districts` | ดูอำเภอในจังหวัด ⭐ | ✅ | ทุก Role |
| GET | `/api/districts` | ดูรายการอำเภอ | ✅ | ทุก Role |
| GET | `/api/districts/:id/subdistricts` | ดูตำบลในอำเภอ | ✅ | ทุก Role |
| POST | `/api/provinces` | สร้างจังหวัด ⭐ | ✅ | super_admin, admin |
| POST | `/api/districts` | สร้างอำเภอ | ✅ | super_admin, admin |
| POST | `/api/districts/:id/subdistricts` | สร้างตำบล | ✅ | super_admin, admin |
| PUT | `/api/provinces/:id` | แก้ไขจังหวัด ⭐ | ✅ | super_admin, admin |
| PUT | `/api/districts/:id` | แก้ไขอำเภอ | ✅ | super_admin, admin |
| PUT | `/api/subdistricts/:id` | แก้ไขตำบล | ✅ | super_admin, admin |

### 6.3 Service Types / Complaint Natures / Complainant Types ⭐ ใหม่

> Master Data สำหรับฟอร์มร้องทุกข์ (ประเภทงานบริการ, ลักษณะเรื่อง, ประเภทผู้ร้องเรียน) — รูปแบบ endpoint เหมือน Channels

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|:----:|-------|
| GET | `/api/service-types` | ดูรายการประเภทงานบริการ | ✅ | ทุก Role |
| POST/PUT | `/api/service-types[/:id]` | สร้าง/แก้ไขประเภทงานบริการ | ✅ | super_admin, admin |
| PATCH | `/api/service-types/:id/status` | เปิด/ปิดใช้งาน | ✅ | super_admin, admin |
| GET | `/api/complaint-natures` | ดูรายการลักษณะเรื่อง | ✅ | ทุก Role |
| POST/PUT | `/api/complaint-natures[/:id]` | สร้าง/แก้ไขลักษณะเรื่อง | ✅ | super_admin, admin |
| PATCH | `/api/complaint-natures/:id/status` | เปิด/ปิดใช้งาน | ✅ | super_admin, admin |
| GET | `/api/complainant-types` | ดูรายการประเภทผู้ร้องเรียน | ✅ | ทุก Role |
| POST/PUT | `/api/complainant-types[/:id]` | สร้าง/แก้ไขประเภทผู้ร้องเรียน | ✅ | super_admin, admin |
| PATCH | `/api/complainant-types/:id/status` | เปิด/ปิดใช้งาน | ✅ | super_admin, admin |

### 6.4 System Settings (ค่าตั้งค่าระบบ) ⭐ Phase ถัดไป

> **ยังไม่ทำใน Phase แรก** — ใช้ให้เจ้าหน้าที่ปรับเกณฑ์เร่งรัดการอัพเดต (และค่าระบบอื่น ๆ) ผ่านหน้า Settings. อิงตาราง `system_settings` (`05` §4.23)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|:----:|-------|
| GET | `/api/settings` | ดูค่าตั้งค่าทั้งหมด (หรือกรองด้วย `?group=escalation`) | ✅ | super_admin, admin |
| PUT | `/api/settings` | แก้ไขค่าตั้งค่า (เช่น `escalation_l1_days`, `escalation_l2_offset_days`, `escalation_l3_offset_days`, `escalation_enabled`) | ✅ | super_admin, admin |

> งาน cron `check_no_update_escalation` อ่านค่าจาก endpoint/ตารางนี้ — ถ้าไม่มีค่า ใช้ default 30/15/7 และ enabled=true

---

## 7. Module 6: Complaints ⭐

### 7.1 CRUD

| Method | Endpoint | Description | Auth | Roles | หมายเหตุ |
|--------|----------|-------------|:----:|-------|---------|
| GET | `/api/complaints` | ดูรายการเรื่องร้องเรียน | ✅ | ทุก Role (Login) | agency_officer/head เห็นเฉพาะของหน่วยงานตน · เรื่อง `is_anonymous` → mask `complainant_*` + `citizen_id` |
| GET | `/api/complaints/:id` | ดูรายละเอียดเรื่อง | ✅ | ทุก Role (Login) | agency/executive ไม่เห็นข้อมูลส่วนบุคคล · เรื่อง `is_anonymous` → mask ทุก Role (รวม officer/chief/admin) |
| POST | `/api/complaints` | สร้างเรื่องใหม่ (เจ้าหน้าที่บันทึก/แจ้งร้องทุกข์แทน) | ✅ | officer, chief, admin, super_admin | สร้างพร้อมสถานะ NEW, `source = STAFF`, เลือกช่องทางที่รับเรื่องมา |
| PUT | `/api/complaints/:id` | แก้ไขเรื่อง | ✅ | officer, chief, admin, super_admin | แก้ไขได้เฉพาะเรื่องที่ยังไม่ CLOSED |
| GET | `/api/complaints/:id/timeline` | ดู Timeline ของเรื่อง | ✅ | ทุก Role (Login) | รวม status logs + updates |

**Request Body — `POST /api/complaints` / `POST /api/public/complaints` / `POST /api/citizen/complaints`:**

```json
{
  "title": "string (required) — ชื่อเรื่องร้องเรียน",
  "description": "string (required)",
  "service_type_id": "int (required) — ประเภทงานบริการ",
  "complaint_nature_id": "int (required) — ลักษณะเรื่อง",
  "complainant_type_id": "int (required) — บุคคลธรรมดา/นิติบุคคล",
  "channel_id": "int (required)",
  "category_id": "int (optional — กำหนดตอนคัดกรองได้)",
  "priority": "HIGH|MEDIUM|LOW (default MEDIUM)",

  "complainant_name": "string (optional)",
  "complainant_id_card": "string (optional, 13 หลัก)",
  "complainant_phone": "string (REQUIRED — บังคับทุกกรณี รวม is_anonymous, BR-16)",
  "complainant_address": "string (optional)",
  "complainant_email": "string (optional)",
  "is_anonymous": "boolean (default false)",

  "province_id": "int (optional, default = ศรีสะเกษ)",
  "district_id": "int (optional)",
  "subdistrict_id": "int (optional)",
  "postal_code": "string (optional, 5 หลัก)",
  "incident_address": "string (optional) — สถานที่เกิดเหตุ",
  "latitude": "decimal (optional) — จาก GPS/เลือกบนแผนที่",
  "longitude": "decimal (optional)"
}
```

> **Validation:** `complainant_phone` บังคับกรอกเสมอ ทั้งกรณีออกนามและ `is_anonymous = true` (ถ้าไม่ส่ง → 400 `VALIDATION_ERROR`) · ไฟล์แนบหลักฐานอัปโหลดแยกผ่าน endpoint Attachments (multipart) — ดู §11

### 7.2 Filters

```
GET /api/complaints?status=IN_PROGRESS&category_id=1&agency_id=2&district_id=3
    &priority=HIGH&is_overdue=true&search=คำค้น
    &date_from=2026-01-01&date_to=2026-06-30
    &page=1&limit=20&sort=created_at&order=desc
```

### 7.3 Public APIs (ไม่ต้อง Login — Guest)

| Method | Endpoint | Description | Auth | Roles | หมายเหตุ |
|--------|----------|-------------|:----:|-------|---------|
| POST | `/api/public/complaints` | ประชาชนยื่นเรื่อง (Guest) | ❌ | Public | สร้างพร้อมสถานะ NEW, source = PUBLIC, citizen_id = NULL, รองรับ `is_anonymous` |
| GET | `/api/public/complaints/track/:complaint_number` | ติดตามสถานะด้วยเลขที่เรื่อง | ❌ | Public | แสดงสถานะแบบย่อ ไม่เห็นรายละเอียดภายใน |
| GET | `/api/public/categories` | ดูประเภทเรื่อง (สำหรับฟอร์มยื่นเรื่อง) | ❌ | Public | เฉพาะ is_active = true |
| GET | `/api/public/channels` | ดูช่องทาง | ❌ | Public | เฉพาะ is_active = true |
| GET | `/api/public/provinces` | ดูจังหวัด ⭐ | ❌ | Public | เฉพาะ is_active = true |
| GET | `/api/public/districts` | ดูอำเภอ | ❌ | Public | เฉพาะ is_active = true (filter ตาม province ได้) |
| GET | `/api/public/service-types` | ดูประเภทงานบริการ ⭐ | ❌ | Public | เฉพาะ is_active = true |
| GET | `/api/public/complaint-natures` | ดูลักษณะเรื่อง ⭐ | ❌ | Public | เฉพาะ is_active = true |
| GET | `/api/public/complainant-types` | ดูประเภทผู้ร้องเรียน ⭐ | ❌ | Public | เฉพาะ is_active = true |

> **`is_anonymous` ในการยื่นเรื่อง**: รองรับทั้ง `POST /api/public/complaints` (Guest), `POST /api/citizen/complaints` (สมาชิก) และ `POST /api/complaints` (staff). เมื่อ `true` ข้อมูลผู้ร้องยังถูกบันทึก แต่จะถูก mask จาก staff ทุก Role (ดู §7.4)

### 7.4 Identity Reveal (เปิดเผยตัวตนเรื่อง Anonymous) ⭐ ใหม่

| Method | Endpoint | Description | Auth | Roles | หมายเหตุ |
|--------|----------|-------------|:----:|-------|---------|
| POST | `/api/complaints/:id/reveal-identity` | เปิดเผยข้อมูลผู้ร้องของเรื่อง anonymous | ✅ | **super_admin** | Request: `{ reason }` (บังคับ) → Response: ข้อมูลผู้ร้องที่ unmask · บันทึก `anonymous_reveal_logs` + `audit_logs` (action `REVEAL_IDENTITY`) · ไม่เปลี่ยนค่า `is_anonymous` |

---

## 8. Module 7: Complaint Status Workflow

| Method | Endpoint | Description | Auth | Roles | หมายเหตุ |
|--------|----------|-------------|:----:|-------|---------|
| PATCH | `/api/complaints/:id/screen` | เริ่มคัดกรอง | ✅ | officer, chief | NEW → SCREENING (หรือ RETURNED → SCREENING, T-12) |
| PATCH | `/api/complaints/:id/reject` | ปฏิเสธเรื่อง | ✅ | officer, chief | SCREENING → REJECTED (T-03), body: `{ rejection_reason }` (บังคับ) |
| PATCH | `/api/complaints/:id/self-handle` | ศูนย์จัดการเอง | ✅ | officer, chief | SCREENING → IN_PROGRESS (T-13), body: `{ note }` (optional) |
| PATCH | `/api/complaints/:id/close` | ปิดเรื่อง | ✅ | officer, chief | REVIEWING → CLOSED (T-10) หรือ IN_PROGRESS → CLOSED (T-14 selfHandle), body: `{ closed_summary }` (บังคับ) |
| PATCH | `/api/complaints/:id/review` | เริ่มตรวจสอบผล | ✅ | officer, chief | RESOLVED → REVIEWING (T-09) |
| PATCH | `/api/complaints/:id/send-back` | ส่งกลับแก้ไข | ✅ | officer, chief | REVIEWING → IN_PROGRESS (T-11), body: `{ note }` |

---

## 9. Module 8: Complaint Assignment

| Method | Endpoint | Description | Auth | Roles | หมายเหตุ |
|--------|----------|-------------|:----:|-------|---------|
| POST | `/api/complaints/:id/assign` | ส่งต่อหน่วยงาน | ✅ | officer, chief | SCREENING → ASSIGNED, Request: `{ agency_id, note }` |
| GET | `/api/complaints/:id/assignments` | ดูประวัติการส่งต่อ | ✅ | ทุก Role (Login) | — |
| PATCH | `/api/assignments/:id/accept` | หน่วยงานรับเรื่อง | ✅ | agency_officer, agency_head | ASSIGNED → ACCEPTED |
| PATCH | `/api/assignments/:id/return` | หน่วยงานส่งคืน | ✅ | agency_officer, agency_head | ASSIGNED/ACCEPTED → RETURNED, ต้องมี `return_reason` |
| PATCH | `/api/assignments/:id/start` | เริ่มดำเนินการ | ✅ | agency_officer, agency_head | ACCEPTED → IN_PROGRESS |
| PATCH | `/api/assignments/:id/resolve` | ส่งผลดำเนินการ | ✅ | agency_officer, agency_head | IN_PROGRESS → RESOLVED, ต้องมี `content` |

---

## 10. Module 9: Complaint Updates

| Method | Endpoint | Description | Auth | Roles | หมายเหตุ |
|--------|----------|-------------|:----:|-------|---------|
| GET | `/api/complaints/:id/updates` | ดูรายการอัปเดตทั้งหมด | ✅ | ทุก Role (Login) | เรียงตาม created_at DESC |
| POST | `/api/complaints/:id/updates` | เพิ่มอัปเดตความคืบหน้า | ✅ | agency_officer, agency_head | Request: `{ content, update_type }` |

---

## 11. Module 10: Attachments

| Method | Endpoint | Description | Auth | Roles | หมายเหตุ |
|--------|----------|-------------|:----:|-------|---------|
| GET | `/api/complaints/:id/attachments` | ดูรายการไฟล์แนบ | ✅ | ทุก Role (Login) | — |
| POST | `/api/complaints/:id/attachments` | อัปโหลดไฟล์แนบ | ✅ | officer, chief, agency_officer, agency_head | multipart/form-data, max 10MB |
| GET | `/api/attachments/:id/download` | ดาวน์โหลดไฟล์ | ✅ | ทุก Role (Login) | — |
| DELETE | `/api/attachments/:id` | ลบไฟล์แนบ | ✅ | super_admin, admin | Soft Delete |
| POST | `/api/public/complaints/attachments` | อัปโหลดไฟล์ (Public) | ❌ | Public | ใช้ตอนยื่นเรื่อง |

---

## 12. Module 11: Notifications

| Method | Endpoint | Description | Auth | Roles | หมายเหตุ |
|--------|----------|-------------|:----:|-------|---------|
| GET | `/api/notifications` | ดูรายการแจ้งเตือน | ✅ | ทุก Role (Login) | เฉพาะของผู้ใช้ปัจจุบัน, Pagination |
| GET | `/api/notifications/unread-count` | นับจำนวนแจ้งเตือนที่ยังไม่อ่าน | ✅ | ทุก Role (Login) | Response: `{ count: 5 }` |
| PATCH | `/api/notifications/:id/read` | Mark as Read | ✅ | ทุก Role (Login) | — |
| PATCH | `/api/notifications/read-all` | Mark All as Read | ✅ | ทุก Role (Login) | — |

> **ประเภทแจ้งเตือน (`type`)** รวม `NEW_PUBLIC_COMPLAINT`, `NEW_ASSIGNMENT`, `ASSIGNMENT_ACCEPTED/RETURNED`, `COMPLAINT_RESOLVED/SENT_BACK/CLOSED`, `NEAR_DUE_WARNING`, `OVERDUE_ALERT` และ **`NO_UPDATE_L1/L2/L3`** (เร่งรัดการอัพเดตสถานะ 30/45/52 วัน — สร้างโดย Scheduled Job, ดู `08` §3.1, §4.3). ไม่มี endpoint เพิ่ม — เป็นงาน cron ฝั่ง Backend

---

## 13. Module 12: Dashboard

| Method | Endpoint | Description | Auth | Roles | หมายเหตุ |
|--------|----------|-------------|:----:|-------|---------|
| GET | `/api/dashboard/summary` | สรุปจำนวนเรื่องตามสถานะ | ✅ | ทุก Role (Login) | agency เห็นเฉพาะของตน |
| GET | `/api/dashboard/by-category` | สถิติตามประเภทเรื่อง | ✅ | officer, chief, admin, executive | — |
| GET | `/api/dashboard/by-agency` | สถิติตามหน่วยงาน | ✅ | officer, chief, admin, executive | — |
| GET | `/api/dashboard/by-district` | สถิติตามพื้นที่ | ✅ | officer, chief, admin, executive | — |
| GET | `/api/dashboard/by-status` | สถิติตามสถานะ | ✅ | ทุก Role (Login) | — |
| GET | `/api/dashboard/trend` | แนวโน้มรายเดือน | ✅ | officer, chief, admin, executive | Query: `?year=2026` |
| GET | `/api/dashboard/overdue` | รายการเรื่องเกินกำหนด | ✅ | officer, chief, admin | — |
| GET | `/api/dashboard/near-due` | รายการเรื่องใกล้ครบกำหนด | ✅ | officer, chief, admin | เหลือ ≤ 3 วัน |

**Filters สำหรับทุก Dashboard API:**

```
?date_from=2026-01-01&date_to=2026-06-30&agency_id=1&category_id=2&district_id=3
```

---

## 14. Module 13: Reports

| Method | Endpoint | Description | Auth | Roles | หมายเหตุ |
|--------|----------|-------------|:----:|-------|---------|
| GET | `/api/reports/monthly` | รายงานสรุปรายเดือน | ✅ | officer, chief, admin, executive | Query: `?year=2026&month=6` |
| GET | `/api/reports/by-category` | รายงานตามประเภทเรื่อง | ✅ | officer, chief, admin, executive | — |
| GET | `/api/reports/by-agency` | รายงานตามหน่วยงาน | ✅ | officer, chief, admin, executive | — |
| GET | `/api/reports/overdue` | รายงานเรื่องเกินกำหนด | ✅ | officer, chief, admin, executive | — |
| GET | `/api/reports/export/excel` | Export รายงานเป็น Excel | ✅ | officer, chief, admin, executive, agency_head | Query: `?type=monthly&year=2026&month=6` |

**Report Filters:**

```
?date_from=2026-01-01&date_to=2026-06-30&category_id=1&agency_id=2&status=CLOSED
```

---

## 15. Module 14: Audit Logs

| Method | Endpoint | Description | Auth | Roles | หมายเหตุ |
|--------|----------|-------------|:----:|-------|---------|
| GET | `/api/audit-logs` | ดูรายการ Audit Log | ✅ | super_admin, admin | Pagination + Filter |
| GET | `/api/audit-logs/:id` | ดูรายละเอียด Log | ✅ | super_admin, admin | รวม details (JSON) |

**Audit Log Filters:**

```
?user_id=1&action=UPDATE&resource=complaints&date_from=2026-01-01&date_to=2026-06-30
```

---

## 16. API Summary

| Module | จำนวน Endpoints | หมายเหตุ |
|--------|:--------------:|---------|
| Auth | 4 | Login, Logout, Me, Change Password |
| **Citizen** ⭐ | **9** | Register, Login, Logout, Me, Change Password, Profile, My-Complaints (list/detail), Submit |
| Users | 5 | CRUD + Status |
| Agencies | 5 | CRUD + Status |
| Categories | 5 | CRUD + Status |
| Master Data (Channels, Provinces, Districts) | 12 | Channels + Provinces ⭐ + Districts + Subdistricts |
| Master Data (Service Types, Natures, Complainant Types) ⭐ | 9 | 3 ชุด × (GET + POST/PUT + Status) |
| Complaints | 5 + 8 Public + 1 Reveal | CRUD + Timeline + Public APIs (รวม master ใหม่) + Identity Reveal (super_admin) |
| Status Workflow | 5 | Screen, Reject, Close, Review, Send-back |
| Assignment | 6 | Assign, Accept, Return, Start, Resolve + History |
| Updates | 2 | List + Create |
| Attachments | 5 | List, Upload, Download, Delete + Public Upload |
| Notifications | 4 | List, Unread Count, Read, Read All |
| Dashboard | 8 | Summary, By Category/Agency/District/Status, Trend, Overdue, Near Due |
| Reports | 5 | Monthly, By Category/Agency, Overdue, Export |
| Audit Logs | 2 | List + Detail |
| **รวม** | **~100** | (เดิม ~77 + Master Data ใหม่/Public ~23) |

---

## 17. Audit Logging Rule

ทุก API ที่เป็น `POST`, `PUT`, `PATCH`, `DELETE` ต้องบันทึก Audit Log อัตโนมัติ:

| ข้อมูลที่บันทึก | ที่มา |
|----------------|------|
| `user_id` | จาก JWT Token |
| `action` | จาก HTTP Method (POST→CREATE, PUT→UPDATE, PATCH→UPDATE, DELETE→DELETE) |
| `resource` | จาก Endpoint (เช่น `complaints`, `users`) |
| `resource_id` | จาก Path Parameter (:id) |
| `details` | JSON ของ Request Body |
| `ip_address` | จาก Request Header |

---

## 18. Authorization Rule Summary

| Resource | Create | Read | Update | Delete |
|----------|:------:|:----:|:------:|:------:|
| Citizen (self) | citizen (register) | citizen (own) | citizen (own) | — (Soft Delete via is_active) |
| Identity Reveal | super_admin | — | — | — |
| Users | super_admin, admin | super_admin, admin | super_admin, admin | super_admin, admin |
| Agencies | super_admin, admin | ทุก Role | super_admin, admin | super_admin, admin |
| Categories | super_admin, admin | ทุก Role | super_admin, admin | super_admin, admin |
| Complaints | officer, chief | ทุก Role ⚠️ | officer, chief | super_admin |
| Assignment | officer, chief | ทุก Role ⚠️ | agency_officer, agency_head | — |
| Updates | agency_officer, agency_head | ทุก Role ⚠️ | — | — |
| Dashboard | — | ทุก Role ⚠️ | — | — |
| Reports | — | officer+, executive | — | — |
| Audit Logs | — | super_admin, admin | — | — |

> ⚠️ agency_officer/head เห็นเฉพาะข้อมูลของหน่วยงานตนเอง

---

## 19. Assumptions

| # | สมมติฐาน |
|---|---------|
| A-1 | ไม่มี Rate Limiting ใน Phase แรก |
| A-2 | ไม่มี API Versioning ใน Phase แรก (ใช้ `/api/...` ไม่ใช่ `/api/v1/...`) |
| A-3 | File Upload ใช้ Local Storage ไม่ใช่ Cloud Storage |
| A-4 | Dashboard API คำนวณ Real-time (ไม่มี Cache) ใน Phase แรก |

---

## 20. Open Questions

| # | คำถาม | ส่งผลต่อ |
|---|-------|---------|
| Q-1 | ต้องการ API Versioning (`/api/v1/...`) ตั้งแต่ Phase แรกหรือไม่? | URL Structure |
| Q-2 | ต้องการ Refresh Token หรือใช้ Login ใหม่เมื่อ Token หมดอายุ? | Auth Flow |
| Q-3 | ต้องการ WebSocket สำหรับ Real-time Notification หรือใช้ Polling? | Notification Architecture |

---

> **เอกสารถัดไป:** `docs/planning/07-frontend-pages.md` — Frontend Page Structure
