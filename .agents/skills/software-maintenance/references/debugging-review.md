# Debugging, Review และ Refactoring

อ่านเมื่อพบข้อผิดพลาด ขอ Review หรือปรับโครงสร้างโดยไม่ตั้งใจเปลี่ยน behavior

## Diagnose

1. เก็บ trigger, input, identity, environment, expected/actual และ error ที่ตัด Secret ออกแล้ว
2. ทำ reproduction ที่เล็กที่สุดหรือ trace เส้นทางโค้ดเมื่อ runtime ไม่พร้อม ระบุชัดว่าข้อใดเป็น inference
3. ไล่จากจุดที่ผิดกลับไปยังต้นเหตุ เช่น stale state, validation, scope, query, transaction หรือ retry
4. ทดสอบสมมติฐานด้วยหลักฐานที่แยกสาเหตุได้ อย่าแก้หลายจุดพร้อมกันโดยไม่รู้ว่าจุดไหนจำเป็น
5. ถ้าผู้ใช้ขอเพียง diagnosis ส่งต้นเหตุและแนวทางแก้ ไม่ implement โดยพลการ

## Fix ที่ได้รับมอบหมาย

- แก้ต้นเหตุพร้อมรักษา behavior ที่ไม่เกี่ยวข้อง
- เพิ่ม regression ที่ทำให้เห็นปัญหาเดิมและพิสูจน์ผลใหม่เมื่อคุ้มกับความเสี่ยง
- ตรวจผลต่อ error path และ cleanup ไม่เพิ่ม catch ที่กลืนความล้มเหลวหรือคืน success ปลอม
- ถ้า fix ต้องเปลี่ยน contract อย่างมีนัยสำคัญ ให้ระบุผลต่อ consumers และใช้ขอบเขตที่ผู้ใช้อนุมัติ

## Review

อ่าน diff และ surrounding code รวม call sites/tests ที่จำเป็นก่อนสรุป
รายงานเฉพาะประเด็นที่มี trigger และผลกระทบชัดเจน เช่นข้อมูลผิด รั่วไหล crash หรือ regression
แต่ละ finding ควรมี priority, file/line, สถานการณ์ที่เกิด, ผลกระทบ และเหตุผลที่แก้
แยก bug จาก preference/style; ไม่สร้าง finding เพื่อให้รายงานดูครบ
หากไม่พบให้บอกว่าไม่พบ actionable finding พร้อมขอบเขตและช่องว่างการทดสอบ ไม่รับรองว่าไม่มีบั๊กทั้งหมด

## Refactor

ระบุ observable contract ที่ต้องคงไว้ก่อนย้ายโค้ด ได้แก่ response, error, side effects, transaction และ ordering
ย้ายทีละ boundary รักษา exported interfaces หรือปรับ callers ให้ครบ
หลีกเลี่ยงการปน formatting ทั้ง repository กับ logic change
ตรวจ import cycles, initialization timing และ resource lifetime หลังแยก module
