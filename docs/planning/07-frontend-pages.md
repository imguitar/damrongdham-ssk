# 07 — Frontend Page Structure: ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด

> เอกสารฉบับนี้เป็นส่วนหนึ่งของขั้นตอน Planning Only — ยังไม่มีการเขียน Code
> อ้างอิงจาก: `01` ~ `06` Planning Documents

---

## 1. Frontend Design Goals

| # | เป้าหมาย |
|---|---------|
| FG-1 | ใช้งานง่าย เหมาะกับเจ้าหน้าที่ราชการที่อาจไม่คุ้นเคยเทคโนโลยี |
| FG-2 | แสดงข้อมูลชัดเจน อ่านง่าย ใช้สีบ่งบอกสถานะ |
| FG-3 | Responsive (Desktop เป็นหลัก, Tablet รอง) |
| FG-4 | แยกหน้าจอตาม Role ชัดเจน |
| FG-5 | Navigation ง่าย ไม่ซับซ้อน |
| FG-6 | ใช้ MUI Component มาตรฐาน ไม่ Custom มาก |

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| UI Library | MUI (Material UI) v5 |
| Routing | React Router v6 |
| State | React Context + useState (Phase แรก ไม่ใช้ Redux) |
| HTTP Client | Axios |
| Charts | Recharts หรือ Chart.js |
| Date | Day.js |
| Form Validation | React Hook Form + Yup (หรือ MUI form validation) |
| Export | SheetJS (xlsx) สำหรับ Export Excel |
| Map ⭐ | **Leaflet + react-leaflet** (+ OpenStreetMap tiles) สำหรับปักหมุดจุดเกิดเหตุ (GPS/เลือกพิกัด) — เป็นไลบรารีแผนที่เฉพาะทาง ใช้ร่วมกับ MUI ได้ (ไม่ขัดกับกฎ UI = MUI) |

---

## 3. Main Layout Structure

### 3.1 Layout สำหรับผู้ใช้งานที่ Login แล้ว (Admin Layout)

```
┌─────────────────────────────────────────────────┐
│  Topbar                                          │
│  [Logo] [ชื่อระบบ]      [🔔 แจ้งเตือน] [👤 User] │
├──────────┬──────────────────────────────────────┤
│          │                                       │
│ Sidebar  │            Main Content               │
│          │                                       │
│ [Menu]   │   (เปลี่ยนตาม Route)                   │
│ [Menu]   │                                       │
│ [Menu]   │                                       │
│ [Menu]   │                                       │
│          │                                       │
│          │                                       │
└──────────┴──────────────────────────────────────┘
```

**Topbar ประกอบด้วย:**
- Logo + ชื่อระบบ (ซ้าย)
- ปุ่ม Toggle Sidebar (ซ้าย)
- Badge จำนวนแจ้งเตือนที่ยังไม่อ่าน (ขวา)
- ชื่อผู้ใช้ + Role + Dropdown (Logout, เปลี่ยนรหัสผ่าน) (ขวา)

**Sidebar ประกอบด้วย:**
- เมนูเปลี่ยนตาม Role ของผู้ใช้
- สามารถ Collapse/Expand ได้

### 3.2 Layout สำหรับหน้า Public (No Login)

```
┌─────────────────────────────────────────────────┐
│  Public Header                                   │
│  [Logo] [ศูนย์ดำรงธรรมจังหวัด]                    │
├─────────────────────────────────────────────────┤
│                                                  │
│              Main Content                        │
│         (ยื่นเรื่อง / ติดตามสถานะ)                │
│                                                  │
├─────────────────────────────────────────────────┤
│  Footer                                          │
└─────────────────────────────────────────────────┘
```

---

## 4. Navigation Structure (Sidebar Menu by Role)

### 4.1 Super Admin / Admin

| ลำดับ | Menu | Icon | Path |
|-------|------|------|------|
| 1 | Dashboard | 📊 | `/dashboard` |
| 2 | เรื่องร้องเรียน | 📋 | `/complaints` |
| 3 | รายงาน | 📈 | `/reports` |
| 4 | แจ้งเตือน | 🔔 | `/notifications` |
| — | — | — | **หมวด: จัดการระบบ** |
| 5 | ผู้ใช้งาน | 👥 | `/users` |
| 6 | หน่วยงาน | 🏢 | `/agencies` |
| 7 | ตั้งค่า Master Data | ⚙️ | `/settings` |
| 8 | Audit Log | 📝 | `/audit-logs` |

### 4.2 เจ้าหน้าที่ศูนย์ดำรงธรรม (Officer) / หัวหน้าศูนย์ (Chief)

| ลำดับ | Menu | Icon | Path |
|-------|------|------|------|
| 1 | Dashboard | 📊 | `/dashboard` |
| 2 | เรื่องร้องเรียน | 📋 | `/complaints` |
| 3 | รายงาน | 📈 | `/reports` |
| 4 | แจ้งเตือน | 🔔 | `/notifications` |

