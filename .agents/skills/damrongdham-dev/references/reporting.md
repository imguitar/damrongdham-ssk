# Dashboard, Reports และ Executive Summary

ใช้ [Backend Queries และ Exports](../../backend-api-development/references/queries-and-exports.md) เมื่อแก้ aggregate/filter/export; ไม่จำเป็นต้องใช้ UI Design ถ้าไม่เปลี่ยนภาพหรือ interaction

อ่านเมื่อเปลี่ยนตัวเลข cards/charts, filters, Excel export หรือข้อความบทสรุป
หลักฐาน: `backend/src/controllers/dashboardController.js`, `services/reportService.js`, `controllers/reportController.js`, `frontend/src/pages/dashboard/DashboardPage.jsx`, `pages/reports/ReportPage.jsx`, `ExecutiveSummaryTab.jsx`

## กำหนด Metric ก่อนแก้

งานออกแบบหน้า KPI/กราฟ ใช้ [UI Dashboard Design](../../ui-dashboard-design/SKILL.md) โดยเลือก Metrics, Information Architecture และ Reference อื่นตามผลกระทบ
ใช้ MUI/theme และ Recharts ของระบบตาม [Frontend](frontend.md); ไม่เปลี่ยนสูตรหรือ scope เพื่อให้ภาพดูดี
Card/กราฟที่ drilldown ต้องส่ง filters ตรงกับตัวเลขและตรวจสิทธิ์ปลายทาง; executive read-only ไม่ควรได้ลิงก์ไปหน้าที่เข้าไม่ได้

ระบุ population, status, time field, agency filter และ soft-delete scope ของแต่ละตัวเลข
อย่ารวม “รับเรื่องในเดือน” กับ “ปิดเรื่องในเดือน” หาก query คนละนิยาม
Assignment history อาจหลายแถวต่อเรื่อง ตรวจ active scope และ COUNT DISTINCT เพื่อไม่เพิ่มจำนวน
SLA overdue กับ no-progress escalation เป็นคนละกลุ่มและอาจซ้อนกัน

## Permissions และ Filter

Agency dashboard scope ตามหน่วยงาน; executive read-only และไม่มี PII
Report page permission กับ export backend เคยต่างกันสำหรับ agency_head ตรวจทั้งคู่
Export ต้องส่งช่วงเวลา/agency ที่ผู้ใช้เลือกจริง หากปุ่มส่งเพียง type อย่าอ้างว่าไฟล์ตรงกับ filters ในหน้าจอ
ตรวจ date inclusivity/timezone, empty/zero/null, pagination และ label ตามช่วงเวลาที่โหลดจริง

## บทสรุปผู้บริหาร

Current implementation สร้างข้อความจากตัวเลขและ template ไม่ใช่ LLM analysis
ทดสอบไม่มีข้อมูล, tie ของ top category/agency, denominator=0 และเปลี่ยน filters หลัง load
ข้อความที่คัดลอกต้องตรง dataset ที่เห็น ไม่สร้างคำกล่าวว่าเรื่องลดลง/ดีขึ้นเมื่อไม่มี comparison period
คงหมายเหตุให้ตรวจข้อมูลก่อนใช้เอกสารราชการ ไม่ใส่คำรับรองผลการดำเนินงานเกินหลักฐาน

## ตรวจรับ

ใช้ dataset สังเคราะห์เล็กที่คำนวณด้วยมือได้ เทียบ cards/table/chart/export
ตรวจ duplicated assignment, wrong agency และเรื่องที่ปิดแล้วแต่เคย overdue
สำหรับ Excel ตรวจชนิดข้อมูล วันที่/พ.ศ. ความครบของแถว และ formula injection จาก user text ตาม export implementation
