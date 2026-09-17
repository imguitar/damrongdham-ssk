-- ============================================================
-- Migration 07: รหัสติดตามเรื่อง (สุ่ม) + เลขเอกสารอ้างอิงภายในหน่วยงาน
-- - tracking_code    : รหัส 4 ตัวอักษรแบบสุ่ม ใช้ติดตามเรื่องฝั่งประชาชน
--                      (complaint_number เดิมเป็นเลขเอกสารภายใน เห็นเฉพาะเจ้าหน้าที่)
-- - reference_number : เลขเอกสารอ้างอิงจากระบบภายในของหน่วยงาน (เจ้าหน้าที่กรอก)
-- - เรื่องเดิมที่ยังไม่มี tracking_code จะถูกสุ่มให้อัตโนมัติเมื่อ backend เริ่มทำงาน
-- - Safe to run repeatedly on an existing database.
-- ============================================================

DROP PROCEDURE IF EXISTS `migrate_07_complaint_tracking_code`;

DELIMITER //
CREATE PROCEDURE `migrate_07_complaint_tracking_code`()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'complaints' AND COLUMN_NAME = 'tracking_code'
  ) THEN
    ALTER TABLE `complaints`
      ADD COLUMN `tracking_code` CHAR(4) NULL AFTER `complaint_number`,
      ADD UNIQUE KEY `uq_complaints_tracking_code` (`tracking_code`);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'complaints' AND COLUMN_NAME = 'reference_number'
  ) THEN
    ALTER TABLE `complaints`
      ADD COLUMN `reference_number` VARCHAR(100) NULL AFTER `tracking_code`,
      ADD KEY `idx_complaints_reference_number` (`reference_number`);
  END IF;
END //
DELIMITER ;

CALL `migrate_07_complaint_tracking_code`();
DROP PROCEDURE `migrate_07_complaint_tracking_code`;
