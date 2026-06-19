# แนวทางการสร้าง Web Application ด้วย AI

แนวทางนี้แบ่งการทำงานออกเป็น **4 ช่วงหลัก** เพื่อให้การใช้ AI ช่วยพัฒนา Web Application เป็นระบบ ลดความสับสน ลดการแก้ซ้ำ และควบคุมไม่ให้ AI เขียนโค้ดเกินขอบเขต

```text
Set Rules → Plan First → Build by Phase → Test & Deploy → Improve
```

---

## ภาพรวมทั้ง 4 ช่วง

| ช่วง | ชื่อช่วง | เป้าหมายหลัก |
|---|---|---|
| ช่วงที่ 0 | เตรียมกติกาและบริบท | กำหนดกติกาการทำงานของ AI, Tech Stack, Docs, Git และ Context |
| ช่วงที่ 1 | Planning Only | วิเคราะห์และออกแบบระบบให้ครบก่อนเขียนโค้ด |
| ช่วงที่ 2 | Implementation by Phase | พัฒนาทีละ Phase ตรวจสอบ แก้ Bug แล้วค่อยไป Phase ถัดไป |
| ช่วงที่ 3 | Testing & Deployment | ทดสอบรวมระบบ Deploy ขึ้น Server สำรองข้อมูล และดูแลต่อเนื่อง |

---

# ความแตกต่างของไฟล์สำคัญ

ก่อนเริ่มทำงาน ควรเข้าใจความแตกต่างของไฟล์หลัก 3 ไฟล์นี้

| ไฟล์ | สร้างเมื่อไหร่ | หน้าที่ |
|---|---|---|
| `SKILL.md` | ช่วงที่ 0 | กำหนดว่า AI ต้องทำงานอย่างไร |
| `docs/planning/PROJECT_CONTEXT.md` | หลัง Planning Step 1–9 | สรุปว่าโปรเจกต์นี้คืออะไร |
| `docs/planning/10-implementation-plan.md` | ปลายช่วง Planning Only | กำหนดว่าจะพัฒนาเป็น Phase อะไรบ้าง |

สรุปสั้น ๆ คือ

```text
SKILL.md = คู่มือการทำงานของ AI
PROJECT_CONTEXT.md = บริบทของระบบ
10-implementation-plan.md = แผนพัฒนาทีละ Phase
```

---

# ช่วงที่ 0: เตรียมกติกาและบริบท

## เป้าหมาย

ช่วงนี้เป็นการเตรียมกติกาและบริบทก่อนให้ AI เริ่มวิเคราะห์ ออกแบบ หรือเขียนโค้ด เพื่อให้ AI ทำงานอยู่ในกรอบเดียวกันตลอดทั้งโปรเจกต์

หัวใจสำคัญของช่วงนี้คือการสร้าง `SKILL.md` ตั้งแต่ต้น เพื่อกำหนดกติกาว่า AI ต้องทำงานอย่างไร ห้ามทำอะไร และต้องตอบผลลัพธ์ในรูปแบบใด

---

## สิ่งที่ต้องทำ

- กำหนด Tech Stack
- สร้าง `SKILL.md`
- กำหนด AI Working Rules
- กำหนดโครงสร้างเอกสาร
- กำหนด Git Workflow
- กำหนดวิธีเก็บ Context
- กำหนด Naming Convention
- กำหนดรูปแบบการเก็บไฟล์ Markdown
- กำหนดว่า AI ต้องทำงานตาม Phase เท่านั้น
- กำหนดว่า AI ห้ามเขียนโค้ดก่อน Planning เสร็จ

---

## ตัวอย่าง Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React + Vite + MUI |
| Backend | Node.js + Express |
| Database | MySQL 8 |
| Container (Dev) | Docker Compose |
| Database Tool (Dev) | phpMyAdmin |
| Deploy | Railway (single-container Dockerfile) |

---

## ไฟล์ที่ควรสร้างในช่วงที่ 0

```text
SKILL.md
docs/
docs/planning/
docs/testing/
docs/deployment/
README.md
.gitignore
```

---

## ตำแหน่งที่แนะนำสำหรับ `SKILL.md`

ควรเก็บไว้ที่ root ของโปรเจกต์

