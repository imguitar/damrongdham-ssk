# LINE Postback Payload — Damrongdham SSK

รูปแบบ payload ที่ระบบใช้ระหว่างปุ่ม/Rich Menu กับ Webhook
เป็น query string สั้น ๆ (`a=<action>&<params>`) เพื่อให้อยู่ในขีดจำกัด 300 ตัวอักษรของ LINE

สร้าง/อ่านด้วย `backend/src/utils/lineBotMessages.js` (`pb()` / `parsePostback()`)
และตีความใน `backend/src/utils/lineFlowMachine.js`

## เมนูหลัก (ใช้ใน Rich Menu ได้โดยตรง)

| ปุ่ม | payload | ผลลัพธ์ |
|---|---|---|
| แจ้งเรื่องร้องเรียน | `a=start` | เริ่ม wizard ที่ขั้นประกาศความเป็นส่วนตัว |
| ติดตามสถานะ | `a=track` | แสดงรายการเรื่องของบัญชี LINE นั้น |
| เพิ่มข้อมูล/เอกสาร | `a=more_info` | แสดงคำขอข้อมูลเพิ่มเติมที่รอตอบ |
| ติดต่อเจ้าหน้าที่ | `a=contact` | ข้อมูลติดต่อศูนย์ดำรงธรรม |
| คู่มือการร้องเรียน | `a=guide` | วิธีใช้งานโดยย่อ |
| เมนูหลัก | `a=menu` | ล้างบทสนทนาและกลับเมนู |

> ปุ่ม Rich Menu จะส่งเป็น **text** ก็ได้ (เช่น `แจ้งเรื่องร้องเรียน`, `ติดตามสถานะ`)
> ระบบรองรับทั้งสองแบบ (ดู `TEXT_COMMANDS` ใน `lineFlowMachine.js`)

## ปุ่มระหว่างขั้นตอน (quick reply)

| ปุ่ม | payload |
|---|---|
| ยอมรับ / ไม่ยอมรับประกาศความเป็นส่วนตัว | `a=consent&v=accept` / `a=consent&v=decline` |
| เลือกประเภทเรื่อง | `a=category&id=<complaint_categories.id>` |
| ข้ามขั้นตอนนี้ | `a=skip` |
| ย้อนกลับ | `a=back` |
| ยกเลิก | `a=cancel` |
| เริ่มกรอกใหม่ | `a=restart` |
| เปิดเผย / ไม่เปิดเผยตัวตน | `a=anon&v=0` / `a=anon&v=1` |
| แนบไฟล์เสร็จแล้ว | `a=attach_done` |
| ยืนยันส่งเรื่อง | `a=confirm` |

## ปุ่มติดตามสถานะ / ส่งข้อมูลเพิ่มเติม

| ปุ่ม | payload | หมายเหตุ |
|---|---|---|
| เลือกเรื่องที่ต้องการดู | `a=track_view&id=<complaint_id>` | backend ตรวจสิทธิ์ว่าเรื่องนั้นเป็นของบัญชี LINE นี้เสมอ |
| เลือกคำขอที่จะตอบ | `a=info_reply&id=<info_request_id>` | ตรวจ ownership ผ่าน `complaints.citizen_id` |
| ส่งข้อมูลเสร็จสิ้น | `a=info_done` | ปิดคำขอ + แจ้งเจ้าหน้าที่ |

⚠️ **ห้ามเชื่อ id ที่มากับ payload โดยไม่ตรวจสิทธิ์** — ทุก action ที่มี `id`
จะถูกตรวจกับ `citizen_identities` ของ LINE userId ที่ยืนยันด้วยลายเซ็น webhook แล้วเท่านั้น

## ตัวอย่าง webhook event

```json
{
  "destination": "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "events": [
    {
      "type": "postback",
      "webhookEventId": "01H8XXXXXXXXXXXXXXXXXXXXXX",
      "deliveryContext": { "isRedelivery": false },
      "timestamp": 1755500000000,
      "source": { "type": "user", "userId": "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
      "replyToken": "0f3779fba3b349968c5d07db31eab56f",
      "mode": "active",
      "postback": { "data": "a=category&id=3" }
    }
  ]
}
```

`webhookEventId` ถูกบันทึกในตาราง `line_webhook_events` (PK) — event เดิมที่ LINE ส่งซ้ำ
จะถูกข้ามทันที จึงไม่เกิดเรื่องร้องเรียนหรือข้อความซ้ำ
