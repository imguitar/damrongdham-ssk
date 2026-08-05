-- ============================================================
-- Damrongdham DCMS — LINE Complaint Intake Migration
-- Phase LC1: รับเรื่องร้องเรียนผ่าน LINE + ขอข้อมูลเพิ่มเติม
-- ============================================================
-- รันต่อจาก 03-staff-line.sql · idempotent (รันซ้ำ / รันบน DB เดิมที่มีข้อมูลได้)
-- ไม่มีคำสั่งที่ทำลายข้อมูลเดิม (เพิ่มตาราง + ALTER แบบ additive เท่านั้น)
-- Charset: utf8mb4 / utf8mb4_unicode_ci | Timezone: +07:00
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+07:00';

-- ============================================================
-- 1. complaint_channels — เพิ่มช่องทาง "LINE Official Account"
--    เรื่องที่มาจาก LINE ใช้ channel_id นี้ (ไม่สร้างระบบเลขที่/ตารางแยก)
-- ============================================================
INSERT INTO `complaint_channels` (`name`, `is_active`)
SELECT 'LINE Official Account', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `complaint_channels` WHERE `name` = 'LINE Official Account');

-- ============================================================
-- 2. line_webhook_events — idempotency ของ webhook (กัน redelivery ซ้ำ)
--    PK = webhookEventId ที่ LINE ส่งมา → INSERT ซ้ำ = duplicate → ข้าม event
-- ============================================================
CREATE TABLE IF NOT EXISTS `line_webhook_events` (
  `webhook_event_id` VARCHAR(100) NOT NULL,          -- event.webhookEventId
  `event_type`       VARCHAR(30)  NOT NULL,          -- message / postback / follow / ...
  `source_type`      VARCHAR(20),                    -- user / group / room
  `received_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`webhook_event_id`),
  KEY `idx_line_events_received` (`received_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. line_conversations — สถานะบทสนทนา (wizard รับเรื่อง / ส่งข้อมูลเพิ่มเติม)
--    draft เก็บร่างที่ผู้ใช้กรอกไว้ชั่วคราว → ลบเมื่อส่งเรื่องสำเร็จ/ยกเลิก/หมดอายุ
-- ============================================================
CREATE TABLE IF NOT EXISTS `line_conversations` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `line_user_id`  VARCHAR(64)  NOT NULL,             -- LINE userId (source.userId)
  `citizen_id`    INT,                               -- ผูกเมื่อ resolve identity แล้ว
  `state`         VARCHAR(40)  NOT NULL DEFAULT 'IDLE',
  `draft`         JSON,                              -- ร่างเรื่องร้องเรียน (ชั่วคราว)
  `context`       JSON,                              -- เช่น { infoRequestId, complaintId }
  `last_event_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at`    DATETIME,                          -- หมดอายุ → เริ่มใหม่ (retention)
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_line_conv_user` (`line_user_id`),
  KEY `idx_line_conv_expires` (`expires_at`),
  KEY `idx_line_conv_citizen` (`citizen_id`),
  CONSTRAINT `fk_line_conv_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. complaint_info_requests — เจ้าหน้าที่ขอข้อมูล/เอกสารเพิ่มเติมจากผู้ร้อง
-- ============================================================
CREATE TABLE IF NOT EXISTS `complaint_info_requests` (
  `id`               INT      NOT NULL AUTO_INCREMENT,
  `complaint_id`     INT      NOT NULL,
  `requested_by`     INT      NOT NULL,              -- users.id (เจ้าหน้าที่)
  `message`          TEXT     NOT NULL,              -- รายการข้อมูล/เอกสารที่ต้องการ
  `due_date`         DATE,
  `status`           ENUM('PENDING','RESPONDED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `last_notified_at` DATETIME,                       -- ครั้งล่าสุดที่ enqueue แจ้งผู้ร้อง
  `notify_count`     INT      NOT NULL DEFAULT 0,    -- จำนวนครั้งที่ส่ง (รวมส่งซ้ำ)
  `responded_at`     DATETIME,
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_info_req_complaint` (`complaint_id`),
  KEY `idx_info_req_status`    (`status`),
  CONSTRAINT `fk_info_req_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`),
  CONSTRAINT `fk_info_req_user`      FOREIGN KEY (`requested_by`) REFERENCES `users`      (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. complaint_info_responses — ข้อมูล/เอกสารที่ประชาชนส่งกลับ
--    ข้อความ 1 แถว / ไฟล์ 1 แถว (attachment_id ชี้ไป complaint_attachments)
-- ============================================================
CREATE TABLE IF NOT EXISTS `complaint_info_responses` (
  `id`              INT         NOT NULL AUTO_INCREMENT,
  `info_request_id` INT         NOT NULL,
  `complaint_id`    INT         NOT NULL,
  `citizen_id`      INT,
  `channel`         VARCHAR(20) NOT NULL DEFAULT 'line',
  `message`         TEXT,
  `attachment_id`   INT,
  `created_at`      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_info_resp_request`   (`info_request_id`),
  KEY `idx_info_resp_complaint` (`complaint_id`),
  CONSTRAINT `fk_info_resp_request`    FOREIGN KEY (`info_request_id`) REFERENCES `complaint_info_requests` (`id`),
  CONSTRAINT `fk_info_resp_complaint`  FOREIGN KEY (`complaint_id`)    REFERENCES `complaints`              (`id`),
  CONSTRAINT `fk_info_resp_citizen`    FOREIGN KEY (`citizen_id`)      REFERENCES `citizens`                (`id`),
  CONSTRAINT `fk_info_resp_attachment` FOREIGN KEY (`attachment_id`)   REFERENCES `complaint_attachments`   (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. Idempotent ALTERs — complaint_attachments รองรับไฟล์ที่มาจาก LINE
-- ============================================================
DROP PROCEDURE IF EXISTS `_dcms_line_complaints_migrate`;
DELIMITER $$
CREATE PROCEDURE `_dcms_line_complaints_migrate`()
BEGIN
  DECLARE db VARCHAR(128);
  SET db = DATABASE();

  -- upload_source: เพิ่มค่า 'LINE' (ค่าเดิม STAFF/PUBLIC ไม่เปลี่ยน)
  IF (SELECT COLUMN_TYPE FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = db AND TABLE_NAME = 'complaint_attachments'
          AND COLUMN_NAME = 'upload_source') NOT LIKE '%LINE%' THEN
    ALTER TABLE `complaint_attachments`
      MODIFY `upload_source` ENUM('STAFF','PUBLIC','LINE') NOT NULL DEFAULT 'STAFF';
  END IF;

  -- info_request_id: ไฟล์ที่ส่งมาตามคำขอข้อมูลเพิ่มเติม
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = db AND TABLE_NAME = 'complaint_attachments'
          AND COLUMN_NAME = 'info_request_id') THEN
    ALTER TABLE `complaint_attachments`
      ADD COLUMN `info_request_id` INT NULL AFTER `update_id`,
      ADD KEY `idx_attachments_info_request` (`info_request_id`);
    ALTER TABLE `complaint_attachments`
      ADD CONSTRAINT `fk_attachments_info_request`
      FOREIGN KEY (`info_request_id`) REFERENCES `complaint_info_requests` (`id`);
  END IF;
END$$
DELIMITER ;

CALL `_dcms_line_complaints_migrate`();
DROP PROCEDURE IF EXISTS `_dcms_line_complaints_migrate`;

-- ============================================================
-- หมายเหตุ:
-- - ไม่มีการเพิ่มคอลัมน์ลง complaints: เรื่องจาก LINE = source 'PUBLIC'
--   + channel_id ของ 'LINE Official Account' + citizen_id ที่ผูกกับ LINE
-- - การยอมรับประกาศความเป็นส่วนตัวใช้ citizens.consent_at เดิม (ไม่สร้างคอลัมน์ใหม่)
-- - line_conversations.draft มีข้อมูลส่วนบุคคลชั่วคราว → job ลบทิ้งเมื่อหมดอายุ
--   (ดู backend/src/jobs/lineConversationCleanupJob.js และ docs/LINE_COMPLAINTS.md §นโยบายข้อมูล)
-- ============================================================