```text
your-project/
├── SKILL.md            # หรือ .agents/skills/<name>/SKILL.md (ตามที่ repo นี้ใช้)
├── frontend/
├── backend/
├── db/                 # SQL init scripts (ชื่อ db/ ไม่ใช่ database/)
├── docs/
└── README.md
```

เหตุผลคือ AI Tools เช่น Cursor, Copilot, Claude Code หรือ VS Code Agent มักอ่านไฟล์ที่อยู่ root ของโปรเจกต์ได้ง่าย

---

## ตัวอย่างเนื้อหาที่ควรมีใน `SKILL.md`

```text
- AI ต้องทำเฉพาะงานที่ได้รับมอบหมาย
- ห้ามเขียนโค้ดก่อน Planning เสร็จ
- ห้ามทำเกิน Phase
- ห้ามเพิ่ม Feature นอกแผน
- ห้ามเปลี่ยน Tech Stack โดยไม่ได้รับอนุญาต
- ห้ามเปลี่ยน Architecture ถ้าไม่จำเป็น
- ถ้าจำเป็นต้องเปลี่ยนจากแผนเดิม ต้องแจ้งเหตุผลก่อน
- ทุก Phase ต้องมีวิธีรัน
- ทุก Phase ต้องมีวิธีทดสอบ
- ทุก Phase ต้องมี Acceptance Criteria Checklist
- ทุก Phase ต้องมี Git Commit Message ที่แนะนำ
```

---

## ตัวอย่างผลลัพธ์ที่ควรได้จากช่วงที่ 0

```text
SKILL.md
docs/planning/
docs/testing/
docs/deployment/
Git commit convention
Tech Stack Decision
AI Working Rules
```

> หมายเหตุ: `PROJECT_CONTEXT.md` ยังไม่ควรสร้างในช่วงนี้ เพราะต้องรอข้อมูลจาก Planning Step 1–9 ก่อน

---

## หัวใจของช่วงนี้

```text
กำหนดกติกาให้ AI ทำงานเป็นระบบ ก่อนเริ่มวางแผนหรือเขียนโค้ด
```

---

# ช่วงที่ 1: Planning Only

## เป้าหมาย

ช่วงนี้เป็นการวิเคราะห์และออกแบบระบบเท่านั้น **ยังไม่เขียนโค้ด** เพื่อให้ได้แผนที่ชัดเจนก่อนเริ่ม Implementation

AI ต้องทำงานตามกติกาใน `SKILL.md` โดยเฉพาะกติกาเรื่อง:

```text
- ห้ามเขียน code
- ห้ามสร้าง implementation จริง
- ให้ตอบเป็น Markdown
- ให้เก็บผลลัพธ์ตาม path ที่กำหนด
- ให้ระบุ Assumptions
- ให้ระบุ Open Questions
```

---

## สิ่งที่ต้องทำ

- วิเคราะห์ระบบ
- วิเคราะห์ Requirement
- ออกแบบ User Role / Permission
- ออกแบบ Workflow
- ออกแบบฐานข้อมูล
- ออกแบบ API
- ออกแบบ UI / Page Structure
- ออกแบบ Dashboard / Report / Notification
- ออกแบบ Docker Architecture
- สร้าง `PROJECT_CONTEXT.md`
- แบ่ง Phase การพัฒนา
- กำหนด Deliverables ของแต่ละ Phase
- กำหนด Acceptance Criteria
- กำหนด Testing Plan เบื้องต้น

---

## เอกสารที่ควรสร้างในช่วง Planning Only

```text
docs/planning/01-system-overview.md
docs/planning/02-requirements.md
docs/planning/03-roles-permissions.md
docs/planning/04-complaint-workflow.md
docs/planning/05-database-design.md
docs/planning/06-api-contract.md
docs/planning/07-frontend-pages.md
docs/planning/08-dashboard-report-notification.md
docs/planning/09-project-docker-architecture.md
docs/planning/PROJECT_CONTEXT.md
docs/planning/10-implementation-plan.md
```

---

## ลำดับการสร้างเอกสารในช่วง Planning Only

