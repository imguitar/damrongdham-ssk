# 08 — Dashboard, Report and Notification Design: ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด

> เอกสารฉบับนี้เป็นส่วนหนึ่งของขั้นตอน Planning Only — ยังไม่มีการเขียน Code
> อ้างอิงจาก: `01` ~ `07` Planning Documents

---

## 1. Dashboard Design

### 1.1 Dashboard Goals

Dashboard ต้องตอบคำถามผู้บริหารได้ทันทีเมื่อเปิดหน้าจอ:

| # | คำถามผู้บริหาร | ตัวชี้วัดที่ตอบ | แสดงใน |
|---|--------------|--------------|--------|
| 1 | มีเรื่องทั้งหมดกี่เรื่อง? | จำนวนเรื่องทั้งหมด | Summary Card |
| 2 | วันนี้มีเรื่องใหม่กี่เรื่อง? | เรื่องใหม่วันนี้ | Summary Card |
| 3 | กำลังดำเนินการกี่เรื่อง? | เรื่องที่ยังไม่ปิด | Summary Card |
| 4 | เกินกำหนดกี่เรื่อง? | เรื่องที่ `is_overdue = true` | Summary Card |
| 5 | หน่วยงานใดค้างมากที่สุด? | จำนวนเรื่องค้างแยกตามหน่วยงาน | Bar Chart + Table |
| 6 | ประเภทเรื่องใดพบมากที่สุด? | จำนวนเรื่องแยกตามประเภท | Pie Chart |
| 7 | พื้นที่ใดมีเรื่องมากที่สุด? | จำนวนเรื่องแยกตามอำเภอ | Bar Chart |
| 8 | แนวโน้มเป็นอย่างไร? | จำนวนเรื่องรายเดือน | Line Chart |

---

### 1.2 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard                    [Filter: ปี ▼] [เดือน ▼] [🔄]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│ │ทั้งหมด │ │ใหม่วันนี้│ │ดำเนินการ│ │เกินกำหนด│ │ใกล้ครบ  │ │ปิดแล้ว │      │
│ │  150  │ │   3   │ │  45   │ │  12   │ │  8    │ │  80   │      │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘      │
│                                                              │
│ ┌────────────────────────┐ ┌────────────────────────┐       │
│ │ แนวโน้มรายเดือน        │ │ สัดส่วนตามประเภทเรื่อง  │       │
│ │ (Line Chart)           │ │ (Pie Chart)             │       │
│ │                        │ │                         │       │
│ └────────────────────────┘ └────────────────────────┘       │
│                                                              │
│ ┌────────────────────────┐ ┌────────────────────────┐       │
│ │ จำนวนตามหน่วยงาน       │ │ สัดส่วนตามสถานะ        │       │
│ │ (Bar Chart)            │ │ (Donut Chart)           │       │
│ │                        │ │                         │       │
│ └────────────────────────┘ └────────────────────────┘       │
│                                                              │
│ ┌──────────────────────────────────────────────────┐        │
│ │ 🔴 เรื่องเกินกำหนด (Top 10)                      │        │
│ │ Table: เลขที่ | เรื่อง | หน่วยงาน | ครบกำหนด | เกิน│        │
│ └──────────────────────────────────────────────────┘        │
│                                                              │
│ ┌──────────────────────────────────────────────────┐        │
│ │ ⚠️ เรื่องใกล้ครบกำหนด (Top 10)                    │        │
│ │ Table: เลขที่ | เรื่อง | หน่วยงาน | ครบกำหนด | เหลือ│       │
│ └──────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.3 Summary Cards

| # | Card | ค่าที่แสดง | สี | Icon | SQL Logic (Pseudo) |
|---|------|----------|-----|------|-------------------|
| 1 | เรื่องทั้งหมด | จำนวนเรื่องทั้งหมดในช่วงที่กรอง | น้ำเงิน | 📋 | `COUNT(*) WHERE created_at BETWEEN date_from AND date_to` |
| 2 | เรื่องใหม่วันนี้ | จำนวนเรื่องที่สร้างวันนี้ | ฟ้า | 🆕 | `COUNT(*) WHERE DATE(created_at) = CURDATE()` |
| 3 | กำลังดำเนินการ | เรื่องที่ไม่ใช่ CLOSED/REJECTED | ส้ม | ⚙️ | `COUNT(*) WHERE status NOT IN ('CLOSED','REJECTED')` |
| 4 | เกินกำหนด | เรื่องที่ `is_overdue = true` | แดง | 🔴 | `COUNT(*) WHERE is_overdue = 1 AND status NOT IN ('CLOSED','REJECTED')` |
| 5 | ใกล้ครบกำหนด | เรื่องที่เหลือ ≤ 3 วัน | เหลือง | ⚠️ | `COUNT(*) WHERE due_date BETWEEN CURDATE() AND CURDATE()+3 AND status NOT IN ('CLOSED','REJECTED')` |
| 6 | ปิดเรื่องแล้ว | เรื่องที่ CLOSED ในช่วงที่กรอง | เขียว | ✅ | `COUNT(*) WHERE status = 'CLOSED' AND closed_at BETWEEN date_from AND date_to` |

