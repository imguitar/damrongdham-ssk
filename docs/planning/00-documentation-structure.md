# 00 — Documentation Structure: ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด

> เอกสารฉบับนี้กำหนดโครงสร้าง มาตรฐาน และลำดับการสร้างเอกสารทั้งหมดในโปรเจกต์
> ใช้สำหรับอ้างอิงในการทำงานร่วมกับ AI ตลอดการพัฒนา

---

## 1. โครงสร้างโฟลเดอร์ `docs/`

โฟลเดอร์ `docs/` จะถูกแบ่งออกเป็น 3 หมวดหมู่หลักตามช่วงของการพัฒนา:

```
damrongdham-ssk/
└── docs/
    ├── planning/       # เอกสารวิเคราะห์, ออกแบบ และวางแผน (Phase 0)
    ├── testing/        # เอกสารทดสอบระบบ, Test Cases, UAT (Phase 14)
    └── deployment/     # เอกสารการติดตั้ง, คู่มือใช้งาน, Backup (Phase 15)
```

---

## 2. โครงสร้างและวัตถุประสงค์ของ `docs/planning/`

โฟลเดอร์นี้เก็บเอกสารวิเคราะห์และออกแบบระบบทั้งหมด ซึ่งถือเป็น **Single Source of Truth** สำหรับ AI ก่อนเริ่มเขียนโค้ด

| ลำดับสร้าง | ชื่อไฟล์ | วัตถุประสงค์หลัก |
|:---:|---|---|
| 1 | `00-tech-stack-decision.md` | สรุป Technology Stack, เหตุผล, ข้อจำกัด, และ Architecture พื้นฐาน |
| 2 | `00-ai-working-rules.md` | กติกาควบคุมพฤติกรรมของ AI (ห้ามข้าม Phase, ข้อห้ามต่างๆ) |
| 3 | `00-documentation-structure.md` | โครงสร้างและมาตรฐานเอกสารของโปรเจกต์ (เอกสารฉบับนี้) |
| 4 | `01-system-overview.md` | ภาพรวมระบบ, ผู้ใช้งานหลัก, วัตถุประสงค์ และเป้าหมาย |
| 5 | `02-requirements.md` | Functional & Non-functional Requirements อย่างละเอียด |
| 6 | `03-roles-permissions.md` | ตารางกำหนด Role, สิทธิ์การเข้าถึง และการมองเห็นข้อมูล |
| 7 | `04-complaint-workflow.md` | ลำดับขั้นตอน (Status Transitions) ของเรื่องร้องเรียน + SLA |
| 8 | `05-database-design.md` | โครงสร้างฐานข้อมูล (ERD Overview), Tables, Fields, Relationships |
| 9 | `06-api-contract.md` | สเปกของ REST API ทั้งหมด (Endpoints, Methods, Request/Response) |
| 10 | `07-frontend-pages.md` | โครงสร้างหน้าจอ, UI Components, และเส้นทางการนำทาง (Routing) |
| 11 | `08-dashboard-report-notification.md`| กฎการแจ้งเตือน, ตัวชี้วัด (KPIs), และรูปแบบรายงาน/Dashboard |
| 12 | `09-project-docker-architecture.md` | โครงสร้างโฟลเดอร์ Project, Docker Compose Services, Network, Volume |
| 13 | `PROJECT_CONTEXT.md` | **เอกสารสรุป Context ทั้งหมด** เพื่อให้ AI โหลดอ่านแบบไวๆ ก่อนเริ่มงาน |
| 14 | `10-implementation-plan.md` | แผนการพัฒนาแบ่งตาม Phase (0-15) + Acceptance Criteria ของแต่ละ Phase |

> **หมายเหตุ:** เนื้อหาฟีเจอร์ สมาชิกประชาชน (Citizen) + ปกปิดตัวตน (Anonymous) + ยื่นแบบสมาชิก/ไม่สมาชิก เดิมแยกเป็น `11-citizen-membership-anonymity.md` — ปัจจุบัน **รวมเข้าเอกสารหลักแล้ว** (`03` §12 และ §5.1.1 เป็น SSOT, การยื่นใน `04` §5 Step 0, Acceptance Criteria ใน `10`) และนำไฟล์ 11 ออกแล้ว

---

## 3. โครงสร้าง `docs/testing/`

โฟลเดอร์นี้เก็บเอกสารที่เกี่ยวกับการทดสอบระบบ (จะถูกสร้างใน Phase 14)

