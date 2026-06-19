---
name: damrongdham-dev
description: คู่มือการทำงานของ AI สำหรับโปรเจกต์ Web Application ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด (Damrongdham SSK)
---

# SKILL: Damrongdham SSK AI Assistant

## 1. Purpose

ไฟล์นี้คือคู่มือ (Instruction Manual) สำหรับ AI เพื่อใช้เป็นแนวทางในการพัฒนาโปรเจกต์ Damrongdham SSK (ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด) โดยครอบคลุมถึง Tech Stack, มาตรฐานการเขียนโค้ด, กติกาการทำงานตาม Phase, ข้อห้าม, และรูปแบบการตอบกลับ

AI **ต้องอ่านไฟล์นี้ทุกครั้งก่อนเริ่มทำงาน** และยึดถือกติกานี้อย่างเคร่งครัด

---

## 2. Project Working Principles

* **Tech Stack**: React 18 + Vite 5 + MUI 5 (Frontend), Node.js 20 LTS + Express 4 (Backend), MySQL 8 (Database), Docker Compose (Dev) → Prod 2 targets: **Railway** (primary) + **On-premise/Ubuntu** (`docker-compose.prod.yml` + Nginx) — ใช้ root `Dockerfile` ตัวเดียวกัน
* **Scope**: ศูนย์ดำรงธรรม **จังหวัดศรีสะเกษ** — Master Data (อำเภอ/ตำบล/ประเภทเรื่อง/หน่วยงาน) ตาม `docs/planning/05-database-design.md` §8
* **Architecture**: 3-Layer Architecture สำหรับ Backend (Route → Controller → Service → Model)
* **Workflow**: ทำงานเป็น Phase ตามที่กำหนดใน `docs/planning/10-implementation-plan.md`
* **Core Rule**: **ห้ามเขียนโค้ดนอกเหนือจากที่กำหนดใน Phase ปัจจุบัน**
* **Context First**: อ้างอิงเอกสารใน `docs/planning/` ก่อนตัดสินใจ

---

## 3. AI General Rules

1.  **Read Context First**: อ่าน `docs/planning/PROJECT_CONTEXT.md` และ `docs/planning/10-implementation-plan.md` ก่อนเริ่มเขียนโค้ดทุกครั้ง
2.  **No Assumption**: หาก Requirement ไม่ชัดเจน **ต้องถามผู้ใช้ก่อน** ห้ามคิดหรือเดาเอาเอง
3.  **Strict Phase Control**: ทำเฉพาะงานใน Phase ที่ได้รับมอบหมาย ห้ามทำเกินขอบเขต
4.  **No Unapproved Architecture Changes**: ห้ามเปลี่ยน Architecture, Tech Stack หรือ Database Schema ยกเว้นมีเหตุผลทางเทคนิคที่จำเป็นและได้รับอนุมัติจากผู้ใช้แล้ว
5.  **Language**: สื่อสารกับผู้ใช้เป็นภาษาไทย (ยกเว้น Code และ Technical Terms)

---

## 4. Planning Rules

1.  การวางแผนทั้งหมดจะอยู่ในโฟลเดอร์ `docs/planning/`
2.  ห้ามแก้ไขเอกสาร Planning เดิม (01-10) เว้นแต่พบข้อผิดพลาดร้ายแรงและได้รับอนุญาต
3.  หากระหว่างพัฒนาพบข้อจำกัดทางเทคนิคที่ต้องแก้แผน ให้สร้างเอกสารอัปเดต หรือปรับปรุงเอกสารเดิมโดยมี Commit Message ที่ชัดเจน

---

## 5. Implementation by Phase Rules

1.  เริ่มทำแต่ละ Phase เมื่อผู้ใช้สั่งให้เริ่มเท่านั้น (เช่น "เริ่ม Phase 1 ได้")
2.  ก่อนเขียนโค้ดในแต่ละ Phase:
    *   ระบุขอบเขตของงานใน Phase นั้น
    *   ระบุ Dependency ว่าต้องอิงกับ Phase ก่อนหน้าอย่างไร
    *   ระบุรายการไฟล์ที่จะสร้างหรือแก้ไข
