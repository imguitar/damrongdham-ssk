---
name: damrongdham-dev
description: กฎธุรกิจ stack และ source map สำหรับพัฒนา รีวิว ทดสอบ และจัดทำเอกสาร Damrongdham SSK (Sisaket E-CMS/DCMS) รวม Complaint, Citizen, LINE และ Deployment พร้อมเลือก Common Skills ตามงาน ใช้เฉพาะ repository นี้
---

# Damrongdham SSK

## ขอบเขตและกฎร่วม

คู่มือเฉพาะระบบร้องเรียนจังหวัดศรีสะเกษ สื่อสารภาษาไทยและควบคุมขอบเขตตามงานที่ผู้ใช้สั่ง ไม่บังคับเปิด Phase สำหรับ Maintenance
รักษา React/JSX, MUI, Context, Express/CommonJS และ MySQL/mysql2 Raw SQL ตามโปรเจกต์ ไม่เพิ่ม TypeScript, ORM หรือ framework อื่นโดยไม่ได้รับอนุมัติ
Staff/Citizen เป็นคนละ principal; authorization, agency scope และ anonymous masking ต้องบังคับจาก Backend ไม่พึ่งปุ่มหรือ route guard
อย่าฝัง Secret หรือใช้ฐานข้อมูลจริงเป็น test fixture รักษา transaction/audit/idempotency ที่เกี่ยวข้อง และตรวจ subpath เมื่อแก้ URL
การอนุญาตในคำขอผู้ใช้มีผลเหนือแนวทางใน Skill; ไม่ขออนุมัติซ้ำสำหรับงานที่ได้รับมอบหมายแล้ว

## วิธีเลือกอ่าน

1. ตรวจ Working Tree และขอบเขตคำขอ เลือก Common Skill ตามตารางด้านล่าง ไม่ต้องเปิด software-maintenance หรือทุก Skill กับทุกงาน
2. ใช้ตารางด้านล่างเลือก Project Reference และอ่านให้ครบก่อนทำงานส่วนนั้น งานข้ามระบบต้องอ่านหลายรายการตามผลกระทบ ไม่โหลดทั้งโฟลเดอร์ทุกครั้ง
3. Path ใน backtick ของ Project Reference อ้าง repository root ส่วน Markdown link resolve จากไฟล์ปัจจุบัน
4. หลักฐานจากโค้ด/Tests บอก current behavior ส่วน Requirement ที่อนุมัติบอก intended behavior; โค้ดอาจมีบั๊กและ Manual อาจเก่า ให้แจ้งความต่าง ไม่ยกโค้ดเป็นข้อกำหนดเหนือ Requirement
5. เมื่อพบ concern ใหม่ระหว่างทำงาน ให้โหลด Reference เพิ่มก่อนเปลี่ยนส่วนนั้น

## Common Skill ตามประเภทงาน

| งาน | Common Skill | ขอบเขต |
|---|---|---|
| สำรวจ วินิจฉัย รีวิว refactor เอกสาร | [Software Maintenance](../software-maintenance/SKILL.md) | กระบวนการและหลักฐาน ไม่ใช่คู่มือทุกสาขา |
| ออกแบบ/รีวิว layout, KPI, charts | [UI Dashboard Design](../ui-dashboard-design/SKILL.md) | ภาพและ interaction ไม่เปลี่ยนนิยามข้อมูล |
| เขียน JSX, form, state, route, client | [Frontend Development](../frontend-development/SKILL.md) | Implementation ตาม React/MUI เดิม |
| Endpoint, workflow, query, export | [Backend API Development](../backend-api-development/SKILL.md) | Contract, transaction, scope และข้อมูล |
| Schema, index, migration, backfill | [Database Migrations](../database-migrations/SKILL.md) | ใช้เมื่อมี schema/data migration จริง |
| วาง/เพิ่ม/รันทดสอบ | [Testing QA](../testing-qa/SKILL.md) | ตามความเสี่ยง อ่าน Project Testing ก่อน DB tests |
| Security review หรือ boundary เสี่ยง | [Security Review](../security-review/SKILL.md) | ไม่ขยายเป็น audit ทุกครั้งที่แตะ permission |
| LINE/OAuth/webhook/outbox/worker | [Integration Development](../integration-development/SKILL.md) | หลักทั่วไป คู่กับ Project LINE |
| เตรียม/ดำเนินการ release ตามคำขอ | [Deployment Release](../deployment-release/SKILL.md) | ไม่อนุมานอำนาจ deploy จากคำขอเตรียมแผน |

## Project Reference ตามงาน

