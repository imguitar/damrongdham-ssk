-- ============================================================
-- Damrongdham DCMS — Staff LINE Notifications (Hybrid) Migration
-- Phase S1: generalize outbox to multi-recipient + staff/group targets
-- ============================================================
-- รันต่อจาก 02-line-notification.sql · idempotent (รันซ้ำ/รันบน DB เดิมได้)
-- Charset: utf8mb4 / utf8mb4_unicode_ci | Timezone: +07:00
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+07:00';

-- ============================================================
-- 1. user_identities — staff (users) personal LINE link (mirror citizen_identities)
-- ============================================================
CREATE TABLE IF NOT EXISTS `user_identities` (
  `id`               INT          NOT NULL AUTO_INCREMENT,
  `user_id`          INT          NOT NULL,
  `provider`         VARCHAR(20)  NOT NULL,             -- 'line'
  `provider_user_id` VARCHAR(255) NOT NULL,             -- LINE userId (sub)
  `display_name`     VARCHAR(255),
  `picture_url`      VARCHAR(1000),
  `linked_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_identity_provider_user` (`provider`, `provider_user_id`),
  KEY `idx_user_identity_user` (`user_id`),
  CONSTRAINT `fk_user_identity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. line_group_targets — LINE group bound to a unit (center / agency)
-- ============================================================
CREATE TABLE IF NOT EXISTS `line_group_targets` (
  `id`                 INT          NOT NULL AUTO_INCREMENT,
  `scope`              ENUM('center','agency') NOT NULL,
  `agency_id`          INT,                              -- NULL when scope='center'
  `group_id`           VARCHAR(64)  NOT NULL,            -- LINE groupId
  `label`              VARCHAR(255),
  `is_active`          TINYINT(1)   NOT NULL DEFAULT 1,
  -- per-group event opt-in
  `notify_new`         TINYINT(1)   NOT NULL DEFAULT 1,  -- new complaint received
  `notify_forwarded`   TINYINT(1)   NOT NULL DEFAULT 1,  -- forwarded to this agency
  `notify_sla`         TINYINT(1)   NOT NULL DEFAULT 1,  -- near/overdue
  `notify_escalation`  TINYINT(1)   NOT NULL DEFAULT 1,
  `bound_by`           INT,
  `bound_at`           DATETIME,
  `created_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_group_target_group` (`group_id`),
  KEY `idx_group_target_scope` (`scope`, `agency_id`),
  CONSTRAINT `fk_group_target_agency` FOREIGN KEY (`agency_id`) REFERENCES `agencies` (`id`),
  CONSTRAINT `fk_group_target_bound_by` FOREIGN KEY (`bound_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. line_group_pairing_codes — one-time codes to bind a group to a unit
-- ============================================================
CREATE TABLE IF NOT EXISTS `line_group_pairing_codes` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `code`           VARCHAR(16)  NOT NULL,
  `scope`          ENUM('center','agency') NOT NULL,
  `agency_id`      INT,
  `label`          VARCHAR(255),
  `created_by`     INT,
  `expires_at`     DATETIME     NOT NULL,
  `used_at`        DATETIME,
  `used_group_id`  VARCHAR(64),
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pairing_code` (`code`),
  KEY `idx_pairing_active` (`used_at`, `expires_at`),
  CONSTRAINT `fk_pairing_agency`     FOREIGN KEY (`agency_id`)  REFERENCES `agencies` (`id`),
  CONSTRAINT `fk_pairing_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`    (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. user_notification_preferences — per-staff LINE prefs (for S3 individual DMs)
-- ============================================================
CREATE TABLE IF NOT EXISTS `user_notification_preferences` (
  `id`                    INT        NOT NULL AUTO_INCREMENT,
  `user_id`               INT        NOT NULL,
  `line_enabled`          TINYINT(1) NOT NULL DEFAULT 1,
  `notify_new`            TINYINT(1) NOT NULL DEFAULT 1,
  `notify_forwarded`      TINYINT(1) NOT NULL DEFAULT 1,
  `notify_sla`            TINYINT(1) NOT NULL DEFAULT 1,
  `notify_escalation`     TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`            DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_pref_user` (`user_id`),
  CONSTRAINT `fk_user_pref_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. Generalize notification_outbox / notification_logs to multi-recipient
--    (additive + backward compatible: recipient_type defaults 'citizen')
-- ============================================================
DROP PROCEDURE IF EXISTS `_dcms_staff_line_migrate`;
DELIMITER $$
CREATE PROCEDURE `_dcms_staff_line_migrate`()
BEGIN
  DECLARE db VARCHAR(128);
  SET db = DATABASE();

  -- notification_outbox: recipient generalization
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA=db AND TABLE_NAME='notification_outbox' AND COLUMN_NAME='recipient_type') THEN
    ALTER TABLE `notification_outbox`
      ADD COLUMN `recipient_type` ENUM('citizen','user','line_group') NOT NULL DEFAULT 'citizen' AFTER `event_type`,
      ADD COLUMN `recipient_user_id` INT NULL AFTER `citizen_id`,
      ADD COLUMN `line_group_id` VARCHAR(64) NULL AFTER `recipient_user_id`,
      ADD KEY `idx_outbox_recipient_user` (`recipient_user_id`),
      ADD KEY `idx_outbox_group` (`line_group_id`);
    ALTER TABLE `notification_outbox`
      ADD CONSTRAINT `fk_outbox_recipient_user` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`);
  END IF;

  IF (SELECT IS_NULLABLE FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA=db AND TABLE_NAME='notification_outbox' AND COLUMN_NAME='citizen_id') = 'NO' THEN
    ALTER TABLE `notification_outbox` MODIFY `citizen_id` INT NULL;
  END IF;

  -- notification_logs: recipient generalization
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA=db AND TABLE_NAME='notification_logs' AND COLUMN_NAME='recipient_type') THEN
    ALTER TABLE `notification_logs`
      ADD COLUMN `recipient_type` ENUM('citizen','user','line_group') NOT NULL DEFAULT 'citizen' AFTER `event_type`,
      ADD COLUMN `recipient_user_id` INT NULL AFTER `citizen_id`,
      ADD COLUMN `line_group_id` VARCHAR(64) NULL AFTER `recipient_user_id`;
    ALTER TABLE `notification_logs`
      ADD CONSTRAINT `fk_logs_recipient_user` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`);
  END IF;

  IF (SELECT IS_NULLABLE FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA=db AND TABLE_NAME='notification_logs' AND COLUMN_NAME='citizen_id') = 'NO' THEN
    ALTER TABLE `notification_logs` MODIFY `citizen_id` INT NULL;
  END IF;
END$$
DELIMITER ;

CALL `_dcms_staff_line_migrate`();
DROP PROCEDURE IF EXISTS `_dcms_staff_line_migrate`;

-- หมายเหตุ: worker/enqueue เดิมยังคงใช้ recipient_type='citizen' โดยปริยาย → ไม่กระทบ flow ประชาชน
