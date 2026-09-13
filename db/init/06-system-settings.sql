-- ============================================================
-- Migration 06: configurable system settings
-- - Adds escalation thresholds editable from Master Data settings.
-- - Safe to run repeatedly on an existing database.
-- ============================================================

CREATE TABLE IF NOT EXISTS `system_settings` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `setting_key`   VARCHAR(100) NOT NULL,
  `setting_value` VARCHAR(255) NOT NULL,
  `value_type`    ENUM('INT','STRING','BOOLEAN','JSON') NOT NULL,
  `description`   VARCHAR(255),
  `updated_by`    INT,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_system_settings_key` (`setting_key`),
  KEY `idx_system_settings_updated_by` (`updated_by`),
  CONSTRAINT `fk_system_settings_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `system_settings`
  (`setting_key`, `setting_value`, `value_type`, `description`)
VALUES
  ('escalation_enabled',        'true', 'BOOLEAN', 'เปิดหรือปิดระบบเร่งรัดการอัปเดตความคืบหน้า'),
  ('escalation_l1_days',        '30',   'INT',     'จำนวนวันก่อนเร่งรัดระดับที่ 1'),
  ('escalation_l2_offset_days', '15',   'INT',     'จำนวนวันเพิ่มจากระดับที่ 1 ก่อนเร่งรัดระดับที่ 2'),
  ('escalation_l3_offset_days', '7',    'INT',     'จำนวนวันเพิ่มจากระดับที่ 2 ก่อนเร่งรัดระดับที่ 3');

