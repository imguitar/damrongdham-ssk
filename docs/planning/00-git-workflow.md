# 00 — Git Workflow & Commit Rules: ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด

> เอกสารฉบับนี้กำหนดมาตรฐานการใช้ Git สำหรับการพัฒนาโปรเจกต์ร่วมกับ AI
> เพื่อให้มีจุดย้อนกลับ (Rollback Point) ที่ชัดเจนและปลอดภัยในทุกขั้นตอน

---

## 1. Branch Strategy

สำหรับการพัฒนาที่ขับเคลื่อนด้วย AI (AI-Driven Development) แนะนำให้ใช้โครงสร้าง Branch ที่เรียบง่าย เพื่อลดความซับซ้อนในการจัดการ:

*   **`main`**: เก็บโค้ดที่พร้อมใช้งานจริง (Production-ready) และผ่านการทดสอบแล้ว
*   **`develop`**: สาขาหลักสำหรับการพัฒนา (AI จะทำงานหลักที่สาขานี้)
*   **`feature/*`** (Optional): ใช้เมื่อต้องทำฟีเจอร์ใหญ่ที่อาจกระทบระบบหลัก (เช่น `feature/phase-4-auth`)
*   **`fix/*`** (Optional): ใช้สำหรับแก้ Bug ฉุกเฉิน (เช่น `fix/login-cors`)

---

## 2. Commit Convention

โปรเจกต์นี้ใช้มาตรฐาน **Conventional Commits** เพื่อให้อ่านประวัติการแก้ไขได้ง่ายและชัดเจน

| Type | ความหมาย | ตัวอย่างการใช้งาน |
|------|---------|-----------------|
| `docs` | เพิ่ม/แก้ไขเอกสาร (ไม่มีผลกับโค้ด) | งาน Planning, README, SKILL.md |
| `feat` | เพิ่มฟีเจอร์ใหม่ หรือจบ Phase | งาน Implementation เมื่อจบ Phase |
| `fix` | แก้ไข Bug ที่พบระหว่างทาง | งาน Debugging |
| `chore` | อัปเดตการตั้งค่า, Docker, Dependencies | เปลี่ยน Config, รัน `npm install` |
| `refactor`| ปรับปรุงโค้ดโดยไม่เปลี่ยนการทำงาน | จัดระเบียบไฟล์, แยก Component |
| `style` | ปรับรูปแบบโค้ด (ไม่กระทบ Logic) | จัด Format, ลบ space |
| `test` | เพิ่มหรือปรับปรุงการทดสอบ | งานเขียน Unit/Integration Tests |

---

## 3. Commit Message Format

รูปแบบมาตรฐานที่ต้องใช้:
```
<type>: <description>
```

**กฎการเขียน:**
*   ใช้ตัวพิมพ์เล็กทั้งหมดสำหรับ `<type>`
*   `<description>` ใช้ภาษาอังกฤษ อธิบายสั้นๆ เข้าใจง่าย (Imperative mood เช่น add, fix, update)
*   ไม่ต้องมีจุด (`.`) ต่อท้าย

---

## 4. When to Commit

เพื่อสร้างจุดย้อนกลับที่ปลอดภัย (Safety Nets) ควร Commit ในจังหวะต่อไปนี้:

1.  **เมื่อสร้างเอกสาร Planning เสร็จ 1 ฉบับ**
2.  **เมื่อพัฒนา Phase หนึ่งเสร็จสมบูรณ์** และผ่าน Acceptance Criteria
3.  **เมื่อแก้ไข Bug ระดับ Critical สำเร็จ**
4.  **เมื่อปรับแก้การตั้งค่า Infrastructure สำเร็จ** (เช่น Docker, Config)

⛔ **ห้าม Commit โค้ดที่ยังทำงานไม่เสร็จ หรือคอมไพล์ไม่ผ่าน (Broken Code)**

---

## 5. Commit per Planning Step

ในช่วง Phase 0 (Planning) ให้ Commit ทันทีที่สรุปเอกสารแต่ละฉบับเสร็จสิ้น เพื่อล็อค Requirement เป็นระยะ

