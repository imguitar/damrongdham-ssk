---
name: ui-dashboard-design
description: ออกแบบ ปรับปรุง และรีวิว UI ของ Dashboard, หน้ารายงาน และหน้าปฏิบัติงาน ครอบคลุม information hierarchy, KPI, charts, interaction, responsive และ visual QA ใช้ข้ามโปรเจกต์โดยยึด design system และเทคโนโลยีของปลายทาง ไม่ใช้กับงานแก้ query อย่างเดียว
---

# UI and Dashboard Design

ออกแบบให้ผู้ใช้เข้าใจสถานการณ์ ตัดสินใจ และทำงานต่อได้ ไม่เพิ่มกราฟหรือการตกแต่งที่ไม่ช่วยคำถามของผู้ใช้
Skill นี้ใช้ได้อิสระ ไม่มี dependency ต่อ Skill หรือ framework อื่น คัดลอกทั้งโฟลเดอร์ไปใช้ใน `.agents/skills/` ของโปรเจกต์อื่นได้

## เริ่มงาน

1. แยกคำขอเป็น review, design proposal, prototype หรือ implementation; review ไม่อนุญาตให้แก้แอปโดยปริยาย
2. ตรวจกลุ่มผู้ใช้ งานหลัก ข้อมูลจริง ขอบเขตสิทธิ์ และหน้าจอเดิม รวม theme, component library, routes และ API ที่เกี่ยวข้อง
3. รักษา stack/design system ของปลายทาง หากยังไม่มีให้เสนอแนวทางที่เหมาะกับบริบท ไม่ติดตั้ง UI/chart library หรือเปลี่ยน framework เพียงเพื่อทำตามตัวอย่าง
4. เลือกอ่าน Reference ที่เกี่ยวข้องให้ครบก่อนทำงาน ไม่โหลดทุกไฟล์สำหรับการแก้เล็กน้อย เมื่อพบ concern เพิ่มจึงอ่านเพิ่ม
5. แยกข้อมูลจริง สมมติฐาน และ sample data ให้ชัดเจน ห้ามสร้าง KPI/comparison/insight ที่ไม่มีนิยามหรือข้อมูลรองรับ

## Reference ตามงาน

| งาน | อ่าน | เพิ่มเมื่อ |
|---|---|---|
| หน้าใหม่, จัด layout ใหม่, ผู้ใช้หาข้อมูลไม่เจอ | [Discovery และโครงสร้างข้อมูล](references/information-architecture.md) | Metrics เมื่อมีข้อมูลสรุป; Interaction เมื่อมี workflow |
| KPI, กราฟ, trend, ranking, comparison | [Metrics และ Charts](references/metrics-and-charts.md) | Interaction สำหรับ filter/drilldown |
| สี, typography, spacing, card, consistency | [Visual System](references/visual-system.md) | Responsive เมื่อเปลี่ยนขนาดหรือ layout |
| Filter, form, table, drilldown, loading/error | [Interaction และ States](references/interaction-and-states.md) | Metrics เมื่อ filter เปลี่ยนนิยามตัวเลข |
| Mobile, keyboard, screen reader, ภาษา | [Responsive และ Accessibility](references/responsive-accessibility.md) | Visual System สำหรับ contrast และ typography |
| รีวิวภาพ, browser verification, ส่งมอบ | [Visual QA และ Handoff](references/visual-qa.md) | อ่าน reference ของปัญหาที่พบเพิ่มเติม |

## ตัวอย่างการเลือกใช้

- “จัด Dashboard ผู้บริหารใหม่”: Information Architecture + Metrics + Visual System + Responsive + Visual QA; Interaction ถ้ามี filter
- “ตารางใช้บนมือถือไม่ได้”: Interaction + Responsive + Visual QA ไม่ออกแบบ KPI ใหม่
- “รีวิวสีและลำดับความสำคัญจาก screenshot”: Visual System + Information Architecture; ระบุว่า keyboard/API/สิทธิ์ยังไม่ได้ตรวจ
- “ออกแบบฟอร์มในระบบเดิม”: Information Architecture + Interaction + Responsive และ Visual QA ไม่บังคับเพิ่มกราฟ

## เกณฑ์ส่งมอบ

ส่งสิ่งที่ผู้ใช้ขอพร้อมเหตุผลของการตัดสินใจที่สำคัญและหลักฐานตรวจรับตามความเสี่ยง
Prototype ต้องระบุข้อมูลตัวอย่างและ interaction ที่ยังไม่เชื่อมจริง; implementation ต้องรักษา data contract และ permissions
การออกแบบสิ่งที่มองเห็นไม่ใช่การอนุญาตให้เปิดเผยข้อมูลหรือเพิ่มสิทธิ์ และไม่ครอบคลุมการ deploy/publish โดยอัตโนมัติ
หากตรวจ browser ไม่ได้ ให้ระบุข้อจำกัด ไม่เรียก code review หรือ build ว่า visual QA ผ่าน
