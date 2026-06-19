-- ============================================================
-- Damrongdham DCMS — Database Initialization
-- Phase 2: Database Schema and Seed Data
-- ============================================================
-- 22 ตาราง + Seed Data เริ่มต้น
-- Charset : utf8mb4
-- Collation: utf8mb4_unicode_ci
-- Timezone : +07:00
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+07:00';
SET foreign_key_checks = 0;

-- ============================================================
-- DROP TABLES (reverse FK order)
-- ============================================================
DROP TABLE IF EXISTS `anonymous_reveal_logs`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `complaint_status_logs`;
DROP TABLE IF EXISTS `complaint_attachments`;
DROP TABLE IF EXISTS `complaint_updates`;
DROP TABLE IF EXISTS `complaint_assignments`;
DROP TABLE IF EXISTS `complaint_sequences`;
DROP TABLE IF EXISTS `complaints`;
DROP TABLE IF EXISTS `subdistricts`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `citizens`;
DROP TABLE IF EXISTS `districts`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `agencies`;
DROP TABLE IF EXISTS `complaint_categories`;
DROP TABLE IF EXISTS `complaint_channels`;
DROP TABLE IF EXISTS `complainant_types`;
DROP TABLE IF EXISTS `complaint_natures`;
DROP TABLE IF EXISTS `service_types`;
DROP TABLE IF EXISTS `provinces`;
DROP TABLE IF EXISTS `roles`;

-- ============================================================
-- CREATE TABLES
-- ============================================================

-- 1. roles
CREATE TABLE `roles` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `code`        VARCHAR(50)  NOT NULL,
  `name`        VARCHAR(100) NOT NULL,
  `description` TEXT,
  `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roles_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. provinces
CREATE TABLE `provinces` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(255) NOT NULL,
  `code`       VARCHAR(2),
  `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_provinces_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. service_types
CREATE TABLE `service_types` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(255) NOT NULL,
  `description` TEXT,
  `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. complaint_natures
CREATE TABLE `complaint_natures` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(255) NOT NULL,
  `description` TEXT,
  `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. complainant_types
CREATE TABLE `complainant_types` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. complaint_channels
CREATE TABLE `complaint_channels` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. complaint_categories
CREATE TABLE `complaint_categories` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(255) NOT NULL,
  `description` TEXT,
  `sla_days`    INT          NOT NULL,
  `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. agencies
CREATE TABLE `agencies` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(255) NOT NULL,
  `short_name`    VARCHAR(100),
  `contact_phone` VARCHAR(20),
  `contact_email` VARCHAR(255),
  `address`       TEXT,
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. permissions (Role-Permission Mapping)
CREATE TABLE `permissions` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `role_id`    INT          NOT NULL,
  `resource`   VARCHAR(100) NOT NULL,
  `action`     VARCHAR(50)  NOT NULL,
  `conditions` JSON,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_permissions_role` (`role_id`),
  CONSTRAINT `fk_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. districts
CREATE TABLE `districts` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `province_id` INT          NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `code`        VARCHAR(10),
  `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_districts_code` (`code`),
  KEY `idx_districts_province` (`province_id`),
  CONSTRAINT `fk_districts_province` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. citizens
CREATE TABLE `citizens` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `email`         VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name`     VARCHAR(255) NOT NULL,
  `phone`         VARCHAR(20),
  `id_card`       VARCHAR(13),
  `address`       TEXT,
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `last_login_at` DATETIME,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_citizens_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. users
CREATE TABLE `users` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name`     VARCHAR(255) NOT NULL,
  `email`         VARCHAR(255),
  `phone`         VARCHAR(20),
  `role_id`       INT          NOT NULL,
  `agency_id`     INT,
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `last_login_at` DATETIME,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role`   (`role_id`),
  KEY `idx_users_agency` (`agency_id`),
  CONSTRAINT `fk_users_role`   FOREIGN KEY (`role_id`)   REFERENCES `roles`    (`id`),
  CONSTRAINT `fk_users_agency` FOREIGN KEY (`agency_id`) REFERENCES `agencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. subdistricts
CREATE TABLE `subdistricts` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `district_id` INT          NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `code`        VARCHAR(10),
  `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subdistricts_code` (`code`),
  KEY `idx_subdistricts_district` (`district_id`),
  CONSTRAINT `fk_subdistricts_district` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. complaint_sequences (Running Number สำหรับเลขที่เรื่อง)
CREATE TABLE `complaint_sequences` (
  `id`          INT         NOT NULL AUTO_INCREMENT,
  `year_month`  VARCHAR(6)  NOT NULL,
  `last_number` INT         NOT NULL DEFAULT 0,
  `updated_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sequences_year_month` (`year_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. complaints (ตารางหลัก)