**Card Behavior:**
- Click ที่ Card → Navigate ไปหน้า Complaint List พร้อม Filter ที่เกี่ยวข้อง
- เช่น Click "เกินกำหนด" → ไปยัง `/complaints?is_overdue=true`

**API:** `GET /api/dashboard/summary`

**Response:**

```json
{
  "total": 150,
  "today_new": 3,
  "in_progress": 45,
  "overdue": 12,
  "near_due": 8,
  "closed": 80
}
```

---

### 1.4 Charts

#### Chart 1: แนวโน้มรายเดือน (Line Chart)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **ประเภท** | Line Chart (2 เส้น) |
| **แกน X** | เดือน (ม.ค. - ธ.ค.) |
| **แกน Y** | จำนวนเรื่อง |
| **เส้นที่ 1** | เรื่องใหม่ที่เข้ามา (สีน้ำเงิน) |
| **เส้นที่ 2** | เรื่องที่ปิดแล้ว (สีเขียว) |
| **Filter** | ปี (Default: ปีปัจจุบัน) |
| **API** | `GET /api/dashboard/trend?year=2026` |

**Response:**

```json
{
  "data": [
    { "month": 1, "month_name": "ม.ค.", "new": 25, "closed": 20 },
    { "month": 2, "month_name": "ก.พ.", "new": 30, "closed": 28 },
    ...
  ]
}
```

#### Chart 2: สัดส่วนตามประเภทเรื่อง (Pie Chart)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **ประเภท** | Pie Chart |
| **Data** | จำนวนเรื่องแยกตาม Category |
| **สี** | กำหนดสีต่างกันให้แต่ละประเภท |
| **API** | `GET /api/dashboard/by-category` |

**Response:**

```json
{
  "data": [
    { "category_id": 1, "category_name": "ที่ดิน", "count": 45 },
    { "category_id": 2, "category_name": "สิ่งแวดล้อม", "count": 30 },
    { "category_id": 3, "category_name": "สาธารณูปโภค", "count": 25 },
    ...
  ]
}
```

#### Chart 3: จำนวนตามหน่วยงาน (Horizontal Bar Chart)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **ประเภท** | Horizontal Bar Chart |
| **Data** | จำนวนเรื่องค้าง (ยังไม่ปิด) แยกตามหน่วยงาน |
| **สี** | สีเดียว (หน่วยงานที่เกินกำหนดมาก → สีแดง) |
| **Sort** | เรียงจากมากไปน้อย |
| **API** | `GET /api/dashboard/by-agency` |

**Response:**

```json
{
  "data": [
    { "agency_id": 1, "agency_name": "สำนักงานที่ดินฯ", "total": 15, "overdue": 3 },
    { "agency_id": 2, "agency_name": "อบจ.", "total": 12, "overdue": 1 },
    ...
  ]
}
```

#### Chart 4: สัดส่วนตามสถานะ (Donut Chart)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **ประเภท** | Donut Chart |
| **Data** | จำนวนเรื่องแยกตามสถานะ |
| **สี** | ใช้สีตาม Status Color Mapping (จาก `07-frontend-pages.md`) |
| **Center** | แสดงจำนวนทั้งหมด |
| **API** | `GET /api/dashboard/by-status` |

**Response:**

```json
{
  "data": [
    { "status": "NEW", "label": "รับเรื่องใหม่", "count": 5, "color": "#2196F3" },
    { "status": "SCREENING", "label": "คัดกรอง", "count": 3, "color": "#FF9800" },
    { "status": "IN_PROGRESS", "label": "ดำเนินการ", "count": 30, "color": "#03A9F4" },
    { "status": "CLOSED", "label": "ปิดเรื่อง", "count": 80, "color": "#4CAF50" },
    ...
  ]
}
```

---

### 1.5 Dashboard Tables

#### Table 1: 🔴 เรื่องเกินกำหนด (Top 10)

| Column | Description |
|--------|-------------|
| เลขที่เรื่อง | Link ไปหน้า Detail |
| เรื่อง | หัวเรื่อง (ตัดไม่เกิน 60 ตัวอักษร) |
| ประเภท | ประเภทเรื่อง |
| หน่วยงาน | หน่วยงานที่รับผิดชอบ |
| ครบกำหนด | วันครบกำหนด (DD/MM/YYYY) |
| เกินกำหนด | จำนวนวันที่เกิน (สีแดง) |

**API:** `GET /api/dashboard/overdue?limit=10`

#### Table 2: ⚠️ เรื่องใกล้ครบกำหนด (Top 10)

| Column | Description |
|--------|-------------|
| เลขที่เรื่อง | Link ไปหน้า Detail |
| เรื่อง | หัวเรื่อง |
| ประเภท | ประเภทเรื่อง |
| หน่วยงาน | หน่วยงานที่รับผิดชอบ |
| ครบกำหนด | วันครบกำหนด |
| เหลือ | จำนวนวันที่เหลือ (สีเหลือง/ส้ม) |