### 4.3 เจ้าหน้าที่หน่วยงาน (Agency Officer) / หัวหน้าหน่วยงาน (Agency Head)

| ลำดับ | Menu | Icon | Path |
|-------|------|------|------|
| 1 | Dashboard | 📊 | `/dashboard` |
| 2 | เรื่องที่ได้รับมอบหมาย | 📋 | `/complaints` |
| 3 | แจ้งเตือน | 🔔 | `/notifications` |

### 4.4 ผู้บริหาร (Executive)

| ลำดับ | Menu | Icon | Path |
|-------|------|------|------|
| 1 | Dashboard | 📊 | `/dashboard` |
| 2 | เรื่องร้องเรียน | 📋 | `/complaints` |
| 3 | รายงาน | 📈 | `/reports` |

---

## 5. Route Structure

### 5.1 Public Routes (ไม่ต้อง Login)

| Path | Page | Description |
|------|------|-------------|
| `/login` | Login Page | หน้า Login (เจ้าหน้าที่) |
| `/public/complaints/new` | Public Complaint Form | ประชาชนยื่นเรื่อง (Guest) |
| `/public/track` | Public Tracking | ประชาชนติดตามสถานะด้วยเลขที่เรื่อง |

### 5.1A Citizen Routes (สมาชิกประชาชน) ⭐ ใหม่

> Layout = Public/Citizen Layout (ไม่มี Sidebar ของ staff) · ใช้ `CitizenAuthContext` แยกจาก staff · Guard = `CitizenProtectedRoute`

| Path | Page | Auth | Description |
|------|------|:----:|-------------|
| `/citizen/register` | Citizen Register | ❌ | สมัครสมาชิก |
| `/citizen/login` | Citizen Login | ❌ | เข้าสู่ระบบสมาชิก |
| `/citizen` (หรือ `/citizen/complaints`) | My Complaints | ✅ | "เรื่องของฉัน" — รายการเรื่องที่เคยยื่น + สถานะ |
| `/citizen/complaints/new` | Citizen Complaint Form | ✅ | ยื่นเรื่องแบบสมาชิก (pre-fill โปรไฟล์) |
| `/citizen/complaints/:complaint_number` | My Complaint Detail | ✅ | สถานะ/Timeline ย่อ ของเรื่องตนเอง |
| `/citizen/profile` | Citizen Profile | ✅ | แก้ไขข้อมูลส่วนตัว + เปลี่ยนรหัสผ่าน |

### 5.2 Protected Routes (ต้อง Login)

| Path | Page | Allowed Roles |
|------|------|--------------|
| `/dashboard` | Dashboard | ทุก Role |
| `/complaints` | Complaint List | ทุก Role |
| `/complaints/new` | Create Complaint | officer, chief, admin, super_admin |
| `/complaints/:id` | Complaint Detail | ทุก Role |
| `/complaints/:id/edit` | Edit Complaint | officer, chief, admin, super_admin |
| `/reports` | Reports | officer, chief, admin, super_admin, executive |
| `/notifications` | Notification List | ทุก Role |
| `/users` | User Management | super_admin, admin |
| `/users/new` | Create User | super_admin, admin |
| `/users/:id/edit` | Edit User | super_admin, admin |
| `/agencies` | Agency Management | super_admin, admin |
| `/settings` | Master Data Settings | super_admin, admin |
| `/settings/categories` | Category Management | super_admin, admin |
| `/settings/channels` | Channel Management | super_admin, admin |
| `/settings/service-types` ⭐ | Service Type Management | super_admin, admin |
| `/settings/complaint-natures` ⭐ | Complaint Nature Management | super_admin, admin |
| `/settings/complainant-types` ⭐ | Complainant Type Management | super_admin, admin |
| `/settings/provinces` ⭐ | Province Management | super_admin, admin |
| `/settings/districts` | District Management | super_admin, admin |
| `/settings/escalation` ⭐ (Phase ถัดไป) | Escalation Settings (เกณฑ์เร่งรัดอัพเดต) | super_admin, admin |
| `/audit-logs` | Audit Logs | super_admin, admin |
| `/profile` | My Profile | ทุก Role |
| `/change-password` | Change Password | ทุก Role |

### 5.3 Error Pages

| Path | Page | Description |
|------|------|-------------|
| `/403` | Forbidden | ไม่มีสิทธิ์เข้าถึง |
| `/404` | Not Found | ไม่พบหน้า |
| `*` | Redirect to 404 | Route ที่ไม่มี |

---

## 6. Page Details

### 6.1 Login Page (`/login`)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Center Layout (ไม่มี Sidebar) |
| **Roles** | ทุกคน (ก่อน Login) |
| **Form Fields** | Username, Password |
| **Actions** | ปุ่ม "เข้าสู่ระบบ" |
| **Validation** | Required ทั้ง 2 Field |
| **Error State** | แสดง Alert เมื่อ Login ผิด |
| **API** | `POST /api/auth/login` |
| **After Login** | Redirect ไป `/dashboard` |
| **Links** | "ยื่นเรื่องร้องเรียน (สำหรับประชาชน)" → `/public/complaints/new` · "สำหรับประชาชน (สมาชิก)" → `/citizen/login` |