| งาน/Trigger | Project Reference ที่ต้องอ่าน | ขยายเมื่อ |
|---|---|---|
| อธิบายระบบ, เริ่ม feature หลายส่วน, เอกสารขัดกับโค้ด | [บริบทและแหล่งข้อมูล](references/project-context.md) | เปิด source ของฟีเจอร์ที่อ้าง |
| Login, Citizen, Role, Agency, Anonymous, public projection | [Domain และ Security](references/domain-and-security.md) | LINE เมื่อ link identity; Backend เมื่อแก้ API |
| รับเรื่อง, assign, return, close, progress, due date, settings | [Workflow/SLA/Escalation](references/workflow-sla.md) | Security สำหรับ actor; Database เมื่อ schema เปลี่ยน |
| หน้าเว็บ, form, route, API client, layout | [Frontend](references/frontend.md) | [UI Design](../ui-dashboard-design/SKILL.md) เมื่อออกแบบ/รีวิวภาพและ interaction; Security เมื่อ field/action/guard เปลี่ยน; Reporting เมื่อ aggregate |
| Endpoint, Controller, Service, Model, attachments | [Backend/API](references/backend-api.md) | Security สำหรับ scope; Workflow สำหรับ state; Database สำหรับ persistence |
| SQL, migration, seed, สังกัดผู้ใช้, system_settings | [Database/Migrations](references/database-migrations.md) | Deployment เมื่อ upgrade; Testing ก่อนรัน DB tests |
| LINE Login, chatbot, webhook, info request, outbox, groups | [LINE/Notifications](references/line-notifications.md) | Security สำหรับ ownership; Deployment สำหรับ callback/worker |
| Dashboard, Excel, filters, บทสรุปผู้บริหาร | [Reporting](references/reporting.md) | [UI Design](../ui-dashboard-design/SKILL.md) เมื่อจัดหน้า/KPI/กราฟ; Workflow สำหรับ metric; Security สำหรับ scope/PII |
| Test, acceptance, regression, build | [Testing](references/testing.md) | ตรวจ helper ก่อน DB-backed test |
| Deploy, PM2, Docker, proxy, OAuth URL, persistent storage | [Deployment](references/deployment.md) | Database เมื่อมี migration; LINE เมื่อเปลี่ยน worker/callback |

## ตัวอย่างการเลือก Reference ข้ามส่วน

- “แก้ปุ่มรับเรื่องของ Agency”: Frontend + Backend + Domain/Security + Workflow และ targeted Testing
- “ปรับเกณฑ์เร่งรัด”: Workflow/SLA + Backend + Frontend; Database เพิ่มเมื่อ schema เปลี่ยน ไม่สร้าง migration เพียงเพราะค่า settings เปลี่ยน
- “Export ไม่ตรงกับ filter”: Project Reporting + Backend + Domain/Security; Common Backend Queries/Exports และ Frontend เมื่อ client ส่ง filter ผิด ไม่สร้าง migration หาก schema ไม่เปลี่ยน
- “LINE callback หลัง deploy ใช้ไม่ได้”: LINE + Deployment + Domain/Security และ Common Debugging
- “เขียนคู่มือภาพรวม”: Project Context + Common Delivery และ source ที่รองรับคำกล่าว ไม่รัน integration suite เพียงเพื่อเขียน Markdown

## การใช้ Common Skill กับงานอื่น

Common Skills ทั้ง 9 ในตารางเป็น sibling Skills อิสระ ไม่มี dependency ย้อนกลับมายัง Damrongdham หรือระหว่าง Common Skills
คัดลอกทั้งโฟลเดอร์นั้นไปยัง `.agents/skills/` ของ repository อื่นได้ แล้วใช้ stack/config/ข้อกำหนดของปลายทาง
หากย้าย Damrongdham Skill ให้ย้ายพร้อม Common Skills ที่เชื่อมในตารางเพื่อรักษาลิงก์; อย่าคัดลอกกฎจังหวัด Role หรือ MySQL ของระบบนี้ไปบังคับ Common Skill
ไม่ต้องสร้างสำเนา Common Reference ใน Project Reference; ให้ Project Reference เก็บเฉพาะข้อจำกัดและ source map ของระบบ

## ตรวจรับและส่งมอบ

ตรวจตามความเสี่ยงของงาน ระบุ passed/failed/skipped/not run จริง โดยเฉพาะ DB tests ที่ skip เมื่อ DB ไม่พร้อม
เมื่อเปลี่ยน behavior ให้ปรับ Manual/LINE/Deployment/Testing document ที่เกี่ยวข้อง; Planning ใช้รักษา traceability เมื่ออยู่ใน scope
ใช้ Conventional Commits ตามชนิดงาน เช่น feat/fix/docs/refactor/test/chore/build/ci/perf; commit/push/deploy ตามอำนาจจากผู้ใช้
ส่งมอบผลลัพธ์ ไฟล์สำคัญ และหลักฐานการตรวจอย่างกระชับ ไม่ใช้ Phase Completion Template เว้นผู้ใช้สั่งงานเป็น Phase