3.  หลังเขียนโค้ดในแต่ละ Phase:
    *   สรุปวิธีรัน (Run Instructions)
    *   สรุปวิธีทดสอบ (Testing Instructions)
    *   สรุป Acceptance Criteria Checklist
    *   เสนอ Git Commit Message
    *   สร้าง Phase Completion Report
4.  **ต้องผ่าน Acceptance Criteria ของ Phase ปัจจุบันให้หมดก่อน จึงจะย้ายไป Phase ถัดไปได้**

---

## 6. Frontend Development Rules

1.  **Framework**: React + Vite
2.  **UI Library**: MUI (Material UI) เท่านั้น ห้ามใช้ Tailwind CSS หรือ Bootstrap
3.  **Language**: JavaScript (`.js`, `.jsx`) — ไม่ใช้ TypeScript
4.  **State Management**: ใช้ React Context API สำหรับ Global State เบื้องต้น — ห้ามใช้ Redux, Zustand ยกเว้นจำเป็นจริงๆ
5.  **API Client**: ใช้ `axios` พร้อม Interceptors สำหรับ Authentication (JWT)
6.  **Component Structure**: แยก UI Components ให้ Reusable และจัดหมวดหมู่ตาม `docs/planning/09-project-docker-architecture.md`
7.  **Naming Convention**:
    *   Components/Pages: PascalCase (e.g., `ComplaintList.jsx`)
    *   Hooks/Utils: camelCase (e.g., `useAuth.js`, `formatDate.js`)

---

## 7. Backend Development Rules

1.  **Framework**: Node.js + Express
2.  **Architecture**: แยก Logic เป็น Routes → Controllers → Services → Models
3.  **Language**: JavaScript (`.js`) — ไม่ใช้ TypeScript
4.  **Authentication**: ใช้ JWT (`jsonwebtoken`) และ bcrypt สำหรับรหัสผ่าน
5.  **Validation**: ตรวจสอบ Request Body/Params/Query ก่อนส่งเข้า Controller เสมอ
6.  **Error Handling**: ใช้ Global Error Handler Middleware ให้ API คืนค่า Error Response ที่มีรูปแบบเดียวกัน
7.  **Naming Convention**:
    *   Files/Functions/Variables: camelCase (e.g., `authController.js`, `createComplaint`)

---

## 8. Database Development Rules

1.  **Database**: MySQL 8.0
2.  **Driver**: `mysql2` (ใช้ Connection Pool + Promise) — **ห้ามใช้ ORM (Sequelize, Prisma, etc.)**
3.  **Encoding**: ใช้ `utf8mb4` และ `utf8mb4_unicode_ci` สำหรับทุกตารางเพื่อรองรับภาษาไทย
4.  **Naming Convention**:
    *   Tables/Columns: snake_case (e.g., `complaint_categories`, `created_at`)
5.  **SQL Scripts**: วางคำสั่ง `CREATE TABLE` และ Seed Data ไว้ใน `db/init/` (ปัจจุบันคือ `db/init/01-init.sql`) — โฟลเดอร์ชื่อ `db/` ไม่ใช่ `database/` และ mount เข้า `/docker-entrypoint-initdb.d`
6.  **Transactions**: ใช้ Database Transaction (`START TRANSACTION`, `COMMIT`, `ROLLBACK`) สำหรับคำสั่งที่อัปเดตหลายตารางพร้อมกัน

---

## 9. API Development Rules

1.  อ้างอิงและปฏิบัติตาม API Contract ใน `docs/planning/06-api-contract.md`
2.  RESTful Standard: ใช้ HTTP Methods (GET, POST, PUT, PATCH, DELETE) และ Status Codes ให้ถูกต้อง
3.  Response Format (Success):
    ```json
    {
      "success": true,
      "data": { ... }
    }
    ```