---

### 6.2 Dashboard (`/dashboard`)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Admin Layout |
| **Roles** | ทุก Role (Login) — ข้อมูลแตกต่างตาม Role |

**Dashboard Cards (Summary):**

| Card | สี | Icon | ข้อมูล | API |
|------|----|------|-------|-----|
| เรื่องทั้งหมด | น้ำเงิน | 📋 | จำนวนเรื่องทั้งหมด | `GET /api/dashboard/summary` |
| เรื่องใหม่วันนี้ | ฟ้า | 🆕 | เรื่องที่สร้างวันนี้ | `GET /api/dashboard/summary` |
| กำลังดำเนินการ | ส้ม | ⚙️ | เรื่องที่ยังไม่ปิด | `GET /api/dashboard/summary` |
| เกินกำหนด | แดง | 🔴 | เรื่องเกิน Due Date | `GET /api/dashboard/summary` |
| ปิดเรื่องแล้ว | เขียว | ✅ | เรื่องที่ปิดแล้ว | `GET /api/dashboard/summary` |
| ใกล้ครบกำหนด | เหลือง | ⚠️ | เรื่องที่เหลือ ≤ 3 วัน | `GET /api/dashboard/summary` |

**Charts:**

| Chart | ประเภท | API |
|-------|--------|-----|
| สัดส่วนตามประเภทเรื่อง | Pie Chart | `GET /api/dashboard/by-category` |
| จำนวนตามหน่วยงาน | Bar Chart | `GET /api/dashboard/by-agency` |
| สัดส่วนตามสถานะ | Donut Chart | `GET /api/dashboard/by-status` |
| แนวโน้มรายเดือน | Line Chart | `GET /api/dashboard/trend` |

**Tables:**

| ตาราง | ข้อมูล | API |
|-------|--------|-----|
| เรื่องเกินกำหนด (Top 10) | เลขที่, เรื่อง, หน่วยงาน, Due Date, จำนวนวันเกิน | `GET /api/dashboard/overdue` |
| เรื่องใกล้ครบกำหนด (Top 10) | เลขที่, เรื่อง, หน่วยงาน, Due Date, จำนวนวันเหลือ | `GET /api/dashboard/near-due` |

**Filters:** Date Range (เดือน/ปี)

> **หมายเหตุ Role:**
> - Agency Officer/Head จะเห็น Dashboard เฉพาะของหน่วยงานตนเอง
> - Executive เห็นภาพรวมทั้งจังหวัดแต่ไม่เห็นรายละเอียดส่วนบุคคล

---

### 6.3 Complaint List (`/complaints`)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Admin Layout |
| **Roles** | ทุก Role (Login) |

**Table Columns:**

| Column | Description | Sortable |
|--------|-------------|:--------:|
| เลขที่เรื่อง | DC-YYYYMM-XXXX (Link ไป Detail) | ✅ |
| เรื่อง | หัวเรื่องร้องเรียน | ✅ |
| ประเภท | ประเภทเรื่อง (Chip สี) | ✅ |
| สถานะ | Chip สีตามสถานะ | ✅ |
| Priority | สูง/ปานกลาง/ต่ำ (Chip สี) | ✅ |
| หน่วยงาน | หน่วยงานที่รับผิดชอบ | ✅ |
| วันที่รับเรื่อง | DD/MM/YYYY | ✅ |
| ครบกำหนด | DD/MM/YYYY (แดงถ้าเกิน) | ✅ |
| ⚠️ | Icon เตือนถ้า Overdue / Near Due | — |

**Filters:**

| Filter | Type | API Parameter |
|--------|------|--------------|
| ค้นหา | Text Field | `search` |
| สถานะ | Multi-Select | `status` |
| ประเภท | Select | `category_id` |
| หน่วยงาน | Select | `agency_id` |
| Priority | Select | `priority` |
| พื้นที่ | Select | `district_id` |
| ช่วงวันที่ | Date Range Picker | `date_from`, `date_to` |
| เกินกำหนด | Checkbox | `is_overdue` |

**Actions:**

| Action | ปุ่ม | Roles |
|--------|------|-------|
| สร้างเรื่องใหม่ | ปุ่ม "➕ รับเรื่องใหม่" (มุมขวาบน) | officer, chief, admin |
| Export Excel | ปุ่ม "📥 Export" | officer, chief, admin, executive |

**API:** `GET /api/complaints` (Pagination + Filter)

---

### 6.4 Create Complaint (`/complaints/new`)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Admin Layout |
| **Roles** | officer, chief, admin, super_admin |

**Form Fields:**