| ชื่อไฟล์ (แนะนำ) | วัตถุประสงค์หลัก |
|---|---|
| `TEST_PLAN.md` | แผนการทดสอบโดยรวม, ขอบเขต และวิธีทดสอบ |
| `API_TESTING.md` | คู่มือการรัน API Tests (เช่น curl commands หรือ Postman) |
| `UAT_PLAN.md` | User Acceptance Test Plan สำหรับให้ผู้ใช้จริงทดสอบ |
| `BUG_REPORTS.md` | บันทึกข้อผิดพลาดที่พบระหว่างการพัฒนาและการแก้ไข |

---

## 4. โครงสร้าง `docs/deployment/`

โฟลเดอร์นี้เก็บเอกสารที่เกี่ยวกับการนำระบบไปใช้งานจริง (จะถูกสร้างใน Phase 15)

| ชื่อไฟล์ (แนะนำ) | วัตถุประสงค์หลัก |
|---|---|
| `DEPLOYMENT.md` | ขั้นตอนการติดตั้งระบบบน Production Server ทีละขั้นตอน |
| `BACKUP_RESTORE.md` | ขั้นตอนการสำรองข้อมูล (Database, Uploads) และการกู้คืน |
| `MONITORING_MAINTENANCE.md` | คู่มือการดูแลรักษาระบบ, เช็ค Logs, จัดการเนื้อที่ดิสก์ |
| `POST_DEPLOYMENT_CHECKLIST.md` | สิ่งที่ต้องตรวจสอบหลังนำระบบขึ้น Production แล้ว |

---

## 5. กติกาการตั้งชื่อไฟล์

1.  **Format**: ใช้ `kebab-case.md` ทั้งหมด ห้ามเว้นวรรค
2.  **Numbering (สำหรับ Planning)**:
    *   ใช้ตัวเลขสองหลักนำหน้า (เช่น `01-xxx.md`, `02-xxx.md`)
    *   เอกสารเชิงกติกาหรือโครงสร้าง ให้ใช้ `00-xxx.md`
    *   เอกสารสรุป ให้ใช้ `PROJECT_CONTEXT.md` (ตัวพิมพ์ใหญ่เพื่อให้เด่นชัด)
3.  **Extension**: ต้องเป็น `.md` เสมอ

---

## 6. กติกาการเขียน Markdown

1.  **Title**: บรรทัดแรกของเอกสารต้องเป็น Heading 1 (`# หมายเลข — ชื่อเอกสาร: โปรเจกต์`)
2.  **Context Reminder**: ใต้ Heading 1 ควรมี Blockquote (`>`) เตือน AI ว่านี่คือเอกสารสำหรับ Planning Only
3.  **Tables**: ข้อมูลที่มีโครงสร้างชัดเจน (เช่น Roles, APIs, Fields) ให้ **ใช้ตาราง (Table)** เพื่อความอ่านง่าย
4.  **Code Blocks**: ใช้ Code Blocks (` ``` `) สำหรับ โค้ด, คำสั่งรัน, โครงสร้างโฟลเดอร์ หรือ JSON format
5.  **Checklists**: ใช้ `- [ ]` สำหรับรายการสิ่งที่ต้องทำ (Acceptance Criteria)
6.  **Cross-reference**: เมื่อพูดถึงเอกสารอื่น ให้ทำลิงก์อ้างอิงเสมอ (เช่น "อ้างอิงจาก `05-database-design.md`")

---

## 7. วิธีใช้เอกสารเหล่านี้กับ AI ในแต่ละ Phase

เพื่อให้ AI ทำงานได้อย่างแม่นยำและไม่หลุดบริบท:

| เหตุการณ์ | สิ่งที่ต้องสั่งให้ AI อ่าน |
|---|---|
| **ก่อนเริ่มเขียนโค้ด (ต้น Phase)** | สั่งอ่าน `PROJECT_CONTEXT.md` + `10-implementation-plan.md` + ไฟล์ `SKILL.md` ของ AI |
| **ก่อนออกแบบหน้า UI** | สั่งอ่าน `07-frontend-pages.md` + `03-roles-permissions.md` |
| **ก่อนสร้าง/แก้ไข API** | สั่งอ่าน `06-api-contract.md` + `05-database-design.md` |
| **ก่อนทำ Workflow Logic** | สั่งอ่าน `04-complaint-workflow.md` + `08-dashboard-report-notification.md` |
| **ก่อน Setup/Config** | สั่งอ่าน `09-project-docker-architecture.md` |

> **คำแนะนำสำหรับ User:** ในตอนเริ่ม Phase 1 ควรพิมพ์ prompt ว่า:
> *"เรากำลังจะเริ่ม Phase 1 โปรดอ่าน `SKILL.md`, `PROJECT_CONTEXT.md` และดูแผนใน `10-implementation-plan.md` ก่อนเริ่มทำงาน"*
