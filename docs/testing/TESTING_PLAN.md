# Testing Plan — ระบบร้องเรียนศูนย์ดำรงธรรมจังหวัด (DCMS)

> อัปเดตล่าสุด: 2026-07-14 | Testing & Deployment Phase
> ขอบเขต: แผนทดสอบระบบก่อน UAT / Staging / Production Deploy

---

## Testing Objectives

- ตรวจสอบว่าระบบทำงานตรงตาม Requirement และ Acceptance Criteria เดิมใน `docs/planning/10-implementation-plan.md`
- ตรวจสอบ workflow เรื่องร้องเรียนครบตั้งแต่ `NEW` ถึง `CLOSED` รวม transition T-01 ถึง T-14
- ตรวจสอบสิทธิ์การใช้งานตาม role และการปกปิดข้อมูลส่วนบุคคล/anonymous complaint
- ตรวจสอบความถูกต้องของ API response, validation, pagination, filtering, file upload และ error handling
- ตรวจสอบความถูกต้องของข้อมูลใน MySQL, foreign key, transaction, audit log, notification และ SLA flags
- ตรวจสอบความพร้อมของ frontend, backend, Docker Compose และ production artifact ก่อน deploy
- ลดความเสี่ยง production โดยแยก bug เป็น Blocker, Major, Minor และบันทึกผลทดสอบอย่างเป็นระบบ

---

## Scope of Testing

| In Scope | รายละเอียด |
|----------|------------|
| Frontend | Login, layout, role menu, forms, validation, complaint pages, dashboard, report, responsive |
| Backend | Express API, auth middleware, authorization, service/model logic, error response |
| Database | schema, seed data, FK, utf8mb4, transaction, audit logs, status logs, notification data |
| API | Auth, Citizen, Public, Complaints, Workflow, Assignment, Notification, Dashboard, Report, Audit |
| Docker | dev compose, health check, service network, volume persistence, prod image readiness |
| Workflow | T-01 ถึง T-14, forbidden transitions, overdue flag, escalation |
| Security เบื้องต้น | JWT, role access, anonymous masking, upload validation, SQL injection smoke test |

| Out of Scope | เหตุผล |
|--------------|--------|
| Feature ใหม่ | Testing phase ห้ามเพิ่ม feature |
| Architecture change | ตรวจ readiness เท่านั้น |
| Load test ขนาดใหญ่ | ทำได้ภายหลังหลัง staging stable |
| Full penetration test | ระบุเฉพาะ security smoke/baseline test |
| PDF export | Requirement ระบุเป็น Phase ถัดไป/Low priority |

---

## Test Environment

| Environment | Purpose | URL / Service |
|-------------|---------|---------------|
| Local Dev | Developer verification และ smoke test | Frontend `http://localhost:5173`, Backend `http://localhost:5001/api` |
| Docker Compose Dev | Integration test แบบใกล้เคียงระบบจริง | `docker-compose.yml`: frontend, backend, db, phpMyAdmin |
| Staging | UAT และ pre-deploy validation | Railway staging หรือ server staging |
| Production | Post-deployment smoke test เท่านั้น | Domain จริงหลัง deploy |

### Environment Requirements

- Node.js runtime ใน container ใช้ Node.js 20 LTS
- MySQL 8 ใช้ charset `utf8mb4` และ collation `utf8mb4_unicode_ci`
- `.env` / Railway Variables ต้องตั้งค่า DB, JWT, CORS, LINE และ URL ให้ครบตาม environment
- File upload บน staging/production ต้องมี persistent storage โดยเฉพาะ Railway ต้องใช้ Railway Volume หรือ Object Storage
- ก่อน UAT ต้องเปลี่ยนรหัสผ่าน seed/demo account ทั้งหมด

---

## Test Data