| Section | Field | Type | Required | หมายเหตุ |
|---------|-------|------|:--------:|---------|
| **ข้อมูลเรื่อง** | ชื่อเรื่องร้องเรียน (Title) | Text | ✅ | |
| | รายละเอียด | Textarea | ✅ | |
| | ประเภทงานบริการ ⭐ | Select (service_types) | ✅ | ทั่วไป/สำคัญ/บัตรสนเท่ห์/ผลกระทบวงกว้าง/นโยบายสำคัญ |
| | ลักษณะเรื่อง ⭐ | Select (complaint_natures) | ✅ | 8 ลักษณะ |
| | ประเภทเรื่อง | Select (categories) | ✅ | |
| | ช่องทางรับเรื่อง ⭐ | Select (channels) | ✅ | จดหมาย/ลงพื้นที่/ตู้ราชสีห์/1567/Walk In/เว็บไซต์/MOI1567/ผ่านหน่วยงานอื่น/อื่น ๆ |
| | Priority | Select (สูง/ปานกลาง/ต่ำ) | ✅ | Default: ปานกลาง |
| **ข้อมูลผู้ร้อง** | ประเภทผู้ร้องเรียน ⭐ | Select (complainant_types) | ✅ | บุคคลธรรมดา/นิติบุคคล |
| | ไม่ระบุตัวตน (ปกปิดตัวตน) | Checkbox | — | ถ้าเลือก จะ mask ข้อมูลผู้ร้องจาก staff (เบอร์โทรยังบังคับกรอก) |
| | ชื่อ-นามสกุล | Text | ❌ | |
| | เลขบัตรประชาชน | Text (13 หลัก) | ❌ | |
| | **เบอร์โทร** ⭐ | Text | ✅ | **บังคับกรอกเสมอ** ทั้งออกนาม/ปกปิดตัวตน (BR-16) |
| | ที่อยู่ | Textarea | ❌ | |
| | อีเมล | Email | ❌ | |
| **จุดเกิดเหตุ** ⭐ | จังหวัด | Select (provinces) | ❌ | Default: ศรีสะเกษ |
| | อำเภอ | Select (districts) | ❌ | Filter ตามจังหวัด |
| | ตำบล | Select (subdistricts) | ❌ | Filter ตามอำเภอ |
| | รหัสไปรษณีย์ | Text (5 หลัก) | ❌ | |
| | สถานที่เกิดเหตุ | Textarea | ❌ | รายละเอียด/จุดสังเกต |
| | แผนที่ปักหมุด | `LocationMapPicker` (Leaflet) | ❌ | ปุ่ม "ใช้ตำแหน่งปัจจุบัน (GPS)" + คลิกเลือกพิกัดบนแผนที่ → เก็บ latitude/longitude |
| **ไฟล์แนบหลักฐาน** | อัปโหลดไฟล์ | File Upload (Multi) | ❌ | Max 10MB/ไฟล์ · jpg, jpeg, png, pdf, doc, docx |

**Actions:** ปุ่ม "บันทึก", ปุ่ม "ยกเลิก"

> **หมายเหตุ:** หน้านี้คือช่องทางให้ **เจ้าหน้าที่ศูนย์ดำรงธรรมบันทึก/แจ้งร้องทุกข์แทนประชาชน** (`source = STAFF`) โดยเลือกช่องทางที่รับเรื่องมาได้ครบทุกช่องทาง

**API:** `POST /api/complaints`

---

### 6.5 Complaint Detail (`/complaints/:id`)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Admin Layout |
| **Roles** | ทุก Role (Login) — ข้อมูลแตกต่างตาม Role |

**Sections:**

| Section | เนื้อหา |
|---------|--------|
| **Header** | เลขที่เรื่อง, สถานะ (Chip สี), Priority (Chip), ปุ่ม Actions |
| **ข้อมูลเรื่อง** | เรื่อง, รายละเอียด, ประเภท, ช่องทาง, พื้นที่, วันที่รับเรื่อง, ครบกำหนด |
| **ข้อมูลผู้ร้อง** | ชื่อ, เลขบัตร, เบอร์โทร, ที่อยู่ ⚠️ เฉพาะ officer/chief/admin · ถ้าเรื่อง **ปกปิดตัวตน** แสดงป้าย "🕶️ ปกปิดตัวตน" แทนข้อมูล (mask ทุก Role) — super_admin มีปุ่ม "เปิดเผยตัวตน" |
| **การส่งต่อ** | หน่วยงาน, วันที่ส่งต่อ, สถานะ Assignment, ผู้ส่งต่อ |
| **Timeline** | ลำดับเหตุการณ์ทั้งหมด (Status Changes + Updates) เรียงตามเวลา |
| **ไฟล์แนบ** | รายการไฟล์แนบ พร้อมปุ่มดาวน์โหลด |

**Action Buttons (แสดงตามสถานะ + Role):**