**ตัวอย่าง:**
*   `docs: add tech stack decision`
*   `docs: add AI working rules`
*   `docs: add system overview`
*   `docs: add project context`

---

## 6. Commit per Implementation Phase

ในการพัฒนา (Phase 1-15) ให้ Commit **รวบยอด 1 ครั้ง เมื่อจบ Phase นั้นๆ** (หากเป็น Phase ใหญ่ อาจแบ่ง Commit ย่อยตามฟีเจอร์ได้ แต่ต้องทำงานได้สมบูรณ์)

**ตัวอย่าง:**
*   `feat: complete phase 1 project setup`
*   `feat: complete phase 4 authentication`
*   `feat: complete phase 5 complaint crud`

---

## 7. Commit after Bug Fix

เมื่อ AI ช่วยแก้ปัญหาหรือ Bug สำเร็จ ให้ Commit ทันทีเพื่อบันทึกวิธีแก้ปัญหานั้นไว้

**ตัวอย่าง:**
*   `fix: resolve backend database connection timeout`
*   `fix: resolve cors issue on login endpoint`

---

## 8. Rollback Strategy

หาก AI สร้างข้อผิดพลาดใน Phase ปัจจุบัน หรือระบบพัง:

1.  **ยกเลิกการเปลี่ยนแปลงที่ยังไม่ Commit (Discard changes):**
    ```bash
    git checkout -- .
    # หรือ
    git restore .
    ```
2.  **ย้อนกลับไป Commit ก่อนหน้า (Undo last commit but keep changes):**
    ```bash
    git reset HEAD~1
    ```
3.  **ย้อนกลับแบบลบข้อมูล (Hard Reset to last working state):**
    ```bash
    git reset --hard HEAD
    ```

> 💡 **Tip:** การย้อนกลับที่ปลอดภัยที่สุดคือการมี Commit ย่อยที่ดีตามจังหวะข้อ 4

---

## 9. Files that Should Be Committed

*   ✅ **Source Code**: ทุกไฟล์ใน `src/`, `components/`, `controllers/`, ฯลฯ
*   ✅ **Documentation**: ไฟล์ Markdown ใน `docs/` และ `README.md`, `SKILL.md`
*   ✅ **Infrastructure**: `docker-compose.yml`, `Dockerfile`, `nginx.conf`
*   ✅ **Configuration**: `package.json`, `vite.config.js`, `.eslintrc`
*   ✅ **Examples/Templates**: `.env.example`

---

## 10. Files that Should Not Be Committed

*   ❌ **Dependencies**: `node_modules/`
*   ❌ **Build Outputs**: `dist/`, `build/`
*   ❌ **Secrets**: `.env`, `*.pem`, `*.key`
*   ❌ **Database Data**: `mysql-data/`
*   ❌ **User Uploads**: ไฟล์ภาพ/เอกสารในโฟลเดอร์ `uploads/` (ยกเว้น `.gitkeep`)
*   ❌ **OS/Editor Files**: `.DS_Store`, `Thumbs.db`, `.vscode/`

---

## 11. Suggested `.gitignore` Rules

*(ตัวอย่างเบื้องต้น นำไปใส่ในไฟล์ `.gitignore` ของ Root Project)*

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build Outputs
dist/
build/
coverage/

# Environment Variables
.env
.env.production
.env.development

# Database / Storage
mysql-data/
backend/uploads/*
!backend/uploads/.gitkeep

# IDE / OS Files
.vscode/
.idea/
.DS_Store
Thumbs.db
npm-debug.log*
yarn-debug.log*
```

---

## 12. Example Commit Messages

รวบรวมตัวอย่าง Commit Message ที่ครอบคลุมการทำงาน:

*   `docs: add tech stack decision`
*   `docs: add AI working rules`
*   `docs: add system overview`
*   `docs: add project context`
*   `feat: complete phase 1 project setup`
*   `fix: resolve backend database connection`
*   `chore: update docker compose configuration`
*   `feat: implement role-based access control`
*   `refactor: optimize dashboard queries`
*   `docs: update API contract for complaints`
