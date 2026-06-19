# Prompts สำหรับสั่งงานตาม Implementation Plan

> ชุด Prompt มาตรฐานสำหรับสั่งงาน AI ให้พัฒนาโปรเจกต์ Damrongdham SSK ทีละ Phase
> อิงกฎจาก `10-implementation-plan.md` และ skill `damrongdham-dev`

---

## Prompt 1 — เริ่มต้น Session (ใช้ครั้งแรกของทุก Session)

```
อ่าน skill `damrongdham-dev`, `docs/planning/PROJECT_CONTEXT.md` และ
`docs/planning/10-implementation-plan.md` ให้ครบก่อนเริ่มงาน

กติกาที่ต้องยึดตลอด session นี้:
- ทำเฉพาะ Phase ที่ผมสั่งเท่านั้น ห้ามทำข้าม/เกิน Phase (IR-1, IR-2)
- ห้ามเปลี่ยน Tech Stack / Architecture / DB Schema เว้นแต่แจ้งเหตุผลและผมอนุมัติ (IR-3, IR-4)
- Backend: Route → Controller → Service → Model, ใช้ mysql2 (Connection Pool) ห้าม ORM, JS เท่านั้นห้าม TS
- Frontend: React + Vite + MUI เท่านั้น, JS/JSX, Context API (ห้าม Redux/Zustand/Tailwind)
- ถ้า Requirement ไม่ชัด ให้ถามก่อน ห้ามเดา
- สื่อสารกับผมเป็นภาษาไทย

ตอนนี้สถานะโปรเจกต์อยู่ที่ Phase ไหนแล้ว และ Phase ถัดไปคืออะไร? สรุปให้ฟังก่อน
```

---

## Prompt 2 — สั่งทำทีละ Phase (ตัวหลัก ใช้บ่อยสุด)

แทนที่ `{N}` ด้วยเลข Phase เช่น 1, 2, 3 …

```
เริ่ม Phase {N} ได้

ก่อนเขียนโค้ด ให้ตอบตาม Required Response Format ก่อน:
1. ขอบเขต (Scope) ของ Phase {N}
2. Dependency — อิง Phase ก่อนหน้าอย่างไร และพร้อมหรือยัง
3. รายการไฟล์ที่จะสร้าง/แก้ไข (อ้างตามตารางงานใน implementation plan)

จากนั้นลงมือเขียนโค้ดตามขอบเขตของ Phase {N} เท่านั้น โดย:
- ทำครบทุกงานย่อยในตารางของ Phase {N} (รวมงาน ⭐ ถ้ามี)
- ทำตาม Acceptance Criteria ของ Phase {N} ทุกข้อ
- ตั้งชื่อไฟล์/ตัวแปรตาม Naming Convention ในคู่มือ
- API ให้ตรงกับ `06-api-contract.md` และ Response format มาตรฐาน
- ห้ามทำงานของ Phase อื่น

เสร็จแล้วทำ Phase Completion Report ตามรูปแบบในคู่มือ (Summary, วิธีรัน+ทดสอบ,
Acceptance Criteria Checklist, Git Commit Message) แล้วหยุดรอผมยืนยันก่อนไป Phase ถัดไป
```

---

## Prompt 3 — ตรวจรับ / ปิด Phase

```
ช่วยรันและทดสอบ Phase {N} ตามวิธีทดสอบที่เขียนไว้ แล้วเช็ค Acceptance Criteria
ทีละข้อว่าผ่านจริงไหม (ข้อไหนยังทดสอบเองไม่ได้ บอกผมให้ทดสอบ)

ถ้าผ่านครบ:
- ยืนยัน checklist ครบทุกข้อ
- เสนอ Git Commit Message ของ Phase นี้
- สร้าง Phase Completion Report

ถ้ายังไม่ผ่านข้อไหน ให้ debug เฉพาะส่วนนั้น (ห้ามเพิ่ม feature/เปลี่ยน logic อื่น)
แล้วระบุวิธีทดสอบยืนยันว่าแก้แล้ว
```

---

## Prompt 4 — เมื่อต้องเปลี่ยนจากแผนเดิม

```
ระหว่างทำ Phase {N} ถ้าเจอข้อจำกัดทางเทคนิคที่ทำให้ต้องเปลี่ยนจากแผน/Schema/API Contract
อย่าเพิ่งแก้ ให้แจ้งผมก่อน (IR-4):
- ปัญหาคืออะไร ทำไมแผนเดิมทำไม่ได้
- ทางเลือกที่เสนอ + ผลกระทบต่อ Phase อื่น
รอผมอนุมัติก่อน ถ้าอนุมัติแล้วค่อยอัปเดตเอกสาร planning ที่เกี่ยวข้องพร้อม commit `docs:`
```

---

## ลำดับการสั่งงานแนะนำ

1. เปิด session → **Prompt 1**
2. สั่งทำ Phase → **Prompt 2** (เปลี่ยนเลข Phase ตามลำดับ 1 → 2 → … → 15)
3. ปิด Phase ก่อนไปต่อ → **Prompt 3**
4. ถ้าติดปัญหาต้องแก้แผน → **Prompt 4**

> ลำดับ Phase ต้องเคารพ Dependency ใน implementation plan (เช่น Phase 9 ต้องรอ Phase 4 และ 8)
```
