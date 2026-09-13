# Testing และหลักฐานการตรวจรับ

อ่านเมื่อเลือกหรือรัน tests และเมื่อเปลี่ยน behavior ที่ควรมี regression

## เลือกการตรวจตามความเสี่ยง

| เปลี่ยนอะไร | การตรวจที่เหมาะสม |
|---|---|
| Markdown/Skill | โครงสร้าง metadata, link targets, coverage ของ instruction และ whitespace |
| Pure logic | Unit cases ครอบคลุม boundary และ regression |
| API/Auth | Endpoint/Integration กับ allowed/denied/malformed/ownership |
| Database | Fresh initialization, upgrade, data integrity และ partial failure |
| UI interaction | Build และ browser flow ตาม role/loading/error |
| Base URL/OAuth/Proxy | Deep link, callback, cookie และ request path ภายใต้ target base path |
| Worker/Queue | Duplicate, retry, failure, restart และ recipient changes |

ไม่ต้องทำทุกแถวในทุกงาน และไม่สร้าง test ที่เพียงยืนยันชื่อ heading หรือเลียนแบบ implementation โดยไม่มี behavior ให้พิสูจน์

## ก่อนรัน

อ่าน scripts/config/helper: test ใช้ DB ไหน เปิด network หรือไม่ และ cleanup ลบอะไร
ยืนยัน test environment ที่ปลอดภัย ไม่ถือ NODE_ENV=test เป็นการรับรองว่า DB connection ไม่ชี้ production
ใช้ runner/dependency ที่มีอยู่ เลือก targeted test ก่อน full suite
สำหรับ fixture ที่ใช้ DB ร่วม ระวัง parallelism และ unique IDs; cleanup เฉพาะข้อมูลที่ test สร้าง

## การอ่านผล

- Passed: test รันจริงและ assertion ผ่าน
- Failed: เก็บ failure ที่เกี่ยวข้องและแยก pre-existing failure ด้วยหลักฐาน
- Skipped: dependency/DB ไม่พร้อมหรือ runner ตั้ง skip ต้องรายงานจำนวนถ้ามี
- Not run: ยังไม่ได้รัน เช่นไม่มี browser/DB ให้ระบุข้อจำกัด
- Static inspection: ช่วยเพิ่มความมั่นใจ แต่ห้ามเรียกว่า runtime/E2E verification

หลังมีผลผ่านให้หยุดขยาย suite เว้นแต่มี change หรือความเสี่ยงใหม่
เมื่อ regression สำคัญควรยืนยันว่าตรวจจับปัญหาเดิมได้โดยไม่ย้อนทับงานผู้ใช้
