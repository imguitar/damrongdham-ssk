# การทดสอบใน Repository นี้

อ่านก่อนรันทดสอบแอปหรือกำหนด acceptance; ใช้ [Testing QA](../../testing-qa/SKILL.md) สำหรับ strategy/isolation/evidence และ skill-only checks

## คำสั่งจาก repository root

```bash
npm --prefix backend test
npm --prefix backend test -- tests/lineFlowMachine.test.js
npm --prefix backend run lint
npm --prefix frontend run lint
npm --prefix frontend run build
```

ตัวอย่าง targeted test ใช้เมื่อแก้ flow; เลือก test จริงที่สัมพันธ์กับ change ก่อนรัน
หาก dependencies ไม่พร้อม ให้ใช้ runtime/Docker ที่โครงการจัดไว้ ไม่อัปเกรด runner เพื่อแก้ environment โดยไม่จำเป็น

## ข้อควรทราบจาก Config

`backend/vitest.config.mjs` รวม tests/**/*.test.js และปิด fileParallelism เพราะ DB-backed tests ใช้ฐานข้อมูลร่วม
`backend/tests/integration/_helpers.js` สร้าง fixture และลบข้อมูลเกี่ยวข้อง; dbAvailable อาจทำให้ test skip เมื่อเชื่อมไม่ได้
NODE_ENV=test/fake LINE token ไม่ยืนยันว่า DB target ปลอดภัย ต้องตรวจ connection settings โดยไม่พิมพ์ secrets
ห้ามเอาผล suite ที่ skip Integration ไปอ้างว่า E2E ผ่าน
Stub network สำหรับ LINE แม้ runner มี dummy credential อยู่แล้ว

## เลือกชุดตรวจ

| เปลี่ยน | Test/วิธีตรวจ |
|---|---|
| Intake/chat | lineFlowMachine, lineBotMessages, lineFileIntake, integration intake/webhook |
| Identity/Login | lineLoginService, linking/identity integration, lineOauthCookie/lineCallback/ownership security |
| Staff/group LINE | staffIndividual, staffNotify, staffLineGroups, staffLine security |
| Outbox | notificationPreference, lineMessagingService, outbox/worker integration |
| Role/Agency | ownership security, userAgencyAffiliation integration, direct API denied cases |
| Workflow/SLA/Settings | targeted cases ตาม business rule; ถ้ายังไม่มี test ให้เพิ่มที่ชั้นเหมาะสม |
| UI | lint/build + browser flow เมื่อ behavior/layout เปลี่ยน |
| Schema | disposable fresh/upgrade DB และ record integrity |

ชื่อไฟล์ให้ตรวจจาก rg --files backend/tests ก่อนใช้ คง fixtures แยกและ cleanup ไม่กระทบ seed/user data

## Handoff

สรุปคำสั่ง ผลผ่าน/ล้ม/ข้าม และสิ่งที่ยังไม่ได้ทดสอบ
ไม่รัน down -v เพื่อทำให้ tests ผ่านบน shared database
Build ไม่ครอบคลุม browser, DB และ provider delivery; รายงานตามหลักฐานเท่านั้น
