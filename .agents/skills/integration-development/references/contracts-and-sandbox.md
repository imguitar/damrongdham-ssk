# Provider Contract และ Sandbox

อ่านเมื่อเพิ่ม adapter, อัปเดต API version หรือวาง integration tests

## Discovery

ระบุ API version, auth mechanism, request/response schema, error categories, quotas และ delivery semantics จากหลักฐาน
ค้น adapter/config เดิมก่อนเพิ่ม SDK ไม่บังคับ library ใหม่เมื่อ client เดิมเพียงพอ
แยก sandbox/prod endpoints และ credential source ห้าม dump environment ทั้งชุด
หาก spec/version ไม่แน่นอน ให้ตรวจเอกสารทางการก่อน implement ไม่เดา parameter หรือ rate limit

## Adapter Boundary

แยก provider parsing/errors ออกจาก business decisions และ local identity model
Validate input/output ที่ boundary และรองรับ unknown fields ตาม compatibility policy
Pagination/cursor และ batching ต้องรักษา completeness ไม่ assume response แรกคือทั้งหมด
กำหนด timeout/resource limits และ behavior เมื่อ response ไม่ตรง schema
อย่าซ่อน provider failures เป็น empty success จนผู้ใช้เข้าใจว่าข้อมูลไม่มี

## Test Contract

ใช้ recorded fixtures ที่ตัด sensitive data หรือ handcrafted representative responses
ครอบคลุม normal, malformed, unauthorized, rate-limited, timeout และ partial success
Tests ต้องตรวจ mapping/error classification และ caller behavior ไม่เพียง assert SDK method ถูกเรียก
Sandbox execution ยังเป็น external action ต้องอยู่ใน scope และระบุ test recipient/account เมื่อมีผลออก
เมื่อไม่มี sandbox ใช้ fake adapter พร้อมรายงานว่า live provider compatibility ยังไม่ยืนยัน

## Version Change และ Handoff

ประเมิน callers, stored payloads, webhook schema และ rollback compatibility เมื่ออัปเดต version
ไม่เปลี่ยน provider dashboard/config หรือ rotate credentials เพียงเพื่อเขียนโค้ด
ส่งมอบ config keys ที่ต้องมีโดยไม่ใส่ values ลับ พร้อมวิธี verify และข้อจำกัด delivery
