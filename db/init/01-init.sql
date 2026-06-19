-- ============================================================
-- Damrongdham DCMS — Database Initialization
-- ============================================================
-- ไฟล์นี้รันอัตโนมัติตอนสร้าง MySQL container ครั้งแรก
--
-- Phase 1: Project Setup — ตั้งค่า Charset/Timezone เท่านั้น
-- Phase 2: Database Schema — จะเพิ่ม CREATE TABLE 22 ตาราง + Seed Data
-- ============================================================

-- ตั้งค่า Character Set และ Timezone
SET NAMES utf8mb4;
SET time_zone = '+07:00';

-- ยืนยัน Database ถูกสร้างแล้ว (สร้างโดย MYSQL_DATABASE env var)
SELECT SCHEMA_NAME AS 'Database'
FROM INFORMATION_SCHEMA.SCHEMATA
WHERE SCHEMA_NAME = DATABASE();