**API:** `GET /api/dashboard/near-due?limit=10`

---

### 1.6 Dashboard Filters

| Filter | Type | Default |
|--------|------|---------|
| ปี | Year Picker | ปีปัจจุบัน |
| เดือน | Month Picker (Optional) | ทั้งปี |
| ปุ่ม Refresh | Button | — |

**หมายเหตุ:** Dashboard ใช้ Filter น้อย เพื่อให้เปิดมาเห็นข้อมูลทันที

---

### 1.7 Dashboard by Role

| Role | มองเห็น | ข้อจำกัด |
|------|---------|---------|
| super_admin, admin | ข้อมูลทั้งหมด | — |
| officer, chief | ข้อมูลทั้งหมด | — |
| agency_officer, agency_head | เฉพาะของหน่วยงานตน | API Filter `agency_id` อัตโนมัติ |
| executive | ข้อมูลทั้งหมด (ไม่เห็นข้อมูลส่วนบุคคล) | Tables แสดงเรื่องแต่ไม่แสดงชื่อผู้ร้อง |

---

## 2. Report Design

### 2.1 Report Types

| # | Report | Description | Output |
|---|--------|-------------|--------|
| R-1 | สรุปรายเดือน | สรุปจำนวนเรื่องแยกตามสถานะ ในแต่ละเดือน | Table + Export |
| R-2 | ตามประเภทเรื่อง | จำนวนเรื่องแยกตามประเภท พร้อมสัดส่วน | Table + Bar Chart + Export |
| R-3 | ตามหน่วยงาน | จำนวนเรื่องแยกตามหน่วยงาน + อัตราปิดเรื่อง | Table + Bar Chart + Export |
| R-4 | เรื่องเกินกำหนด | รายการเรื่องที่เกิน Due Date พร้อมรายละเอียด | Table + Export |

---

### 2.2 Report R-1: สรุปรายเดือน

**Filters:** ปี, เดือน (optional)

**Table Structure:**

| เดือน | เรื่องใหม่ | คัดกรอง | ส่งต่อ | ดำเนินการ | ปิดเรื่อง | ปฏิเสธ | เกินกำหนด | รวม |
|-------|:--------:|:------:|:-----:|:---------:|:--------:|:------:|:---------:|:---:|
| ม.ค. 2569 | 25 | 2 | 5 | 10 | 20 | 3 | 2 | 25 |
| ก.พ. 2569 | 30 | 1 | 3 | 12 | 28 | 2 | 1 | 30 |
| ... | | | | | | | | |
| **รวม** | **150** | | | | **120** | **15** | **12** | **150** |

**Computed Metrics:**

| ตัวชี้วัด | สูตร |
|----------|------|
| อัตราปิดเรื่อง | (ปิดเรื่อง / รวม) × 100% |
| อัตราปฏิเสธ | (ปฏิเสธ / รวม) × 100% |
| อัตราเกินกำหนด | (เกินกำหนด / รวม) × 100% |
| ระยะเวลาเฉลี่ย | AVG(closed_at - created_at) สำหรับเรื่องที่ปิดแล้ว |

**API:** `GET /api/reports/monthly?year=2026`

---

### 2.3 Report R-2: ตามประเภทเรื่อง

**Filters:** ช่วงวันที่, สถานะ

**Table Structure:**

| ประเภทเรื่อง | จำนวน | สัดส่วน | ปิดแล้ว | เกินกำหนด | SLA (วัน) |
|-------------|:-----:|:------:|:------:|:---------:|:---------:|
| ที่ดิน | 45 | 30% | 35 | 5 | 15 |
| สิ่งแวดล้อม | 30 | 20% | 25 | 2 | 7 |
| สาธารณูปโภค | 25 | 17% | 20 | 3 | 10 |
| ... | | | | | |

**Chart:** Bar Chart แสดงจำนวนแยกตามประเภท

**API:** `GET /api/reports/by-category?date_from=2026-01-01&date_to=2026-06-30`

---

### 2.4 Report R-3: ตามหน่วยงาน

**Filters:** ช่วงวันที่, ประเภทเรื่อง

**Table Structure:**

| หน่วยงาน | รับเรื่อง | ดำเนินการ | ปิดแล้ว | เกินกำหนด | อัตราปิด | เวลาเฉลี่ย (วัน) |
|---------|:-------:|:---------:|:------:|:---------:|:-------:|:----------------:|
| สำนักงานที่ดินฯ | 40 | 10 | 25 | 5 | 63% | 12 |
| อบจ. | 30 | 8 | 20 | 2 | 67% | 8 |
| ... | | | | | | |

**Computed Metrics:**

| ตัวชี้วัด | สูตร |
|----------|------|
| อัตราปิดเรื่อง | (ปิดแล้ว / รับเรื่อง) × 100% |
| เวลาเฉลี่ย | AVG(ระยะเวลาดำเนินการ) ของเรื่องที่ปิดแล้ว (วัน) |

**Chart:** Stacked Bar Chart (ดำเนินการ vs ปิดแล้ว vs เกินกำหนด)

