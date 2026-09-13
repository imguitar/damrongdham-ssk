-- ============================================================
-- Migration 05: staff agency affiliations
-- - Center roles belong to the configured center agency.
-- - The missing Dev/Demo chief account is created for role testing.
-- - Existing Dev/Demo agency accounts belong to the land office.
-- Safe to run repeatedly on an existing database.
-- ============================================================

START TRANSACTION;

UPDATE `users` u
JOIN `roles` r ON r.id = u.role_id
JOIN (
  SELECT MIN(id) AS id
  FROM `agencies`
  WHERE is_center = 1 AND is_active = 1
) center_agency ON center_agency.id IS NOT NULL
SET u.agency_id = center_agency.id
WHERE r.code IN ('super_admin', 'admin', 'officer', 'chief');

INSERT INTO `users`
  (`username`, `password_hash`, `full_name`, `email`, `role_id`, `agency_id`, `is_active`)
SELECT
  'chief1',
  '$2b$10$a.1WZoKwR98zLaSi9cN0Z..aYgTHaVWaHxAK7IbGF9nU83TlMkpGa',
  'หัวหน้าเจ้าหน้าที่ศูนย์ดำรงธรรม',
  NULL,
  r.id,
  center_agency.id,
  1
FROM `roles` r
JOIN (
  SELECT MIN(id) AS id
  FROM `agencies`
  WHERE is_center = 1 AND is_active = 1
) center_agency ON center_agency.id IS NOT NULL
WHERE r.code = 'chief'
  AND NOT EXISTS (SELECT 1 FROM `users` WHERE username = 'chief1');

UPDATE `users` u
JOIN `roles` r ON r.id = u.role_id
JOIN (
  SELECT MIN(id) AS id
  FROM `agencies`
  WHERE name = 'สำนักงานที่ดินจังหวัดศรีสะเกษ' AND is_active = 1
) land_office ON land_office.id IS NOT NULL
SET u.agency_id = land_office.id
WHERE u.username IN ('agency1', 'test_agency_head', 'test_agency_off')
  AND r.code IN ('agency_officer', 'agency_head');

COMMIT;