| ลำดับ | ไฟล์ | วัตถุประสงค์ |
|---|---|---|
| 1 | `01-system-overview.md` | สรุปภาพรวมระบบ |
| 2 | `02-requirements.md` | วิเคราะห์ Requirement |
| 3 | `03-roles-permissions.md` | ออกแบบ Role และ Permission |
| 4 | `04-complaint-workflow.md` | ออกแบบ Workflow |
| 5 | `05-database-design.md` | ออกแบบฐานข้อมูล |
| 6 | `06-api-contract.md` | ออกแบบ API |
| 7 | `07-frontend-pages.md` | ออกแบบหน้าจอ |
| 8 | `08-dashboard-report-notification.md` | ออกแบบ Dashboard, Report, Notification |
| 9 | `09-project-docker-architecture.md` | ออกแบบ Project Structure และ Docker |
| 10 | `PROJECT_CONTEXT.md` | สรุปบริบทกลางของโปรเจกต์ |
| 11 | `10-implementation-plan.md` | แบ่ง Phase สำหรับ Implementation |

---

## ความสำคัญของ `PROJECT_CONTEXT.md`

`PROJECT_CONTEXT.md` ควรสร้างหลังจากทำเอกสาร Planning Step 1–9 ครบแล้ว เพราะต้องสรุปข้อมูลจากเอกสารทั้งหมด

ไฟล์นี้ใช้ตอบคำถามว่า

```text
โปรเจกต์นี้คืออะไร
ระบบมีขอบเขตอะไร
ใช้ Tech Stack อะไร
มี Feature หลักอะไร
มี Role อะไร
มี Workflow อย่างไร
มี Database/API/UI/Docker อย่างไร
```

ตำแหน่งที่แนะนำคือ

```text
docs/planning/PROJECT_CONTEXT.md
```

---

## ตัวอย่างหัวข้อใน `PROJECT_CONTEXT.md`

```text
1. Project Name
2. Project Summary
3. System Objectives
4. Tech Stack
5. Target Users
6. User Roles and Permissions Summary
7. Core Features
8. Workflow Summary
9. Main Database Tables
10. Main API Modules
11. Frontend Page Structure
12. Dashboard and Report Summary
13. Docker Architecture Summary
14. Development Rules for AI
15. Key Decisions
16. Assumptions
17. Open Questions
18. Important Notes for Future AI Prompts
```

---

## ตัวอย่างหัวข้อใน Implementation Plan

| Phase | รายละเอียด |
|---|---|
| Phase 1 | Project Setup |
| Phase 2 | Database Schema |
| Phase 3 | Backend Core |
| Phase 4 | Authentication |
| Phase 5 | Main CRUD API |
| Phase 6 | Workflow API |
| Phase 7 | Frontend Layout |
| Phase 8 | Frontend API Integration |
| Phase 9 | Dashboard |
| Phase 10 | Docker Integration |
| Phase 11 | Testing Preparation |
| Phase 12 | Deployment Preparation |

---

## หัวใจของช่วงนี้

```text
วางแผนให้ครบก่อน ไม่ให้ AI รีบเขียนโค้ด
```

---

# ช่วงที่ 2: Implementation by Phase

## เป้าหมาย

ช่วงนี้เป็นการเริ่มเขียนโค้ดจริง แต่ต้องทำ **ทีละ Phase เท่านั้น** เพื่อควบคุมขอบเขต ลดข้อผิดพลาด และตรวจสอบความถูกต้องได้ง่าย

ก่อนเริ่มทำงานในแต่ละ Phase ต้องให้ AI อ่านไฟล์ต่อไปนี้ก่อนเสมอ

```text
1. SKILL.md
2. docs/planning/PROJECT_CONTEXT.md
3. docs/planning/10-implementation-plan.md
```

---

## สิ่งที่ต้องทำ

- ทำเฉพาะ Phase ที่กำหนด
- สร้างหรือแก้ไฟล์เฉพาะที่เกี่ยวข้อง
- ห้ามทำ Phase ถัดไปล่วงหน้า
- ห้ามเพิ่ม Feature นอกแผน
- ห้ามเปลี่ยน Architecture ถ้าไม่จำเป็น
- รันทดสอบเบื้องต้น
- ตรวจตาม Acceptance Criteria
- แก้ Bug
- Commit งาน
- สรุปผล Phase
- ค่อยเริ่ม Phase ถัดไป

---

## วงจรการทำงานในแต่ละ Phase

```text
เริ่ม Phase
→ อ่าน SKILL.md + PROJECT_CONTEXT.md + 10-implementation-plan.md
→ สร้าง/แก้ไขไฟล์เฉพาะ Phase
→ รันทดสอบ
→ ตรวจตาม Acceptance Criteria
→ แก้ Bug
→ Commit
→ สรุป Phase
→ ไป Phase ถัดไป
```

