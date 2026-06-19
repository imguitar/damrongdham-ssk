# 00 — AI Working Rules: ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด

> เอกสารฉบับนี้กำหนดกติกาการทำงานร่วมกับ AI ตลอดทุก Phase ของโปรเจกต์
> AI ต้องอ่านเอกสารนี้ก่อนเริ่มงานทุกครั้ง

---

## 1. General AI Rules

| # | กฎ |
|---|---|
| G-01 | AI ต้องอ่าน `PROJECT_CONTEXT.md` และ `10-implementation-plan.md` **ก่อนเริ่มงานทุก Phase** |
| G-02 | AI ต้องอ่าน `00-ai-working-rules.md` (เอกสารนี้) **ก่อนเริ่มงานทุกครั้ง** |
| G-03 | AI ต้องทำงาน **เฉพาะ Phase ที่ได้รับมอบหมาย** เท่านั้น |
| G-04 | AI ต้อง **ไม่เพิ่ม Feature** นอกเหนือจากที่ระบุใน Planning Documents |
| G-05 | AI ต้อง **ไม่เปลี่ยน Architecture, Tech Stack, Database Schema, API Contract** โดยไม่ได้รับอนุญาต |
| G-06 | ถ้าจำเป็นต้องเปลี่ยนจากแผนเดิม AI ต้อง **แจ้งเหตุผลก่อนดำเนินการ** |
| G-07 | AI ต้อง **ตอบเป็นภาษาไทย** เป็นหลัก (ยกเว้น Code, Technical Terms) |
| G-08 | AI ต้อง **ไม่ทำงานข้าม Phase** ถึงแม้จะง่ายหรือเห็นว่าเกี่ยวข้อง |
| G-09 | AI ต้อง **ไม่สมมติ Requirement** ที่ยังไม่ได้ระบุ — ต้องถามก่อน |
| G-10 | AI ต้อง **ไม่ลบ Code หรือไฟล์** ที่ทำงานอยู่แล้ว โดยไม่มีเหตุผล |

---

## 2. Planning Rules

| # | กฎ |
|---|---|
| P-01 | ในช่วง Planning — **ห้ามเขียน Code Implementation** |
| P-02 | Planning Documents ต้องอ้างอิงกันเป็นลำดับ (01 → 02 → ... → 10) |
| P-03 | ห้ามข้าม Planning Step — ต้องทำตามลำดับ |
| P-04 | ทุก Planning Document ต้องมีหัวข้อ **Assumptions** และ **Open Questions** |
| P-05 | ห้ามเริ่ม Implementation **จนกว่า Phase 0 จะเสร็จสมบูรณ์** |
| P-06 | ถ้า Planning เอกสารก่อนหน้ามีข้อขัดแย้ง — ต้องแจ้งก่อนดำเนินการ |
| P-07 | Planning Documents เก็บใน `docs/planning/` เท่านั้น |

---

## 3. Implementation Rules

| # | กฎ |
|---|---|
| I-01 | ทำเฉพาะ Phase ที่ได้รับมอบหมาย **ห้ามทำเกิน Phase** |
| I-02 | สร้างหรือแก้ไข **เฉพาะไฟล์ที่เกี่ยวข้องกับ Phase นี้** |
| I-03 | ถ้าต้องแก้ไฟล์ที่ทำเสร็จใน Phase ก่อนหน้า — ต้อง **ระบุเหตุผล** |
| I-04 | ต้อง **แสดงรายการไฟล์** ที่จะสร้างหรือแก้ไขก่อนเริ่มเขียน Code |
| I-05 | ต้องอ้างอิง **Planning Document** ที่เกี่ยวข้องกับ Phase นั้น |
| I-06 | Code ต้องสอดคล้องกับ **Architecture ที่กำหนดไว้** ใน `09-project-docker-architecture.md` |
| I-07 | API ต้องสอดคล้องกับ **API Contract** ที่กำหนดไว้ใน `06-api-contract.md` |
| I-08 | Database ต้องสอดคล้องกับ **Database Design** ที่กำหนดไว้ใน `05-database-design.md` |
| I-09 | Frontend ต้องสอดคล้องกับ **Page Structure** ที่กำหนดไว้ใน `07-frontend-pages.md` |
| I-10 | ทุก Phase ต้องจบด้วย **วิธีรัน + วิธีทดสอบ + Acceptance Criteria Checklist** |

