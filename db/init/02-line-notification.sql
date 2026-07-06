-- ============================================================
-- Damrongdham DCMS — LINE Login & Notification Migration
-- Phase L2: Identity model + Notification (preferences/outbox/logs)
-- ============================================================
-- ไฟล์นี้รันต่อจาก 01-init.sql (docker-entrypoint-initdb.d รันตามลำดับชื่อไฟล์)
-- ออกแบบให้ idempotent: รันซ้ำ หรือรันบน DB เดิมที่มีข้อมูลแล้วได้อย่างปลอดภัย
-- Charset : utf8mb4 / utf8mb4_unicode_ci  | Timezone: +07:00
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+07:00';

-- ============================================================
-- 1. citizen_identities — external identity mapping (LINE / future providers)
--    Internal user = citizens.id เป็นศูนย์กลาง; ไม่ผูก line_user_id ลง citizens โดยตรง
-- ============================================================
CREATE TABLE IF NOT EXISTS `citizen_identities` (
  `id`               INT          NOT NULL AUTO_INCREMENT,
  `citizen_id`       INT          NOT NULL,
  `provider`         VARCHAR(20)  NOT NULL,               -- 'line' (future: 'local', ...)
  `provider_user_id` VARCHAR(255) NOT NULL,               -- LINE subject (sub) — stable identifier
  `display_name`     VARCHAR(255),                        -- UX only — ห้ามใช้ยืนยันตัวตน
  `picture_url`      VARCHAR(1000),
  `linked_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_identity_provider_user` (`provider`, `provider_user_id`),
  KEY `idx_identity_citizen` (`citizen_id`),
  CONSTRAINT `fk_identity_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. notification_preferences — per-citizen channel/event opt-in (default ON)
-- ============================================================
CREATE TABLE IF NOT EXISTS `notification_preferences` (
  `id`                        INT        NOT NULL AUTO_INCREMENT,
  `citizen_id`                INT        NOT NULL,
  `line_enabled`              TINYINT(1) NOT NULL DEFAULT 1,
  `notify_status_change`      TINYINT(1) NOT NULL DEFAULT 1,
  `notify_progress_update`    TINYINT(1) NOT NULL DEFAULT 1,
  `notify_more_info_required` TINYINT(1) NOT NULL DEFAULT 1,
  `notify_resolved`           TINYINT(1) NOT NULL DEFAULT 1,
  `notify_closed`             TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`                DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pref_citizen` (`citizen_id`),
  CONSTRAINT `fk_pref_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. notification_outbox — transactional outbox (worker polls this)
--    idempotency_key ป้องกันส่งซ้ำ; status ขับเคลื่อน retry
-- ============================================================
CREATE TABLE IF NOT EXISTS `notification_outbox` (
  `id`              INT          NOT NULL AUTO_INCREMENT,
  `event_type`      VARCHAR(50)  NOT NULL,                -- COMPLAINT_STATUS_CHANGED, ...
  `citizen_id`      INT          NOT NULL,
  `complaint_id`    INT,
  `channel`         VARCHAR(20)  NOT NULL DEFAULT 'line',
  `payload`         JSON         NOT NULL,                -- template inputs (no PII beyond ref/status)
  `status`          ENUM('pending','processing','sent','failed','retry','cancelled')
                                 NOT NULL DEFAULT 'pending',
  `attempt_count`   INT          NOT NULL DEFAULT 0,
  `next_attempt_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `idempotency_key` VARCHAR(255) NOT NULL,
  `last_error`      VARCHAR(1000),
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at`    DATETIME,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_outbox_idempotency` (`idempotency_key`),
  KEY `idx_outbox_poll` (`status`, `next_attempt_at`),
  KEY `idx_outbox_citizen` (`citizen_id`),
  KEY `idx_outbox_complaint` (`complaint_id`),
  CONSTRAINT `fk_outbox_citizen`   FOREIGN KEY (`citizen_id`)   REFERENCES `citizens`   (`id`),
  CONSTRAINT `fk_outbox_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. notification_logs — delivery history (audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id`                  INT          NOT NULL AUTO_INCREMENT,
  `outbox_id`           INT,
  `citizen_id`          INT          NOT NULL,
  `complaint_id`        INT,
  `channel`             VARCHAR(20)  NOT NULL DEFAULT 'line',
  `event_type`          VARCHAR(50)  NOT NULL,
  `status`              ENUM('sent','failed')  NOT NULL,
  `provider_message_id` VARCHAR(255),
  `error_code`          VARCHAR(100),
  `error_message`       VARCHAR(1000),
  `sent_at`             DATETIME,
  `created_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_logs_citizen` (`citizen_id`),
  KEY `idx_logs_complaint` (`complaint_id`),
  KEY `idx_logs_outbox` (`outbox_id`),
  CONSTRAINT `fk_logs_citizen`   FOREIGN KEY (`citizen_id`)   REFERENCES `citizens`   (`id`),
  CONSTRAINT `fk_logs_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. Idempotent ALTERs (citizens + complaint_updates)
--    ใช้ stored procedure guard เพราะ MySQL ไม่รองรับ ADD COLUMN IF NOT EXISTS
-- ============================================================
DROP PROCEDURE IF EXISTS `_dcms_line_migrate`;
DELIMITER $$
CREATE PROCEDURE `_dcms_line_migrate`()
BEGIN
  DECLARE db VARCHAR(128);
  SET db = DATABASE();

  -- citizens.email / password_hash → nullable (LINE provisional users ไม่มี email/password)
  IF (SELECT IS_NULLABLE FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = db AND TABLE_NAME = 'citizens' AND COLUMN_NAME = 'email') = 'NO' THEN
    ALTER TABLE `citizens` MODIFY `email` VARCHAR(255) NULL;
  END IF;

  IF (SELECT IS_NULLABLE FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = db AND TABLE_NAME = 'citizens' AND COLUMN_NAME = 'password_hash') = 'NO' THEN
    ALTER TABLE `citizens` MODIFY `password_hash` VARCHAR(255) NULL;
  END IF;

  -- citizens.is_provisional — บัญชีที่มาจาก LINE แต่ยังกรอกโปรไฟล์/consent ไม่ครบ
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = db AND TABLE_NAME = 'citizens' AND COLUMN_NAME = 'is_provisional') THEN
    ALTER TABLE `citizens` ADD COLUMN `is_provisional` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_active`;
  END IF;

  -- citizens.consent_at — timestamp ที่ผู้ใช้ยอมรับ privacy notice (PDPA)
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = db AND TABLE_NAME = 'citizens' AND COLUMN_NAME = 'consent_at') THEN
    ALTER TABLE `citizens` ADD COLUMN `consent_at` DATETIME NULL AFTER `is_provisional`;
  END IF;

  -- complaint_updates.is_public — แยก public_update ออกจาก internal_note
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = db AND TABLE_NAME = 'complaint_updates' AND COLUMN_NAME = 'is_public') THEN
    ALTER TABLE `complaint_updates` ADD COLUMN `is_public` TINYINT(1) NOT NULL DEFAULT 0 AFTER `content`;
  END IF;
END$$
DELIMITER ;

CALL `_dcms_line_migrate`();
DROP PROCEDURE IF EXISTS `_dcms_line_migrate`;

-- ============================================================
-- หมายเหตุ:
-- - RESULT updates (ผลการดำเนินการที่ส่งให้ศูนย์) จะถือเป็น public ได้เมื่อ set is_public=1
--   ค่าเริ่มต้น 0 = internal เพื่อความปลอดภัย (opt-in ต่อ public)
-- - notification_preferences ถูกสร้างอัตโนมัติเมื่อ citizen ผูก LINE ครั้งแรก (backend, phase L3)
-- ============================================================
