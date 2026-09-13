# Frontend และประสบการณ์ใช้งาน

อ่านเมื่อเปลี่ยนหน้า form component routing หรือ API client ใช้ design system และ state pattern ของปลายทาง

## สำรวจและออกแบบ

- ตรวจ route guards, layout, reusable components, API client และแหล่ง auth state ที่มีอยู่
- ระบุผู้ใช้ที่เห็นหน้า/Action และข้อมูลที่ต้องให้ server enforce
- รักษา language, date/number formatting, timezone และ responsive breakpoint ที่โปรเจกต์ใช้
- แยก UI state เช่น selected tab/filter จาก server state และหลีกเลี่ยง duplicate source of truth

## Implementation

- รองรับ loading, empty, error, retry และ success โดยไม่ล้าง input เมื่อ API ผิดพลาดโดยไม่จำเป็น
- ตรวจ required fields, trimming, null vs empty และ server validation errors
- ป้องกัน double submit; handle request ที่ตอบสลับลำดับหรือ component ถูก unmount
- ตรวจ cache/invalidation หลัง mutate ให้หน้ารายการและรายละเอียดไม่ขัดกัน
- Filter, sorting และ pagination ต้องส่ง contract เดียวกับ server; reset page เมื่อ filter เปลี่ยน
- Link, refresh และ back/forward ต้องทำงานตาม router/base path ไม่พึ่ง navigate จากหน้าก่อนหน้าเท่านั้น
- ใช้ label, keyboard focus, error association และ contrast ที่เหมาะสม; อย่าใช้สีอย่างเดียวบอกสถานะ
- ไม่แสดง implementation jargon หรือ stack trace ในข้อความผู้ใช้

## ตรวจรับ

ทดสอบ role ที่อนุญาตและปฏิเสธ, direct URL, expired session, no data, long text และ API error ตามผลกระทบ
ตรวจ browser/viewport จริงเมื่อ layout หรือ interaction เปลี่ยน หากทำไม่ได้ให้ระบุว่ายังไม่ได้ visual verification
Build สำเร็จไม่เท่ากับ interaction ผ่าน; screenshot สวยไม่ยืนยัน authorization
งานรายงานต้องตรวจว่า filter ที่แสดงตรงกับ request/export และตัวเลขไม่ถูก label เป็นคนละช่วงเวลา