---

## ตัวอย่าง Prompt สำคัญ

```text
อ่านไฟล์ต่อไปนี้ก่อนเริ่มทำงาน:
1. SKILL.md
2. docs/planning/PROJECT_CONTEXT.md
3. docs/planning/10-implementation-plan.md

จากนั้นให้ทำเฉพาะ Phase นี้เท่านั้น ห้ามทำเกิน Phase
```

```text
ห้ามเพิ่ม Feature ใหม่
ห้ามเปลี่ยน Architecture เดิมถ้าไม่จำเป็น
ถ้าจำเป็นต้องเปลี่ยนจากแผนเดิม ให้แจ้งเหตุผลก่อน
```

---

## สิ่งที่ควรมีหลังจบแต่ละ Phase

- รายการงานที่ทำเสร็จ
- ไฟล์ที่สร้างใหม่
- ไฟล์ที่แก้ไข
- ผลการทดสอบ
- Bug ที่แก้แล้ว
- Known Issues
- Acceptance Criteria Checklist
- Git commit message
- Next Phase TODO
- Phase Completion Report

---

## ตัวอย่าง Git Commit หลังจบ Phase

```bash
git add .
git commit -m "feat: complete phase 1 project setup"
```

หรือ

```bash
git commit -m "docs: complete planning documents"
git commit -m "feat: add backend health check"
git commit -m "fix: resolve database connection issue"
```

---

## หัวใจของช่วงนี้

```text
ทำทีละ Phase → ตรวจสอบ → แก้ Bug → Commit → ไป Phase ถัดไป
```

---

# ช่วงที่ 3: Testing & Deployment

## เป้าหมาย

ช่วงนี้เป็นการทดสอบรวมระบบ เตรียมระบบสำหรับใช้งานจริง Deploy ขึ้น Server สำรองข้อมูล ตรวจสอบความปลอดภัย และวางแผนดูแลต่อเนื่อง

ช่วงนี้ไม่ควรเพิ่ม Feature ใหม่ แต่ควรเน้นตรวจสอบความถูกต้อง ความปลอดภัย ความเสถียร และความพร้อมใช้งานจริง

---

## สิ่งที่ต้องทำ

- ทดสอบรวมระบบ End-to-End
- ทดสอบ API
- ทดสอบ Frontend
- ทดสอบ Role / Permission
- ทดสอบ Workflow หลัก
- ทดสอบ Docker Integration
- ตรวจ Security เบื้องต้น
- เตรียม Production Environment
- Deploy ขึ้น Railway (single-container จาก Dockerfile)
- Domain / SSL (Railway จัดการอัตโนมัติ)
- สำรองข้อมูล
- ตรวจสอบ Log
- Monitoring
- UAT กับผู้ใช้งานจริง
- ปรับปรุงต่อเนื่อง

---

## เอกสารที่ควรสร้างในช่วง Testing & Deployment

```text
docs/testing/TESTING_PLAN.md
docs/testing/UAT_PLAN.md
docs/deployment/DEPLOYMENT.md
docs/deployment/BACKUP_RESTORE.md
docs/deployment/MONITORING_MAINTENANCE.md
docs/deployment/POST_DEPLOYMENT_CHECKLIST.md
```

---

## ตัวอย่าง Checklist สำคัญ

| หมวด | สิ่งที่ต้องตรวจ |
|---|---|
| Frontend | เปิดหน้าเว็บได้, Routing ถูกต้อง, Login ได้ |
| Backend | API ทำงานถูกต้อง, Error response เหมาะสม |
| Database | ตารางครบ, Migration ถูกต้อง, Seed Data พร้อม |
| Auth | Login, Token, Permission, Role-based Access |
| Workflow | ขั้นตอนการทำงานถูกต้องตามสถานะ |
| Docker | Container ทำงานร่วมกันได้, Network ถูกต้อง |
| Security | CORS, JWT, Password Hashing, SQL Injection |
| Deployment | Railway (Dockerfile), Domain + SSL (auto), Production ENV |
| Backup | Backup Database, Restore Test, Backup Upload Files |
| Monitoring | Log, Error, Disk Usage, Service Status |
| UAT | ผู้ใช้งานจริงทดสอบและยอมรับระบบ |