| Data Set | รายละเอียด | ใช้กับ |
|----------|------------|--------|
| Staff users | super_admin, admin, officer, chief, executive | Auth, RBAC, dashboard/report |
| Agency users | agency_head, agency_officer ผูก agency_id | Assignment, workflow, visibility |
| Citizen users | citizen ปกติ, citizen ผูก LINE, citizen provisional | Citizen auth, my complaints, LINE |
| Master data | categories + SLA, channels 9 ช่องทาง, agencies, districts/subdistricts, service types, complaint natures, complainant types | Complaint form, filters, reports |
| Complaints | เรื่องปกติ, anonymous, guest, citizen, staff-created, multi-status, overdue, near-due | Workflow, dashboard, report, public tracking |
| Attachments | jpg, png, pdf, doc, docx, ไฟล์เกิน 10MB, ไฟล์ต้องห้าม เช่น exe/html/js | Upload security |
| SLA/Escalation | เรื่อง assigned แล้วใกล้ครบกำหนด, เกินกำหนด, ไม่มี progress 30/45/52 วัน | Jobs, notifications |

---

## Functional Test Cases

| Test Case ID | Module | Scenario | Preconditions | Test Steps | Expected Result | Priority | Status |
|--------------|--------|----------|---------------|------------|-----------------|----------|--------|
| FUNC-001 | Complaint Intake | เจ้าหน้าที่สร้างเรื่องร้องเรียนใหม่ | Login เป็น officer, master data พร้อม | เปิด `/complaints/new`, กรอกข้อมูลบังคับครบ, บันทึก | สร้างเรื่องสำเร็จ, ได้เลข `DC-YYYYMM-XXXX`, status `NEW` | High | |
| FUNC-002 | Complaint Intake | ประชาชน Guest ยื่นเรื่อง | Public page เปิดได้ | เปิด `/public/complaints/new`, กรอกข้อมูล, ส่งเรื่อง | สร้างเรื่อง `source=PUBLIC`, status `NEW`, ได้เลขเรื่อง | High | |
| FUNC-003 | Citizen Complaint | สมาชิกยื่นเรื่องและเห็นใน "เรื่องของฉัน" | Login เป็น citizen | ไป `/citizen/complaints/new`, ส่งเรื่อง, เปิดรายการของฉัน | เห็นเฉพาะเรื่องของตนเองและ tracking detail | High | |
| FUNC-004 | Anonymous | ยื่นเรื่องแบบปกปิดตัวตน | มี user staff และ super_admin | สร้าง anonymous complaint, เปิด detail ด้วย role ต่างๆ | staff เห็นข้อมูลถูก mask, super_admin reveal ได้เมื่อใส่เหตุผล | High | |
| FUNC-005 | Attachment | แนบไฟล์หลักฐานตอนยื่นเรื่อง | มีไฟล์ชนิดอนุญาต | แนบ jpg/pdf/docx แล้วส่งเรื่อง | Upload สำเร็จและแสดงในรายการไฟล์แนบ | High | |
| FUNC-006 | Master Data | Admin จัดการประเภทเรื่องและ SLA | Login เป็น admin | สร้าง/แก้ไข category และ sla_days | บันทึกได้, ใช้คำนวณ due_date เมื่อตอน assign | Medium | |
| FUNC-007 | Notification | ผู้ใช้ดูและ mark notification | มี notification unread | เปิด `/notifications`, mark read, mark all read | unread count ลดลงถูกต้อง | Medium | |
| FUNC-008 | Audit Log | Admin ดู audit log | มี action เกิดขึ้นในระบบ | Login admin, เปิด `/audit-logs`, filter action/date | แสดง log ถูกต้องและ filter ได้ | Medium | |

---

## API Test Cases

