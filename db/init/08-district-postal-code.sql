-- ============================================================
-- Migration 08: รหัสไปรษณีย์ระดับอำเภอ
-- - districts.postal_code : ใช้เติมรหัสไปรษณีย์อัตโนมัติในแบบฟอร์มคำร้องเมื่อเลือกอำเภอ
-- - ทุกตำบลในอำเภอเดียวกันของจังหวัดศรีสะเกษใช้รหัสไปรษณีย์เดียวกัน จึงเก็บที่ระดับอำเภอ
--   (ข้อมูลจาก kongvut/thai-province-data อ้างอิงรหัสอำเภอ กรมการปกครอง)
-- - Safe to run repeatedly on an existing database.
-- ============================================================

DROP PROCEDURE IF EXISTS `migrate_08_district_postal_code`;

DELIMITER //
CREATE PROCEDURE `migrate_08_district_postal_code`()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'districts' AND COLUMN_NAME = 'postal_code'
  ) THEN
    ALTER TABLE `districts` ADD COLUMN `postal_code` VARCHAR(5) NULL AFTER `code`;
  END IF;
END //
DELIMITER ;

CALL `migrate_08_district_postal_code`();
DROP PROCEDURE `migrate_08_district_postal_code`;

-- เติมเฉพาะอำเภอที่ยังไม่มีรหัสไปรษณีย์ (ไม่ทับค่าที่ผู้ดูแลแก้ไขเอง)
UPDATE `districts` d
JOIN (
  SELECT '3301' AS code, '33000' AS postal_code
  UNION ALL SELECT '3302', '33190'
  UNION ALL SELECT '3303', '33130'
  UNION ALL SELECT '3304', '33110'
  UNION ALL SELECT '3305', '33140'
  UNION ALL SELECT '3306', '33180'
  UNION ALL SELECT '3307', '33170'
  UNION ALL SELECT '3308', '33150'
  UNION ALL SELECT '3309', '33160'
  UNION ALL SELECT '3310', '33120'
  UNION ALL SELECT '3311', '33220'
  UNION ALL SELECT '3312', '33210'
  UNION ALL SELECT '3313', '33250'
  UNION ALL SELECT '3314', '33240'
  UNION ALL SELECT '3315', '33130'
  UNION ALL SELECT '3316', '33270'
  UNION ALL SELECT '3317', '33140'
  UNION ALL SELECT '3318', '33120'
  UNION ALL SELECT '3319', '33110'
  UNION ALL SELECT '3320', '33230'
  UNION ALL SELECT '3321', '33120'
  UNION ALL SELECT '3322', '33160'
) p ON p.code = d.code
SET d.postal_code = p.postal_code
WHERE d.postal_code IS NULL;