| ปุ่ม | แสดงเมื่อสถานะ | Roles | API |
|------|--------------|-------|-----|
| ✏️ แก้ไข | ไม่ใช่ CLOSED/REJECTED | officer, chief, admin | — |
| 🔍 เริ่มคัดกรอง | NEW | officer, chief | `PATCH /api/complaints/:id/screen` |
| 📤 ส่งต่อหน่วยงาน | SCREENING | officer, chief | `POST /api/complaints/:id/assign` |
| ❌ ปฏิเสธเรื่อง | SCREENING | officer, chief | `PATCH /api/complaints/:id/reject` |
| ✅ รับเรื่อง | ASSIGNED | agency_officer, agency_head | `PATCH /api/assignments/:id/accept` |
| ↩️ ส่งคืน | ASSIGNED/ACCEPTED | agency_officer, agency_head | `PATCH /api/assignments/:id/return` |
| ▶️ เริ่มดำเนินการ | ACCEPTED | agency_officer, agency_head | `PATCH /api/assignments/:id/start` |
| 📝 อัปเดตผล | IN_PROGRESS | agency_officer, agency_head | `POST /api/complaints/:id/updates` |
| ✅ ส่งผลดำเนินการ | IN_PROGRESS | agency_officer, agency_head | `PATCH /api/assignments/:id/resolve` |
| 🔍 เริ่มตรวจสอบผล | RESOLVED | officer, chief | `PATCH /api/complaints/:id/review` |
| ✅ ปิดเรื่อง | REVIEWING | officer, chief | `PATCH /api/complaints/:id/close` |
| ↩️ ส่งกลับแก้ไข | REVIEWING | officer, chief | `PATCH /api/complaints/:id/send-back` |
| 🕶️ เปิดเผยตัวตน | เรื่องที่ `is_anonymous` | **super_admin** | `POST /api/complaints/:id/reveal-identity` (บังคับกรอกเหตุผล) |

**APIs:**
- `GET /api/complaints/:id`
- `GET /api/complaints/:id/timeline`
- `GET /api/complaints/:id/attachments`
- `GET /api/complaints/:id/assignments`

---

### 6.6 Edit Complaint (`/complaints/:id/edit`)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Admin Layout |
| **Roles** | officer, chief, admin, super_admin |
| **Form** | เหมือน Create แต่มีข้อมูลเดิมแสดง |
| **Condition** | แก้ไขได้เฉพาะเรื่องที่ยังไม่ CLOSED/REJECTED |
| **API** | `GET /api/complaints/:id` → `PUT /api/complaints/:id` |

---

### 6.7 Reports (`/reports`)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Admin Layout |
| **Roles** | officer, chief, admin, super_admin, executive, agency_head |

**Report Types (Tabs):**

| Tab | เนื้อหา | API |
|-----|--------|-----|
| สรุปรายเดือน | ตารางสรุปจำนวนเรื่องแยกตามสถานะ | `GET /api/reports/monthly` |
| ตามประเภทเรื่อง | ตาราง + Bar Chart | `GET /api/reports/by-category` |
| ตามหน่วยงาน | ตาราง + Bar Chart | `GET /api/reports/by-agency` |
| เรื่องเกินกำหนด | ตารางรายละเอียดเรื่องที่เกิน Due Date | `GET /api/reports/overdue` |

**Filters:** Date Range, ประเภท, หน่วยงาน, สถานะ

**Actions:** ปุ่ม "📥 Export Excel" → `GET /api/reports/export/excel`

---

### 6.8 Notification List (`/notifications`)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Admin Layout |
| **Roles** | ทุก Role (Login) |
| **List** | รายการแจ้งเตือนเรียงตามวันที่ล่าสุด |
| **Each Item** | Icon + Title + Message + เวลา + สถานะ (อ่าน/ยังไม่อ่าน) |
| **Actions** | Click → ไปยังเรื่องที่เกี่ยวข้อง, ปุ่ม "อ่านทั้งหมด" |
| **API** | `GET /api/notifications`, `PATCH /api/notifications/:id/read` |

---

### 6.9 User Management (`/users`)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Admin Layout |
| **Roles** | super_admin, admin |

**Table Columns:** ชื่อ, Username, Role, หน่วยงาน, สถานะ (Active/Inactive), วันที่สร้าง

**Actions:**
- ปุ่ม "➕ สร้างผู้ใช้ใหม่"
- ปุ่ม Edit ของแต่ละแถว
- Toggle Active/Inactive