| Test Case ID | Module | Scenario | Preconditions | Test Steps | Expected Result | Priority | Status |
|--------------|--------|----------|---------------|------------|-----------------|----------|--------|
| API-001 | Health | ตรวจ health endpoint | Backend และ DB รันอยู่ | GET `/api/health` | `success=true`, database connected, HTTP 200 | High | |
| API-002 | Auth | Login staff สำเร็จ | มี staff active | POST `/api/auth/login` ด้วย username/password ถูกต้อง | ได้ JWT และ user data | High | |
| API-003 | Auth | Login ผิด | มี staff active | POST `/api/auth/login` ด้วย password ผิด | HTTP 401 และ error format ถูกต้อง | High | |
| API-004 | Citizen Auth | Citizen register/login | Email ยังไม่ซ้ำ | POST register แล้ว POST login | ได้ citizen JWT และเรียก `/api/citizen/auth/me` ได้ | High | |
| API-005 | Complaints | List complaints พร้อม pagination/filter | มี complaint หลายสถานะ | GET `/api/complaints?page=1&limit=20&status=IN_PROGRESS` | ได้ data + pagination ถูกต้อง | High | |
| API-006 | Public | Public track complaint | มีเลขเรื่องจริง | GET `/api/public/complaints/track/:complaint_number` | เห็นสถานะแบบย่อ ไม่เห็นข้อมูลภายใน/PII | High | |
| API-007 | Validation | เบอร์โทรผู้ร้องเป็น required | เตรียม payload ไม่มี `complainant_phone` | POST complaint | HTTP 400 `VALIDATION_ERROR` | High | |
| API-008 | Attachment | Upload ไฟล์ต้องห้าม | มี token และ complaint | POST multipart ด้วย `.exe` หรือ mime ไม่อนุญาต | HTTP 400 และไม่มีไฟล์ถูกบันทึก | High | |
| API-009 | Reports | Export Excel | มีข้อมูล report | GET `/api/reports/export/excel?type=monthly` | ได้ไฟล์ `.xlsx`, เปิดแล้วภาษาไทยถูกต้อง | Medium | |
| API-010 | Error Format | Endpoint ไม่พบ | Backend รันอยู่ | GET endpoint ที่ไม่มี | HTTP 404 และ response format มาตรฐาน | Medium | |

---

## Authentication and Authorization Test Cases

| Test Case ID | Module | Scenario | Preconditions | Test Steps | Expected Result | Priority | Status |
|--------------|--------|----------|---------------|------------|-----------------|----------|--------|
| AUTH-001 | Staff Auth | API ที่ต้อง login ไม่มี token | ไม่มี token | GET `/api/complaints` | HTTP 401 | High | |
| AUTH-002 | Staff Auth | Token หมดอายุหรือ invalid | มี token invalid | GET `/api/auth/me` | HTTP 401, client redirect login | High | |
| AUTH-003 | Citizen Auth | Citizen token เรียก staff endpoint | Login citizen | GET `/api/complaints` ด้วย citizen JWT | HTTP 403 | High | |
| AUTH-004 | Staff Auth | Staff token เรียก citizen endpoint | Login staff | GET `/api/citizen/complaints` ด้วย staff JWT | HTTP 403 | High | |
| AUTH-005 | Password | เปลี่ยนรหัสผ่าน staff | Login staff | PUT `/api/auth/change-password` | เปลี่ยนสำเร็จ, password เก่าใช้ไม่ได้ | Medium | |
| AUTH-006 | Logout | Logout ฝั่ง frontend | Login staff/citizen | กด logout | token ถูกลบและกลับหน้า login | Medium | |

---

## Role-based Access Test Cases

| Test Case ID | Module | Scenario | Preconditions | Test Steps | Expected Result | Priority | Status |
|--------------|--------|----------|---------------|------------|-----------------|----------|--------|
| RBAC-001 | Users | agency_officer เข้า `/users` | Login agency_officer | เปิด `/users` หรือ GET `/api/users` | UI ไป 403 หรือ API 403 | High | |
| RBAC-002 | Complaint Visibility | agency user เห็นเฉพาะเรื่องหน่วยงานตน | มี complaint 2 หน่วยงาน | Login agency_officer แล้วเปิด list | เห็นเฉพาะเรื่องที่ assigned ให้ agency ตน | High | |
| RBAC-003 | Executive | executive ดูได้แต่แก้ไม่ได้ | Login executive | เปิด complaint detail แล้วพยายามแก้/เปลี่ยนสถานะ | ไม่มีปุ่ม action และ API 403 หากเรียกตรง | High | |
| RBAC-004 | Center Roles | officer/chief ส่งต่อและปิดเรื่องได้ | Login officer/chief | ทำ T-02, T-10 | เปลี่ยนสถานะได้ตาม workflow | High | |
| RBAC-005 | Super Admin | reveal anonymous identity | มี anonymous complaint | Login super_admin, reveal พร้อม reason | เห็นข้อมูลจริง, มี audit/reveal log | High | |
| RBAC-006 | Admin | admin จัดการ master data ได้ | Login admin | CRUD category/channel/agency | สำเร็จตามสิทธิ์ | Medium | |