**API:** `GET /api/reports/by-agency?date_from=2026-01-01&date_to=2026-06-30`

---

### 2.5 Report R-4: เรื่องเกินกำหนด

**Filters:** หน่วยงาน, ประเภท, ช่วงวันที่

**Table Structure:**

| เลขที่เรื่อง | เรื่อง | ประเภท | หน่วยงาน | วันที่ส่งต่อ | ครบกำหนด | เกิน (วัน) | สถานะ |
|-------------|-------|-------|---------|-----------|---------|:---------:|-------|
| DC-202601-0005 | ร้องเรียนที่ดิน... | ที่ดิน | สนง.ที่ดินฯ | 01/01/2569 | 16/01/2569 | 15 | IN_PROGRESS |
| ... | | | | | | | |

**Summary:** จำนวนเรื่องเกินกำหนดทั้งหมด, จำนวนวันเกินเฉลี่ย, หน่วยงานที่เกินมากที่สุด

**API:** `GET /api/reports/overdue`

---

### 2.6 Export Excel

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Format** | `.xlsx` (Excel) |
| **Library** | SheetJS (xlsx) หรือ exceljs |
| **วิธีการ** | Backend สร้างไฟล์ Excel → ส่งเป็น Binary Download |
| **API** | `GET /api/reports/export/excel?type={report_type}&year=2026&month=6` |

**Report Types สำหรับ Export:**

| `type` Parameter | Report |
|-----------------|--------|
| `monthly` | สรุปรายเดือน |
| `by-category` | ตามประเภทเรื่อง |
| `by-agency` | ตามหน่วยงาน |
| `overdue` | เรื่องเกินกำหนด |

**Excel Structure (ตัวอย่าง Monthly):**
- Sheet 1: ข้อมูลสรุป
- Row 1: ชื่อรายงาน + ช่วงวันที่
- Row 2: วันที่สร้างรายงาน
- Row 3: ว่าง
- Row 4: Header
- Row 5+: Data

---

### 2.7 Report Access by Role

| Role | R-1 สรุปรายเดือน | R-2 ตามประเภท | R-3 ตามหน่วยงาน | R-4 เกินกำหนด | Export |
|------|:----------------:|:-------------:|:---------------:|:-------------:|:-----:|
| super_admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| officer | ✅ | ✅ | ✅ | ✅ | ✅ |
| chief | ✅ | ✅ | ✅ | ✅ | ✅ |
| agency_head | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| executive | ✅ | ✅ | ✅ | ✅ | ✅ |
| agency_officer | ❌ | ❌ | ❌ | ❌ | ❌ |

> ⚠️ agency_head เห็นเฉพาะข้อมูลของหน่วยงานตนเอง

---

## 3. Notification Design

### 3.1 Notification Types

| # | Type Code | เหตุการณ์ | ผู้รับแจ้งเตือน | Priority |
|---|-----------|---------|--------------|---------|
| N-01 | `NEW_PUBLIC_COMPLAINT` | ประชาชนยื่นเรื่องใหม่ | Officer ทุกคน | Medium |
| N-02 | `NEW_ASSIGNMENT` | เรื่องถูกส่งต่อมาให้หน่วยงาน | Agency Officer/Head ของหน่วยงานนั้น | High |
| N-03 | `ASSIGNMENT_ACCEPTED` | หน่วยงานรับเรื่องแล้ว | Officer ผู้ส่งต่อ | Low |
| N-04 | `ASSIGNMENT_RETURNED` | หน่วยงานส่งคืนเรื่อง | Officer ผู้ส่งต่อ | High |
| N-05 | `COMPLAINT_RESOLVED` | หน่วยงานส่งผลดำเนินการ | Officer + Chief | Medium |
| N-06 | `COMPLAINT_SENT_BACK` | ศูนย์ส่งกลับแก้ไข | Agency Officer/Head | High |
| N-07 | `COMPLAINT_CLOSED` | เรื่องปิดแล้ว | Agency Officer/Head | Low |
| N-08 | `NEAR_DUE_WARNING` | เรื่องใกล้ครบกำหนด (≤ 3 วัน) | Officer + Agency Officer/Head | High |
| N-09 | `OVERDUE_ALERT` | เรื่องเกินกำหนด | Officer + Chief + Agency Officer/Head | Critical |
| N-10 | `NO_UPDATE_L1` | ไม่มีการอัพเดตสถานะดำเนินการครบ **30 วัน** (ครั้งที่ 1) | เจ้าหน้าที่หน่วยงานผู้รับผิดชอบ (ตนเอง) | High |
| N-11 | `NO_UPDATE_L2` | ไม่มีการอัพเดตครบ **45 วัน** (+15 วันจากครั้งที่ 1) (ครั้งที่ 2) | หัวหน้าหน่วยงาน (agency_head) + เจ้าหน้าที่ผู้รับผิดชอบ | High |
| N-12 | `NO_UPDATE_L3` | ไม่มีการอัพเดตครบ **52 วัน** (+7 วันจากครั้งที่ 2) (ครั้งที่ 3) | หัวหน้าหน่วยงาน (agency_head) + เจ้าหน้าที่ผู้รับผิดชอบ | Critical |