**API:** `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `PATCH /api/users/:id/status`

---

### 6.10 Agency Management (`/agencies`)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Admin Layout |
| **Roles** | super_admin, admin |

**Table Columns:** ชื่อหน่วยงาน, ชื่อย่อ, เบอร์โทร, สถานะ

**Actions:** สร้างใหม่, แก้ไข, Toggle Active

**API:** `GET /api/agencies`, `POST /api/agencies`, `PUT /api/agencies/:id`

---

### 6.11 Master Data Settings (`/settings`)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Admin Layout |
| **Roles** | super_admin, admin |

**Sub-pages (Tabs หรือ Sub-routes):**

| Tab | Path | Table Columns | Actions |
|-----|------|--------------|---------|
| ประเภทเรื่อง | `/settings/categories` | ชื่อ, SLA (วัน), สถานะ | CRUD + Toggle |
| ช่องทางรับเรื่อง | `/settings/channels` | ชื่อ, สถานะ | CRUD + Toggle |
| ประเภทงานบริการ ⭐ | `/settings/service-types` | ชื่อ, คำอธิบาย, สถานะ | CRUD + Toggle |
| ลักษณะเรื่อง ⭐ | `/settings/complaint-natures` | ชื่อ, คำอธิบาย, สถานะ | CRUD + Toggle |
| ประเภทผู้ร้องเรียน ⭐ | `/settings/complainant-types` | ชื่อ, สถานะ | CRUD + Toggle |
| จังหวัด ⭐ | `/settings/provinces` | ชื่อ, รหัส, จำนวนอำเภอ, สถานะ | CRUD + Toggle |
| อำเภอ | `/settings/districts` | จังหวัด, ชื่อ, รหัส, จำนวนตำบล, สถานะ | CRUD + Toggle |
| ตำบล | `/settings/districts/:id/subdistricts` | ชื่อ, รหัส, สถานะ | CRUD + Toggle |
| ตั้งค่าการเร่งรัด ⭐ (Phase ถัดไป) | `/settings/escalation` | เปิด/ปิดการเร่งรัด, จำนวนวันครั้งที่ 1 (default 30), +วันครั้งที่ 2 (default 15), +วันครั้งที่ 3 (default 7) | แก้ไขค่า (Form) |

> **ตั้งค่าการเร่งรัด** เป็นฟอร์มแก้ค่า (ไม่ใช่ตาราง CRUD) บันทึกผ่าน `PUT /api/settings` — ดู `08` §4.3.5 (Phase ถัดไป)

---

### 6.12 Audit Logs (`/audit-logs`)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Admin Layout |
| **Roles** | super_admin, admin |
| **Table** | วันเวลา, ผู้กระทำ, Action, Resource, Resource ID, IP |
| **Filters** | ผู้กระทำ, Action, Resource, ช่วงวันที่ |
| **API** | `GET /api/audit-logs` |

---

### 6.13 Public — ยื่นเรื่องร้องเรียน (`/public/complaints/new`)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Public Layout (ไม่มี Sidebar) |
| **Roles** | ประชาชน (ไม่ต้อง Login) |

**Form Fields:**

| Field | Type | Required |
|-------|------|:--------:|
| ชื่อเรื่องร้องเรียน | Text | ✅ |
| รายละเอียด | Textarea | ✅ |
| ประเภทงานบริการ ⭐ | Select (service_types) | ✅ |
| ลักษณะเรื่อง ⭐ | Select (complaint_natures) | ✅ |
| ประเภทเรื่อง | Select | ✅ |
| ช่องทาง | Select (Pre-selected: "เว็บไซต์") | ✅ |
| ประเภทผู้ร้องเรียน ⭐ | Select (บุคคลธรรมดา/นิติบุคคล) | ✅ |
| **ปกปิดตัวตน (ไม่เปิดเผยข้อมูลผู้ร้องต่อเจ้าหน้าที่)** | Checkbox | — |
| ชื่อ-นามสกุล | Text | ❌ |
| **เบอร์โทร** ⭐ | Text | ✅ (บังคับเสมอ รวมกรณีปกปิดตัวตน) |
| อีเมล | Email | ❌ |
| จังหวัดจุดเกิดเหตุ ⭐ | Select (Default: ศรีสะเกษ) | ❌ |
| อำเภอ | Select | ❌ |
| ตำบล | Select | ❌ |
| รหัสไปรษณีย์ ⭐ | Text (5 หลัก) | ❌ |
| สถานที่เกิดเหตุ ⭐ | Textarea | ❌ |
| แผนที่ปักหมุด ⭐ | `LocationMapPicker` (Leaflet) | ❌ |
| ไฟล์แนบหลักฐาน | File Upload (Multi) | ❌ |

> **ปกปิดตัวตน**: เมื่อเลือก ระบบยังเก็บข้อมูลผู้ร้องไว้ (เพื่อใช้ติดต่อกลับหากจำเป็น) แต่จะไม่แสดงให้เจ้าหน้าที่เห็น — แสดงข้อความอธิบายใต้ Checkbox · **เบอร์โทรยังบังคับกรอก** แม้เลือกปกปิดตัวตน (BR-16)
> 💡 มีลิงก์ "สมัครสมาชิก/เข้าสู่ระบบ เพื่อติดตามเรื่องได้ง่ายขึ้น" → `/citizen/register`

**After Submit:**
- แสดงหน้า Success พร้อม **เลขที่เรื่อง** ที่ได้รับ
- แจ้งให้จดเลขที่เรื่องไว้สำหรับติดตามสถานะ
- ปุ่ม "ติดตามสถานะ" → `/public/track`

**API:** `POST /api/public/complaints`

---

### 6.14 Public — ติดตามสถานะ (`/public/track`)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Public Layout |
| **Roles** | ประชาชน (ไม่ต้อง Login) |

**Form:** กรอกเลขที่เรื่อง → ปุ่ม "ค้นหา"

**Result (แสดงเมื่อค้นเจอ):**

| ข้อมูล | รายละเอียด |
|--------|-----------|
| เลขที่เรื่อง | DC-YYYYMM-XXXX |
| เรื่อง | หัวเรื่อง |
| สถานะ | สถานะแบบย่อ (📋 รับเรื่องแล้ว / ⚙️ กำลังดำเนินการ / ✅ เสร็จสิ้น) |
| วันที่รับเรื่อง | DD/MM/YYYY |

**Not Found:** แสดง Alert "ไม่พบเลขที่เรื่องที่ค้นหา"

**API:** `GET /api/public/complaints/track/:complaint_number`

---

### 6.15 Profile & Change Password

| Path | Description | Roles |
|------|-------------|-------|
| `/profile` | แสดงข้อมูลส่วนตัว (ชื่อ, Username, Role, หน่วยงาน) | ทุก Role |
| `/change-password` | ฟอร์มเปลี่ยนรหัสผ่าน (รหัสเดิม + รหัสใหม่ + ยืนยัน) | ทุก Role |

---

### 6.16 Citizen — สมัครสมาชิก (`/citizen/register`) ⭐ ใหม่

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Citizen/Public Layout |
| **Form Fields** | อีเมล ✅, รหัสผ่าน ✅, ยืนยันรหัสผ่าน ✅, ชื่อ-นามสกุล ✅, เบอร์โทร ❌, เลขบัตร ปชช. ❌, ที่อยู่ ❌ |
| **Validation** | อีเมลรูปแบบถูกต้อง + ไม่ซ้ำ, รหัสผ่าน ≥ 8 ตัว, รหัสผ่านตรงกัน |
| **API** | `POST /api/citizen/auth/register` |
| **After Register** | Auto-login → ไป `/citizen` · มีลิงก์ไป `/citizen/login` |

### 6.17 Citizen — เข้าสู่ระบบ (`/citizen/login`) ⭐ ใหม่

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Form Fields** | อีเมล, รหัสผ่าน |
| **API** | `POST /api/citizen/auth/login` |
| **After Login** | ไป `/citizen` (เรื่องของฉัน) · ลิงก์ "สมัครสมาชิก" + "ยื่นเรื่องแบบไม่สมัครสมาชิก" (`/public/complaints/new`) |

### 6.18 Citizen — เรื่องของฉัน (`/citizen/complaints`) ⭐ ใหม่

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Layout** | Citizen Layout (Auth required) |
| **List** | รายการเรื่องที่ตนเองยื่น: เลขที่เรื่อง, หัวเรื่อง, สถานะย่อ (StatusChip), วันที่ยื่น, ป้าย "ปกปิดตัวตน" ถ้ามี |
| **Actions** | ปุ่ม "➕ ยื่นเรื่องใหม่" → `/citizen/complaints/new` · Click แถว → Detail |
| **API** | `GET /api/citizen/complaints` (Pagination) |
| **Empty State** | "ยังไม่มีเรื่องที่ยื่น" + ปุ่มยื่นเรื่องใหม่ |

### 6.19 Citizen — ยื่นเรื่อง/รายละเอียดเรื่องของฉัน ⭐ ใหม่

| Path | รายละเอียด |
|------|-----------|
| `/citizen/complaints/new` | ฟอร์มเหมือน Public Form (รวมฟิลด์ใหม่: ประเภทงานบริการ, ลักษณะเรื่อง, ประเภทผู้ร้องเรียน, จุดเกิดเหตุ + แผนที่ Leaflet, ไฟล์แนบ, เบอร์โทรบังคับ) แต่ **pre-fill ข้อมูลผู้ร้องจากโปรไฟล์** (แก้ก่อนส่งได้) + มี Checkbox "ปกปิดตัวตน" · API `POST /api/citizen/complaints` |
| `/citizen/complaints/:complaint_number` | แสดงสถานะแบบย่อ + Timeline ย่อ ของเรื่องตนเอง · API `GET /api/citizen/complaints/:complaint_number` |

### 6.20 Citizen — ข้อมูลส่วนตัว (`/citizen/profile`) ⭐ ใหม่

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Form** | แก้ไข ชื่อ-นามสกุล, เบอร์โทร, เลขบัตร ปชช., ที่อยู่ (อีเมลแก้ไม่ได้/แสดงอย่างเดียวใน Phase แรก) |
| **เปลี่ยนรหัสผ่าน** | Section/แท็บ: รหัสเดิม + รหัสใหม่ + ยืนยัน |
| **API** | `PUT /api/citizen/profile`, `PUT /api/citizen/auth/change-password` |

---

## 7. Shared Components

| Component | ใช้ในหน้า | Description |
|-----------|---------|-------------|
| `StatusChip` | Complaint List/Detail | แสดงสถานะเป็น Chip สีตามสถานะ |
| `PriorityChip` | Complaint List/Detail | แสดง Priority เป็น Chip สี |
| `DataTable` | ทุกหน้าที่มีตาราง | ตาราง MUI พร้อม Sort, Pagination, Filter |
| `ConfirmDialog` | ทุกหน้าที่มี Action สำคัญ | Dialog ยืนยันก่อนดำเนินการ |
| `FileUpload` | Create/Edit Complaint, Update Progress | Drag & Drop Upload พร้อม Preview |
| `LocationMapPicker` ⭐ | Create/Edit/Public/Citizen Complaint | แผนที่ Leaflet ปักหมุดจุดเกิดเหตุ — ปุ่ม "ใช้ตำแหน่งปัจจุบัน (GPS)" + คลิกเลือกพิกัด → คืนค่า latitude/longitude |
| `Timeline` | Complaint Detail | แสดงลำดับเหตุการณ์ |
| `SummaryCard` | Dashboard | Card แสดงตัวเลขสรุป |
| `FilterBar` | Complaint List, Reports | แถบ Filter (Status, Category, Date ฯลฯ) |
| `LoadingSpinner` | ทุกหน้า | แสดงระหว่าง Loading |
| `EmptyState` | ทุกหน้าที่มีรายการ | แสดงเมื่อไม่มีข้อมูล |
| `ErrorAlert` | ทุกหน้า | แสดง Error Message |
| `NotificationBadge` | Topbar | แสดงจำนวนแจ้งเตือนที่ยังไม่อ่าน |

---

## 8. Status Color Mapping (สำหรับ StatusChip)

| Status | สี MUI | Label |
|--------|--------|-------|
| `NEW` | `info` | รับเรื่องใหม่ |
| `SCREENING` | `warning` | กำลังคัดกรอง |
| `ASSIGNED` | `secondary` | ส่งต่อแล้ว |
| `ACCEPTED` | `primary` | รับเรื่องแล้ว |
| `IN_PROGRESS` | `info` | กำลังดำเนินการ |
| `RESOLVED` | `success` (light) | ส่งผลแล้ว |
| `REVIEWING` | `warning` | กำลังตรวจผล |
| `CLOSED` | `success` | ปิดเรื่อง |
| `REJECTED` | `error` | ปฏิเสธ |
| `RETURNED` | `default` | ส่งคืน |

---

## 9. UX Considerations

| # | ข้อพิจารณา |
|---|-----------|
| UX-1 | ใช้ Breadcrumbs ทุกหน้าที่อยู่ลึก (เช่น Complaints → Detail → Edit) |
| UX-2 | Loading Skeleton สำหรับตารางและ Dashboard Cards |
| UX-3 | Toast/Snackbar สำหรับแจ้งผลสำเร็จ (สร้างเรื่องสำเร็จ, อัปเดตสำเร็จ) |
| UX-4 | Confirm Dialog ก่อน Action สำคัญ (ปฏิเสธ, ปิดเรื่อง, ส่งกลับ) |
| UX-5 | Auto-refresh Dashboard ทุก 5 นาที (หรือ Manual Refresh) |
| UX-6 | Keyboard Shortcuts (Enter = Submit, Esc = Cancel) ในฟอร์ม |
| UX-7 | หน้า Public ต้องเรียบง่าย มี Stepper ถ้าฟอร์มยาว |
| UX-8 | แสดง "เรื่องเกินกำหนด" ด้วยสีแดงเสมอ |

---

## 10. Assumptions

| # | สมมติฐาน |
|---|---------|
| A-1 | Desktop-first แต่ Responsive สำหรับ Tablet (ไม่เน้น Mobile) |
| A-2 | ใช้ MUI Theme เดียว (Light Mode) ใน Phase แรก |
| A-3 | ไม่มี Real-time Update (WebSocket) ใน Phase แรก ใช้ Manual Refresh |
| A-4 | ภาษาไทยเป็นหลัก ไม่มี Multi-language |

---

## 11. Open Questions

| # | คำถาม | ส่งผลต่อ |
|---|-------|---------|
| Q-1 | ต้องการ Dark Mode หรือไม่? | Theme Design |
| Q-2 | Dashboard ต้อง Auto-refresh หรือ Manual? | Performance |
| Q-3 | หน้า Public ต้องมี Captcha หรือไม่? (ป้องกัน Spam) | Security |
| Q-4 | ต้องการ Multi-language (ไทย/อังกฤษ) ในอนาคตหรือไม่? | i18n Architecture |

---

> **เอกสารถัดไป:** `docs/planning/08-dashboard-report-notification.md` — Dashboard, Report and Notification Design