---

## Database Test Cases

| Test Case ID | Module | Scenario | Preconditions | Test Steps | Expected Result | Priority | Status |
|--------------|--------|----------|---------------|------------|-----------------|----------|--------|
| DB-001 | Schema | ตารางหลักและ migration พร้อม | DB clean start | ตรวจจำนวน tables และ key tables | มี schema ครบ รวม citizen/anonymous/LINE tables | High | |
| DB-002 | Charset | รองรับภาษาไทย | DB พร้อม | Insert/update ข้อความไทยใน complaint/update/report | อ่านกลับถูกต้อง ไม่เป็น mojibake | High | |
| DB-003 | FK Integrity | Foreign key ป้องกันข้อมูล orphan | DB พร้อม | พยายาม insert assignment ด้วย complaint_id ไม่จริง | DB reject หรือ API validation reject | High | |
| DB-004 | Transaction | สร้าง complaint พร้อม sequence/log | DB พร้อม | สร้าง complaint แล้วตรวจ complaints, sequences, status logs | ข้อมูลครบหรือ rollback ทั้งชุดเมื่อ error | High | |
| DB-005 | Complaint Number | Running number ไม่ซ้ำ | DB พร้อม | สร้างหลาย complaint เดือนเดียวกัน | เลข `DC-YYYYMM-XXXX` เพิ่มตามลำดับและไม่ซ้ำ | High | |
| DB-006 | Audit | Action สำคัญถูกบันทึก | มี user login | สร้าง/แก้ไข/เปลี่ยนสถานะ/reveal identity | audit_logs มี user/action/resource/details | High | |
| DB-007 | Overdue | `is_overdue` ถูก set | มี due_date เกินกำหนด | รัน SLA job หรือ trigger ตรวจ | complaint ถูก mark overdue โดยไม่เปลี่ยน status | Medium | |
| DB-008 | Seed Data | Master data พร้อม UAT | DB clean start | ตรวจ roles, channels, categories, agencies, districts/subdistricts | master data จำเป็นมีครบตาม requirement | Medium | |

---

## Frontend UI Test Cases

| Test Case ID | Module | Scenario | Preconditions | Test Steps | Expected Result | Priority | Status |
|--------------|--------|----------|---------------|------------|-----------------|----------|--------|
| UI-001 | Login | หน้า login staff validation | เปิด `/login` | submit form ว่าง/ผิด/ถูก | แสดง validation/error หรือ redirect dashboard | High | |
| UI-002 | Layout | Sidebar menu ตาม role | มี user ทุก role | Login แต่ละ role แล้วดู sidebar | เมนูตรงตามสิทธิ์ | High | |
| UI-003 | Route Guard | ไม่ login เข้า protected page | ไม่มี token | เปิด `/dashboard` | Redirect ไป `/login` | High | |
| UI-004 | Complaint Form | Required fields และ Thai labels | Login officer | เปิด form แล้ว submit ข้อมูลไม่ครบ | แจ้ง field required ชัดเจน | High | |
| UI-005 | Complaint List | Filter/search/pagination | มี complaint หลายรายการ | filter status/category/search และเปลี่ยน page | รายการตรง filter และ pagination ไม่เพี้ยน | High | |
| UI-006 | Detail Timeline | Timeline แสดง status/update | มี complaint ผ่านหลาย action | เปิด detail | เห็น timeline เรียงถูกต้อง | High | |
| UI-007 | Public | Public submit/track ใช้ได้บน tablet/mobile | เปิด public routes | ทดสอบ form และ track ใน viewport ต่างๆ | Layout ไม่แตกและใช้งานได้ | Medium | |
| UI-008 | Map Picker | เลือกจุดเกิดเหตุ | Browser รองรับ location/map | เลือกพิกัดด้วย map/GPS | lat/long ถูกเก็บและแสดง | Medium | |