> **N-10…N-12 = การแจ้งเตือนเร่งรัดการอัพเดตสถานะ (Status-Update Escalation)** — เป็นกลไก **แยกต่างหากจาก** SLA near-due/overdue (N-08/N-09) โดยอิงระยะเวลาที่ "ไม่มีการอัพเดตความคืบหน้า" ไม่ใช่ Due Date ของ Category — ดูตรรกะเต็มใน §4.3

---

### 3.2 Notification Data Structure

```json
{
  "id": 1,
  "user_id": 5,
  "complaint_id": 123,
  "type": "NEW_ASSIGNMENT",
  "title": "มีเรื่องร้องเรียนใหม่ส่งต่อมา",
  "message": "เรื่อง DC-202606-0015 ถูกส่งต่อมาให้หน่วยงานคุณ: ร้องเรียนเรื่องที่ดิน",
  "is_read": false,
  "read_at": null,
  "created_at": "2026-06-16T10:30:00Z"
}
```

---

### 3.3 Notification Message Templates

| Type | Title | Message Template |
|------|-------|-----------------|
| `NEW_PUBLIC_COMPLAINT` | มีเรื่องร้องเรียนใหม่จากประชาชน | "มีเรื่องร้องเรียนใหม่: {complaint_number} — {title}" |
| `NEW_ASSIGNMENT` | มีเรื่องส่งต่อมาให้หน่วยงาน | "เรื่อง {complaint_number} ถูกส่งต่อมาให้หน่วยงานคุณ: {title}" |
| `ASSIGNMENT_ACCEPTED` | หน่วยงานรับเรื่องแล้ว | "หน่วยงาน {agency_name} รับเรื่อง {complaint_number} แล้ว" |
| `ASSIGNMENT_RETURNED` | หน่วยงานส่งคืนเรื่อง | "หน่วยงาน {agency_name} ส่งคืนเรื่อง {complaint_number} เหตุผล: {reason}" |
| `COMPLAINT_RESOLVED` | ส่งผลดำเนินการแล้ว | "หน่วยงาน {agency_name} ส่งผลดำเนินการเรื่อง {complaint_number}" |
| `COMPLAINT_SENT_BACK` | เรื่องถูกส่งกลับแก้ไข | "เรื่อง {complaint_number} ถูกส่งกลับแก้ไข หมายเหตุ: {note}" |
| `COMPLAINT_CLOSED` | เรื่องปิดแล้ว | "เรื่อง {complaint_number} ปิดเรื่องเรียบร้อยแล้ว" |
| `NEAR_DUE_WARNING` | ⚠️ เรื่องใกล้ครบกำหนด | "เรื่อง {complaint_number} ใกล้ครบกำหนด เหลืออีก {days} วัน" |
| `OVERDUE_ALERT` | 🔴 เรื่องเกินกำหนด | "เรื่อง {complaint_number} เกินกำหนดแล้ว {days} วัน" |
| `NO_UPDATE_L1` | ⏰ โปรดอัพเดตสถานะดำเนินการ | "เรื่อง {complaint_number} ไม่มีการอัพเดตความคืบหน้ามาแล้ว {days} วัน กรุณาอัพเดตสถานะดำเนินการ" |
| `NO_UPDATE_L2` | ⏰ เรื่องค้างอัพเดต (แจ้งหัวหน้าหน่วยงาน) | "เรื่อง {complaint_number} ไม่มีการอัพเดตความคืบหน้ามาแล้ว {days} วัน — แจ้งหัวหน้าหน่วยงานเพื่อเร่งรัด" |
| `NO_UPDATE_L3` | 🔴 เรื่องค้างอัพเดตเกินกำหนด | "เรื่อง {complaint_number} ไม่มีการอัพเดตความคืบหน้ามาแล้ว {days} วัน — โปรดเร่งรัดดำเนินการโดยด่วน" |

---

### 3.4 Notification Trigger Logic

| Trigger | When | Who Creates |
|---------|------|-------------|
| เรื่องใหม่จาก Public | หลัง `POST /api/public/complaints` สำเร็จ | Backend (Auto) |
| ส่งต่อหน่วยงาน | หลัง `POST /api/complaints/:id/assign` สำเร็จ | Backend (Auto) |
| หน่วยงานรับเรื่อง | หลัง `PATCH /api/assignments/:id/accept` สำเร็จ | Backend (Auto) |
| หน่วยงานส่งคืน | หลัง `PATCH /api/assignments/:id/return` สำเร็จ | Backend (Auto) |
| ส่งผลดำเนินการ | หลัง `PATCH /api/assignments/:id/resolve` สำเร็จ | Backend (Auto) |
| ส่งกลับแก้ไข | หลัง `PATCH /api/complaints/:id/send-back` สำเร็จ | Backend (Auto) |
| ปิดเรื่อง | หลัง `PATCH /api/complaints/:id/close` สำเร็จ | Backend (Auto) |
| ใกล้ครบกำหนด | Scheduled Job ตรวจทุกวัน 08:00 | Backend (Cron/Job) |
| เกินกำหนด | Scheduled Job ตรวจทุกวัน 08:00 | Backend (Cron/Job) |
| ไม่มีอัพเดต 30/45/52 วัน (N-10/11/12) | Scheduled Job ตรวจทุกวัน 08:00 | Backend (Cron/Job) — ดู §4.3 |