---

## 4. Phase Control Rules

| # | กฎ |
|---|---|
| PC-01 | ทำเฉพาะ Phase ที่ระบุ — **ห้ามทำ Phase ถัดไปล่วงหน้า** |
| PC-02 | Phase ต้องผ่าน **Acceptance Criteria** ก่อนไป Phase ถัดไป |
| PC-03 | ถ้า Phase ไม่ผ่าน — ต้อง **แก้ไขจนผ่าน** ก่อนเริ่ม Phase ถัดไป |
| PC-04 | ห้ามข้าม Phase — ถ้าต้องทำพร้อมกัน ต้อง **ได้รับอนุมัติ** ก่อน |
| PC-05 | ก่อนเริ่ม Phase — ต้อง **ตรวจ Dependency** จาก Phase ก่อนหน้า |
| PC-06 | หลังจบ Phase — ต้อง **สรุป Phase Completion Report** |
| PC-07 | Phase Completion Report ต้องมี: Completed Tasks, Files Created/Modified, Test Results, Acceptance Criteria Status, Known Issues, Git Commit Message |

### Phase Workflow

```
1. อ่าน PROJECT_CONTEXT.md + Implementation Plan
2. ตรวจ Dependency จาก Phase ก่อนหน้า
3. แสดงขอบเขตของ Phase
4. แสดงรายการไฟล์ที่จะสร้าง/แก้ไข
5. เขียน Code เฉพาะ Phase นี้
6. อธิบายวิธีรัน + วิธีทดสอบ
7. ตรวจ Acceptance Criteria
8. สรุป Phase Completion Report
9. แนะนำ Git Commit Message
```

---

## 5. Code Generation Rules

| # | กฎ |
|---|---|
| CG-01 | ใช้ **JavaScript** เท่านั้น (ไม่ใช่ TypeScript) |
| CG-02 | ตั้งชื่อไฟล์เป็น **camelCase** สำหรับ JS, **PascalCase** สำหรับ JSX Components |
| CG-03 | Database fields ใช้ **snake_case** |
| CG-04 | API endpoints ใช้ **kebab-case** (หรือ lowercase) |
| CG-05 | ใช้ **mysql2** สำหรับ Database — ห้ามใช้ ORM |
| CG-06 | ใช้ **React Context** สำหรับ State — ห้ามใช้ Redux/Zustand |
| CG-07 | ใช้ **MUI** Components — ห้ามใช้ UI Library อื่น |
| CG-08 | Code ต้องมี **Comment** อธิบายส่วนสำคัญ (เป็นภาษาอังกฤษ) |
| CG-09 | ห้ามใช้ **hardcoded values** — ใช้ Constants หรือ Env Variables |
| CG-10 | ห้ามใส่ **Secret/Password จริง** ใน Code — ใช้ .env |
| CG-11 | ห้ามเขียน Code ที่ **ไม่เกี่ยวข้อง** กับ Phase ปัจจุบัน |
| CG-12 | ถ้าไฟล์ยาวมาก — แสดงเฉพาะ **ส่วนที่ต้องเปลี่ยน** พร้อมบริบทรอบข้าง |

---

## 6. Debugging Rules

| # | กฎ |
|---|---|
| D-01 | แก้เฉพาะ Bug ที่เกี่ยวข้องกับ **Phase ปัจจุบัน** |
| D-02 | ห้ามเพิ่ม Feature ใหม่ระหว่าง Debug |
| D-03 | ห้ามเปลี่ยน Architecture ระหว่าง Debug (ยกเว้นจำเป็นจริงๆ) |
| D-04 | ถ้าต้องแก้หลายไฟล์ — ระบุ **เหตุผลของแต่ละไฟล์** |
| D-05 | ต้อง **วิเคราะห์สาเหตุ** ก่อนแก้ — ไม่ใช่แก้มั่ว |
| D-06 | ตรวจว่าการแก้ไข **ไม่กระทบ Phase อื่น** |
| D-07 | หลังแก้ Bug ต้อง **อธิบายวิธีทดสอบ** ว่า Bug หายแล้ว |