---

## Workflow Test Cases

| Test Case ID | Module | Scenario | Preconditions | Test Steps | Expected Result | Priority | Status |
|--------------|--------|----------|---------------|------------|-----------------|----------|--------|
| WF-001 | T-01 | เริ่มคัดกรอง | มี complaint `NEW` | officer กด screen | status `SCREENING` และมี status log | High | |
| WF-002 | T-02 | ส่งต่อหน่วยงาน | complaint `SCREENING`, มี agency/category | officer assign agency | status `ASSIGNED`, due_date ถูกคำนวณ | High | |
| WF-003 | T-03 | ปฏิเสธเรื่อง | complaint `SCREENING` | officer reject พร้อม reason | status `REJECTED`, final state | High | |
| WF-004 | T-04 | หน่วยงานรับเรื่อง | complaint `ASSIGNED` | agency accept assignment | status `ACCEPTED` | High | |
| WF-005 | T-05 | ส่งคืนจาก ASSIGNED | complaint `ASSIGNED` | agency return พร้อม reason | status `RETURNED` | High | |
| WF-006 | T-06 | เริ่มดำเนินการ | complaint `ACCEPTED` | agency start | status `IN_PROGRESS` | High | |
| WF-007 | T-07 | ส่งคืนจาก ACCEPTED | complaint `ACCEPTED` | agency return พร้อม reason | status `RETURNED` | High | |
| WF-008 | T-08 | ส่งผลดำเนินการ | complaint `IN_PROGRESS` มี active assignment | agency resolve พร้อม content | status `RESOLVED` | High | |
| WF-009 | T-09 | ศูนย์เริ่มตรวจผล | complaint `RESOLVED` | officer review | status `REVIEWING` | High | |
| WF-010 | T-10 | ศูนย์ปิดเรื่อง | complaint `REVIEWING` | officer close พร้อม closed_summary | status `CLOSED`, final state | High | |
| WF-011 | T-11 | ส่งกลับแก้ไข | complaint `REVIEWING` | officer send back | status `IN_PROGRESS` และแจ้งหน่วยงาน | High | |
| WF-012 | T-12 | รับเรื่องคืนกลับคัดกรอง | complaint `RETURNED` | officer screen | status `SCREENING` | High | |
| WF-013 | T-13 | ศูนย์จัดการเอง | complaint `SCREENING` | officer self-handle | status `IN_PROGRESS`, ไม่มี active assignment | High | |
| WF-014 | T-14 | ปิดเรื่องศูนย์จัดการเอง | self-handle complaint `IN_PROGRESS` | officer close พร้อม summary | status `CLOSED` | High | |
| WF-015 | Invalid Transition | ห้าม NEW -> CLOSED | complaint `NEW` | เรียก close โดยตรง | HTTP 400 `INVALID_TRANSITION`, status ไม่เปลี่ยน | High | |

---

## Dashboard and Report Test Cases

