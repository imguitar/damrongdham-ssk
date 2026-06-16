-- ============================================
-- Damrongdham SSK - Database Initialization
-- ไฟล์นี้จะถูกรันอัตโนมัติเมื่อสร้าง MySQL container ครั้งแรก
-- ============================================



-- ตาราง users ตัวอย่าง
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role ENUM('admin', 'teacher', 'student', 'parent') DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- เพิ่มข้อมูลตัวอย่าง
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@damrongdham.ac.th', SHA2('admin123', 256), 'ผู้ดูแลระบบ', 'admin'),
('teacher01', 'teacher01@damrongdham.ac.th', SHA2('teacher123', 256), 'ครูทดสอบ', 'teacher')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