---

## 7. Documentation Rules

| # | กฎ |
|---|---|
| DC-01 | Planning Documents เก็บใน `docs/planning/` |
| DC-02 | Testing Documents เก็บใน `docs/testing/` |
| DC-03 | Deployment Documents เก็บใน `docs/deployment/` |
| DC-04 | ตั้งชื่อไฟล์เป็น **kebab-case** ด้วยหมายเลขนำหน้า (`01-xxx.md`) |
| DC-05 | ใช้ **Markdown** เท่านั้น |
| DC-06 | ทุกเอกสารต้องมี **Header** ระบุวัตถุประสงค์ |
| DC-07 | ห้ามแก้ไขเอกสาร Planning **หลัง Phase 0 เสร็จ** — ยกเว้นมีเหตุผลสำคัญ |
| DC-08 | ถ้าต้องแก้ Planning Document — ต้อง **แจ้ง + ระบุเหตุผล** ก่อน |
| DC-09 | `README.md` ต้องอัปเดตทุกครั้งที่วิธีรัน/ติดตั้งเปลี่ยน |

---

## 8. Testing Rules

| # | กฎ |
|---|---|
| T-01 | ทุก Phase ต้องมี **วิธีทดสอบ** ที่ชัดเจน |
| T-02 | ทุก Phase ต้องมี **Acceptance Criteria Checklist** |
| T-03 | API ต้องทดสอบด้วย **curl command** หรือ Postman Collection |
| T-04 | Frontend ต้องทดสอบ **Manual** ผ่าน Browser |
| T-05 | ต้องทดสอบ **Role-based Access** สำหรับทุก Role ที่เกี่ยวข้อง |
| T-06 | ต้องทดสอบ **Error Cases** (Invalid input, Unauthorized, Not Found) |
| T-07 | ต้องทดสอบ **Docker Clean Start** (down -v → up) อย่างน้อย Phase 1, 2, 13 |

---

## 9. Git Commit Rules

### 9.1 Commit Message Format

```
<type>: <description>
```

### 9.2 Commit Types

| Type | ใช้เมื่อ | ตัวอย่าง |
|------|--------|---------|
| `docs` | สร้าง/แก้ไขเอกสาร | `docs: add system overview` |
| `feat` | เพิ่ม Feature ใหม่ (จบ Phase) | `feat: complete phase 1 project setup` |
| `fix` | แก้ Bug | `fix: resolve mysql connection timeout` |
| `chore` | งานทั่วไป (config, dependency) | `chore: update docker compose ports` |
| `refactor` | ปรับโครงสร้าง Code (ไม่เปลี่ยนพฤติกรรม) | `refactor: extract validation middleware` |
| `style` | แก้ Code Style (ไม่เปลี่ยน Logic) | `style: format complaint controller` |
| `test` | เพิ่ม Test | `test: add auth api test cases` |

### 9.3 When to Commit

| เหตุการณ์ | Commit? | ตัวอย่าง Message |
|---------|:-------:|----------------|
| จบ Planning Step | ✅ | `docs: add database design` |
| จบ Phase | ✅ | `feat: complete phase 4 authentication` |
| แก้ Bug สำเร็จ | ✅ | `fix: resolve cors error on login` |
| เปลี่ยน Config | ✅ | `chore: update env variables` |
| กำลังทำยังไม่เสร็จ | ❌ | ห้าม Commit Code ที่ยังไม่ทำงาน |

### 9.4 Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Development branch (Commit ทุก Phase ที่นี่) |
| `feature/phase-X` | (Optional) แยก Branch ต่อ Phase |

---

## 10. Forbidden Actions

> ⛔ **AI ห้ามทำสิ่งต่อไปนี้โดยเด็ดขาด**