| Test Case ID | Module | Scenario | Preconditions | Test Steps | Expected Result | Priority | Status |
|--------------|--------|----------|---------------|------------|-----------------|----------|--------|
| DR-001 | Dashboard | Summary cards ถูกต้อง | มีข้อมูลหลายสถานะ | เปิด dashboard และเทียบกับ DB/list | จำนวนรวม/status/overdue ถูกต้อง | High | |
| DR-002 | Dashboard | Agency dashboard จำกัดข้อมูล | Login agency user | เปิด dashboard | แสดงเฉพาะข้อมูลหน่วยงานตน | High | |
| DR-003 | Dashboard | Chart by status/category/agency/district | มีข้อมูลหลากหลาย | เปิด dashboard charts | Chart render และตัวเลขถูกต้อง | Medium | |
| DR-004 | Dashboard | Date filter | มีข้อมูลหลายช่วงวันที่ | filter date range | Card/chart/table เปลี่ยนตาม filter | Medium | |
| DR-005 | Report | Monthly report | มี complaint เดือนทดสอบ | เปิด report monthly | จำนวนและ grouping ถูกต้อง | High | |
| DR-006 | Report | By category/agency/overdue | มีข้อมูลครบ grouping | เปิดแต่ละ tab | ตารางแสดงถูกต้อง | High | |
| DR-007 | Export | Export Excel | มีข้อมูลรายงาน | กด export excel | ได้ไฟล์ `.xlsx`, ภาษาไทยอ่านได้ | High | |
| DR-008 | Anonymous Report | Anonymous ไม่รั่ว PII | มี anonymous complaint | เปิด dashboard/report/export | ไม่แสดงข้อมูลผู้ร้องจริง | High | |

---

## Docker Integration Test Cases

| Test Case ID | Module | Scenario | Preconditions | Test Steps | Expected Result | Priority | Status |
|--------------|--------|----------|---------------|------------|-----------------|----------|--------|
| DOCKER-001 | Dev Compose | Start services | มี `.env` จาก `.env.example` | `docker compose up -d --build` | frontend/backend/db/phpMyAdmin up และ db healthy | High | |
| DOCKER-002 | Health | Backend ติดต่อ DB ผ่าน network | Dev compose running | GET `http://localhost:5001/api/health` | database connected | High | |
| DOCKER-003 | Frontend Proxy | Frontend เรียก backend ผ่าน Vite proxy | Dev compose running | เปิด `http://localhost:5173` แล้ว login/test API | API request สำเร็จ ไม่ติด CORS | High | |
| DOCKER-004 | DB Init | Clean start DB | Dev compose available | clean volume แล้ว start ใหม่ | init scripts รันสำเร็จ, seed data พร้อม | High | |
| DOCKER-005 | Volume | Upload persistence dev/on-prem | มีไฟล์ upload | restart containers | ไฟล์ยังอยู่ตาม volume/bind mount | Medium | |
| DOCKER-006 | Prod Image | Root Dockerfile build | Docker พร้อม | build production image และ run container | `/` serve React, `/api/health` ตอบได้ | High | |
| DOCKER-007 | Prod Compose | On-prem compose config | มี `.env.production` | `docker compose -f docker-compose.prod.yml config` และ start staging | app/db/nginx เชื่อมกันได้ | Medium | |
| DOCKER-008 | Railway Readiness | Railway env/storage พร้อม | Railway staging | ตรวจ env, DB migration, upload volume, healthcheck | deploy ผ่านและข้อมูลไม่หายหลัง redeploy | High | |

---

## Security Test Cases เบื้องต้น

| Test Case ID | Module | Scenario | Preconditions | Test Steps | Expected Result | Priority | Status |
|--------------|--------|----------|---------------|------------|-----------------|----------|--------|
| SEC-001 | JWT | Protected API without token | ไม่มี token | GET `/api/complaints` | HTTP 401 | High | |
| SEC-002 | RBAC | Direct API call ข้ามสิทธิ์ | Login role ต่ำกว่า | เรียก endpoint admin เช่น `/api/users` | HTTP 403 | High | |
| SEC-003 | Anonymous | Anonymous masking | มี anonymous complaint | เปิด list/detail/timeline/export ด้วย staff/admin/agency/executive | PII และ citizen_id ถูก mask | High | |
| SEC-004 | Reveal | เปิดเผยตัวตนต้องเป็น super_admin | มี anonymous complaint | admin/officer เรียก reveal | HTTP 403 | High | |
| SEC-005 | Reveal Audit | super_admin reveal ต้องมี reason | Login super_admin | reveal ไม่มี reason แล้ว reveal มี reason | ไม่มี reason ถูก reject, มี reason สำเร็จและมี audit | High | |
| SEC-006 | SQL Injection Smoke | Search/filter input แปลก | มี list endpoint | search ด้วย `' OR 1=1 --` | ไม่ error, ไม่คืนข้อมูลเกินสิทธิ์ | Medium | |
| SEC-007 | XSS Smoke | Input มี script tag | สร้าง complaint/update มี `<script>` | เปิด UI list/detail/public track | script ไม่ execute และ UI ไม่แตก | Medium | |
| SEC-008 | Upload | Upload executable/html/js | มี token | upload ไฟล์ต้องห้าม | ถูกปฏิเสธ | High | |
| SEC-009 | Citizen Ownership | Citizen เปิดเรื่องคนอื่น | มี citizen 2 คน | citizen A เปิด complaint_number ของ citizen B | HTTP 403/404 หรือไม่แสดงข้อมูล | High | |
| SEC-010 | CORS | Origin ไม่อนุญาต | Staging configured | เรียกจาก origin อื่น | Browser ถูก CORS block | Medium | |

