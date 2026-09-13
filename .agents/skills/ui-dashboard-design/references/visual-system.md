# Visual System

อ่านเมื่อปรับรูปลักษณ์ ลำดับความเด่น typography หรือความสม่ำเสมอของ component

## ใช้ระบบเดิมเป็นฐาน

ตรวจ theme/tokens และ component ที่มีอยู่ก่อนกำหนดสี radius shadow หรือ breakpoint ใหม่
แยกการปรับหน้าเดียวกับการแก้ global token เพราะ token กระทบทุก consumer; ตรวจหน้าตัวแทนเพิ่มเมื่อแก้ global
ถ้าไม่มี design system ให้กำหนด semantic tokens ขนาดเล็กตามงาน ไม่สร้าง component library ทั้งระบบโดยไม่ได้รับมอบหมาย
ไม่บังคับสี ฟอนต์ รูปแบบ card หรือ dark mode เดียวกันทุกโปรเจกต์

## Hierarchy และ Density

ใช้ขนาด น้ำหนัก ช่องว่าง และ grouping สร้างลำดับก่อนเพิ่มสีหรือเงา
หัวหน้าบอกบริบท หัว section แบ่งงาน label อธิบายค่า และ metadata มีความเด่นรองลงมาแต่ยังอ่านได้
KPI สำคัญควรเด่นกว่าของรอง ไม่ทำทุก card ใหญ่เท่ากันจนไม่มีลำดับ
เลือกระดับความหนาแน่นจาก task: work queue อาจต้องเห็นหลายแถว ขณะที่ summary ต้องอ่านใจความเร็ว
หลีกเลี่ยง nested cards ที่เพิ่มขอบหลายชั้นโดยไม่เพิ่มความหมาย

## Typography และตัวเลข

ใช้ typography scale ของระบบ ลดขนาดต่างกันที่ไม่มีหน้าที่ชัดเจน
เลือก font fallback ที่รองรับภาษาจริง ทดสอบ glyph, line height และน้ำหนักกับข้อความยาว
ตัวเลขที่ต้องเทียบกันใช้ tabular numerals เมื่อ font รองรับ; จัด alignment ของ numeric columns ให้สแกนง่าย
อย่าลดฟอนต์อย่างเดียวเพื่อยัดข้อมูลลง card ให้ปรับ layout, wrap หรือแสดงรายละเอียดเพิ่มตามความสำคัญ
ชื่อสำคัญต้องมีทางอ่านเต็ม ไม่พึ่ง tooltip อย่างเดียวบนอุปกรณ์ touch

## สีและสถานะ

แยก brand/action colors, surface/text/border tokens และ semantic status colors
ผูกสีสถานะกับความหมายเดิมของโปรเจกต์; อย่าเปลี่ยนสีสถานะเฉพาะ dashboard จนขัดกับตาราง/detail
แสดง status ด้วยข้อความหรือสัญลักษณ์ร่วมกับสี โดยเฉพาะ error, warning, success และ chart series
การเพิ่ม/ลดไม่ได้ดี/ร้ายเหมือนกันทุก metric; กำหนด semantics จาก domain ก่อนเลือกสี
ตรวจ contrast ของข้อความ ไอคอนเชิงหน้าที่ focus และ control boundaries ใน theme ที่รองรับ; ระบุเกณฑ์ accessibility ของงานก่อนอ้าง compliance

## Spacing, Containers และ Components

ใช้ spacing scale เดิมให้ระยะภายใน component เล็กกว่าระยะระหว่างกลุ่มที่ไม่เกี่ยวข้อง
จัดแนว label/value/action และขอบ container ให้มีระบบ ไม่แก้ด้วย margin เฉพาะจุดสะสม
Chart ต้องมีพื้นที่สำหรับ legend, labels และ axis ไม่คำนวณจาก plot area อย่างเดียว
ใช้ semantic HTML หรือ component semantics ที่ถูกต้อง หลีกเลี่ยง div ที่ดูเหมือนปุ่มแต่ไม่มี keyboard behavior
Reuse empty state, alert, loading, table และ dialog ของระบบ; สร้าง variant ใหม่เมื่อมีความต่างทางหน้าที่จริง

## ตรวจภาพก่อนส่ง

มองทั้งภาพรวมและจุดเสี่ยง: hierarchy, alignment, contrast, long text, large numbers, clipping, focus และ error state
ถ้าเสนอหลายแบบ ให้เปรียบเทียบข้อได้เปรียบตาม task ไม่แสดงหลายธีมเพื่อความหลากหลายอย่างเดียว
อ่าน [Visual QA](visual-qa.md) เมื่อต้องยืนยันผลใน browser