---

### 3.5 Notification Recipient Logic

| Type | ผู้รับ | Logic |
|------|------|-------|
| `NEW_PUBLIC_COMPLAINT` | Officer ทุกคน | `SELECT id FROM users WHERE role_id IN (officer) AND is_active = 1` |
| `NEW_ASSIGNMENT` | เจ้าหน้าที่ของหน่วยงานนั้น | `SELECT id FROM users WHERE agency_id = {assigned_agency_id} AND role_id IN (agency_officer, agency_head)` |
| `ASSIGNMENT_ACCEPTED` | Officer ที่ส่งต่อ | `SELECT assigned_by FROM complaint_assignments WHERE id = {assignment_id}` |
| `ASSIGNMENT_RETURNED` | Officer ที่ส่งต่อ | เหมือน ACCEPTED |
| `COMPLAINT_RESOLVED` | Officer + Chief ทุกคน | `SELECT id FROM users WHERE role_id IN (officer, chief)` |
| `COMPLAINT_SENT_BACK` | เจ้าหน้าที่หน่วยงานนั้น | เหมือน NEW_ASSIGNMENT |
| `COMPLAINT_CLOSED` | เจ้าหน้าที่หน่วยงานนั้น | เหมือน NEW_ASSIGNMENT |
| `NEAR_DUE_WARNING` | Officer + เจ้าหน้าที่หน่วยงานนั้น | รวม Officer ทุกคน + เจ้าหน้าที่หน่วยงานที่ดูแลเรื่องนั้น |
| `OVERDUE_ALERT` | Officer + Chief + เจ้าหน้าที่หน่วยงานนั้น | รวม Chief ด้วย (เรื่องเกินกำหนดต้องถึงหัวหน้า) |
| `NO_UPDATE_L1` | เจ้าหน้าที่ผู้รับผิดชอบ (ตนเอง) | `accepted_by` ของ assignment ที่ active (เจ้าหน้าที่หน่วยงานที่กดรับเรื่อง) |
| `NO_UPDATE_L2` | หัวหน้าหน่วยงาน + เจ้าหน้าที่ผู้รับผิดชอบ | `accepted_by` + `SELECT id FROM users WHERE agency_id = {agency} AND role_id = agency_head` |
| `NO_UPDATE_L3` | หัวหน้าหน่วยงาน + เจ้าหน้าที่ผู้รับผิดชอบ | เหมือน L2 |

---

### 3.6 Notification UI Behavior

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Badge** | แสดงจำนวน Unread ที่ Topbar (Bell Icon) |
| **Dropdown** | Click Bell → แสดง 5 รายการล่าสุด + "ดูทั้งหมด" |
| **Full Page** | `/notifications` → แสดงทั้งหมด + Pagination |
| **Click Item** | Navigate ไปหน้า Complaint Detail ของเรื่องนั้น |
| **Mark as Read** | Click → `PATCH /api/notifications/:id/read` |
| **Mark All** | "อ่านทั้งหมด" → `PATCH /api/notifications/read-all` |
| **Polling** | Frontend เช็ค Unread Count ทุก 60 วินาที |
| **API** | `GET /api/notifications/unread-count` |

---

## 4. SLA Alert Rules

### 4.1 SLA Monitoring Logic

| # | กฎ | เงื่อนไข | Action |
|---|---|---------|--------|
| SLA-1 | **คำนวณ Due Date** | เมื่อส่งต่อหน่วยงาน (`ASSIGNED`) | `due_date = assigned_at + category.sla_days` |
| SLA-2 | **ตรวจจับใกล้ครบกำหนด** | `due_date - CURDATE() <= 3` AND ยังไม่ปิด | สร้าง Notification `NEAR_DUE_WARNING` |
| SLA-3 | **ตรวจจับเกินกำหนด** | `CURDATE() > due_date` AND ยังไม่ปิด | Update `is_overdue = true` + สร้าง Notification `OVERDUE_ALERT` |
| SLA-4 | **อัปเดต Overdue Flag** | ทุกวัน 08:00 | Batch update เรื่องที่เกิน Due Date |
| SLA-5 | **ไม่แจ้งซ้ำ** | ถ้าส่งเตือนไปแล้วในเรื่องเดียวกัน | ตรวจ Notification ก่อนสร้างใหม่ (ส่งครั้งเดียวต่อเรื่องต่อประเภท) |

### 4.2 Scheduled Job

