-- Tạo database
CREATE DATABASE IF NOT EXISTS uteshop
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE uteshop;

-- Bảng Users

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullName` varchar(100) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `isVerified` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_email` (`email`),
  KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Bảng OTPs
CREATE TABLE IF NOT EXISTS `otps` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `type` enum('register','forgot-password') NOT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_otps_email_type` (`email`, `type`),
  KEY `idx_otps_expires` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO `users` (`email`, `password`, `fullName`, `phone`, `address`, `isVerified`) VALUES
('admin@uteshop.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin UTEShop', '0123456789', '123 Đường ABC, Quận 1, TP.HCM', 1),
('user1@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nguyễn Văn A', '0987654321', '456 Đường XYZ, Quận 2, TP.HCM', 1),
('user2@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Trần Thị B', '0123456780', '789 Đường DEF, Quận 3, TP.HCM', 0)
ON DUPLICATE KEY UPDATE `updatedAt` = CURRENT_TIMESTAMP;

INSERT INTO `otps` (`email`, `otp`, `type`, `expiresAt`) VALUES
('user2@test.com', '123456', 'register', DATE_ADD(NOW(), INTERVAL 10 MINUTE)),
('user1@test.com', '654321', 'forgot-password', DATE_ADD(NOW(), INTERVAL 10 MINUTE))
ON DUPLICATE KEY UPDATE `expiresAt` = DATE_ADD(NOW(), INTERVAL 10 MINUTE);



-- Procedure để xóa OTP hết hạn
DELIMITER //
CREATE PROCEDURE CleanExpiredOTPs()
BEGIN
    DELETE FROM `otps` WHERE `expiresAt` < NOW();
END //
DELIMITER ;

-- Procedure để lấy thông tin user theo email
DELIMITER //
CREATE PROCEDURE GetUserByEmail(IN user_email VARCHAR(100))
BEGIN
    SELECT * FROM `users` WHERE `email` = user_email;
END //
DELIMITER ;


-- Event để tự động xóa OTP hết hạn (chạy mỗi giờ)
CREATE EVENT IF NOT EXISTS clean_expired_otps_event
ON SCHEDULE EVERY 1 HOUR
DO CALL CleanExpiredOTPs();


SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_otps FROM otps;
