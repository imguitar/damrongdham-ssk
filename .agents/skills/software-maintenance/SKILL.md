---
name: software-maintenance
description: สำรวจซอฟต์แวร์เดิม วางแผนเปลี่ยนแปลง วินิจฉัยบั๊ก รีวิวโค้ด refactor และจัดทำเอกสารส่งมอบ ใช้กับกระบวนการ maintenance ข้าม stack ไม่ใช้แทนคู่มือ implementation เฉพาะด้านหรือ deployment execution
---

# Software Maintenance

## ขอบเขตและการใช้ซ้ำ

Skill นี้เป็นแนวทางทั่วไปสำหรับ repository ซอฟต์แวร์ที่มีอยู่ ไม่กำหนดภาษา framework ฐานข้อมูล cloud provider ภาษาในการตอบ หรือชื่อ Role ของโปรเจกต์ใด
เมื่อย้ายไปใช้ที่อื่น ให้คัดลอกโฟลเดอร์ `software-maintenance/` ทั้งชุดไปยังตำแหน่ง Skill ของ repository ปลายทาง และใช้คู่กับข้อกำหนดของปลายทาง ไม่ต้องนำ Damrongdham ไปด้วย
การมีไฟล์ Skill ไม่ได้ติดตั้ง dependency หรืออนุญาตให้ Deploy/ส่งข้อความ/แก้ระบบจริง

## เริ่มงาน

1. ระบุว่าผู้ใช้ขออธิบาย รีวิว วินิจฉัย แก้ไข เพิ่มฟีเจอร์ หรือ Deploy; ดำเนินการตามอำนาจที่ผู้ใช้ให้ไว้ในบทสนทนา
2. ตรวจสถานะ Working Tree และคำแนะนำของ repository ก่อนแก้ไฟล์ รักษางานเดิมที่ไม่เกี่ยวข้อง
3. แยก “พฤติกรรมที่เกิดจริง” จาก “พฤติกรรมที่ต้องการ”: โค้ดและ Tests เป็นหลักฐานของสิ่งแรก Requirement ที่อนุมัติเป็นหลักฐานของสิ่งหลัง โค้ดที่มีอยู่ไม่ทำให้บั๊กกลายเป็นข้อกำหนด
4. เลือก Reference จากตาราง อ่านไฟล์ที่เลือกให้ครบก่อนลงมือในส่วนนั้น งานข้ามส่วนให้อ่านหลายไฟล์ตามผลกระทบ ไม่ต้องโหลดทั้งหมด
5. ใช้ค่าและคำสั่งจาก manifest/config ของโปรเจกต์จริง แก้เฉพาะขอบเขตที่ร้องขอ ตรวจผล แล้วสรุปหลักฐานและข้อจำกัด

## เลือก Reference ตามงาน

| งาน/สัญญาณ | อ่าน | อ่านเพิ่มเมื่อ |
|---|---|---|
| ทำความเข้าใจระบบ, requirement ไม่ตรงโค้ด, วางแผนเปลี่ยนแปลง | [Discovery](references/discovery.md) | ใช้เริ่มงานใหญ่หรือไม่คุ้น repository |
| บั๊ก, error, regression, ขอวินิจฉัย | [Debugging and review](references/debugging-review.md) | regression ตามผลกระทบเมื่อมีการแก้ |
| Review โค้ด/PR, refactor | [Debugging and review](references/debugging-review.md) | ตรวจ boundary ที่มีหลักฐานความเสี่ยง |
| คู่มือ, เอกสารระบบ, handoff | [Delivery](references/delivery.md) | เปิด source ที่รองรับคำกล่าว |

## งานเฉพาะด้าน

หาก environment มี Skill เฉพาะ frontend, backend, database, QA, security, integration หรือ release ให้เลือกเฉพาะที่ตรงงาน ไม่บังคับโหลดทุกชุด
หากไม่มี ใช้ข้อกำหนด/เครื่องมือของปลายทางและตรวจตามความเสี่ยงได้ตามปกติ Skill นี้ไม่มี file dependency ต่อ sibling Skills
การตรวจพื้นฐาน เช่น validation, permission และ regression ยังคงเป็นส่วนของการแก้ไข ไม่ต้องเปิด security audit หรือ full QA campaign เสมอไป

## กฎร่วม

- อย่าถือคำขอ Review หรือ Diagnose เป็นการอนุญาตแก้ไข; คำขอแก้ไขอนุญาตงาน implementation ปกติที่จำเป็นในขอบเขตนั้น
- ไม่สร้างการขออนุมัติซ้ำเมื่อผู้ใช้อนุมัติไว้แล้ว; ถ้าต้องตัดสินใจที่เปลี่ยนผลลัพธ์หรือเพิ่มผลกระทบภายนอกที่ยังไม่ได้รับอำนาจ ให้ถามโดยระบุสิ่งที่ขาด
- รักษา stack และ pattern ของปลายทาง ไม่บังคับใช้ข้อจำกัดของ repository ต้นทาง
- Secrets, production data และ artifact ที่มี PII ไม่ใช่ test fixture; ทดสอบ external effects ด้วย stub/sandbox ตามที่มี
- ตรวจแบบพอเหมาะกับความเสี่ยง ไม่บังคับ full suite/เอกสารใหม่กับทุกการแก้เล็ก
- รายงานสิ่งที่ตรวจจริง แยก passed, failed, skipped และ not run; ห้ามเรียก skipped ว่าผ่าน