| Job | Schedule | Action |
|-----|---------|--------|
| `check_near_due` | ทุกวัน 08:00 | Query เรื่องที่ `due_date - CURDATE() BETWEEN 1 AND 3` → สร้าง Notification |
| `check_overdue` | ทุกวัน 08:00 | Query เรื่องที่ `CURDATE() > due_date AND is_overdue = 0` → Update flag + สร้าง Notification |
| `update_overdue_flag` | ทุกวัน 08:00 | `UPDATE complaints SET is_overdue = 1 WHERE due_date < CURDATE() AND status NOT IN ('CLOSED','REJECTED')` |
| `check_no_update_escalation` | ทุกวัน 08:00 | ตรวจเรื่องที่ไม่มีการอัพเดตความคืบหน้าตามเกณฑ์ 30/45/52 วัน → สร้าง Notification N-10/N-11/N-12 (ดู §4.3) |

**Implementation Options (Phase แรก):**
- **ง่ายที่สุด:** ใช้ `node-cron` ใน Backend Express
- **อนาคต:** แยกเป็น Worker Process หรือใช้ Message Queue

---

### 4.3 Status-Update Escalation (เร่งรัดการอัพเดตสถานะดำเนินการ) ⭐ ใหม่

แจ้งเตือนแบบ **ขั้นบันได (escalation) 3 ครั้ง** เมื่อเรื่องที่อยู่ระหว่างดำเนินการ **ไม่มีการอัพเดตความคืบหน้า** ตามระยะเวลาที่กำหนด เพื่อกระตุ้นให้เจ้าหน้าที่หน่วยงานอัพเดตสถานะ และยกระดับไปยังหัวหน้าหน่วยงานเมื่อยังเงียบ

#### 4.3.1 จุดเริ่มนับ (Anchor) และการรีเซ็ต

- **Anchor (`last_progress_at`)** = เวลาอัพเดตความคืบหน้าครั้งล่าสุดของเรื่อง (`complaint_updates` ล่าสุด) — ถ้ายังไม่เคยอัพเดต ใช้ `accepted_at` (วันที่หน่วยงานรับเรื่อง)
- **รีเซ็ต:** เมื่อมีการอัพเดตความคืบหน้าใหม่ (`POST /api/complaints/:id/updates`) ระบบตั้ง `last_progress_at = NOW()` และ `escalation_level = 0` → เริ่มนับวงรอบ 30→45→52 วันใหม่ทั้งหมด

#### 4.3.2 เกณฑ์การแจ้งเตือน (สะสมจาก Anchor)

| ครั้งที่ | Level | เงื่อนไข (วันนับจาก `last_progress_at`) | ผู้รับแจ้งเตือน | Type |
|:---:|:---:|---|---|---|
| 1 | L1 | ≥ **30 วัน** | เจ้าหน้าที่หน่วยงานผู้รับผิดชอบ (ตนเอง) | `NO_UPDATE_L1` |
| 2 | L2 | ≥ **45 วัน** (30 + 15) | หัวหน้าหน่วยงาน + เจ้าหน้าที่ผู้รับผิดชอบ | `NO_UPDATE_L2` |
| 3 | L3 | ≥ **52 วัน** (45 + 7) | หัวหน้าหน่วยงาน + เจ้าหน้าที่ผู้รับผิดชอบ | `NO_UPDATE_L3` |

#### 4.3.3 ขอบเขตและกติกา

| # | กฎ | รายละเอียด |
|---|---|-----------|
| ESC-1 | **ขอบเขตเรื่อง** | เฉพาะเรื่องสถานะ `ACCEPTED` หรือ `IN_PROGRESS` (อยู่ระหว่างดำเนินการที่หน่วยงาน) ที่ยังไม่ `RESOLVED/CLOSED/REJECTED` |
| ESC-2 | **ส่งครั้งเดียวต่อ Level** | ใช้ `escalation_level` กันการส่งซ้ำทุกวัน — ส่ง L1 เมื่อ level<1, L2 เมื่อ level<2, L3 เมื่อ level<3 แล้วอัปเดต `escalation_level` + `last_escalation_at` |
| ESC-3 | **รีเซ็ตเมื่ออัพเดต** | มีอัพเดตความคืบหน้า → `escalation_level = 0`, `last_progress_at = NOW()` |
| ESC-4 | **หยุดเมื่อปิด/ส่งผล** | เรื่องที่เปลี่ยนเป็น RESOLVED/CLOSED/REJECTED ไม่อยู่ในขอบเขตการเร่งรัดอีก |
| ESC-5 | **แยกจาก SLA** | ไม่เกี่ยวกับ `due_date`/`is_overdue` ของ Category — เรื่องอาจยังไม่เกิน SLA แต่ถูกเร่งรัดได้ถ้าเงียบนาน |

#### 4.3.4 Pseudo Logic (รันในงาน `check_no_update_escalation` ทุกวัน)

