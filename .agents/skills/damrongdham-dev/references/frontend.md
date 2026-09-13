# Frontend ของ Damrongdham

อ่านเมื่อแก้ JSX, route, form, dashboard, report หรือ API client

งาน implementation ใช้ [Frontend Development](../../frontend-development/SKILL.md) คู่กับข้อกำหนดเฉพาะด้านล่าง; งานภาพเลือก UI Design ในส่วนการออกแบบ

## จุดเข้าหลัก

- `frontend/src/routes/AppRoutes.jsx`: page permissions; `ProtectedRoute.jsx` และ `CitizenProtectedRoute.jsx`: principal guards
- `components/layout/`: Staff/Public/Citizen layouts และ Sidebar
- `contexts/`, `api/axiosInstance.js`, `api/citizenApi.js`: auth และ clients แยกกัน
- `components/complaints/ComplaintForm.jsx`, `components/common/LocationMapPicker.jsx`: form และ incident location
- `pages/dashboard/DashboardPage.jsx`, `pages/reports/`: report/summary
- `pages/settings/EscalationSettingPanel.jsx`: settings editor

## Convention

ใช้ React/JSX, MUI และ React Context ตามเดิม ไม่เพิ่ม TypeScript, Tailwind, Bootstrap, Redux/Zustand เว้นผู้ใช้อนุมัติ
Component/Page PascalCase, function/hook camelCase
Reuse PageHeader, DataTable, ErrorAlert, StatusChip, ConfirmDialog และ alert utilities ตามที่เกี่ยวข้อง
ปรับ pattern ในไฟล์ที่ทำงาน ไม่ refactor UI ทั้งชุดเพื่อให้สวยเหมือนกัน

## การออกแบบ UI และ Dashboard

เมื่อออกแบบ layout, visual hierarchy หรือ interaction ใช้ [UI Dashboard Design](../../ui-dashboard-design/SKILL.md) และเลือก Reference ตามงาน ไม่ใช้ Common Skill แทนข้อกำหนดเฉพาะระบบนี้
ตรวจ `frontend/src/theme/theme.js` และ common components ก่อนเพิ่ม style; ใช้ MUI/theme เดิม และ Recharts สำหรับกราฟตาม dependency ของโปรเจกต์
เมื่อแก้ theme กลาง ให้ตรวจหน้าตัวแทนเพิ่มเติม ไม่เปลี่ยนสี StatusChip จนความหมายขัดกับ Dashboard
Dashboard ต้องแยกภาพรวม งานศูนย์ งานหน่วยงาน และงานเร่งด่วนตามนิยาม/ผู้ใช้จริง ไม่รวมทุกกลุ่มเป็น total ที่อาจนับซ้ำ
อ่าน [Reporting](reporting.md) สำหรับ metric/filter และ [Domain/Security](domain-and-security.md) สำหรับ role/PII โดยเฉพาะ executive ที่ไม่มีสิทธิ์ไปทุกหน้ารายละเอียด
ตรวจชื่อหน่วยงานภาษาไทยยาว ตัวเลขหลายหลัก date labels และ mobile charts; ไม่ถือว่า build ผ่านเท่ากับตรวจภาพแล้ว

## Form และ API

รักษา mandatory phone รวม Anonymous; validate frontend/backend ให้ตรง
เลือกจังหวัด→อำเภอ→ตำบลแล้ว reset ลูกที่ไม่สอดคล้อง; GPS อาจถูกปฏิเสธให้กรอกสถานที่หรือเลือกหมุดเองได้
รักษา citizen prefill/snapshot, nullable location และ optional attachments ตาม controller
ตรวจ staff token กับ citizen token/client ไม่ปนกัน โดยเฉพาะ redirect เมื่อ 401
แสดง validation จาก API ไม่สรุปว่า network error คือ password ผิด

## Routing และ Deploy

Vite BASE_URL, BrowserRouter basename และ VITE_API_BASE_URL ต้องสอดคล้อง
ตรวจ `frontend/vite.config.js`, `frontend/src/main.jsx`, client และ window.location redirects
Deep link/refresh, public tracking, OAuth callback, download และ static image ต้องทำงานบน root และ subpath
อย่าสร้าง URL ด้วยการต่อ slash โดยไม่ตรวจ leading/trailing slash

## ตรวจรับและ Reference เพิ่ม

อ่าน Domain/Security เมื่อเปลี่ยนข้อมูลที่แสดงหรือ Action
อ่าน Reporting เมื่อแก้ dashboard/report และ Deployment เมื่อเปลี่ยน path/env
ใช้ build/lint และ browser check ตามผลกระทบ พร้อม no-data, error, expired session, Thai text ยาว และ viewport ที่รองรับ
