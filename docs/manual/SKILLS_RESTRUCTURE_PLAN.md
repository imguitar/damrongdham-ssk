# แผนปรับโครงสร้าง Skills

## เป้าหมายและขอบเขต

แยกเป็น 9 Common Skills ที่คัดลอกไปใช้ต่างโปรเจกต์ได้อย่างอิสระ และ 1 Project Skill สำหรับ Damrongdham
ปรับเฉพาะคำแนะนำและเอกสาร ไม่แก้ application, dependencies, database หรือ deployment และไม่ commit/push อัตโนมัติ
โครงสร้างนี้เป็นการออกแบบให้เหมาะกับงาน ไม่ใช่จำนวน Skill ที่มาตรฐานบังคับ

## ขั้นตอนและเกณฑ์เสร็จ

| ขั้น | งาน | เกณฑ์ตรวจรับ | สถานะ |
|---|---|---|---|
| 1 | สำรวจไฟล์และกำหนดเจ้าของเนื้อหา | มีขอบเขตของ 10 Skills และแผนย้ายเนื้อหา | ดำเนินการแล้ว |
| 2 | สร้าง/ย้าย/เติม Common References | แต่ละ Skill ใช้ได้ลำพัง ไม่มีลิงก์ย้อนกลับไป Project | ดำเนินการแล้ว |
| 3 | เชื่อม Project routing | เลือกตามงาน ไม่บังคับโหลดครบทุก Skill | ดำเนินการแล้ว |
| 4 | ตรวจโครงสร้างและสถานการณ์ใช้งาน | metadata/link/reachability ผ่าน พร้อมรายงานข้อจำกัด | ดำเนินการแล้ว ตามขอบเขตผลตรวจด้านล่าง |

## เจ้าของเนื้อหา

| Skill | รับผิดชอบ | ขอบเขตที่ไม่ควรซ้ำ |
|---|---|---|
| software-maintenance | Discovery, diagnosis, review, refactoring, documentation/handoff | ไม่รวมคู่มือพัฒนาเฉพาะด้านทั้งหมด |
| ui-dashboard-design | Layout, visual hierarchy, KPI/chart presentation และ visual QA | ไม่กำหนด API/query หรือ framework |
| frontend-development | Components, state, routing, forms, API client | ไม่เป็นเจ้าของ visual design system ข้ามโปรเจกต์ |
| backend-api-development | API contract, validation, business transactions, queries/exports | ไม่รวม provider workflow และ migration runbook |
| database-migrations | Schema/index, compatibility, backfill และ recovery | ไม่บังคับทำ migration กับทุก query change |
| testing-qa | Test strategy, fixture isolation, integration/E2E และ evidence | ไม่บังคับ suite ทั้งระบบกับทุกงาน |
| security-review | Threat-oriented review, identity/scope, PII และ findings | ไม่อนุญาต hardening หรือโจมตีระบบจริงโดยปริยาย |
| integration-development | OAuth, webhooks, retries, delivery/outbox | ไม่เก็บ LINE-specific config |
| deployment-release | Readiness, release sequence, smoke, rollback | เตรียมแผนไม่เท่ากับอนุญาต deploy |
| damrongdham-dev | กฎธุรกิจ stack/source map และการเลือก Common Skills | ไม่ทำสำเนา Common References |

## แผนย้ายเนื้อหาเดิม

- software-maintenance/references/frontend.md → frontend-development/references/implementation.md
- backend.md → backend-api-development/references/contracts-and-transactions.md; ส่วน delivery ไป integration-development
- data.md → database-migrations/references/schema-and-migrations.md; ส่วน query/report ไป backend-api-development
- security.md → security-review/references/identity-and-data.md
- testing.md → testing-qa/references/strategy-and-evidence.md
- delivery.md คงเฉพาะ documentation/handoff; release procedure ไป deployment-release
- Project References และ UI design References เดิมคงอยู่ ปรับการเชื่อมโยงโดยไม่ทิ้งข้อจำกัดเฉพาะระบบ

## การทบทวนสถานการณ์

ตรวจแบบ tabletop ว่า routing และขอบเขตต่อไปนี้ทำได้จากไฟล์จริง; ไม่ใช่การพิสูจน์ auto-selection ของโมเดลด้วย runtime