```
สำหรับแต่ละ complaint ที่ status IN ('ACCEPTED','IN_PROGRESS'):
    days = DATEDIFF(NOW(), last_progress_at)   // last_progress_at = อัพเดตล่าสุด หรือ accepted_at
    ถ้า days >= 52 และ escalation_level < 3:
        แจ้ง NO_UPDATE_L3 → agency_head + assignee ; set escalation_level = 3
    ไม่งั้นถ้า days >= 45 และ escalation_level < 2:
        แจ้ง NO_UPDATE_L2 → agency_head + assignee ; set escalation_level = 2
    ไม่งั้นถ้า days >= 30 และ escalation_level < 1:
        แจ้ง NO_UPDATE_L1 → assignee ; set escalation_level = 1
    // เมื่อมี complaint_update ใหม่ → last_progress_at = NOW(), escalation_level = 0 (ทำตอนรับ POST updates)
```

> ฟิลด์รองรับ: `complaints.last_progress_at`, `complaints.escalation_level`, `complaints.last_escalation_at` (ดู `05` §4.9)

#### 4.3.5 การตั้งค่าเกณฑ์ (Configurable Settings) — ⭐ Phase ถัดไป

ใน **Phase แรก** ค่าเกณฑ์ 30 / 15 / 7 วัน เป็น **ค่าคงที่ (constant)** ในโค้ด

ใน **Phase ถัดไป** ให้เจ้าหน้าที่ (super_admin/admin) ปรับเกณฑ์เองผ่านหน้า **Settings → ตั้งค่าการเร่งรัด** โดยอ่าน/เขียนค่าจากตาราง `system_settings` (ดู `05` §4.23):

| คีย์ (`setting_key`) | ค่าเริ่มต้น | ความหมาย |
|----------------------|:---:|---------|
| `escalation_enabled` | `true` | เปิด/ปิดการเร่งรัดทั้งระบบ |
| `escalation_l1_days` | `30` | วันก่อนแจ้งครั้งที่ 1 |
| `escalation_l2_offset_days` | `15` | วันหลังครั้งที่ 1 ก่อนแจ้งครั้งที่ 2 |
| `escalation_l3_offset_days` | `7` | วันหลังครั้งที่ 2 ก่อนแจ้งครั้งที่ 3 |

- งาน `check_no_update_escalation` ต้องอ่านค่าจาก `system_settings` (ถ้ามี) มิฉะนั้นใช้ค่า default
- ถ้า `escalation_enabled = false` → ข้ามการส่ง N-10/11/12 ทั้งหมด
- การแก้ค่าใช้กับการตรวจรอบถัดไป (ไม่ย้อนหลังการแจ้งที่ส่งไปแล้ว)
- API/หน้าจอ: ดู `06` §6.4 (Settings) และ `07` §6.11 (Tab "ตั้งค่าการเร่งรัด")

---

## 5. Dashboard KPIs Summary

| # | KPI | สูตร | เป้าหมาย |
|---|-----|------|---------|
| KPI-1 | อัตราปิดเรื่อง | (เรื่องปิด / เรื่องทั้งหมด) × 100 | ≥ 80% |
| KPI-2 | อัตราเกินกำหนด | (เรื่องเกิน / เรื่องทั้งหมด) × 100 | ≤ 10% |
| KPI-3 | ระยะเวลาเฉลี่ยในการปิดเรื่อง | AVG(closed_at - created_at) | ≤ SLA ของแต่ละประเภท |
| KPI-4 | เรื่องค้างรอดำเนินการ | COUNT(status NOT IN CLOSED, REJECTED) | ลดลงเรื่อยๆ |
| KPI-5 | เรื่องใหม่ต่อเดือน | COUNT(created ต่อเดือน) | ติดตามแนวโน้ม |

---

## 6. Assumptions

| # | สมมติฐาน |
|---|---------|
| A-1 | Dashboard คำนวณ Real-time (ไม่มี Cache) ใน Phase แรก |
| A-2 | Notification เป็นระบบภายในเท่านั้น (ไม่มี Email/SMS/LINE) |
| A-3 | Scheduled Job ใช้ `node-cron` ใน Phase แรก |
| A-4 | Near Due Warning ส่งครั้งเดียวต่อเรื่อง (ไม่ส่งซ้ำทุกวัน) |
| A-5 | Export Excel ทำฝั่ง Backend (ไม่ใช่ Frontend) |
| A-6 | Status-Update Escalation (N-10/11/12) ส่งครั้งเดียวต่อ Level ต่อวงรอบ และรีเซ็ตเมื่อมีการอัพเดตความคืบหน้า (ใช้ `escalation_level` กันส่งซ้ำ) |

---

## 7. Open Questions

| # | คำถาม | ส่งผลต่อ |
|---|-------|---------|
| Q-1 | ต้องการ KPI เป้าหมายจริง (อัตราปิดเรื่อง ≥ XX%) หรือไม่? | Dashboard Display |
| Q-2 | ต้องการส่ง Notification ผ่าน Email/LINE ในอนาคตหรือไม่? | Notification Architecture |
| Q-3 | Near Due Warning ส่งทุกวันจนกว่าจะปิด หรือส่งครั้งเดียว? | Notification Logic |
| Q-4 | ต้องการรายงานเพิ่มเติม เช่น ตามพื้นที่ (อำเภอ) หรือไม่? | Report Types |

---

> **เอกสารถัดไป:** `docs/planning/09-project-docker-architecture.md` — Project Structure & Docker Architecture
