# Routing และ Performance

อ่านเมื่อแก้ route, deep link, base path, rendering หรือความเร็วหน้า

## Routing Contract

ตรวจ router base, API base, asset base และ server fallback แยกกัน; การเข้าได้จากหน้าแรกไม่พิสูจน์ refresh URL ตรง
กำหนด query params ที่ serialize ได้และปลอดภัย ไม่ใส่ token/PII ใน URL
ตรวจ public/protected/not-found และ expired session; client guard เป็น UX ไม่ใช่ server authorization
Download, callback และ external redirect ใช้ URL construction ที่เคารพ base path และ allowlist ตาม flow
รักษา Back/Forward และ context ที่ผู้ใช้คาดหวัง ไม่ reset filters เพียงเพราะ component remount

## Rendering และ Accessibility

ใช้ stable keys ตาม entity ไม่ใช้ index กับรายการที่ reorder/delete ได้
เก็บ subscription/timer/listener cleanup ตาม lifecycle และตรวจ mount/unmount ซ้ำ
ใช้ component semantics, labels และ focus management ของระบบเดิม
ตรวจ browser ที่รองรับจริงเมื่อใช้ API ใหม่; อย่าอ้างรองรับจาก type/lint ผ่าน
SSR/hydration concerns ใช้เฉพาะระบบที่มี SSR ไม่บังคับเพิ่มให้ SPA

## Performance ตามหลักฐาน

วัดอาการและ bottleneck ก่อน optimize เช่น network waterfall, render frequency, payload size หรือ long list
แยก server latency, redundant requests และ rendering; memoization ไม่แก้ query ช้า
ใช้ pagination/virtualization/code splitting เมื่อคุ้มกับข้อมูลและเครื่องมือเดิม พร้อมรักษา keyboard/search/print ตาม task
อย่าเพิ่ม dependency ขนาดใหญ่เพื่อแก้การจัดวางเล็กน้อย
เปรียบเทียบก่อน/หลังบนเงื่อนไขเดียวกัน; ไม่อ้าง production performance จาก dev build เพียงครั้งเดียว

## ตรวจรับ

ทดสอบ root/subpath ที่รองรับ, direct URL/refresh, back/forward, assets/download และ forbidden
ถ้าแก้ shared layout ตรวจหน้าตัวแทนอื่นและ viewport แคบ/กว้าง
รายงาน browser/สภาวะที่วัดและส่วนที่เป็น static inspection