---

## Acceptance Criteria

### System Acceptance

- [ ] Frontend build ผ่าน และหน้าใช้งานหลักเปิดได้ครบ
- [ ] Backend automated tests ผ่านทั้งหมด
- [ ] API สำคัญคืน response format ตาม contract
- [ ] Workflow T-01 ถึง T-14 ผ่านครบ
- [ ] Invalid transitions ถูกปฏิเสธและไม่ทำให้ข้อมูลเสีย
- [ ] Role-based access ผ่านครบทุก role
- [ ] Anonymous complaint ไม่รั่วข้อมูลส่วนบุคคลใน list/detail/timeline/dashboard/report/export
- [ ] Public tracking แสดงเฉพาะข้อมูลที่เปิดเผยได้
- [ ] Dashboard/report/export แสดงข้อมูลถูกต้อง
- [ ] Notification, SLA, overdue และ escalation ทำงานตามเงื่อนไข
- [ ] Docker dev และ staging/prod artifact รันได้ตาม target
- [ ] ไม่มี Blocker หรือ Critical/High production risk ค้างก่อน deploy

### Exit Criteria ก่อน Production Deploy

- [ ] Test case Priority High ผ่าน 100%
- [ ] Priority Medium ผ่านหรือมี workaround ที่อนุมัติแล้ว
- [ ] ไม่มี bug ระดับ Blocker
- [ ] bug ระดับ Major ต้องปิดหรือมี risk acceptance จากผู้รับผิดชอบ
- [ ] UAT sign-off จากเจ้าหน้าที่ศูนย์ดำรงธรรม/ผู้เกี่ยวข้อง
- [ ] Backup/restore, environment variables, DB migration และ upload persistence ตรวจแล้ว

---

## Test Result Template

| Field | Value |
|-------|-------|
| Test Run ID | |
| Environment | Local / Docker Dev / Staging / Production |
| Build / Commit | |
| Tester | |
| Test Date | |
| Module | |
| Total Test Cases | |
| Passed | |
| Failed | |
| Blocked | |
| Not Run | |
| Defect IDs | |
| Summary | |
| Recommendation | Proceed / Hold / Re-test Required |

### Test Case Execution Template

| Test Case ID | Module | Scenario | Actual Result | Status | Severity | Defect ID | Tester | Date | Remark |
|--------------|--------|----------|---------------|--------|----------|-----------|--------|------|--------|
| | | | | Pass / Fail / Blocked / Not Run | Blocker / Major / Minor | | | | |

### Defect Severity Guide

| Severity | นิยาม | ตัวอย่าง |
|----------|-------|----------|
| Blocker | ทำให้ระบบหลักใช้งานไม่ได้หรือ deploy ต่อไม่ได้ | Login ไม่ได้, DB migration fail, workflow ปิดเรื่องไม่ได้, PII anonymous รั่ว |
| Major | ฟังก์ชันสำคัญเสียแต่มี workaround จำกัด | Report บาง filter ผิด, notification บาง event ไม่ส่ง, role บางหน้าผิด |
| Minor | กระทบเล็กน้อย ไม่ขวาง UAT/deploy | label typo, spacing UI, warning ที่ไม่กระทบการใช้งาน |