4.  Response Format (Error):
    ```json
    {
      "success": false,
      "error": {
        "code": "ERROR_CODE",
        "message": "Error description"
      }
    }
    ```

---

## 10. Docker Development Rules

1.  **Dev Environment**: ใช้ `docker-compose.yml` (Frontend, Backend, DB, phpMyAdmin) — ports: frontend `5173`, backend `5001`, MySQL host `3307`→`3306`, phpMyAdmin `8081`→`80`
2.  **Prod Environment — 2 targets (ใช้ root `Dockerfile` ตัวเดียวกัน):**
    *   **Railway (Primary)**: build จาก `Dockerfile` + `railway.toml` (single-container, health check `/api/health`). Railway จัดการ SSL/Domain — ไม่ใช้ Nginx
    *   **On-premise/Ubuntu (Alternative)**: `docker-compose.prod.yml` รัน `app` (image เดียวกัน) + `db` (MySQL) + `nginx` (`nginx/default.conf` ทำ SSL + reverse proxy → app:5001). env จาก `.env.production`
    *   ⚠️ ถ้าแก้โครงสร้าง/พฤติกรรมของแอป ต้องทำใน `Dockerfile`/โค้ดให้ใช้ได้ **ทั้งสอง target** ไม่ผูกกับ target ใด target หนึ่ง
3.  **Volumes**: Dev — Map Volume สำหรับ Source Code (Hot Reload) + `db/init`. Uploads: On-premise ใช้ Docker volume `app_uploads` (ถาวร); ⚠️ Railway filesystem ephemeral — ต้องใช้ Railway Volume หรือ Object Storage
4.  **Networking**: Service ต้องสื่อสารผ่าน Docker Internal Network ไม่ใช่ `localhost` (ยกเว้นเข้าจาก Host Machine)
5.  **Environment Variables**: ห้ามใส่ Secret หรือ Config ในโค้ดโดยตรง ให้ใช้ไฟล์ `.env` (ตัวอย่างเก็บใน `.env.example`); Prod ตั้งค่า env vars บน Railway

---

## 11. Testing Rules

1.  **Manual Test Instructions**: ทุก Phase ต้องมีวิธีทดสอบที่ทำตามได้จริง
2.  **Backend APIs**: เสนอ `curl` commands สำหรับการทดสอบ API ที่สร้างใหม่
3.  **Workflow Validation**: ทดสอบขอบเขตสถานะ (Transitions) ให้ตรงกับที่กำหนดไว้
4.  **Docker Tests**: ทดสอบ Clean Start (`docker compose down -v` → `docker compose up -d`) ในจุดสำคัญ (เช่น Phase 1, Phase 2)

---

## 12. Debugging Rules

1.  **Isolate Issue**: หาสาเหตุของ Bug ก่อนเริ่มแก้ไขโค้ด
2.  **Focus on Scope**: แก้ Bug เฉพาะส่วนที่เกี่ยวข้อง ห้ามเพิ่ม Feature หรือเปลี่ยน Logic โดยไม่จำเป็นระหว่างแก้ Bug
3.  **Log It**: ถ้าแก้ Bug ที่เกิดจาก Design Flaw ให้บันทึกลง Report
4.  **Verify Fix**: ระบุวิธีทดสอบเพื่อยืนยันว่า Bug ถูกแก้ไขแล้ว และไม่กระทบกับฟังก์ชันอื่น

---

## 13. Documentation Rules

1.  อัปเดต `README.md` หากมีขั้นตอนการรัน หรือ Dependencies ที่เปลี่ยนไป
2.  อธิบายโค้ดที่ซับซ้อนด้วย Comment สั้นๆ ภาษาอังกฤษ
3.  หากมีการแก้ไข API Contract หรือ Database Schema แบบฉุกเฉิน (และได้รับอนุมัติแล้ว) ต้องเข้าไปอัปเดตในไฟล์ `docs/planning/` ที่เกี่ยวข้องด้วย

---

## 14. Git Commit Rules

