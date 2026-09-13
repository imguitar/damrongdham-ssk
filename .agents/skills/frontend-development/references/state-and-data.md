# State และ Server Data

อ่านเมื่อแก้ async request, filters, cache, mutation หรือ auth/session

## Source of Truth

แยก server state, draft form, applied filters, URL state และ presentation state
อย่าเก็บ derived values ซ้ำโดยไม่มีกลไก sync; ระบุเจ้าของ state และจุด reset เมื่อเปลี่ยน resource/principal
ใช้ library/cache pattern เดิม ไม่เพิ่ม global state manager เพราะส่ง props ไม่กี่ชั้น
กำหนด canonical types เช่น identifier, null, empty string, date-only และ timestamp ให้ตรง API

## Async และ Consistency

กำหนด loading/error/empty/success และ refreshing ให้แยกกัน; response ที่ยังไม่มาห้ามแสดง 0 ราวกับข้อมูลจริง
ป้องกัน stale response ด้วย cancellation หรือ request identity ตาม tooling; อย่า assume abort ยกเลิก server mutation
เมื่อ filter/search เปลี่ยน ตรวจ pagination reset, debounce และ applied state ให้ UI กับ request ตรงกัน
หลัง mutation กำหนด invalidate/refetch/update ที่ทำให้ list/detail/summary ไม่ขัดกัน
Optimistic update ต้องมี rollback และ conflict policy ไม่ใช้กับ mutation เสี่ยงที่ต้องยืนยันผล
เมื่อ session/principal เปลี่ยน ต้องไม่แสดง cache ของคนก่อน; scope cache key ตาม identity/tenant และ filter ที่มีผลจริง

## Form และ Error

แยก local validation กับ server errors; รักษาข้อมูลที่กรอกเมื่อ request ล้มเหลว
Double-submit protection ใน UI ไม่แทน server idempotency
อย่าแปลง timeout เป็นคำยืนยันว่า server ไม่บันทึก ให้ reconcile ก่อน retry mutation ที่อาจทำซ้ำ
Field dependencies ต้อง reset ลูกที่ไม่ valid และรักษา option ที่โหลดไม่ครบเป็น unknown ไม่ล้างข้อมูลถูกต้องทันที

## ตรวจรับ

จำลอง response กลับสลับลำดับ, navigate ระหว่างโหลด, filter แล้ว Back, mutation failed และ session expired
ตรวจ zero/null/empty, error ต่อ widget, query string กับ request และข้อมูลหลัง refresh
ใช้ fake provider/data ที่ปลอดภัย ไม่เปิดเผย payload/token ใน logs หรือ screenshots