| # | ข้อห้าม |
|---|--------|
| F-01 | ❌ ห้ามเขียน Code **ก่อน Planning เสร็จสมบูรณ์** |
| F-02 | ❌ ห้ามทำ **เกิน Phase** ที่ได้รับมอบหมาย |
| F-03 | ❌ ห้ามเพิ่ม **Feature นอกแผน** |
| F-04 | ❌ ห้ามเปลี่ยน **Tech Stack** (เช่น เปลี่ยนจาก MUI เป็น Ant Design) |
| F-05 | ❌ ห้ามเปลี่ยน **Database Schema** โดยไม่แจ้ง |
| F-06 | ❌ ห้ามเปลี่ยน **API Contract** โดยไม่แจ้ง |
| F-07 | ❌ ห้ามเปลี่ยน **Project Structure** โดยไม่แจ้ง |
| F-08 | ❌ ห้ามใส่ **Secret/Password จริง** ใน Code |
| F-09 | ❌ ห้ามลบ **Code ที่ทำงานอยู่** โดยไม่มีเหตุผล |
| F-10 | ❌ ห้ามใช้ **ORM** (Sequelize, Prisma) |
| F-11 | ❌ ห้ามใช้ **TypeScript** |
| F-12 | ❌ ห้ามใช้ **Redux, Zustand** หรือ State Management Library อื่น |
| F-13 | ❌ ห้าม Commit Code ที่ **ยังไม่ทำงาน** |
| F-14 | ❌ ห้ามข้าม **Acceptance Criteria** ไปทำ Phase ถัดไป |

---

## 11. Required Output Format

### 11.1 เมื่อเริ่ม Phase ใหม่

```
## Phase X: [ชื่อ Phase]

### ขอบเขต
- สรุปสิ่งที่ต้องทำใน Phase นี้

### Dependency
- รายการ Phase ที่ต้องเสร็จก่อน

### ไฟล์ที่จะสร้าง/แก้ไข
- รายการไฟล์

### Code
[แสดง Code แยกตามไฟล์]

### วิธีรัน
[คำสั่งที่ใช้รัน]

### วิธีทดสอบ
[ขั้นตอนทดสอบ + curl commands]

### Acceptance Criteria
- [ ] Checklist

### Git Commit Message
[แนะนำ Commit Message]

### TODO สำหรับ Phase ถัดไป
[บอกสิ่งที่ยังไม่ต้องทำ]
```

### 11.2 เมื่อแก้ Bug

```
## Bug Fix: [อธิบาย Bug]

### สาเหตุ
[วิเคราะห์สาเหตุ]

### ไฟล์ที่แก้ไข
- รายการไฟล์ + เหตุผล

### Code ที่แก้ไข
[แสดง Code เฉพาะส่วนที่เปลี่ยน]

### วิธีทดสอบ
[ขั้นตอนทดสอบว่า Bug หาย]

### ผลกระทบ
[ตรวจว่าไม่กระทบ Phase อื่น]

### Git Commit Message
[แนะนำ Commit Message]
```

### 11.3 Phase Completion Report

```
## Phase Completion Report: Phase X

### Phase Summary
[สรุปสิ่งที่ทำ]

### Completed Tasks
- [x] รายการงานที่ทำเสร็จ

### Files Created
- รายการไฟล์ใหม่

### Files Modified
- รายการไฟล์ที่แก้ไข

### Test Results
[ผลการทดสอบ]

### Acceptance Criteria Status
- [x] Checklist ที่ผ่าน

### Known Issues
[ปัญหาที่ทราบแต่ยังไม่แก้]

### Risks
[ความเสี่ยง]

### Next Phase Readiness
[พร้อมขึ้น Phase ถัดไปหรือยัง]

### Git Commit Message
[Commit Message ที่แนะนำ]
```

---

## 12. How AI Should Ask Questions

| สถานการณ์ | วิธีที่ AI ควรทำ |
|----------|----------------|
| Requirement ไม่ชัดเจน | ถามก่อนทำ — ห้ามสมมติเอง |
| มีทางเลือกหลายแบบ | แสดงทางเลือก + ข้อดี/ข้อเสีย → ให้ User เลือก |
| ไม่แน่ใจว่าต้องทำหรือไม่ | ถามว่า "สิ่งนี้อยู่ในขอบเขต Phase นี้หรือไม่?" |
| ต้องเปลี่ยนจากแผนเดิม | บอกเหตุผล + ผลกระทบ → ขออนุมัติก่อน |
| พบ Bug จาก Phase ก่อนหน้า | แจ้ง Bug + แนะนำวิธีแก้ → ขอยืนยันก่อนแก้ |