| คำขอ | Skill/Reference ที่เกี่ยวข้อง | สิ่งที่ต้องไม่ทำ |
|---|---|---|
| รีวิว API ว่าอ่านเรื่องของหน่วยงานอื่นได้ไหม | Project Domain + Security Review + Backend ตาม endpoint | ไม่แก้ permission โดยยังไม่ได้รับคำขอ |
| แก้ export ไม่ตรง filters | Project Reporting + Frontend client + Backend queries + targeted QA | ไม่ออกแบบ Dashboard ใหม่หรือสร้าง migration โดยไม่มีเหตุ |
| ปรับ layout Dashboard มือถือ | Project Frontend/Reporting + UI Design + Frontend + browser QA | ไม่เปลี่ยนนิยาม KPI/สิทธิ์ |
| เพิ่ม field พร้อมย้ายข้อมูลเดิม | Project Database + Database Migrations + Backend/Frontend ตาม consumers + QA | ไม่ apply production SQL |
| LINE ส่งซ้ำเมื่อ worker restart | Project LINE + Maintenance diagnosis + Integration + QA | ไม่ส่งข้อความจริงเพื่อทดสอบ |
| เตรียมแผน deploy ใต้ subpath | Project Deployment + Deployment Release | ไม่ restart/deploy จริง |
| เขียนคู่มือระบบ | Project Context + Maintenance Delivery | ไม่เรียกทุก Skill หรือรัน DB suite |
| ใช้ Frontend Skill ในโปรเจกต์ framework อื่น | Frontend Skill + config ของปลายทาง | ไม่บังคับ React/MUI หรืออ่าน Damrongdham |

## ผลการตรวจ

ตรวจเมื่อ 13 กันยายน 2026:

- ผ่าน: มี 10 Skills และ 37 References รวม 47 Markdown files ภายใน `.agents/skills/`
- ผ่าน: YAML metadata, ชื่อ/description/allowed fields, ชื่อไม่ซ้ำ และชื่อโฟลเดอร์ตรงกับ Skill
- ผ่าน: relative links, references ที่เข้าถึงจาก entrypoints ได้, code fences, whitespace และไม่มี scaffold placeholders
- ผ่าน: Common Skills ทั้ง 9 ไม่มี file dependency ออกนอกโฟลเดอร์ของตน; Project Skill เชื่อมไปยัง Common Skills ตามประเภทงาน
- ผ่าน: `git diff --check`; ตรวจ whitespace ของไฟล์ใหม่ด้วยเพราะไฟล์ untracked ไม่รวมใน diff ปกติ
- ทบทวนแบบ tabletop: 8 สถานการณ์ในตารางมีเส้นทางเลือก Skill และข้อจำกัดรองรับจากเนื้อหา ไม่พบข้อบังคับให้ deploy/ส่งข้อความ/เปลี่ยน stack โดยปริยาย
- ข้อจำกัด: `quick_validate.py` มาตรฐานรันไม่ได้เพราะ Python ไม่มี PyYAML จึงตรวจด้วย Ruby YAML และ structural checks ทดแทน ไม่ได้ติดตั้ง dependency ใหม่
- ไม่ได้ทำ: model auto-selection evaluation ใน session ใหม่, browser/application tests และ deployment เพราะงานนี้เปลี่ยนคำแนะนำเท่านั้น

## จุดเริ่มต้นใช้งาน

สำหรับระบบนี้ เริ่มที่ [Damrongdham Skill](../../.agents/skills/damrongdham-dev/SKILL.md) ซึ่งมีตารางเลือก Common Skills ครบทั้ง 9
สำหรับโปรเจกต์อื่น คัดลอกเฉพาะ Common Skill ที่ต้องใช้พร้อม references ทั้งโฟลเดอร์ แล้วใช้ร่วมกับข้อกำหนดของปลายทาง
เนื้อหาทั่วไป 5 ไฟล์เดิมถูกย้ายออกจาก software-maintenance ไปยังเจ้าของใหม่ตามแผน ไม่ได้ทิ้งเนื้อหาโดยไม่มีที่ทดแทน
ยังไม่ commit/push; การเปลี่ยนแปลงก่อนหน้าใน working tree ยังคงอยู่