---

## หัวใจของช่วงนี้

```text
Test → Secure → Deploy → Backup → Monitor → Improve
```

---

# โครงสร้างโปรเจกต์ที่แนะนำ

```text
your-project/
├── SKILL.md            # repo นี้เก็บที่ .agents/skills/damrongdham-dev/SKILL.md
├── frontend/
├── backend/            # มี src/server.js + uploads/
├── db/                 # init/ (CREATE TABLE + seed) → mount initdb.d
├── docs/
│   ├── planning/
│   │   ├── 01-system-overview.md
│   │   ├── 02-requirements.md
│   │   ├── 03-roles-permissions.md
│   │   ├── 04-complaint-workflow.md
│   │   ├── 05-database-design.md
│   │   ├── 06-api-contract.md
│   │   ├── 07-frontend-pages.md
│   │   ├── 08-dashboard-report-notification.md
│   │   ├── 09-project-docker-architecture.md
│   │   ├── PROJECT_CONTEXT.md
│   │   └── 10-implementation-plan.md
│   ├── testing/
│   │   ├── TESTING_PLAN.md
│   │   └── UAT_PLAN.md
│   └── deployment/
│       ├── DEPLOYMENT.md
│       ├── BACKUP_RESTORE.md
│       ├── MONITORING_MAINTENANCE.md
│       └── POST_DEPLOYMENT_CHECKLIST.md
├── docker-compose.yml   # Dev (frontend, backend, db, phpmyadmin)
├── Dockerfile           # Production multi-stage (Railway)
├── railway.toml         # Railway deploy config
├── .env.example
├── README.md
└── .gitignore
```

---

# ลำดับการสร้างไฟล์สำคัญ

```text
ช่วงที่ 0:
1. SKILL.md
2. docs/planning/
3. docs/testing/
4. docs/deployment/

ช่วงที่ 1:
5. 01-system-overview.md
6. 02-requirements.md
7. 03-roles-permissions.md
8. 04-complaint-workflow.md
9. 05-database-design.md
10. 06-api-contract.md
11. 07-frontend-pages.md
12. 08-dashboard-report-notification.md
13. 09-project-docker-architecture.md
14. PROJECT_CONTEXT.md
15. 10-implementation-plan.md

ช่วงที่ 2:
16. Source code ตาม Phase
17. Phase Completion Report

ช่วงที่ 3:
18. TESTING_PLAN.md
19. UAT_PLAN.md
20. DEPLOYMENT.md
21. BACKUP_RESTORE.md
22. MONITORING_MAINTENANCE.md
23. POST_DEPLOYMENT_CHECKLIST.md
```

---

# สรุปแบบสั้น

```text
ช่วงที่ 0: เตรียมกติกาและบริบท
สร้าง SKILL.md กำหนด Tech Stack, AI Rules, Docs, Git และ Context

ช่วงที่ 1: Planning Only
วิเคราะห์ระบบ ออกแบบ DB/API/UI/Docker สร้าง PROJECT_CONTEXT.md แบ่ง Phase และกำหนดเกณฑ์ตรวจรับ

ช่วงที่ 2: Implementation by Phase
อ่าน SKILL.md + PROJECT_CONTEXT.md + Implementation Plan แล้วทำทีละ Phase ตรวจสอบ แก้ Bug Commit แล้วค่อยไป Phase ถัดไป

ช่วงที่ 3: Testing & Deployment
ทดสอบรวมระบบ Deploy ขึ้น Server สำรองข้อมูล Monitoring UAT และปรับปรุงต่อเนื่อง
```

---

# แนวคิดหลัก

```text
Set Rules → Plan First → Build by Phase → Test & Deploy → Improve
```

การใช้ AI พัฒนา Web Application ควรให้ AI ทำงานเป็นผู้ช่วยตามขั้นตอน ไม่ใช่สั่งให้สร้างทั้งระบบในครั้งเดียว เพราะจะทำให้ระบบควบคุมยาก แก้ไขยาก และมีโอกาสผิดพลาดสูง

แนวทางที่ปลอดภัยและเหมาะสำหรับงานจริงคือ

```text
กำหนดกติกา → วางแผน → พัฒนาทีละช่วง → ตรวจสอบ → Deploy → ดูแลต่อเนื่อง
```