ใช้รูปแบบ Conventional Commits:

```
<type>: <description>
```

**Types ที่อนุญาต:**
*   `feat`: เพิ่ม Feature หรือจบ Phase
*   `fix`: แก้ไข Bug
*   `docs`: สร้างหรือแก้ไขเอกสาร
*   `chore`: ปรับปรุง Config, Docker, Dependencies
*   `refactor`: ปรับโครงสร้างโค้ด โดยไม่เปลี่ยน Logic ภายนอก

**ตัวอย่าง:**
*   `docs: create implementation plan (phase 10)`
*   `feat: complete phase 1 project setup`
*   `fix: resolve database connection timeout issue`

---

## 15. Security Rules

1.  **No Plaintext Passwords**: รหัสผ่านต้องถูกเข้ารหัสด้วย `bcrypt` ก่อนบันทึกลง Database
2.  **JWT Protection**: API ที่ต้องการสิทธิ์ต้องมี Middleware สำหรับตรวจสอบ JWT Token เสมอ
3.  **Role Authorization**: ต้องเช็คสิทธิ์ (Role) ในระดับ API Controller/Middleware ไม่ใช่แค่ซ่อนปุ่มใน UI
4.  **Input Validation**: ตรวจสอบ Input จากผู้ใช้เสมอ ป้องกัน SQL Injection และ XSS

---

## 16. Forbidden Actions

**⛔ AI ห้ามทำสิ่งเหล่านี้โดยเด็ดขาด ⛔**

1.  เขียนโค้ดข้าม Phase ที่ยังไม่ได้รับมอบหมาย
2.  ใช้ ORM (Sequelize, Prisma, TypeORM, ฯลฯ)
3.  ใช้ TypeScript (บังคับใช้เฉพาะ JavaScript)
4.  ใช้ State Management Libraries ภายนอก (Redux, Zustand) ยกเว้นผ่านการอนุมัติ
5.  ใช้ UI Framework อื่นนอกจาก MUI
6.  ใส่ Secret Keys, Passwords จริงลงใน Source Code (ให้ใช้ `.env`)
7.  ลบโค้ดหรือไฟล์ที่ทำงานได้ดีอยู่แล้วโดยไม่อธิบายเหตุผล
8.  ข้ามการทำ Acceptance Criteria Checklist

---

## 17. Required Response Format

เมื่อเริ่มต้นทำ Phase ใหม่ AI ต้องตอบด้วยรูปแบบนี้:

```markdown
## Phase X: [ชื่อ Phase]

### ขอบเขต (Scope)
- [สรุปงานที่จะทำใน Phase นี้]

### ไฟล์ที่จะสร้างหรือแก้ไข (Files to create/modify)
- `path/to/file1.js` (สร้างใหม่)
- `path/to/file2.js` (แก้ไข)

### Code Implementation
[แสดงเฉพาะโค้ดของไฟล์ที่จำเป็น ใช้คำสั่งเขียนไฟล์หากเกี่ยวข้อง]
```

---

## 18. Phase Completion Report Format

เมื่อผู้ใช้ยืนยัน หรือ AI พัฒนาและทดสอบ (หากทำได้) เสร็จแล้ว AI ต้องสรุปด้วยรูปแบบนี้:

```markdown
## Phase Completion Report: Phase X

### สรุปผลงาน (Summary)
[อธิบายสั้นๆ ว่าทำอะไรสำเร็จไปบ้าง]

### วิธีรันและวิธีทดสอบ (Run & Test Instructions)
1. `[Command สำหรับรัน]`
2. `[วิธีทดสอบ/Curl command]`

### Acceptance Criteria Checklist
- [x] ข้อ 1
- [x] ข้อ 2

### Git Commit Message
`[แนะนำ Git Commit Message สำหรับ Phase นี้]`

### ข้อเสนอแนะ / ปัญหาที่พบ (Optional)
[ถ้ามี]

**พร้อมดำเนินการ Phase ถัดไป (Phase Y) หรือไม่?**
```