### ตัวอย่างการถาม

```
❓ คำถาม: Field "complainant_name" ในตาราง complaints ต้อง NOT NULL หรือ NULLABLE?

เหตุผลที่ถาม: ผู้ร้องอาจเลือก "ไม่ระบุตัวตน" ซึ่งจะไม่มีชื่อ

ทางเลือก:
A) NULLABLE — รองรับกรณีไม่ระบุตัวตน
B) NOT NULL — บังคับกรอกชื่อเสมอ

แนะนำ: ทางเลือก A — สอดคล้องกับ Requirement ที่รองรับการร้องเรียนแบบไม่ระบุตัวตน
```

---

## 13. How AI Should Handle Unclear Requirements

| # | กฎ |
|---|---|
| UR-01 | ถ้า Requirement ไม่ชัดเจน — **ห้ามสมมติเอง** ต้องถามก่อน |
| UR-02 | ถ้า Planning Documents ขัดแย้งกัน — **แจ้งให้ทราบ** พร้อมระบุจุดที่ขัดแย้ง |
| UR-03 | ถ้าไม่มี Specification — ให้ **เสนอทางเลือก** พร้อมเหตุผล |
| UR-04 | ถ้าเกินขอบเขต Phase — ให้ **บันทึกเป็น TODO** สำหรับ Phase ถัดไป |
| UR-05 | ถ้าพบ Edge Case ที่ไม่ได้ระบุ — ให้ **ถาม** ก่อนตัดสินใจ |

---

## 14. How AI Should Report Changes

### 14.1 เมื่อสร้างไฟล์ใหม่

```
📁 สร้างไฟล์ใหม่: backend/src/controllers/authController.js
   วัตถุประสงค์: จัดการ Login, Logout, Change Password
   เกี่ยวข้องกับ: Phase 4, API Contract 06
```

### 14.2 เมื่อแก้ไขไฟล์เดิม

```
✏️ แก้ไขไฟล์: backend/src/routes/index.js
   สิ่งที่เปลี่ยน: เพิ่ม authRoutes เข้า Route Index
   เหตุผล: เชื่อมต่อ Auth API ที่สร้างใน Phase 4
   ผลกระทบ: ไม่มี (เพิ่ม Route ใหม่ ไม่แก้ Route เดิม)
```

### 14.3 เมื่อต้องเปลี่ยนจากแผนเดิม

```
⚠️ ขอเปลี่ยนจากแผนเดิม:

สิ่งที่แผนกำหนด: ใช้ jsonwebtoken โดยตรง
สิ่งที่ต้องการเปลี่ยน: ใช้ jose แทน
เหตุผล: jsonwebtoken มี Security Vulnerability (CVE-XXXX)
ผลกระทบ: API ไม่เปลี่ยน, เปลี่ยนเฉพาะ Internal Implementation
ขออนุมัติ: ใช่/ไม่ใช่?
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────┐
│           AI WORKING RULES SUMMARY           │
├─────────────────────────────────────────────┤
│                                              │
│  ✅ ทำ                    ❌ ห้ามทำ           │
│  ─────                   ──────             │
│  อ่าน Context ก่อน        ข้าม Phase          │
│  ทำเฉพาะ Phase นี้        เพิ่ม Feature       │
│  ถามเมื่อไม่ชัด           เปลี่ยน Architecture│
│  แจ้งก่อนเปลี่ยน          ใส่ Secret ใน Code  │
│  ทดสอบก่อนส่ง             Commit Code เสีย    │
│  สรุป Report              สมมติ Requirement   │
│                                              │
│  📋 ทุก Phase ต้องมี:                         │
│  □ ขอบเขต + ไฟล์ที่เกี่ยวข้อง                 │
│  □ Code ที่ทำงานได้                           │
│  □ วิธีรัน + วิธีทดสอบ                        │
│  □ Acceptance Criteria                       │
│  □ Git Commit Message                        │
│  □ Phase Completion Report                   │
│                                              │
└─────────────────────────────────────────────┘
```

---

> **เอกสารนี้ต้องถูกอ้างอิงก่อนเริ่มงานทุกครั้ง**
