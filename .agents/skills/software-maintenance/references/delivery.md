# Documentation และ Handoff

อ่านเมื่อทำคู่มือหรือส่งมอบงาน ไม่ใช่ runbook สำหรับ deploy จริง

## เอกสาร

กำหนดผู้อ่าน: ผู้ใช้งานต้องการวิธีทำงาน ผู้ดูแลต้องการ configuration/recovery นักพัฒนาต้องการ contract/source references
แยก current behavior, planned feature, desired requirement และ known gap
ใช้ relative links ภายใน repository เพื่อย้ายที่ได้; อย่าคัดลอก Secret/test password ไปคู่มือทั่วไป
ตรวจลิงก์และคำสั่งกับไฟล์จริง ไม่คัดลอก production target ที่ไม่ได้ยืนยันไปโปรเจกต์ใหม่
ไม่สร้าง README/changelog/report ซ้ำหากมีเอกสารที่เหมาะสมอยู่แล้ว

## เอกสารปฏิบัติการ

อ้าง runbook ของปลายทางและแยกคำสั่งตัวอย่างจากคำสั่งที่ตรวจบน target จริงแล้ว
ระบุ prerequisites, expected outcome และสิ่งที่ผู้ใช้ต้องยืนยันโดยไม่ใส่ credential
การเขียน runbook ไม่เท่ากับ execute; กระบวนการ release ใช้คู่มือปฏิบัติการหรือ Skill เฉพาะที่มีใน environment

## ส่งมอบ

สรุปปัญหาหรือเป้าหมาย ผลที่เปลี่ยน ไฟล์สำคัญ การตรวจจริง และส่วนที่ยังไม่ยืนยัน
รายงาน skipped/not run อย่างตรงไปตรงมา ไม่เรียก release “พร้อม Production” จาก build ผ่านอย่างเดียว
เสนอ commit message ตาม convention ของ repository เมื่อมีประโยชน์; commit/push ตามคำขอเท่านั้น
ถ้าต้องมี action ของผู้ใช้ ให้ระบุสิ่งที่ต้องทำและเหตุผลอย่างเฉพาะเจาะจง ไม่ปิดงานด้วยรายการคำเตือนทั่วไป