CREATE TABLE `complaints` (
  `id`                   INT              NOT NULL AUTO_INCREMENT,
  `complaint_number`     VARCHAR(20)      NOT NULL,
  `title`                VARCHAR(500)     NOT NULL,
  `description`          TEXT             NOT NULL,
  `complainant_type_id`  INT              NOT NULL,
  `complainant_name`     VARCHAR(255),
  `complainant_id_card`  VARCHAR(13),
  `complainant_phone`    VARCHAR(20)      NOT NULL,
  `complainant_address`  TEXT,
  `complainant_email`    VARCHAR(255),
  `citizen_id`           INT,
  `is_anonymous`         TINYINT(1)       NOT NULL DEFAULT 0,
  `service_type_id`      INT              NOT NULL,
  `complaint_nature_id`  INT              NOT NULL,
  `category_id`          INT,
  `channel_id`           INT              NOT NULL,
  `province_id`          INT,
  `district_id`          INT,
  `subdistrict_id`       INT,
  `postal_code`          VARCHAR(5),
  `incident_address`     TEXT,
  `latitude`             DECIMAL(10,7),
  `longitude`            DECIMAL(10,7),
  `priority`             ENUM('HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
  `status`               ENUM('NEW','SCREENING','ASSIGNED','ACCEPTED','IN_PROGRESS','RESOLVED','REVIEWING','CLOSED','REJECTED','RETURNED') NOT NULL DEFAULT 'NEW',
  `is_overdue`           TINYINT(1)       NOT NULL DEFAULT 0,
  `due_date`             DATE,
  `last_progress_at`     DATETIME,
  `escalation_level`     TINYINT          NOT NULL DEFAULT 0,
  `last_escalation_at`   DATETIME,
  `received_by`          INT,
  `source`               ENUM('STAFF','PUBLIC') NOT NULL DEFAULT 'STAFF',
  `rejection_reason`     TEXT,
  `closed_at`            DATETIME,
  `closed_by`            INT,
  `closed_summary`       TEXT,
  `created_at`           DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_complaints_number` (`complaint_number`),
  KEY `idx_complaints_status`       (`status`),
  KEY `idx_complaints_priority`     (`priority`),
  KEY `idx_complaints_due_date`     (`due_date`),
  KEY `idx_complaints_category`     (`category_id`),
  KEY `idx_complaints_district`     (`district_id`),
  KEY `idx_complaints_service_type` (`service_type_id`),
  KEY `idx_complaints_nature`       (`complaint_nature_id`),
  KEY `idx_complaints_created_at`   (`created_at`),
  KEY `idx_complaints_escalation`   (`status`, `last_progress_at`, `escalation_level`),
  CONSTRAINT `fk_complaints_complainant_type` FOREIGN KEY (`complainant_type_id`) REFERENCES `complainant_types`    (`id`),
  CONSTRAINT `fk_complaints_citizen`          FOREIGN KEY (`citizen_id`)          REFERENCES `citizens`             (`id`),
  CONSTRAINT `fk_complaints_service_type`     FOREIGN KEY (`service_type_id`)     REFERENCES `service_types`        (`id`),
  CONSTRAINT `fk_complaints_nature`           FOREIGN KEY (`complaint_nature_id`) REFERENCES `complaint_natures`    (`id`),
  CONSTRAINT `fk_complaints_category`         FOREIGN KEY (`category_id`)         REFERENCES `complaint_categories` (`id`),
  CONSTRAINT `fk_complaints_channel`          FOREIGN KEY (`channel_id`)          REFERENCES `complaint_channels`   (`id`),
  CONSTRAINT `fk_complaints_province`         FOREIGN KEY (`province_id`)         REFERENCES `provinces`            (`id`),
  CONSTRAINT `fk_complaints_district`         FOREIGN KEY (`district_id`)         REFERENCES `districts`            (`id`),
  CONSTRAINT `fk_complaints_subdistrict`      FOREIGN KEY (`subdistrict_id`)      REFERENCES `subdistricts`         (`id`),
  CONSTRAINT `fk_complaints_received_by`      FOREIGN KEY (`received_by`)         REFERENCES `users`                (`id`),
  CONSTRAINT `fk_complaints_closed_by`        FOREIGN KEY (`closed_by`)           REFERENCES `users`                (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. complaint_assignments
CREATE TABLE `complaint_assignments` (
  `id`           INT      NOT NULL AUTO_INCREMENT,
  `complaint_id` INT      NOT NULL,
  `agency_id`    INT      NOT NULL,
  `assigned_by`  INT      NOT NULL,
  `assigned_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `due_date`     DATE     NOT NULL,
  `status`       ENUM('PENDING','ACCEPTED','RETURNED') NOT NULL DEFAULT 'PENDING',
  `accepted_at`  DATETIME,
  `accepted_by`  INT,
  `return_reason` TEXT,
  `returned_at`  DATETIME,
  `note`         TEXT,
  `is_active`    TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_assignments_complaint` (`complaint_id`),
  KEY `idx_assignments_agency`    (`agency_id`),
  KEY `idx_assignments_status`    (`status`),
  CONSTRAINT `fk_assignments_complaint`   FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`),
  CONSTRAINT `fk_assignments_agency`      FOREIGN KEY (`agency_id`)    REFERENCES `agencies`   (`id`),
  CONSTRAINT `fk_assignments_assigned_by` FOREIGN KEY (`assigned_by`)  REFERENCES `users`      (`id`),
  CONSTRAINT `fk_assignments_accepted_by` FOREIGN KEY (`accepted_by`)  REFERENCES `users`      (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. complaint_updates
CREATE TABLE `complaint_updates` (
  `id`            INT      NOT NULL AUTO_INCREMENT,
  `complaint_id`  INT      NOT NULL,
  `assignment_id` INT,
  `update_type`   ENUM('PROGRESS','RESULT','REVIEW_NOTE') NOT NULL,
  `content`       TEXT     NOT NULL,
  `updated_by`    INT      NOT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_updates_complaint`  (`complaint_id`),
  KEY `idx_updates_assignment` (`assignment_id`),
  CONSTRAINT `fk_updates_complaint`  FOREIGN KEY (`complaint_id`)  REFERENCES `complaints`           (`id`),
  CONSTRAINT `fk_updates_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `complaint_assignments` (`id`),
  CONSTRAINT `fk_updates_user`       FOREIGN KEY (`updated_by`)    REFERENCES `users`                (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. complaint_attachments
CREATE TABLE `complaint_attachments` (
  `id`                  INT          NOT NULL AUTO_INCREMENT,
  `complaint_id`        INT          NOT NULL,
  `update_id`           INT,
  `file_name`           VARCHAR(255) NOT NULL,
  `file_path`           VARCHAR(500) NOT NULL,
  `file_size`           INT          NOT NULL,
  `file_type`           VARCHAR(50)  NOT NULL,
  `uploaded_by`         INT,
  `uploaded_by_citizen` INT,
  `upload_source`       ENUM('STAFF','PUBLIC') NOT NULL DEFAULT 'STAFF',
  `created_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attachments_complaint` (`complaint_id`),
  KEY `idx_attachments_update`    (`update_id`),
  CONSTRAINT `fk_attachments_complaint` FOREIGN KEY (`complaint_id`)        REFERENCES `complaints`        (`id`),
  CONSTRAINT `fk_attachments_update`    FOREIGN KEY (`update_id`)            REFERENCES `complaint_updates` (`id`),
  CONSTRAINT `fk_attachments_user`      FOREIGN KEY (`uploaded_by`)          REFERENCES `users`             (`id`),
  CONSTRAINT `fk_attachments_citizen`   FOREIGN KEY (`uploaded_by_citizen`)  REFERENCES `citizens`          (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. complaint_status_logs
CREATE TABLE `complaint_status_logs` (
  `id`           INT         NOT NULL AUTO_INCREMENT,
  `complaint_id` INT         NOT NULL,
  `from_status`  VARCHAR(20),
  `to_status`    VARCHAR(20) NOT NULL,
  `changed_by`   INT,
  `note`         TEXT,
  `created_at`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status_logs_complaint` (`complaint_id`),
  CONSTRAINT `fk_status_logs_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`),
  CONSTRAINT `fk_status_logs_user`      FOREIGN KEY (`changed_by`)   REFERENCES `users`      (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. notifications
CREATE TABLE `notifications` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `user_id`      INT          NOT NULL,
  `complaint_id` INT,
  `type`         VARCHAR(50)  NOT NULL,
  `title`        VARCHAR(255) NOT NULL,
  `message`      TEXT         NOT NULL,
  `is_read`      TINYINT(1)   NOT NULL DEFAULT 0,
  `read_at`      DATETIME,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_read`  (`user_id`, `is_read`),
  KEY `idx_notifications_complaint`  (`complaint_id`),
  CONSTRAINT `fk_notifications_user`      FOREIGN KEY (`user_id`)      REFERENCES `users`      (`id`),
  CONSTRAINT `fk_notifications_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. audit_logs
CREATE TABLE `audit_logs` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `user_id`     INT,
  `action`      VARCHAR(50)  NOT NULL,
  `resource`    VARCHAR(100) NOT NULL,
  `resource_id` INT,
  `details`     JSON,
  `ip_address`  VARCHAR(45),
  `user_agent`  VARCHAR(500),
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_resource` (`resource`, `resource_id`),
  KEY `idx_audit_user`     (`user_id`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. anonymous_reveal_logs
CREATE TABLE `anonymous_reveal_logs` (
  `id`           INT      NOT NULL AUTO_INCREMENT,
  `complaint_id` INT      NOT NULL,
  `revealed_by`  INT      NOT NULL,
  `reason`       TEXT     NOT NULL,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reveal_logs_complaint` (`complaint_id`),
  CONSTRAINT `fk_reveal_logs_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`),
  CONSTRAINT `fk_reveal_logs_user`      FOREIGN KEY (`revealed_by`)  REFERENCES `users`      (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;

-- ============================================================
-- SEED DATA
-- ============================================================

-- ─── 1. roles (8 records) ────────────────────────────────────
INSERT INTO `roles` (`code`, `name`, `description`) VALUES
  ('super_admin',    'ผู้ดูแลระบบสูงสุด',    'มีสิทธิ์ทุกอย่างในระบบ รวมถึงการตั้งค่าระบบและการเปิดเผยตัวตนเรื่อง Anonymous'),
  ('admin',          'ผู้ดูแลระบบ',           'จัดการผู้ใช้ (ยกเว้น super_admin) Master Data และดู Audit Log'),
  ('officer',        'เจ้าหน้าที่รับเรื่อง',  'รับเรื่อง คัดกรอง ส่งต่อ ตรวจผล ปิดเรื่อง'),
  ('chief',          'หัวหน้าเจ้าหน้าที่',    'เหมือน officer + เข้าถึง Dashboard/Report เต็ม'),
  ('agency_officer', 'เจ้าหน้าที่หน่วยงาน',  'เฉพาะเรื่องหน่วยงานตน: รับ/อัปเดต/ส่งผล/ส่งคืน ไม่เห็นข้อมูลส่วนบุคคลผู้ร้อง'),
  ('agency_head',    'หัวหน้าหน่วยงาน',       'เหมือน agency_officer + สรุปภาพรวมหน่วยงาน'),
  ('executive',      'ผู้บริหาร',             'Read-only: Dashboard + Report ไม่เห็นข้อมูลส่วนบุคคล'),
  ('public',         'ประชาชนทั่วไป',          'ยื่นเรื่องและติดตามสถานะด้วยเลขที่เรื่องเท่านั้น');

-- ─── 2. provinces (1 record — ศรีสะเกษ) ─────────────────────
INSERT INTO `provinces` (`name`, `code`) VALUES
  ('ศรีสะเกษ', '33');

-- ─── 3. service_types (5 records) ────────────────────────────
INSERT INTO `service_types` (`name`) VALUES
  ('ทั่วไป'),
  ('สำคัญ'),
  ('บัตรสนเท่ห์'),
  ('ผลกระทบวงกว้างต่อประชาชน/ประเด็นที่สังคมสนใจ'),
  ('นโยบายสำคัญของรัฐบาล/กระทรวงมหาดไทย');

-- ─── 4. complaint_natures (8 records) ────────────────────────
INSERT INTO `complaint_natures` (`name`) VALUES
  ('เรื่องร้องเรียนร้องทุกข์'),
  ('การให้บริการแบบเบ็ดเสร็จ'),
  ('บริการด้านข้อมูลข่าวสารของทางราชการ'),
  ('บริการให้คำปรึกษา'),
  ('บริการรับ-ส่งต่อ'),
  ('ดำเนินการตามนโยบายสำคัญของรัฐบาล'),
  ('แก้ไขปัญหาความเดือดร้อนเฉพาะหน้า'),
  ('ข้อเสนอแนะ');

-- ─── 5. complainant_types (2 records) ────────────────────────
INSERT INTO `complainant_types` (`name`) VALUES
  ('บุคคลธรรมดา'),
  ('นิติบุคคล');

-- ─── 6. complaint_channels (9 records) ───────────────────────
INSERT INTO `complaint_channels` (`name`) VALUES
  ('จดหมาย'),
  ('การลงพื้นที่ / หน่วยเคลื่อนที่เร็ว'),
  ('ตู้ราชสีห์'),
  ('สายด่วน 1567'),
  ('เข้ามารับบริการด้วยตนเอง (Walk In)'),
  ('เว็บไซต์'),
  ('แอปพลิเคชัน MOI1567'),
  ('ร้องเรียนผ่านหน่วยงานอื่น'),
  ('ช่องทางอื่น ๆ');

-- ─── 7. complaint_categories (11 records พร้อม SLA) ──────────
INSERT INTO `complaint_categories` (`name`, `sla_days`) VALUES
  ('ที่ดิน / ที่สาธารณประโยชน์',                                15),
  ('สิ่งแวดล้อม / มลพิษ (เสียง กลิ่น ฝุ่น น้ำเสีย)',            7),
  ('สาธารณูปโภค (ไฟฟ้า ประปา ถนน)',                             10),
  ('ความสงบเรียบร้อย / ความปลอดภัยในชีวิตและทรัพย์สิน',          7),
  ('ทุจริต / ประพฤติมิชอบของเจ้าหน้าที่รัฐ',                    30),
  ('ยาเสพติด / อบายมุข',                                        15),
  ('หนี้สิน / การเงินนอกระบบ',                                  15),
  ('คุ้มครองผู้บริโภค / สินค้าและบริการ',                        15),
  ('แรงงาน / สวัสดิการ',                                        15),
  ('ขอความช่วยเหลือ / สงเคราะห์ผู้เดือดร้อน',                   10),
  ('ร้องทุกข์ทั่วไป / อื่นๆ',                                   15);

-- ─── 8. agencies (10 records — หน่วยงานศรีสะเกษ) ────────────
INSERT INTO `agencies` (`name`, `short_name`) VALUES
  ('สำนักงานที่ดินจังหวัดศรีสะเกษ',                            'สนง.ที่ดิน'),
  ('สำนักงานทรัพยากรธรรมชาติและสิ่งแวดล้อมจังหวัดศรีสะเกษ',    'ทสจ.ศก.'),
  ('สำนักงานโยธาธิการและผังเมืองจังหวัดศรีสะเกษ',               'สนง.โยธาฯ'),
  ('การไฟฟ้าส่วนภูมิภาคจังหวัดศรีสะเกษ',                       'กฟภ.ศก.'),
  ('การประปาส่วนภูมิภาคสาขาศรีสะเกษ',                           'กปภ.ศก.'),
  ('ที่ทำการปกครองจังหวัดศรีสะเกษ',                             'ปค.ศก.'),
  ('สำนักงานสาธารณสุขจังหวัดศรีสะเกษ',                          'สสจ.ศก.'),
  ('ตำรวจภูธรจังหวัดศรีสะเกษ',                                  'ภ.จว.ศก.'),
  ('องค์การบริหารส่วนจังหวัดศรีสะเกษ',                          'อบจ.ศก.'),
  ('เทศบาลเมืองศรีสะเกษ',                                       'ทม.ศก.');

-- ─── 9. districts (22 อำเภอ — จังหวัดศรีสะเกษ) ──────────────
-- province_id = 1 (ศรีสะเกษ)
INSERT INTO `districts` (`province_id`, `name`, `code`) VALUES
  (1, 'เมืองศรีสะเกษ',    '3301'),
  (1, 'ยางชุมน้อย',       '3302'),
  (1, 'กันทรารมย์',       '3303'),
  (1, 'กันทรลักษ์',       '3304'),
  (1, 'ขุขันธ์',          '3305'),
  (1, 'ไพรบึง',           '3306'),
  (1, 'ปรางค์กู่',        '3307'),
  (1, 'ขุนหาญ',           '3308'),
  (1, 'ราษีไศล',          '3309'),
  (1, 'อุทุมพรพิสัย',     '3310'),
  (1, 'บึงบูรพ์',         '3311'),
  (1, 'ห้วยทับทัน',       '3312'),
  (1, 'โนนคูณ',           '3313'),
  (1, 'ศรีรัตนะ',         '3314'),
  (1, 'น้ำเกลี้ยง',       '3315'),
  (1, 'วังหิน',           '3316'),
  (1, 'ภูสิงห์',          '3317'),
  (1, 'เมืองจันทร์',      '3318'),
  (1, 'เบญจลักษ์',        '3319'),
  (1, 'พยุห์',            '3320'),
  (1, 'โพธิ์ศรีสุวรรณ',  '3321'),
  (1, 'ศิลาลาด',          '3322');

-- ─── 10. subdistricts (≈193 ตำบล — ครบทุกอำเภอ) ──────────────
-- district_id อ้างอิงจาก districts ที่ INSERT ข้างบน
-- 3301=1, 3302=2, 3303=3, 3304=4, 3305=5, 3306=6, 3307=7, 3308=8
-- 3309=9, 3310=10, 3311=11, 3312=12, 3313=13, 3314=14, 3315=15
-- 3316=16, 3317=17, 3318=18, 3319=19, 3320=20, 3321=21, 3322=22

-- อำเภอเมืองศรีสะเกษ (district_id=1) — 16 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (1, 'เมืองเหนือ', '330101'),
  (1, 'เมืองใต้',   '330102'),
  (1, 'ค้อ',        '330103'),
  (1, 'หญ้าปล้อง',  '330104'),
  (1, 'ทาม',        '330105'),
  (1, 'โพธิ์',      '330106'),
  (1, 'โพนเขวา',    '330107'),
  (1, 'หนองครก',    '330108'),
  (1, 'จาน',        '330109'),
  (1, 'โดด',        '330110'),
  (1, 'โพนข่า',     '330111'),
  (1, 'คูซอด',      '330112'),
  (1, 'น้ำคำ',      '330113'),
  (1, 'ตะดอบ',      '330114'),
  (1, 'หนองแก้ว',   '330115'),
  (1, 'หมากเขียบ',  '330116');

-- อำเภอยางชุมน้อย (district_id=2) — 5 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (2, 'ยางชุมน้อย',  '330201'),
  (2, 'ลิ้นฟ้า',    '330202'),
  (2, 'ยางชุมใหญ่',  '330203'),
  (2, 'กุดเมืองฮาม','330204'),
  (2, 'บึงบอน',     '330205');

-- อำเภอกันทรารมย์ (district_id=3) — 15 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (3, 'ดูน',        '330301'),
  (3, 'โนนสัง',     '330302'),
  (3, 'หนองหัวช้าง','330303'),
  (3, 'ยาง',        '330304'),
  (3, 'หนองแวง',    '330305'),
  (3, 'ผักแพว',     '330306'),
  (3, 'จาน',        '330307'),
  (3, 'ดู่',        '330308'),
  (3, 'หนองบัว',    '330309'),
  (3, 'ทาม',        '330310'),
  (3, 'ขะยูง',      '330311'),
  (3, 'เมืองน้อย',  '330312'),
  (3, 'บัวน้อย',    '330313'),
  (3, 'สามสวน',     '330314'),
  (3, 'กู่',        '330315');

-- อำเภอกันทรลักษ์ (district_id=4) — 20 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (4, 'บึงมะลู',    '330401'),
  (4, 'กระแชง',     '330402'),
  (4, 'บ้านแต้',    '330403'),
  (4, 'หนองหญ้าลาด','330404'),
  (4, 'กุดชุมพิบูล','330405'),
  (4, 'เสาธงชัย',   '330406'),
  (4, 'กันทรลักษ์', '330407'),
  (4, 'จันทบเพชร',  '330408'),
  (4, 'น้ำอ้อม',    '330409'),
  (4, 'ละลาย',      '330410'),
  (4, 'สังเม็ก',    '330411'),
  (4, 'ตระกาจ',     '330412'),
  (4, 'จอกอ',       '330413'),
  (4, 'หนองฝ้าย',   '330414'),
  (4, 'ทุ่งใหญ่',   '330415'),
  (4, 'ขนุน',       '330416'),
  (4, 'สวนกล้วย',   '330417'),
  (4, 'ภูเงิน',     '330418'),
  (4, 'โนนสำราญ',   '330419'),
  (4, 'ศรีแก้ว',    '330420');

-- อำเภอขุขันธ์ (district_id=5) — 17 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (5, 'ห้วยเหนือ',   '330501'),
  (5, 'ห้วยใต้',    '330502'),
  (5, 'นิคมพัฒนา',  '330503'),
  (5, 'โสน',        '330504'),
  (5, 'ปรือใหญ่',   '330505'),
  (5, 'สะอาง',      '330506'),
  (5, 'ตาอุด',      '330507'),
  (5, 'หัวเสือ',    '330508'),
  (5, 'ห้วยสำราญ',  '330509'),
  (5, 'กฤษณา',      '330510'),
  (5, 'ลมศักดิ์',   '330511'),
  (5, 'หนองฉลอง',   '330512'),
  (5, 'ศรีตระกูล',  '330513'),
  (5, 'ศรีสะอาด',   '330514'),
  (5, 'โคกเพชร',    '330515'),
  (5, 'ปราสาท',     '330516'),
  (5, 'สำโรงตาเจ็น','330517');

-- อำเภอไพรบึง (district_id=6) — 6 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (6, 'ไพรบึง',    '330601'),
  (6, 'ดินแดง',    '330602'),
  (6, 'สำโรงพลัน', '330603'),
  (6, 'สวาย',      '330604'),
  (6, 'โนนปูน',    '330605'),
  (6, 'ตูม',       '330606');

-- อำเภอปรางค์กู่ (district_id=7) — 9 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (7, 'พิมาย',        '330701'),
  (7, 'กู่',          '330702'),
  (7, 'หนองเชียงทูน', '330703'),
  (7, 'ตูม',          '330704'),
  (7, 'สมอ',          '330705'),
  (7, 'โพธิ์ศรี',     '330706'),
  (7, 'สำโรงพลัน',    '330707'),
  (7, 'หนองแสง',      '330708'),
  (7, 'ดู่',          '330709');

-- อำเภอขุนหาญ (district_id=8) — 10 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (8, 'สิ',        '330801'),
  (8, 'ห้วยจันทร์','330802'),
  (8, 'ไพร',       '330803'),
  (8, 'พราน',      '330804'),
  (8, 'โพธิ์วงศ์', '330805'),
  (8, 'ขุนหาญ',    '330806'),
  (8, 'กระหวัน',   '330807'),
  (8, 'โนนสูง',    '330808'),
  (8, 'บักดอง',    '330809'),
  (8, 'กันทรอม',   '330810');

-- อำเภอราษีไศล (district_id=9) — 16 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (9, 'เมืองคง',     '330901'),
  (9, 'เมืองแคน',   '330902'),
  (9, 'หนองแค',     '330903'),
  (9, 'หนองหมี',    '330904'),
  (9, 'จิกสังข์ทอง','330905'),
  (9, 'ด่าน',       '330906'),
  (9, 'หนองอึ่ง',   '330907'),
  (9, 'บัวหุ่ง',    '330908'),
  (9, 'ยาง',        '330909'),
  (9, 'ดู่',        '330910'),
  (9, 'ทุ่ม',       '330911'),
  (9, 'หนองแวง',    '330912'),
  (9, 'โจด',        '330913'),
  (9, 'ไผ่',        '330914'),
  (9, 'เสียว',      '330915'),
  (9, 'สร้างปี่',   '330916');

-- อำเภออุทุมพรพิสัย (district_id=10) — 16 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (10, 'กำแพง',         '331001'),
  (10, 'อี่หล่ำ',       '331002'),
  (10, 'แขม',           '331003'),
  (10, 'ทุ่งไชย',       '331004'),
  (10, 'หนองห้าง',      '331005'),
  (10, 'หนองบัวไชยวาน', '331006'),
  (10, 'สระกำแพงใหญ่',  '331007'),
  (10, 'หนองไฮ',        '331008'),
  (10, 'ขะยูง',         '331009'),
  (10, 'แต้',           '331010'),
  (10, 'แข้',           '331011'),
  (10, 'โพธิ์ชัย',      '331012'),
  (10, 'สาโรง',         '331013'),
  (10, 'หนองปลาหมอ',    '331014'),
  (10, 'ปะหลาน',        '331015'),
  (10, 'ก้านเหลือง',    '331016');

-- อำเภอบึงบูรพ์ (district_id=11) — 5 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (11, 'บึงบูรพ์',  '331101'),
  (11, 'เป๊าะ',     '331102'),
  (11, 'หนองหงส์',  '331103'),
  (11, 'โนนสำราญ',  '331104'),
  (11, 'ศรีสุข',    '331105');

-- อำเภอห้วยทับทัน (district_id=12) — 6 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (12, 'ห้วยทับทัน',  '331201'),
  (12, 'เมืองหลวง',   '331202'),
  (12, 'กล้วยกว้าง',  '331203'),
  (12, 'ผักไหม',      '331204'),
  (12, 'จานแสนไชย',   '331205'),
  (12, 'ปราสาท',      '331206');

-- อำเภอโนนคูณ (district_id=13) — 5 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (13, 'โนนคูณ',   '331301'),
  (13, 'หนองกุง',  '331302'),
  (13, 'บก',       '331303'),
  (13, 'ลิ้นฟ้า',  '331304'),
  (13, 'เหล่ากวาง','331305');

-- อำเภอศรีรัตนะ (district_id=14) — 6 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (14, 'ศรีแก้ว',   '331401'),
  (14, 'พิงพวย',    '331402'),
  (14, 'สะพุง',     '331403'),
  (14, 'ศรีโนนงาม', '331404'),
  (14, 'ตูม',       '331405'),
  (14, 'เสื่องข้าว','331406');

-- อำเภอน้ำเกลี้ยง (district_id=15) — 5 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (15, 'น้ำเกลี้ยง','331501'),
  (15, 'ละเอาะ',    '331502'),
  (15, 'ตองปิด',    '331503'),
  (15, 'เขิน',      '331504'),
  (15, 'รุ่งระวี',  '331505');

-- อำเภอวังหิน (district_id=16) — 8 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (16, 'บุสูง',    '331601'),
  (16, 'ทุ่งสว่าง','331602'),
  (16, 'วังหิน',   '331603'),
  (16, 'โพนยาง',   '331604'),
  (16, 'ดวนใหญ่',  '331605'),
  (16, 'บ่อแก้ว',  '331606'),
  (16, 'ศรีสำราญ', '331607'),
  (16, 'หนองส้าว', '331608');

-- อำเภอภูสิงห์ (district_id=17) — 5 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (17, 'โคกตาล',   '331701'),
  (17, 'ห้วยตึ๊กชู','331702'),
  (17, 'ห้วยตามอญ','331703'),
  (17, 'ดงรัก',    '331704'),
  (17, 'ตะเคียนราม','331705');

-- อำเภอเมืองจันทร์ (district_id=18) — 3 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (18, 'เมืองจันทร์','331801'),
  (18, 'ตาโกน',      '331802'),
  (18, 'หนองใหญ่',   '331803');

-- อำเภอเบญจลักษ์ (district_id=19) — 5 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (19, 'เสียว',    '331901'),
  (19, 'หนองฮาง',  '331902'),
  (19, 'บัวกาบ',   '331903'),
  (19, 'ท่าคล้อ',  '331904'),
  (19, 'โนนสำราญ', '331905');

-- อำเภอพยุห์ (district_id=20) — 5 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (20, 'พยุห์',     '332001'),
  (20, 'พรหมสวัสดิ์','332002'),
  (20, 'ตำแย',      '332003'),
  (20, 'โนนเพ็ก',   '332004'),
  (20, 'หนองค้า',   '332005');

-- อำเภอโพธิ์ศรีสุวรรณ (district_id=21) — 5 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (21, 'โดด',    '332101'),
  (21, 'เสียว',  '332102'),
  (21, 'หนองม้า','332103'),
  (21, 'ผือใหญ่','332104'),
  (21, 'อีเซ',   '332105');

-- อำเภอศิลาลาด (district_id=22) — 4 ตำบล
INSERT INTO `subdistricts` (`district_id`, `name`, `code`) VALUES
  (22, 'กุง',       '332201'),
  (22, 'คลีกลิ้ง',  '332202'),
  (22, 'หนองบัวดง', '332203'),
  (22, 'โจด',       '332204');

-- ─── 11. users — Super Admin (1 คน) ──────────────────────────
-- username: admin | password: admin123 (bcrypt rounds=10)
-- role_id=1 (super_admin) | agency_id=NULL (ศูนย์ดำรงธรรม)
INSERT INTO `users` (`username`, `password_hash`, `full_name`, `email`, `role_id`, `agency_id`) VALUES
  ('admin',
   '$2b$10$pRfTs3c3SOg32jv9QOwL.uOz5LaAeyg6TiQPUFrjhCSAFa4tCuN5q',
   'ผู้ดูแลระบบสูงสุด',
   'admin@dcms.local',
   1,
   NULL);

-- ─── 12. citizens — Test Account (Dev/Demo เท่านั้น) ─────────
-- email: citizen@example.com | password: Citizen@123 (bcrypt rounds=10)
INSERT INTO `citizens` (`email`, `password_hash`, `full_name`, `phone`) VALUES
  ('citizen@example.com',
   '$2b$10$A4ax4XFdVZzNc/TTN3KSK.PDQ2a2Tu3YkrzSXFnkBf.sOJD8EdgHu',
   'ประชาชนทดสอบ',
   '0812345678');

-- ─── หมายเหตุ ──────────────────────────────────────────────────
-- permissions: จะ seed ใน Phase 4 (Auth) เมื่อกำหนด RBAC ครบถ้วน
-- complaint_sequences: จะสร้าง record อัตโนมัติเมื่อมีเรื่องแรกในแต่ละเดือน
-- ตำบลทั้งหมด: ≈193 ตำบล (ใกล้เคียง 206 ของทางการ)
--   → ยืนยันและเติมด้วยชุดข้อมูลทางการ (กรมการปกครอง) ก่อน Go-live
