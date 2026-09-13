# Interaction และ States

อ่านเมื่อออกแบบ filters, drilldown, tables, forms และพฤติกรรมระหว่างโหลดข้อมูล

## Filter Contract

ระบุว่า filter ควบคุมทั้งหน้า section หรือ widget ใด และ apply ทันทีหรือกด Apply
แสดงค่าที่ active อยู่พร้อม reset ที่เข้าใจได้; reset ต้องกลับสู่ default ที่ตกลง ไม่ล้าง agency scope ที่บังคับจากสิทธิ์
Filter ที่เป็นลำดับชั้นต้อง reset ค่า dependent ที่ไม่ถูกต้อง; ช่วงวันที่ต้องมี validation และนิยามวันเริ่ม/สิ้นสุด
ถ้ามี draft filters กับ applied filters แยกกัน ต้องไม่แสดงผลเก่าราวกับเป็นผลของค่าที่เพิ่งเลือก
พิจารณา URL query สำหรับ deep link/back/share เมื่อเหมาะกับระบบ แต่ห้ามใส่ token หรือข้อมูลส่วนบุคคลใน URL
เมื่อเปลี่ยน filter ให้จัดการ request race ไม่ให้ response เก่าทับใหม่ รักษา pagination/sort ให้สอดคล้อง dataset

## Drilldown และ Navigation

คลิก KPI/กราฟแล้ว detail ต้องรักษานิยามและ filter ที่ทำให้ได้ตัวเลขนั้น
ตรวจว่าปลายทางอนุญาต role จริง ไม่สร้างลิงก์ที่พาไป forbidden เป็นพฤติกรรมหลัก
ถ้าตัวเลขเปิดเผยได้แต่รายละเอียดไม่ได้ ให้ card อ่านอย่างเดียวหรือปลายทางสรุปที่อนุญาต ไม่ขยาย permission เพื่อให้คลิกได้
รองรับ Back และ return context ตามรูปแบบแอป; อย่าทำให้ผู้ใช้สูญเสีย filter หรือ scroll โดยไม่จำเป็น
Control ที่คลิกได้ต้องทำงานด้วย keyboard มี accessible name และไม่มี nested interactive elements ที่ขัดกัน

## ตารางและรายการ

เลือก columns จากการตัดสินใจ/งาน ไม่แสดงทุก field ที่ API ส่งมา
จัด sorting ตามชนิดข้อมูลจริง ไม่ sort ตัวเลขที่ format แล้วเป็น string; ระบุ server/client pagination ให้ตรงกับผลรวม
รักษา row identity เมื่อ sort/filter เพื่อไม่ทำ selection หรือ action ชี้ผิดรายการ
Bulk action ต้องบอกว่าเลือกเฉพาะหน้านี้หรือทั้งผลค้นหา ตรวจสิทธิ์และผลบางรายการล้มเหลว
Horizontal scroll ควรอยู่ใน container ตาราง ไม่ทำทั้งหน้าล้น; คงวิธีอ่านชื่อรายการและเข้าถึง action
Export ต้องใช้ applied filters และ scope เดียวกัน หรือบอกชัดว่า export มีขอบเขตอื่น

## Form และ Action

แสดง label และข้อกำหนดก่อน error ไม่ใช้ placeholder แทน label
Validation ต้องอยู่ใกล้ field และช่วยแก้ได้; error จาก server ต้องไม่ถูกแปลงเป็นความผิดของผู้ใช้โดยไม่มีหลักฐาน
ระหว่าง submit ป้องกันการส่งซ้ำ แสดง progress และรักษาค่าที่กรอกเมื่อผิดพลาด
Confirmation ใช้กับ action ที่มีความเสี่ยงจริง บอก target และผลกระทบ; ไม่ใส่ confirmation ทุกปุ่มจนเกิดความเคยชิน
Optimistic update เหมาะเมื่อย้อนคืนได้และมี rollback; อย่าแสดงว่าสำเร็จก่อน server ยืนยันสำหรับ action เสี่ยง

## State Matrix

| State | พฤติกรรมที่ต้องตัดสินใจ |
|---|---|
| Initial loading | Placeholder ที่ใกล้โครงจริง ไม่แสดงเลข 0 เป็นข้อมูลระหว่างรอ |
| Refreshing | จะคงข้อมูลเก่าหรือปิด interaction; ถ้าคงต้องบอกว่าอัปเดตอยู่ |
| Empty dataset | บอกว่าไม่มีข้อมูลในระบบ/ช่วงนั้น พร้อม action ที่มีสิทธิ์ถ้าเหมาะสม |
| No filter results | บอกว่าตัวกรองไม่พบผลและมีทางปรับ/reset |
| Partial failure | แยก widget ที่ล้มเหลวจาก widget ที่ใช้ได้ ไม่ทำค่าหายเป็นศูนย์ |
| Error/offline | บอกปัญหาที่ทราบ มี retry ที่ปลอดภัย ไม่เปิดเผยรายละเอียดภายใน |
| Stale/cached | แสดง freshness เมื่อกระทบการตัดสินใจ |
| Forbidden/expired | จัดการตาม auth flow ไม่อ้างว่าไม่มีข้อมูล และไม่คงข้อมูลอ่อนไหวของ session เก่า |

ทดสอบ state ที่เปลี่ยนจริงจาก response ไม่เพียงวาด screenshot ของ happy path
