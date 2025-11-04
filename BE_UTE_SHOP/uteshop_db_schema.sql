-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 02, 2025 lúc 05:42 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `uteshop_db`
--

DELIMITER $$
--
-- Thủ tục
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `CleanupExpiredSessions` ()   BEGIN
    DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP AND is_revoked = FALSE;
    DELETE FROM verification_codes WHERE expires_at < CURRENT_TIMESTAMP AND is_used = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CreateOrUpdateOAuthUser` (IN `p_email` VARCHAR(255), IN `p_provider` VARCHAR(50), IN `p_provider_id` VARCHAR(255), IN `p_first_name` VARCHAR(100), IN `p_last_name` VARCHAR(100), IN `p_avatar` VARCHAR(500), IN `p_access_token` TEXT, IN `p_refresh_token` TEXT, OUT `p_user_id` INT)   BEGIN
    DECLARE v_user_exists INT;
    
    SELECT id INTO v_user_exists FROM users WHERE email = p_email LIMIT 1;
    
    IF v_user_exists IS NULL THEN
        INSERT INTO users (
            email, 
            first_name, 
            last_name, 
            avatar, 
            auth_provider, 
            provider_id,
            email_verified,
            password
        ) VALUES (
            p_email,
            p_first_name,
            p_last_name,
            p_avatar,
            p_provider,
            p_provider_id,
            TRUE,
            NULL
        );
        
        SET p_user_id = LAST_INSERT_ID();
    ELSE
        SET p_user_id = v_user_exists;
        
        UPDATE users 
        SET 
            avatar = COALESCE(p_avatar, avatar),
            last_login_at = CURRENT_TIMESTAMP
        WHERE id = p_user_id;
    END IF;
    
    INSERT INTO user_social_accounts (
        user_id,
        provider,
        provider_user_id,
        provider_email,
        provider_name,
        provider_avatar,
        access_token,
        refresh_token
    ) VALUES (
        p_user_id,
        p_provider,
        p_provider_id,
        p_email,
        CONCAT(p_first_name, ' ', p_last_name),
        p_avatar,
        p_access_token,
        p_refresh_token
    )
    ON DUPLICATE KEY UPDATE
        access_token = p_access_token,
        refresh_token = p_refresh_token,
        provider_avatar = p_avatar,
        updated_at = CURRENT_TIMESTAMP;
        
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CreateUserSession` (IN `p_user_id` INT, IN `p_session_token` VARCHAR(255), IN `p_ip_address` VARCHAR(45), IN `p_user_agent` TEXT, IN `p_expires_hours` INT)   BEGIN
    INSERT INTO user_sessions (
        user_id,
        session_token,
        ip_address,
        user_agent,
        expires_at
    ) VALUES (
        p_user_id,
        p_session_token,
        p_ip_address,
        p_user_agent,
        DATE_ADD(CURRENT_TIMESTAMP, INTERVAL p_expires_hours HOUR)
    );
    
    UPDATE users 
    SET 
        last_login_at = CURRENT_TIMESTAMP,
        last_login_ip = p_ip_address
    WHERE id = p_user_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetOrderStatistics` (IN `p_start_date` DATE, IN `p_end_date` DATE)   BEGIN
    SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value
    FROM orders 
    WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetProductsByCategory` (IN `p_category_id` INT, IN `p_limit_count` INT)   BEGIN
    SELECT * FROM v_product_details 
    WHERE category_id = p_category_id 
    AND is_active = TRUE 
    ORDER BY created_at DESC 
    LIMIT p_limit_count;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `UpdateProductStock` (IN `p_product_id` INT, IN `p_quantity_change` INT)   BEGIN
    UPDATE products 
    SET stock_quantity = stock_quantity + p_quantity_change 
    WHERE id = p_product_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `update_payment_status` (IN `p_transaction_id` INT, IN `p_status` VARCHAR(20), IN `p_paid_at` DATETIME)   BEGIN
  DECLARE v_order_id INT;
  DECLARE v_payment_status VARCHAR(20);
  
  -- Cập nhật payment transaction
  UPDATE payment_transactions 
  SET 
    status = p_status,
    paid_at = p_paid_at,
    updated_at = NOW()
  WHERE id = p_transaction_id;
  
  -- Lấy order_id
  SELECT order_id INTO v_order_id 
  FROM payment_transactions 
  WHERE id = p_transaction_id;
  
  -- Xác định payment_status cho order
  CASE p_status
    WHEN 'completed' THEN SET v_payment_status = 'paid';
    WHEN 'failed' THEN SET v_payment_status = 'failed';
    WHEN 'cancelled' THEN SET v_payment_status = 'cancelled';
    WHEN 'refunded' THEN SET v_payment_status = 'refunded';
    ELSE SET v_payment_status = 'pending';
  END CASE;
  
  -- Cập nhật order
  UPDATE orders 
  SET 
    payment_status = v_payment_status,
    updated_at = NOW()
  WHERE id = v_order_id;
  
  -- Nếu thanh toán thành công, cập nhật order status
  -- status_id = 1 là pending, status_id = 2 là processing
  IF p_status = 'completed' THEN
    UPDATE orders 
    SET status_id = 2
    WHERE id = v_order_id AND status_id = 1;
  END IF;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `banners`
--

CREATE TABLE `banners` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) NOT NULL,
  `mobile_image_url` varchar(500) DEFAULT NULL,
  `link_url` varchar(500) DEFAULT NULL,
  `button_text` varchar(100) DEFAULT NULL,
  `position` enum('hero','middle','sidebar','footer') DEFAULT 'hero',
  `display_order` int(11) DEFAULT 0,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `banners`
--

INSERT INTO `banners` (`id`, `title`, `subtitle`, `description`, `image_url`, `mobile_image_url`, `link_url`, `button_text`, `position`, `display_order`, `start_date`, `end_date`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Summer Collection 2025', 'Bộ sưu tập hè', 'Khám phá những xu hướng thời trang mới nhất cho mùa hè năm nay', 'https://thumbs.dreamstime.com/b/summer-collection-special-offer-flowers-leaves-vector-concept-fashion-logo-rose-discount-banner-sale-poster-design-350271445.jpg', NULL, '/shop-default?season=summer', 'Mua ngay', 'hero', 1, NULL, NULL, 1, '2025-10-31 09:50:41', '2025-11-02 13:47:20'),
(2, 'Flash Sale 50%', 'Giảm giá sốc', 'Giảm giá lên đến 50% cho tất cả sản phẩm', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTU6Is8iQiprvO8aTYA-6aofu66v4F-k18cVQ&s', NULL, '/shop-default?is_sale=true', 'Xem ngay', 'hero', 2, NULL, NULL, 1, '2025-10-31 09:50:41', '2025-11-02 13:47:51'),
(3, 'New Arrivals', 'Hàng mới về', 'Cập nhật những sản phẩm mới nhất', 'https://t3.ftcdn.net/jpg/04/32/74/66/360_F_432746600_s540j7iYFQGgTlCYkJmpeiZXgYT6pvmY.jpg', NULL, '/shop-default?is_new=true', 'Khám phá', 'middle', 1, NULL, NULL, 1, '2025-10-31 09:50:41', '2025-11-02 13:48:23'),
(4, 'Men Fashion', 'Thời trang nam', 'Phong cách lịch lãm cho phái mạnh', 'https://i.pinimg.com/736x/94/50/ed/9450edc9e2da48e07031c79b8f725010.jpg', NULL, '/shop-default?gender=male', 'Xem thêm', 'sidebar', 1, NULL, NULL, 1, '2025-10-31 09:50:41', '2025-11-02 13:48:47'),
(5, 'Women Fashion', 'Thời trang nữ', 'Quyến rũ và thanh lịch', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDb1AILmNr7ph7C0uoz5rFI3g0uTQB3ahLlQ&s', NULL, '/shop-default?gender=female', 'Xem thêm', 'sidebar', 2, NULL, NULL, 1, '2025-10-31 09:50:41', '2025-11-02 13:49:24');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `blog_categories`
--

CREATE TABLE `blog_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `blog_categories`
--

INSERT INTO `blog_categories` (`id`, `name`, `slug`, `description`, `image`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Thời trang', 'thoi-trang-blog', 'Tin tức và xu hướng thời trang', NULL, 1, '2025-10-31 09:50:06', '2025-10-31 09:50:06'),
(2, 'Lifestyle', 'lifestyle', 'Phong cách sống', NULL, 1, '2025-10-31 09:50:06', '2025-10-31 09:50:06'),
(3, 'Tips & Tricks', 'tips-tricks', 'Mẹo vặt và hướng dẫn', NULL, 1, '2025-10-31 09:50:06', '2025-10-31 09:50:06');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `blog_posts`
--

CREATE TABLE `blog_posts` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` text DEFAULT NULL,
  `content` longtext NOT NULL,
  `featured_image` varchar(500) DEFAULT NULL,
  `author_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `status` enum('draft','published','archived') DEFAULT 'draft',
  `is_featured` tinyint(1) DEFAULT 0,
  `view_count` int(11) DEFAULT 0,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `blog_posts`
--

INSERT INTO `blog_posts` (`id`, `title`, `slug`, `excerpt`, `content`, `featured_image`, `author_id`, `category_id`, `status`, `is_featured`, `view_count`, `meta_title`, `meta_description`, `published_at`, `created_at`, `updated_at`) VALUES
(1, 'Xu hướng thời trang mùa hè 2024', 'xuhuong-thoitrang-muahe-2024', 'Khám phá những xu hướng thời trang hot nhất mùa hè 2024', '<p>Mùa hè 2024 đã đến với những xu hướng thời trang mới mẻ và thú vị...</p>', NULL, 1, 1, 'published', 1, 150, NULL, NULL, '2024-06-01 03:00:00', '2025-10-31 09:50:06', '2025-10-31 09:50:06');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `blog_post_tags`
--

CREATE TABLE `blog_post_tags` (
  `post_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `blog_tags`
--

CREATE TABLE `blog_tags` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `brands`
--

CREATE TABLE `brands` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `brands`
--

INSERT INTO `brands` (`id`, `name`, `slug`, `logo`, `description`, `website`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'Nike', 'nike', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnF2KeAA-v3OlfoK3SQezNBvJRkdwTwka2bQ&s', 'Thương hiệu thể thao hàng đầu thế giới', 'https://nike.com', 1, 1, '2025-10-31 09:50:06', '2025-11-02 12:12:30'),
(2, 'Adidas', 'adidas', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_PzzsyP7iKBqQTn6tVh4UaJocmJIdDK0KqQ&s', 'Thương hiệu thể thao Đức', 'https://adidas.com', 1, 2, '2025-10-31 09:50:06', '2025-11-02 12:12:49'),
(3, 'Zara', 'zara', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgC-wTAtsTVlxdq5TedHZLZUAZ6se3Q0Me5Q&s', 'Thời trang nhanh từ Tây Ban Nha', 'https://zara.com', 1, 3, '2025-10-31 09:50:06', '2025-11-02 12:13:03'),
(4, 'H&M', 'hm', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQN9I5PIQnLLQjw8gYk2P4lecK46bzW6Ecbg&s', 'Thời trang giá rẻ từ Thụy Điển', 'https://hm.com', 1, 4, '2025-10-31 09:50:06', '2025-11-02 12:13:16'),
(5, 'Uniqlo', 'uniqlo', 'https://tl.vhv.rs/dpng/s/63-633302_uniqlo-logo-white-png-transparent-png.png', 'Thời trang cơ bản từ Nhật Bản', 'https://uniqlo.com', 1, 5, '2025-10-31 09:50:06', '2025-11-02 12:13:36'),
(7, 'Vans', 'vans', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7RHEsqp0WZsz7yVkj3Z1F7arSATtCDsatAA&s', 'Off The Wall - Giày thể thao và thời trang', 'https://www.vans.com', 1, 7, '2025-11-02 11:56:06', '2025-11-02 12:13:53'),
(8, 'Converse', 'converse', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUXj6AYKjQbvMfU1ZZgTluTJvej5OPjoVYzA&s', 'Made By You - Giày sneaker cổ điển', 'https://www.converse.com', 1, 8, '2025-11-02 11:56:06', '2025-11-02 12:14:19');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `selected_color` varchar(100) DEFAULT NULL,
  `selected_size` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `cart_items`
--

INSERT INTO `cart_items` (`id`, `user_id`, `product_id`, `quantity`, `selected_color`, `selected_size`, `price`, `created_at`, `updated_at`) VALUES
(3, 7, 1, 2, 'Đỏ', 'L', 280000.00, '2025-11-01 04:04:06', '2025-11-01 04:04:06');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `gender` enum('male','female','unisex','all') DEFAULT 'all',
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image`, `parent_id`, `gender`, `sort_order`, `is_active`, `meta_title`, `meta_description`, `created_at`, `updated_at`) VALUES
(1, 'Thời trang', 'thoi-trang', 'Quần áo thời trang cho mọi lứa tuổi', 'https://cdn-i.doisongphapluat.com.vn/resize/th/upload/2024/07/25/5-trang-phuc-phu-hop-voi-moi-lua-tuoi-12542333.jpg', NULL, 'all', 1, 1, NULL, NULL, '2025-10-31 09:50:06', '2025-11-02 12:05:00'),
(2, 'Nam', 'nam', 'Thời trang nam', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTocpdIkbuZDkuOiQzVEhJbdmDRSsWsIMUaIA&s', 1, 'all', 1, 1, NULL, NULL, '2025-10-31 09:50:06', '2025-11-02 12:05:24'),
(3, 'Nữ', 'nu', 'Thời trang nữ', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQM9qHGv7o5HYYv7mLVjqJhDo1MFLkueCxu8A&s', 1, 'all', 2, 1, NULL, NULL, '2025-10-31 09:50:06', '2025-11-02 12:05:44'),
(4, 'Trẻ em', 'tre-em', 'Thời trang trẻ em', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzBFF9P0fb4174tiDjxDjJ62ejQftCMY0FPw&s', 1, 'all', 3, 1, NULL, NULL, '2025-10-31 09:50:06', '2025-11-02 12:06:44'),
(5, 'Phụ kiện', 'phu-kien', 'Phụ kiện thời trang', 'https://thostore.com/uploads/images/kinh-doanh-phu-kien-thoi-trang-lay-hang-o-dau-2.png', NULL, 'all', 2, 1, NULL, NULL, '2025-10-31 09:50:06', '2025-11-02 12:08:46'),
(6, 'Giày dép', 'giay-dep', 'Giày dép nam nữ', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRxOGOOLQAcebCmfVsz5K04m-spGijrz9PjA&s', NULL, 'all', 3, 1, NULL, NULL, '2025-10-31 09:50:06', '2025-11-02 12:09:08'),
(7, 'Áo thun', 'ao-thun-nam', 'Áo thun nam', 'https://product.hstatic.net/200000404243/product/a2mn438r2-cnma159-2410-n__1__e07e89fa83224938a77506f0816374e5.jpg', 2, 'all', 1, 1, NULL, NULL, '2025-10-31 09:50:06', '2025-11-02 12:09:35'),
(8, 'Áo sơ mi', 'ao-so-mi-nam', 'Áo sơ mi nam', 'https://product.hstatic.net/200000588671/product/ao-so-mi-nam-bycotton-trang-art-nhan_8ec622a241ea4deb93a02bdbdcb87954.jpg', 2, 'all', 2, 1, NULL, NULL, '2025-10-31 09:50:06', '2025-11-02 12:09:51'),
(9, 'Váy', 'vay', 'Váy nữ', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZHDQC-KY4QroUoMfrg4VMjK8QKHM5yjHPUkfzHSQcY2N6q8F6wuQgQhFZRp3lOnp8Jb4&usqp=CAU', 3, 'all', 1, 1, NULL, NULL, '2025-10-31 09:50:06', '2025-11-02 12:10:45'),
(10, 'Áo thun nữ', 'ao-thun-nu', 'Áo thun nữ', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTFJM0dB_MrURCrdEcrfKnFEM_V7OUTa9wzpDYNUESrgiFnMV0uF95Ay3EGsE0ORmKS6E&usqp=CAU', 3, 'all', 2, 1, NULL, NULL, '2025-10-31 09:50:06', '2025-11-02 12:11:21');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` enum('new','read','replied','closed') DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `coupons`
--

CREATE TABLE `coupons` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('percentage','fixed') NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `minimum_amount` decimal(10,2) DEFAULT 0.00,
  `maximum_discount` decimal(10,2) DEFAULT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `used_count` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `starts_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expires_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `coupons`
--

INSERT INTO `coupons` (`id`, `code`, `name`, `description`, `type`, `value`, `minimum_amount`, `maximum_discount`, `usage_limit`, `used_count`, `is_active`, `starts_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'WELCOME10', 'Giảm 10% cho khách hàng mới', 'Giảm 10% cho đơn hàng đầu tiên', 'percentage', 10.00, 500000.00, NULL, 100, 0, 1, '2023-12-31 17:00:00', '2024-12-31 16:59:59', '2025-10-31 09:50:06', '2025-10-31 09:50:06'),
(2, 'SUMMER20', 'Giảm 20% mùa hè', 'Giảm 20% cho tất cả sản phẩm mùa hè', 'percentage', 20.00, 1000000.00, NULL, 50, 0, 1, '2024-05-31 17:00:00', '2024-08-31 16:59:59', '2025-10-31 09:50:06', '2025-10-31 09:50:06');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `coupon_usage`
--

CREATE TABLE `coupon_usage` (
  `id` int(11) NOT NULL,
  `coupon_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `login_history`
--

CREATE TABLE `login_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `login_method` enum('local','google','facebook','apple','twitter','github') NOT NULL,
  `status` enum('success','failed','blocked') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `device_type` varchar(50) DEFAULT NULL,
  `browser` varchar(50) DEFAULT NULL,
  `os` varchar(50) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `failure_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `login_history`
--

INSERT INTO `login_history` (`id`, `user_id`, `login_method`, `status`, `ip_address`, `user_agent`, `device_type`, `browser`, `os`, `location`, `failure_reason`, `created_at`) VALUES
(1, 7, 'local', 'success', '::ffff:127.0.0.1', 'vscode-restclient', NULL, NULL, NULL, NULL, NULL, '2025-11-01 03:56:43'),
(2, 1, 'local', 'success', '::ffff:127.0.0.1', 'vscode-restclient', NULL, NULL, NULL, NULL, NULL, '2025-11-01 04:49:49'),
(3, 1, 'local', 'success', '::ffff:127.0.0.1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-01 04:50:22'),
(4, 1, 'local', 'success', '::ffff:127.0.0.1', 'vscode-restclient', NULL, NULL, NULL, NULL, NULL, '2025-11-01 04:50:22'),
(5, 7, 'local', 'success', '::1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-01 06:07:07'),
(6, 7, 'local', 'success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', NULL, NULL, NULL, NULL, NULL, '2025-11-01 06:07:07'),
(7, 8, 'local', 'success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', NULL, NULL, NULL, NULL, NULL, '2025-11-01 06:11:50'),
(8, 8, 'local', 'success', '::1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-01 06:12:02'),
(9, 8, 'local', 'success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', NULL, NULL, NULL, NULL, NULL, '2025-11-01 06:12:02'),
(10, 8, 'local', 'success', '::1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-01 06:29:42'),
(11, 8, 'local', 'success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', NULL, NULL, NULL, NULL, NULL, '2025-11-01 06:29:42'),
(12, 8, 'local', 'success', '::1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-01 06:33:17'),
(13, 8, 'local', 'success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', NULL, NULL, NULL, NULL, NULL, '2025-11-01 06:33:17'),
(14, 1, 'local', 'success', '::ffff:127.0.0.1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-01 07:46:56'),
(15, 1, 'local', 'success', '::ffff:127.0.0.1', 'vscode-restclient', NULL, NULL, NULL, NULL, NULL, '2025-11-01 07:46:56'),
(16, 1, 'local', 'success', '::ffff:127.0.0.1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-01 08:04:43'),
(17, 1, 'local', 'success', '::ffff:127.0.0.1', 'vscode-restclient', NULL, NULL, NULL, NULL, NULL, '2025-11-01 08:04:43'),
(18, 8, 'local', 'success', '::1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-01 16:43:20'),
(19, 8, 'local', 'success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, NULL, NULL, NULL, NULL, '2025-11-01 16:43:20'),
(20, 8, 'local', 'success', '::1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-01 16:43:29'),
(21, 8, 'local', 'success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, NULL, NULL, NULL, NULL, '2025-11-01 16:43:29'),
(22, 8, 'local', 'success', '::1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-02 14:06:57'),
(23, 8, 'local', 'success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, NULL, NULL, NULL, NULL, '2025-11-02 14:06:57'),
(24, 8, 'local', 'success', '::1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-02 14:21:53'),
(25, 8, 'local', 'success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, NULL, NULL, NULL, NULL, '2025-11-02 14:21:53'),
(26, 8, 'local', 'success', '::1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-02 14:26:56'),
(27, 8, 'local', 'success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, NULL, NULL, NULL, NULL, '2025-11-02 14:26:56'),
(28, 8, 'local', 'success', '::1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-02 14:27:15'),
(29, 8, 'local', 'success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, NULL, NULL, NULL, NULL, '2025-11-02 14:27:15'),
(30, 8, 'local', 'success', '::1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-02 14:27:29'),
(31, 8, 'local', 'success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, NULL, NULL, NULL, NULL, '2025-11-02 14:27:29'),
(32, 8, 'local', 'success', '::1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-02 14:30:46'),
(33, 8, 'local', 'success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, NULL, NULL, NULL, NULL, '2025-11-02 14:30:46'),
(34, 8, 'local', 'success', '::1', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-02 14:42:57'),
(35, 8, 'local', 'success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, NULL, NULL, NULL, NULL, '2025-11-02 14:42:57');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `oauth_providers`
--

CREATE TABLE `oauth_providers` (
  `id` int(11) NOT NULL,
  `provider_name` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `client_id` varchar(255) NOT NULL,
  `client_secret` varchar(255) NOT NULL,
  `redirect_uri` varchar(500) NOT NULL,
  `authorization_url` varchar(500) NOT NULL,
  `token_url` varchar(500) NOT NULL,
  `user_info_url` varchar(500) NOT NULL,
  `scope` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `oauth_providers`
--

INSERT INTO `oauth_providers` (`id`, `provider_name`, `display_name`, `client_id`, `client_secret`, `redirect_uri`, `authorization_url`, `token_url`, `user_info_url`, `scope`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'google', 'Google', 'YOUR_GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_SECRET', 'http://localhost:3000/auth/google/callback', 'https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', 'https://www.googleapis.com/oauth2/v2/userinfo', 'openid profile email', 1, '2025-10-31 09:50:06', '2025-10-31 09:50:06'),
(2, 'facebook', 'Facebook', 'YOUR_FACEBOOK_APP_ID', 'YOUR_FACEBOOK_APP_SECRET', 'http://localhost:3000/auth/facebook/callback', 'https://www.facebook.com/v12.0/dialog/oauth', 'https://graph.facebook.com/v12.0/oauth/access_token', 'https://graph.facebook.com/me?fields=id,name,email,picture', 'email,public_profile', 1, '2025-10-31 09:50:06', '2025-10-31 09:50:06'),
(3, 'apple', 'Apple', 'YOUR_APPLE_CLIENT_ID', 'YOUR_APPLE_CLIENT_SECRET', 'http://localhost:3000/auth/apple/callback', 'https://appleid.apple.com/auth/authorize', 'https://appleid.apple.com/auth/token', 'https://appleid.apple.com/auth/userinfo', 'name email', 1, '2025-10-31 09:50:06', '2025-10-31 09:50:06');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `shipping_amount` decimal(10,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` enum('credit_card','debit_card','paypal','bank_transfer','cod','payos') NOT NULL,
  `payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `shipping_address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`shipping_address`)),
  `billing_address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`billing_address`)),
  `notes` text DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `shipped_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `user_id`, `status_id`, `subtotal`, `tax_amount`, `shipping_amount`, `discount_amount`, `total_amount`, `payment_method`, `payment_status`, `shipping_address`, `billing_address`, `notes`, `tracking_number`, `shipped_at`, `delivered_at`, `created_at`, `updated_at`) VALUES
(1, 'UTE-2024-001', 2, 4, 630000.00, 63000.00, 50000.00, 0.00, 743000.00, 'cod', 'paid', '{\"full_name\":\"Nguyễn Văn A\",\"phone\":\"0987654321\",\"address\":\"123 Đường ABC\",\"city\":\"Hồ Chí Minh\",\"state\":\"TP.HCM\",\"postal_code\":\"700000\",\"country\":\"Việt Nam\"}', '{\"full_name\":\"Nguyễn Văn A\",\"phone\":\"0987654321\",\"address\":\"123 Đường ABC\",\"city\":\"Hồ Chí Minh\",\"state\":\"TP.HCM\",\"postal_code\":\"700000\",\"country\":\"Việt Nam\"}', NULL, NULL, NULL, NULL, '2025-10-31 09:50:06', '2025-10-31 09:50:06'),
(2, 'UTE-2024-002', 4, 3, 760000.00, 76000.00, 50000.00, 0.00, 886000.00, 'credit_card', 'paid', '{\"full_name\":\"John Smith\",\"phone\":\"0901234567\",\"address\":\"123 Google Street\",\"city\":\"Hồ Chí Minh\",\"state\":\"TP.HCM\",\"postal_code\":\"700000\",\"country\":\"Việt Nam\"}', '{\"full_name\":\"John Smith\",\"phone\":\"0901234567\",\"address\":\"123 Google Street\",\"city\":\"Hồ Chí Minh\",\"state\":\"TP.HCM\",\"postal_code\":\"700000\",\"country\":\"Việt Nam\"}', NULL, NULL, NULL, NULL, '2025-10-31 09:50:06', '2025-10-31 09:50:06'),
(3, 'UTE-2025-000003', 7, 1, 1010000.00, 101000.00, 0.00, 0.00, 1111000.00, '', 'pending', '{\"full_name\":\"Nguyễn Ngọc Huy\",\"phone\":\"0327793283\",\"address\":\"123 Đường ABC\",\"ward\":\"Phường 1\",\"district\":\"Quận 1\",\"city\":\"Hồ Chí Minh\",\"postal_code\":\"70000\"}', '{\"full_name\":\"Nguyễn Ngọc Huy\",\"phone\":\"0327793283\",\"address\":\"123 Đường ABC\",\"ward\":\"Phường 1\",\"district\":\"Quận 1\",\"city\":\"Hồ Chí Minh\",\"postal_code\":\"70000\"}', 'Giao hàng trong giờ hành chính', NULL, NULL, NULL, '2025-11-01 04:04:20', '2025-11-01 04:04:20'),
(4, 'UTE-2025-000004', 7, 1, 1010000.00, 101000.00, 0.00, 0.00, 1111000.00, 'payos', 'pending', '{\"full_name\":\"Nguyễn Ngọc Huy\",\"phone\":\"0327793283\",\"address\":\"123 Đường ABC\",\"ward\":\"Phường 1\",\"district\":\"Quận 1\",\"city\":\"Hồ Chí Minh\",\"postal_code\":\"70000\"}', '{\"full_name\":\"Nguyễn Ngọc Huy\",\"phone\":\"0327793283\",\"address\":\"123 Đường ABC\",\"ward\":\"Phường 1\",\"district\":\"Quận 1\",\"city\":\"Hồ Chí Minh\",\"postal_code\":\"70000\"}', 'Giao hàng trong giờ hành chính', NULL, NULL, NULL, '2025-11-01 04:16:28', '2025-11-01 04:23:47'),
(5, 'UTE-2025-000005', 7, 1, 1010000.00, 101000.00, 0.00, 0.00, 1111000.00, 'payos', 'pending', '{\"full_name\":\"Nguyễn Ngọc Huy\",\"phone\":\"0327793283\",\"address\":\"123 Đường ABC\",\"ward\":\"Phường 1\",\"district\":\"Quận 1\",\"city\":\"Hồ Chí Minh\",\"postal_code\":\"70000\"}', '{\"full_name\":\"Nguyễn Ngọc Huy\",\"phone\":\"0327793283\",\"address\":\"123 Đường ABC\",\"ward\":\"Phường 1\",\"district\":\"Quận 1\",\"city\":\"Hồ Chí Minh\",\"postal_code\":\"70000\"}', 'Giao hàng trong giờ hành chính', NULL, NULL, NULL, '2025-11-01 04:27:20', '2025-11-01 05:48:50');

--
-- Bẫy `orders`
--
DELIMITER $$
CREATE TRIGGER `update_orders_updated_at` BEFORE UPDATE ON `orders` FOR EACH ROW BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_sku` varchar(100) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `selected_color` varchar(100) DEFAULT NULL,
  `selected_size` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `product_sku`, `quantity`, `unit_price`, `total_price`, `selected_color`, `selected_size`, `created_at`) VALUES
(1, 1, 1, 'Áo thun nam Nike Dri-FIT', 'NKE-AT-001', 2, 280000.00, 560000.00, 'Đen', 'M', '2025-10-31 09:50:06'),
(2, 2, 1, 'Áo thun nam Nike Dri-FIT', 'NKE-AT-001', 2, 280000.00, 560000.00, 'Đen', 'M', '2025-10-31 09:50:06'),
(3, 2, 4, 'Áo thun nữ Uniqlo UT', 'UNQ-ATN-001', 1, 160000.00, 160000.00, 'Trắng', 'S', '2025-10-31 09:50:06'),
(4, 3, 1, 'Áo thun nam Nike Dri-FIT', 'NKE-AT-001', 2, 280000.00, 560000.00, 'Đỏ', 'L', '2025-11-01 04:04:20'),
(5, 3, 2, 'Áo sơ mi nam Zara Basic', 'ZRA-AS-001', 1, 450000.00, 450000.00, 'Xanh', 'M', '2025-11-01 04:04:20'),
(6, 4, 1, 'Áo thun nam Nike Dri-FIT', 'NKE-AT-001', 2, 280000.00, 560000.00, 'Đỏ', 'L', '2025-11-01 04:16:28'),
(7, 4, 2, 'Áo sơ mi nam Zara Basic', 'ZRA-AS-001', 1, 450000.00, 450000.00, 'Xanh', 'M', '2025-11-01 04:16:28'),
(8, 5, 1, 'Áo thun nam Nike Dri-FIT', 'NKE-AT-001', 2, 280000.00, 560000.00, 'Đỏ', 'L', '2025-11-01 04:27:20'),
(9, 5, 2, 'Áo sơ mi nam Zara Basic', 'ZRA-AS-001', 1, 450000.00, 450000.00, 'Xanh', 'M', '2025-11-01 04:27:20');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_statuses`
--

CREATE TABLE `order_statuses` (
  `id` int(11) NOT NULL,
  `status_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_statuses`
--

INSERT INTO `order_statuses` (`id`, `status_name`, `description`, `color`, `created_at`) VALUES
(1, 'pending', 'Chờ xử lý', '#ffc107', '2025-10-31 09:50:06'),
(2, 'processing', 'Đang xử lý', '#17a2b8', '2025-10-31 09:50:06'),
(3, 'shipped', 'Đã gửi hàng', '#28a745', '2025-10-31 09:50:06'),
(4, 'delivered', 'Đã giao hàng', '#6c757d', '2025-10-31 09:50:06'),
(5, 'cancelled', 'Đã hủy', '#dc3545', '2025-10-31 09:50:06'),
(6, 'returned', 'Đã trả hàng', '#fd7e14', '2025-10-31 09:50:06');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_status_history`
--

CREATE TABLE `order_status_history` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `page_views`
--

CREATE TABLE `page_views` (
  `id` int(11) NOT NULL,
  `page_url` varchar(500) NOT NULL,
  `page_type` enum('product','category','blog','home','other') NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `referrer` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc đóng vai cho view `payment_details_view`
-- (See below for the actual view)
--
CREATE TABLE `payment_details_view` (
`transaction_id` int(11)
,`payos_transaction_id` varchar(100)
,`payos_order_code` varchar(100)
,`amount` decimal(10,2)
,`currency` varchar(10)
,`payment_method` enum('payos','cod','bank_transfer')
,`payment_status` enum('pending','processing','completed','failed','cancelled','refunded')
,`paid_at` datetime
,`transaction_created_at` timestamp
,`order_id` int(11)
,`order_number` varchar(50)
,`order_status_id` int(11)
,`order_status` varchar(50)
,`order_status_color` varchar(20)
,`order_total` decimal(10,2)
,`order_payment_status` enum('pending','paid','failed','refunded')
,`user_id` int(11)
,`user_email` varchar(255)
,`user_name` varchar(201)
,`refund_count` bigint(21)
,`total_refunded` decimal(32,2)
);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payment_refunds`
--

CREATE TABLE `payment_refunds` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `refund_amount` decimal(10,2) NOT NULL,
  `reason` text DEFAULT NULL,
  `payos_refund_id` varchar(100) DEFAULT NULL,
  `status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `processed_by` int(11) DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payment_transactions`
--

CREATE TABLE `payment_transactions` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `payos_transaction_id` varchar(100) DEFAULT NULL,
  `payos_order_code` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'VND',
  `payment_method` enum('payos','cod','bank_transfer') DEFAULT 'payos',
  `status` enum('pending','processing','completed','failed','cancelled','refunded') DEFAULT 'pending',
  `payment_url` text DEFAULT NULL,
  `qr_code_url` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `bank_code` varchar(50) DEFAULT NULL,
  `bank_account` varchar(100) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `expired_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `payment_transactions`
--

INSERT INTO `payment_transactions` (`id`, `order_id`, `user_id`, `payos_transaction_id`, `payos_order_code`, `amount`, `currency`, `payment_method`, `status`, `payment_url`, `qr_code_url`, `description`, `bank_code`, `bank_account`, `paid_at`, `expired_at`, `created_at`, `updated_at`) VALUES
(1, 5, 7, 'aeece6e8a0ac463786cb089ddab49fd8', '1976129824', 1111000.00, 'VND', 'payos', 'pending', 'https://pay.payos.vn/web/aeece6e8a0ac463786cb089ddab49fd8', '00020101021238570010A000000727012700069704220113VQRQAFAZQ77510208QRIBFTTA5303704540711110005802VN62260822Don hang UTE20250000056304F120', 'Don hang UTE-2025-000005', NULL, NULL, NULL, '2025-11-01 13:18:49', '2025-11-01 05:48:50', '2025-11-01 05:48:50');

--
-- Bẫy `payment_transactions`
--
DELIMITER $$
CREATE TRIGGER `payment_transaction_log` AFTER UPDATE ON `payment_transactions` FOR EACH ROW BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO payment_webhooks (
      transaction_id,
      event_type,
      payload,
      created_at
    ) VALUES (
      NEW.id,
      CONCAT('status_change_', OLD.status, '_to_', NEW.status),
      JSON_OBJECT('old_status', OLD.status, 'new_status', NEW.status),
      NOW()
    );
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payment_webhooks`
--

CREATE TABLE `payment_webhooks` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) DEFAULT NULL,
  `event_type` varchar(50) DEFAULT NULL,
  `payos_transaction_id` varchar(100) DEFAULT NULL,
  `order_code` varchar(100) DEFAULT NULL,
  `payload` text DEFAULT NULL,
  `signature` varchar(255) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `response_status` int(11) DEFAULT NULL,
  `response_message` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `short_description` text DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `sale_price` decimal(10,2) DEFAULT NULL,
  `cost_price` decimal(10,2) DEFAULT NULL,
  `stock_quantity` int(11) DEFAULT 0,
  `min_stock_level` int(11) DEFAULT 5,
  `weight` decimal(8,2) DEFAULT NULL,
  `dimensions` varchar(100) DEFAULT NULL,
  `category_id` int(11) NOT NULL,
  `gender` enum('male','female','unisex') DEFAULT 'unisex',
  `season` enum('spring','summer','fall','winter','all') DEFAULT 'all',
  `brand_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_featured` tinyint(1) DEFAULT 0,
  `is_trending` tinyint(1) DEFAULT 0,
  `is_bestseller` tinyint(1) DEFAULT 0,
  `is_new` tinyint(1) DEFAULT 0,
  `is_sale` tinyint(1) DEFAULT 0,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `view_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `products`
--

INSERT INTO `products` (`id`, `name`, `slug`, `description`, `short_description`, `sku`, `price`, `sale_price`, `cost_price`, `stock_quantity`, `min_stock_level`, `weight`, `dimensions`, `category_id`, `gender`, `season`, `brand_id`, `is_active`, `is_featured`, `is_trending`, `is_bestseller`, `is_new`, `is_sale`, `meta_title`, `meta_description`, `view_count`, `created_at`, `updated_at`) VALUES
(1, 'Áo thun nam Nike Dri-FIT', 'ao-thun-nam-nike-dri-fit', 'Áo thun thể thao nam với công nghệ Dri-FIT thấm hút mồ hôi', 'Áo thun thể thao cao cấp', 'NKE-AT-001', 350000.00, 280000.00, NULL, 120, 5, NULL, NULL, 7, 'male', 'all', 1, 1, 1, 1, 1, 0, 1, NULL, NULL, 16, '2025-10-31 09:50:06', '2025-11-02 15:02:27'),
(2, 'Áo sơ mi nam Zara Basic', 'ao-so-mi-nam-zara-basic', 'Áo sơ mi nam cơ bản, phù hợp cho công sở', 'Áo sơ mi công sở', 'ZRA-AS-001', 450000.00, NULL, NULL, 27, 5, NULL, NULL, 8, 'male', 'all', 3, 1, 0, 0, 0, 1, 0, NULL, NULL, 0, '2025-10-31 09:50:06', '2025-11-02 15:02:11'),
(3, 'Váy nữ Zara Summer', 'vay-nu-zara-summer', 'Váy nữ mùa hè, thiết kế trẻ trung', 'Váy nữ mùa hè', 'ZRA-VN-001', 380000.00, NULL, NULL, 40, 5, NULL, NULL, 9, 'male', 'all', 3, 1, 0, 1, 0, 1, 0, NULL, NULL, 6, '2025-10-31 09:50:06', '2025-11-02 08:17:48'),
(4, 'Áo thun nữ Uniqlo UT', 'ao-thun-nu-uniqlo-ut', 'Áo thun nữ cơ bản, nhiều màu sắc', 'Áo thun nữ cơ bản', 'UNQ-ATN-001', 200000.00, 160000.00, NULL, 60, 5, NULL, NULL, 10, 'male', 'all', 5, 1, 0, 0, 1, 0, 1, NULL, NULL, 10, '2025-10-31 09:50:06', '2025-11-02 10:37:53'),
(5, 'Giày Nike Air Max', 'giay-nike-air-max', 'Giày thể thao Nike Air Max, êm ái', 'Giày thể thao Nike', 'NKE-G-001', 2500000.00, 2000000.00, NULL, 15, 5, NULL, NULL, 6, 'male', 'all', 1, 1, 1, 1, 1, 0, 1, NULL, NULL, 2, '2025-10-31 09:50:06', '2025-11-01 07:22:12'),
(6, 'Áo Thun Nike Dri-FIT Premium', 'ao-thun-nike-dri-fit-premium-formdata', '<p>Áo thun Nike Dri-FIT công nghệ cao, thoáng khí, nhanh khô.</p>', 'Áo thun Nike Dri-FIT công nghệ cao', 'NIKE-DRIFIT-FORMDATA-001', 599000.00, 449000.00, NULL, 0, 5, NULL, NULL, 1, 'unisex', 'all', NULL, 1, 1, 0, 0, 1, 0, NULL, NULL, 0, '2025-11-01 08:16:48', '2025-11-01 08:16:48'),
(8, 'Áo Sơ Mi Nữ Uniqlo', 'ao-so-mi-nu-uniqlo', 'Áo sơ mi nữ Uniqlo thiết kế thanh lịch, chất liệu cotton 100% mềm mại. Phù hợp mặc đi làm hoặc dạo phố, dễ phối với nhiều item khác.', 'Áo sơ mi nữ Uniqlo cotton', 'UNIQLO-AO-008', 550000.00, 449000.00, 280000.00, 190, 15, 0.22, 'XS/S/M/L', 2, 'female', 'all', 4, 1, 1, 0, 1, 0, 1, 'Áo Sơ Mi Nữ Uniqlo', 'Áo sơ mi nữ Uniqlo cotton', 1120, '2025-11-02 11:56:06', '2025-11-02 11:56:06'),
(9, 'Áo Khoác Nữ Adidas', 'ao-khoac-nu-adidas', 'Áo khoác nữ Adidas thiết kế thể thao năng động, chất liệu vải dù nhẹ chống nước. Có nhiều túi tiện lợi, phù hợp đi tập hoặc dạo phố.', 'Áo khoác nữ Adidas chống nước', 'ADIDAS-AO-009', 1500000.00, 1199000.00, 700000.00, 90, 12, 0.45, 'XS/S/M/L', 2, 'female', 'fall', 2, 1, 0, 1, 0, 1, 1, 'Áo Khoác Nữ Adidas', 'Áo khoác nữ Adidas chống nước', 980, '2025-11-02 11:56:06', '2025-11-02 11:56:06'),
(10, 'Áo Ba Lỗ Nữ Puma', 'ao-ba-lo-nu-puma', 'Áo ba lỗ nữ Puma thiết kế thể thao, form fit ôm dáng. Chất liệu polyester co giãn, thấm hút mồ hôi tốt, phù hợp tập luyện.', 'Áo ba lỗ nữ Puma thể thao', 'PUMA-AO-010', 450000.00, 349000.00, 200000.00, 150, 15, 0.15, 'XS/S/M/L', 2, 'female', 'summer', 3, 1, 1, 0, 0, 1, 1, 'Áo Ba Lỗ Nữ Puma', 'Áo ba lỗ nữ Puma thể thao', 780, '2025-11-02 11:56:06', '2025-11-02 11:56:06'),
(11, 'Quần Jeans Nam Levi\'s 501', 'quan-jeans-nam-levis-501', 'Quần jeans nam Levi\'s 501 classic với thiết kế straight fit, chất liệu denim 100% cotton bền bỉ. Kiểu dáng cổ điển không bao giờ lỗi thời.', 'Quần jeans nam Levi\'s 501 classic', 'LEVI-QUAN-011', 2200000.00, 1899000.00, 1200000.00, 100, 12, 0.70, '28/30/32/34/36', 3, 'male', 'all', NULL, 1, 1, 1, 0, 0, 1, 'Quần Jeans Nam Levi\'s 501', 'Quần jeans nam Levi\'s 501 classic', 890, '2025-11-02 11:56:06', '2025-11-02 11:56:06'),
(12, 'Quần Kaki Nam Uniqlo', 'quan-kaki-nam-uniqlo', 'Quần kaki nam Uniqlo thiết kế chinos hiện đại, chất liệu cotton blend mềm mại. Phù hợp mặc đi làm hoặc đi chơi, có nhiều màu sắc.', 'Quần kaki nam Uniqlo chinos', 'UNIQLO-QUAN-012', 890000.00, 749000.00, 450000.00, 140, 15, 0.60, '28/30/32/34/36/38', 3, 'male', 'all', 4, 1, 0, 0, 1, 1, 1, 'Quần Kaki Nam Uniqlo', 'Quần kaki nam Uniqlo chinos', 1120, '2025-11-02 11:56:06', '2025-11-02 11:56:06'),
(13, 'Quần Thể Thao Nam Nike', 'quan-the-thao-nam-nike', 'Quần thể thao nam Nike với công nghệ Dri-FIT, chất liệu polyester co giãn. Thiết kế rộng rãi thoải mái, phù hợp tập luyện và hoạt động thể thao.', 'Quần thể thao nam Nike Dri-FIT', 'NIKE-QUAN-013', 1200000.00, 999000.00, 550000.00, 130, 15, 0.40, 'S/M/L/XL', 3, 'male', 'all', 1, 1, 1, 0, 0, 1, 1, 'Quần Thể Thao Nam Nike', 'Quần thể thao nam Nike Dri-FIT', 980, '2025-11-02 11:56:06', '2025-11-02 11:56:06'),
(14, 'Quần Jeans Nữ Zara', 'quan-jeans-nu-zara', 'Quần jeans nữ Zara thiết kế skinny fit ôm dáng, chất liệu stretch co giãn. Phù hợp mặc đi chơi, đi làm hoặc dạo phố.', 'Quần jeans nữ Zara skinny fit', 'ZARA-QUAN-014', 1590000.00, 1299000.00, 750000.00, 160, 18, 0.55, '24/26/28/30', 4, 'female', 'all', 5, 1, 1, 1, 1, 0, 1, 'Quần Jeans Nữ Zara', 'Quần jeans nữ Zara skinny fit', 1450, '2025-11-02 11:56:06', '2025-11-02 11:56:06'),
(15, 'Quần Legging Nữ Nike', 'quan-legging-nu-nike', 'Quần legging nữ Nike với công nghệ Dri-FIT và có túi nhỏ phía sau. Chất liệu nylon-spandex co giãn tốt, phù hợp tập yoga, gym.', 'Quần legging nữ Nike Dri-FIT', 'NIKE-QUAN-015', 1390000.00, 1099000.00, 600000.00, 180, 20, 0.30, 'XS/S/M/L', 4, 'female', 'all', 1, 1, 1, 0, 1, 1, 1, 'Quần Legging Nữ Nike', 'Quần legging nữ Nike Dri-FIT', 1682, '2025-11-02 11:56:06', '2025-11-02 14:02:07'),
(16, 'Giày Sneaker Nike Air Force 1', 'giay-sneaker-nike-air-force-1', 'Giày sneaker nam Nike Air Force 1 classic màu trắng, thiết kế cổ điển không bao giờ lỗi thời. Đế giày bền bỉ, phù hợp mặc hàng ngày.', 'Giày sneaker nam Nike Air Force 1', 'NIKE-GIAY-016', 3200000.00, 2799000.00, 1800000.00, 80, 10, 1.20, '40/41/42/43/44/45', 5, 'male', 'all', 1, 1, 1, 1, 1, 1, 1, 'Giày Sneaker Nike Air Force 1', 'Giày sneaker nam Nike Air Force 1', 2102, '2025-11-02 11:56:06', '2025-11-02 14:43:22'),
(17, 'Giày Thể Thao Adidas Ultraboost', 'giay-the-thao-adidas-ultraboost', 'Giày thể thao nam Adidas Ultraboost với công nghệ Boost đệm êm, đế ngoài Continental bám đường tốt. Phù hợp chạy bộ và đi bộ.', 'Giày thể thao nam Adidas Ultraboost', 'ADIDAS-GIAY-017', 4500000.00, 3999000.00, 2500000.00, 60, 8, 1.00, '40/41/42/43/44', 5, 'male', 'all', 2, 1, 1, 0, 1, 0, 1, 'Giày Thể Thao Adidas Ultraboost', 'Giày thể thao nam Adidas Ultraboost', 1560, '2025-11-02 11:56:06', '2025-11-02 11:56:06'),
(18, 'Giày Sneaker Vans Old Skool', 'giay-sneaker-vans-old-skool', 'Giày sneaker nam Vans Old Skool thiết kế cổ điển với đường sọc nổi tiếng. Đế giày cao su waffle bền bỉ, phù hợp mặc hàng ngày.', 'Giày sneaker nam Vans Old Skool', 'VANS-GIAY-018', 1800000.00, 1599000.00, 900000.00, 120, 15, 0.90, '39/40/41/42/43/44', 5, 'male', 'all', 7, 1, 0, 1, 0, 1, 1, 'Giày Sneaker Vans Old Skool', 'Giày sneaker nam Vans Old Skool', 1340, '2025-11-02 11:56:06', '2025-11-02 11:56:06'),
(19, 'Giày Sneaker Nữ Nike Air Max', 'giay-sneaker-nu-nike-air-max', 'Giày sneaker nữ Nike Air Max với công nghệ Air đệm êm, thiết kế nữ tính với nhiều màu sắc. Phù hợp mặc đi chơi và tập luyện.', 'Giày sneaker nữ Nike Air Max', 'NIKE-GIAY-019', 3500000.00, 2999000.00, 1900000.00, 150, 18, 0.80, '35/36/37/38/39/40', 6, 'female', 'all', 1, 1, 1, 1, 1, 1, 1, 'Giày Sneaker Nữ Nike Air Max', 'Giày sneaker nữ Nike Air Max', 1910, '2025-11-02 11:56:06', '2025-11-02 14:58:50'),
(20, 'Giày Thể Thao Nữ Adidas', 'giay-the-thao-nu-adidas', 'Giày thể thao nữ Adidas thiết kế năng động, đế giày êm ái phù hợp chạy bộ. Có nhiều màu sắc đa dạng, form fit ôm chân.', 'Giày thể thao nữ Adidas', 'ADIDAS-GIAY-020', 2800000.00, 2399000.00, 1500000.00, 140, 17, 0.75, '35/36/37/38/39/40', 6, 'female', 'all', 2, 1, 1, 0, 1, 1, 1, 'Giày Thể Thao Nữ Adidas', 'Giày thể thao nữ Adidas', 1626, '2025-11-02 11:56:06', '2025-11-02 15:02:26'),
(21, 'Giày Sneaker Nữ Converse Chuck Taylor', 'giay-sneaker-nu-converse-chuck-taylor', 'Giày sneaker nữ Converse Chuck Taylor All Star thiết kế cổ điển không bao giờ lỗi thời. Đế cao su bền bỉ, phù hợp mặc hàng ngày.', 'Giày sneaker nữ Converse Chuck Taylor', 'CONVERSE-GIAY-021', 1800000.00, 1499000.00, 900000.00, 180, 20, 0.70, '35/36/37/38/39/40/41', 6, 'female', 'all', 8, 1, 0, 1, 1, 1, 1, 'Giày Sneaker Nữ Converse', 'Giày sneaker nữ Converse Chuck Taylor', 1754, '2025-11-02 11:56:06', '2025-11-02 14:02:02'),
(22, 'Túi Xách Nam Nike', 'tui-xach-nam-nike', 'Túi xách nam Nike thiết kế thể thao, có nhiều ngăn tiện lợi. Chất liệu polyester bền bỉ, chống nước nhẹ, phù hợp đi tập hoặc dạo phố.', 'Túi xách nam Nike thể thao', 'NIKE-PK-022', 890000.00, 699000.00, 400000.00, 90, 12, 0.50, 'One Size', 7, 'male', 'all', 1, 1, 0, 0, 0, 1, 1, 'Túi Xách Nam Nike', 'Túi xách nam Nike thể thao', 680, '2025-11-02 11:56:06', '2025-11-02 11:56:06'),
(23, 'Ví Nam Zara', 'vi-nam-zara', 'Ví nam Zara thiết kế hiện đại, làm từ da thật cao cấp. Có nhiều ngăn đựng thẻ và tiền, gọn nhẹ dễ mang theo.', 'Ví nam Zara da thật', 'ZARA-PK-023', 1200000.00, 999000.00, 550000.00, 70, 10, 0.15, 'One Size', 7, 'male', 'all', 5, 1, 1, 0, 0, 0, 1, 'Ví Nam Zara', 'Ví nam Zara da thật', 540, '2025-11-02 11:56:06', '2025-11-02 11:56:06'),
(24, 'Áo Thun Unisex Nike', 'ao-thun-unisex-nike', 'Áo thun unisex Nike thiết kế đơn giản, form rộng thoải mái. Chất liệu cotton mềm mại, có nhiều màu sắc và kích thước để lựa chọn.', 'Áo thun unisex Nike', 'NIKE-AO-024', 690000.00, 549000.00, 320000.00, 200, 20, 0.20, 'S/M/L/XL', 8, 'unisex', 'all', 1, 1, 0, 1, 0, 1, 1, 'Áo Thun Unisex Nike', 'Áo thun unisex Nike', 1120, '2025-11-02 11:56:06', '2025-11-02 11:56:06'),
(25, 'Áo Thun Unisex Adidas', 'ao-thun-unisex-adidas', 'Áo thun unisex Adidas với logo 3 sọc nổi tiếng, thiết kế cổ điển. Chất liệu cotton mềm mại, phù hợp mặc hàng ngày.', 'Áo thun unisex Adidas', 'ADIDAS-AO-025', 650000.00, 499000.00, 300000.00, 190, 18, 0.19, 'S/M/L/XL', 8, 'unisex', 'all', 2, 1, 1, 0, 0, 0, 1, 'Áo Thun Unisex Adidas', 'Áo thun unisex Adidas', 980, '2025-11-02 11:56:06', '2025-11-02 11:56:06');

--
-- Bẫy `products`
--
DELIMITER $$
CREATE TRIGGER `update_products_updated_at` BEFORE UPDATE ON `products` FOR EACH ROW BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_attributes`
--

CREATE TABLE `product_attributes` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `attribute_type` enum('color','size','material','style') NOT NULL,
  `attribute_name` varchar(100) NOT NULL,
  `attribute_value` varchar(100) NOT NULL,
  `price_adjustment` decimal(10,2) DEFAULT 0.00,
  `stock_quantity` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `product_attributes`
--

INSERT INTO `product_attributes` (`id`, `product_id`, `attribute_type`, `attribute_name`, `attribute_value`, `price_adjustment`, `stock_quantity`, `is_active`, `created_at`) VALUES
(1, 1, 'color', 'Color', 'Black', 0.00, 50, 1, '2025-11-02 12:20:18'),
(2, 1, 'color', 'Color', 'White', 0.00, 60, 1, '2025-11-02 12:20:18'),
(3, 1, 'color', 'Color', 'Gray', 0.00, 40, 1, '2025-11-02 12:20:18'),
(4, 1, 'size', 'Size', 'M', 0.00, 50, 1, '2025-11-02 12:20:18'),
(5, 1, 'size', 'Size', 'L', 0.00, 60, 1, '2025-11-02 12:20:18'),
(6, 1, 'size', 'Size', 'XL', 0.00, 40, 1, '2025-11-02 12:20:18'),
(7, 2, 'color', 'Color', 'Navy Blue', 0.00, 40, 1, '2025-11-02 12:20:18'),
(8, 2, 'color', 'Color', 'White', 0.00, 50, 1, '2025-11-02 12:20:18'),
(9, 2, 'size', 'Size', 'S', 0.00, 30, 1, '2025-11-02 12:20:18'),
(10, 2, 'size', 'Size', 'M', 0.00, 40, 1, '2025-11-02 12:20:18'),
(11, 2, 'size', 'Size', 'L', 0.00, 50, 1, '2025-11-02 12:20:18'),
(12, 6, 'color', 'Color', 'Pink', 0.00, 60, 1, '2025-11-02 12:20:18'),
(13, 6, 'color', 'Color', 'White', 0.00, 70, 1, '2025-11-02 12:20:18'),
(14, 6, 'color', 'Color', 'Black', 0.00, 50, 1, '2025-11-02 12:20:18'),
(15, 6, 'size', 'Size', 'XS', 0.00, 40, 1, '2025-11-02 12:20:18'),
(16, 6, 'size', 'Size', 'S', 0.00, 60, 1, '2025-11-02 12:20:18'),
(17, 6, 'size', 'Size', 'M', 0.00, 70, 1, '2025-11-02 12:20:18'),
(18, 6, 'size', 'Size', 'L', 0.00, 50, 1, '2025-11-02 12:20:18'),
(19, 11, 'size', 'Size', '28', 0.00, 20, 1, '2025-11-02 12:20:18'),
(20, 11, 'size', 'Size', '30', 0.00, 25, 1, '2025-11-02 12:20:18'),
(21, 11, 'size', 'Size', '32', 0.00, 30, 1, '2025-11-02 12:20:18'),
(22, 11, 'size', 'Size', '34', 0.00, 25, 1, '2025-11-02 12:20:18'),
(23, 11, 'material', 'Material', '100% Cotton Denim', 0.00, 100, 1, '2025-11-02 12:20:18'),
(24, 14, 'color', 'Color', 'Blue', 0.00, 80, 1, '2025-11-02 12:20:18'),
(25, 14, 'color', 'Color', 'Black', 0.00, 80, 1, '2025-11-02 12:20:18'),
(26, 14, 'size', 'Size', '24', 0.00, 30, 1, '2025-11-02 12:20:18'),
(27, 14, 'size', 'Size', '26', 0.00, 40, 1, '2025-11-02 12:20:18'),
(28, 14, 'size', 'Size', '28', 0.00, 50, 1, '2025-11-02 12:20:18'),
(29, 14, 'size', 'Size', '30', 0.00, 40, 1, '2025-11-02 12:20:18'),
(30, 16, 'size', 'Size', '40', 0.00, 15, 1, '2025-11-02 12:20:18'),
(31, 16, 'size', 'Size', '41', 0.00, 15, 1, '2025-11-02 12:20:18'),
(32, 16, 'size', 'Size', '42', 0.00, 20, 1, '2025-11-02 12:20:18'),
(33, 16, 'size', 'Size', '43', 0.00, 15, 1, '2025-11-02 12:20:18'),
(34, 16, 'size', 'Size', '44', 0.00, 10, 1, '2025-11-02 12:20:18'),
(35, 16, 'size', 'Size', '45', 0.00, 5, 1, '2025-11-02 12:20:18'),
(36, 19, 'size', 'Size', '35', 0.00, 25, 1, '2025-11-02 12:20:18'),
(37, 19, 'size', 'Size', '36', 0.00, 30, 1, '2025-11-02 12:20:18'),
(38, 19, 'size', 'Size', '37', 0.00, 30, 1, '2025-11-02 12:20:18'),
(39, 19, 'size', 'Size', '38', 0.00, 25, 1, '2025-11-02 12:20:18'),
(40, 19, 'size', 'Size', '39', 0.00, 20, 1, '2025-11-02 12:20:18'),
(41, 19, 'size', 'Size', '40', 0.00, 20, 1, '2025-11-02 12:20:18'),
(42, 24, 'color', 'Color', 'Black', 0.00, 50, 1, '2025-11-02 12:20:18'),
(43, 24, 'color', 'Color', 'White', 0.00, 60, 1, '2025-11-02 12:20:18'),
(44, 24, 'color', 'Color', 'Red', 0.00, 45, 1, '2025-11-02 12:20:18'),
(45, 24, 'color', 'Color', 'Blue', 0.00, 45, 1, '2025-11-02 12:20:18'),
(46, 24, 'size', 'Size', 'S', 0.00, 50, 1, '2025-11-02 12:20:18'),
(47, 24, 'size', 'Size', 'M', 0.00, 60, 1, '2025-11-02 12:20:18'),
(48, 24, 'size', 'Size', 'L', 0.00, 60, 1, '2025-11-02 12:20:18'),
(49, 24, 'size', 'Size', 'XL', 0.00, 30, 1, '2025-11-02 12:20:18');

-- --------------------------------------------------------

--
-- Cấu trúc đóng vai cho view `product_full_info`
-- (See below for the actual view)
--
CREATE TABLE `product_full_info` (
`id` int(11)
,`name` varchar(255)
,`slug` varchar(255)
,`description` text
,`short_description` text
,`sku` varchar(100)
,`price` decimal(10,2)
,`sale_price` decimal(10,2)
,`cost_price` decimal(10,2)
,`stock_quantity` int(11)
,`min_stock_level` int(11)
,`weight` decimal(8,2)
,`dimensions` varchar(100)
,`category_id` int(11)
,`gender` enum('male','female','unisex')
,`season` enum('spring','summer','fall','winter','all')
,`brand_id` int(11)
,`is_active` tinyint(1)
,`is_featured` tinyint(1)
,`is_trending` tinyint(1)
,`is_bestseller` tinyint(1)
,`is_new` tinyint(1)
,`is_sale` tinyint(1)
,`meta_title` varchar(255)
,`meta_description` text
,`view_count` int(11)
,`created_at` timestamp
,`updated_at` timestamp
,`category_name` varchar(100)
,`category_slug` varchar(100)
,`category_gender` enum('male','female','unisex','all')
,`brand_name` varchar(100)
,`brand_slug` varchar(100)
,`primary_image` varchar(500)
,`all_images` mediumtext
,`average_rating` decimal(14,4)
,`review_count` bigint(21)
,`variant_count` bigint(21)
,`discount_percentage` decimal(15,0)
);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_images`
--

CREATE TABLE `product_images` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_primary` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`, `created_at`) VALUES
(1, 1, 'https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2023/05/ao-thun-nam-nike-dri-fit-uv-hyverse-men-s-short-sleeve-fitness-top-tshirt-dv9840-097-mau-xam-646b363c20ba5-22052023163036.jpg', 'Áo thun Nike Dri-FIT UV - Mặt trước', 1, 1, '2025-11-02 12:19:35'),
(2, 1, 'https://cdn.vuahanghieu.com/unsafe/0x900/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2023/05/ao-thun-nam-nike-dri-fit-uv-hyverse-men-s-short-sleeve-fitness-top-tshirt-dv9840-097-mau-xam-646b363c255e3-22052023163036.jpg', 'Áo thun Nike Dri-FIT UV - Mặt sau', 2, 0, '2025-11-02 12:19:35'),
(3, 1, 'https://cdn.vuahanghieu.com/unsafe/0x900/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2023/05/ao-thun-nam-nike-dri-fit-uv-hyverse-men-s-short-sleeve-fitness-top-tshirt-dv9840-097-mau-xam-646b363c10746-22052023163036.jpg', 'Áo thun Nike Dri-FIT UV - Chi tiết', 3, 0, '2025-11-02 12:19:35'),
(4, 2, 'https://product.hstatic.net/1000367250/product/olo_tee_black_jd2439_01_laydown_hover_d7b495d196a24595abec32f6a5253b05_76faa636a597468ca7a6147e2323c2b9_master.png', 'Áo Polo Adidas Essentials - Mặt trước', 1, 1, '2025-11-02 12:19:35'),
(5, 2, 'https://product.hstatic.net/1000367250/product/_polo_tee_black_jd2439_23_hover_model_d6fb887953974b82aa204652e40cc527_48750ec703eb482299b9e0ee7e092700_master.png', 'Áo Polo Adidas Essentials - Mặt sau', 2, 0, '2025-11-02 12:19:35'),
(6, 6, 'https://cdn.hstatic.net/products/1000008082/dza1_edcc08d0c2234a1081a8c043f1b4b05b_master.jpeg', 'Áo thun nữ Nike Sportswear - Mặt trước', 1, 1, '2025-11-02 12:19:35'),
(7, 6, 'https://cdn.hstatic.net/products/1000008082/dza2_f43039dc87fc40a2aecca09c03d4aca7_master.jpeg', 'Áo thun nữ Nike Sportswear - Mặt sau', 2, 0, '2025-11-02 12:19:35'),
(8, 6, 'https://cdn.hstatic.net/products/1000008082/dza4_b421b13694114d709da00a5051636af3_master.jpeg', 'Áo thun nữ Nike Sportswear - Chi tiết', 3, 0, '2025-11-02 12:19:35'),
(9, 11, 'https://img.bebeboutik-prive.fr/CnGmf0NVfI2dsQPjejWlHt8dWc8IWyfIu1q9p4qoV5Y/rs::1920/f:webp/q:80/bG9jYWw6Ly8vbWVkaWEvaW1hZ2UvZDAvYTEvbGV2aS00ZWg4NzktbDZ6LTAtMTJlYS5qcGc', 'Quần Jeans Nam Levi\'s 501 - Mặt trước', 1, 1, '2025-11-02 12:19:35'),
(10, 11, 'https://ann.com.vn/wp-content/uploads/quan-jeans-nam-dai-tron-mau-xanh-den-levis-320-769.png', 'Quần Jeans Nam Levi\'s 501 - Chi tiết', 2, 0, '2025-11-02 12:19:35'),
(11, 14, 'https://static.zara.net/assets/public/9a55/d058/ecb44de997c5/610025027db5/07223227407-e1/07223227407-e1.jpg?ts=1756461002682&w=750', 'Quần Jeans Nữ Zara - Mặt trước', 1, 1, '2025-11-02 12:19:35'),
(12, 14, 'https://static.zara.net/assets/public/f9eb/d9a0/bde748d392c4/3b258e957757/07223227407-e3/07223227407-e3.jpg?ts=1756461002503&w=1430', 'Quần Jeans Nữ Zara - Chi tiết', 2, 0, '2025-11-02 12:19:35'),
(13, 16, 'https://bizweb.dktcdn.net/100/467/909/products/z6895508001174-92cdcfe59f36ed7ddfe5200b5f1ef66a.jpg?v=1754900386417', 'Giày Sneaker Nike Air Force 1 - Mặt trên', 1, 1, '2025-11-02 12:19:35'),
(14, 16, 'https://trungsneaker.com/wp-content/uploads/2022/04/giay-nike-air-force-1-white-black-w-315115-152-38.jpeg', 'Giày Sneaker Nike Air Force 1 - Mặt bên', 2, 0, '2025-11-02 12:19:35'),
(15, 16, 'https://cdn.vuahanghieu.com/unsafe/0x900/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2023/03/giay-the-thao-nu-nike-air-force-1-07-women-s-shoes-dq7570-001-mau-xam-trang-size-36-6410259daf687-14032023144325.jpg', 'Giày Sneaker Nike Air Force 1 - Đế giày', 3, 0, '2025-11-02 12:19:35'),
(16, 19, 'https://ash.vn/cdn/shop/files/8d40672199ca003d9465678116c7469c_1800x.jpg?v=1733730660', 'Giày Sneaker Nữ Nike Air Max - Mặt trên', 1, 1, '2025-11-02 12:19:35'),
(17, 19, 'https://cdn.vuahanghieu.com/unsafe/0x900/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2023/07/giay-the-thao-nu-nike-air-max-90-women-s-shoes-dx0115-101-mau-trang-kem-size-36-5-64a4c9962d653-05072023083830.jpg', 'Giày Sneaker Nữ Nike Air Max - Mặt bên', 2, 0, '2025-11-02 12:19:35'),
(18, 24, 'https://cdn.vuahanghieu.com/unsafe/0x900/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2023/04/ao-thun-nam-nike-dri-fit-challenge-iii-t-shirt-bv6703-010-mau-den-size-s-642e433e998c5-06042023105750.jpg', 'Áo Thun Unisex Nike - Mặt trước', 1, 1, '2025-11-02 12:19:35'),
(19, 24, 'https://cdn.vuahanghieu.com/unsafe/0x900/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2023/04/ao-thun-nam-nike-dri-fit-challenge-iii-t-shirt-bv6703-010-mau-den-size-s-642e433e9e6f5-06042023105750.jpg', 'Áo Thun Unisex Nike - Mặt sau', 2, 0, '2025-11-02 12:19:35');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_reviews`
--

CREATE TABLE `product_reviews` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `title` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `is_approved` tinyint(1) DEFAULT 0,
  `helpful_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_tags`
--

CREATE TABLE `product_tags` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `product_tags`
--

INSERT INTO `product_tags` (`id`, `name`, `slug`, `created_at`) VALUES
(1, 'Thời trang', 'thoi-trang', '2025-10-31 09:50:06'),
(2, 'Thể thao', 'the-thao', '2025-10-31 09:50:06'),
(3, 'Công sở', 'cong-so', '2025-10-31 09:50:06'),
(4, 'Casual', 'casual', '2025-10-31 09:50:06'),
(5, 'Sale', 'sale', '2025-10-31 09:50:06');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_tag_relations`
--

CREATE TABLE `product_tag_relations` (
  `product_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `product_tag_relations`
--

INSERT INTO `product_tag_relations` (`product_id`, `tag_id`) VALUES
(1, 1),
(1, 2),
(1, 4),
(1, 5),
(2, 1),
(2, 3),
(3, 1),
(3, 4),
(4, 1),
(4, 4),
(4, 5);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_variants`
--

CREATE TABLE `product_variants` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `size` varchar(50) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `color_code` varchar(20) DEFAULT NULL,
  `price_adjustment` decimal(10,2) DEFAULT 0.00,
  `stock_quantity` int(11) DEFAULT 0,
  `sku` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_revoked` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `review_images`
--

CREATE TABLE `review_images` (
  `id` int(11) NOT NULL,
  `review_id` int(11) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('text','number','boolean','json') DEFAULT 'text',
  `description` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`) VALUES
(1, 'site_name', 'UTESHOP', 'text', 'Tên website', '2025-10-31 09:50:06'),
(2, 'site_description', 'Website thương mại điện tử thời trang hàng đầu Việt Nam', 'text', 'Mô tả website', '2025-10-31 09:50:06'),
(3, 'currency', 'VND', 'text', 'Đơn vị tiền tệ', '2025-10-31 09:50:06'),
(4, 'tax_rate', '10', 'number', 'Thuế suất (%)', '2025-10-31 09:50:06'),
(5, 'shipping_fee', '50000', 'number', 'Phí vận chuyển (VND)', '2025-10-31 09:50:06'),
(6, 'contact_email', 'info@uteshop.com', 'text', 'Email liên hệ', '2025-10-31 09:50:06'),
(7, 'contact_phone', '1900-1234', 'text', 'Số điện thoại liên hệ', '2025-10-31 09:50:06');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `role_id` int(11) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `email_verified` tinyint(1) DEFAULT 0,
  `auth_provider` enum('local','google','facebook','apple','twitter') DEFAULT 'local',
  `provider_id` varchar(255) DEFAULT NULL,
  `provider_token` text DEFAULT NULL,
  `provider_refresh_token` text DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `first_name`, `last_name`, `phone`, `date_of_birth`, `gender`, `avatar`, `role_id`, `is_active`, `email_verified`, `auth_provider`, `provider_id`, `provider_token`, `provider_refresh_token`, `last_login_at`, `last_login_ip`, `created_at`, `updated_at`) VALUES
(1, 'admin@uteshop.com', '$2a$12$Gq6eeXAtMJTWKcpcYj3y3OTfFxTHyL6mdaObNZCXtChNyoZelaxdC', 'Admin', 'UTESHOP', '0123456789', '1990-01-01', 'other', NULL, 2, 1, 1, 'local', NULL, NULL, NULL, '2025-11-01 08:04:43', '::ffff:127.0.0.1', '2025-10-31 09:50:06', '2025-11-01 08:04:43'),
(2, 'customer1@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nguyễn', 'Văn A', '0987654321', '1995-05-15', 'male', NULL, 1, 1, 1, 'local', NULL, NULL, NULL, NULL, NULL, '2025-10-31 09:50:06', '2025-10-31 09:50:06'),
(3, 'customer2@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Trần', 'Thị B', '0912345678', '1992-08-20', 'female', NULL, 1, 1, 1, 'local', NULL, NULL, NULL, NULL, NULL, '2025-10-31 09:50:06', '2025-10-31 09:50:06'),
(4, 'john.google@example.com', NULL, 'John', 'Smith', '0901234567', '1988-03-15', 'male', NULL, 1, 1, 1, 'google', NULL, NULL, NULL, NULL, NULL, '2025-10-31 09:50:06', '2025-10-31 09:50:06'),
(5, 'mike.facebook@example.com', NULL, 'Mike', 'Johnson', '0923456789', '1990-07-20', 'male', NULL, 1, 1, 1, 'facebook', NULL, NULL, NULL, NULL, NULL, '2025-10-31 09:50:06', '2025-10-31 09:50:06'),
(7, 'nguyenhuypm1@gmail.com', '$2b$12$hroOedRD9Pt0sxYYwgMiJucgRpbmnIWHAVa1dLz0z7w3rFLUQh4I2', 'Ngọc Huy', 'Nguyễn', '0327793283', NULL, 'male', NULL, 1, 1, 1, 'local', NULL, NULL, NULL, '2025-11-01 06:07:07', '::1', '2025-11-01 03:54:35', '2025-11-01 06:07:07'),
(8, 'maianhkhoi04@gmail.com', '$2b$12$qSfmCA7jODc6LXkqMVPu9./O21HdDvFz/gLqn1Z2sPEV7U0K.fW/K', 'Mai Anh', 'Khôi', '0254354125', NULL, 'other', NULL, 1, 1, 1, 'local', NULL, NULL, NULL, '2025-11-02 14:42:57', '::1', '2025-11-01 06:09:41', '2025-11-02 14:42:57');

--
-- Bẫy `users`
--
DELIMITER $$
CREATE TRIGGER `after_user_login` AFTER UPDATE ON `users` FOR EACH ROW BEGIN
    IF NEW.last_login_at != OLD.last_login_at THEN
        INSERT INTO login_history (
            user_id,
            login_method,
            status,
            ip_address
        ) VALUES (
            NEW.id,
            NEW.auth_provider,
            'success',
            NEW.last_login_ip
        );
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_users_updated_at` BEFORE UPDATE ON `users` FOR EACH ROW BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_activity_logs`
--

CREATE TABLE `user_activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `activity_type` enum('login','logout','register','view_product','add_to_cart','purchase','review') NOT NULL,
  `description` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_addresses`
--

CREATE TABLE `user_addresses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `address_type` enum('home','work','other') DEFAULT 'home',
  `full_name` varchar(200) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address_line1` varchar(255) NOT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `postal_code` varchar(20) NOT NULL,
  `country` varchar(100) NOT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `user_addresses`
--

INSERT INTO `user_addresses` (`id`, `user_id`, `address_type`, `full_name`, `phone`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 2, 'home', 'Nguyễn Văn A', '0987654321', '123 Đường ABC', NULL, 'Hồ Chí Minh', 'TP.HCM', '700000', 'Việt Nam', 1, '2025-10-31 09:50:06', '2025-10-31 09:50:06'),
(2, 3, 'home', 'Trần Thị B', '0912345678', '456 Đường XYZ', NULL, 'Hà Nội', 'Hà Nội', '100000', 'Việt Nam', 1, '2025-10-31 09:50:06', '2025-10-31 09:50:06'),
(3, 4, 'home', 'John Smith', '0901234567', '123 Google Street', NULL, 'Hồ Chí Minh', 'TP.HCM', '700000', 'Việt Nam', 1, '2025-10-31 09:50:06', '2025-10-31 09:50:06');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_roles`
--

CREATE TABLE `user_roles` (
  `id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `user_roles`
--

INSERT INTO `user_roles` (`id`, `role_name`, `description`, `created_at`) VALUES
(1, 'customer', 'Khách hàng', '2025-10-31 09:50:06'),
(2, 'admin', 'Quản trị viên', '2025-10-31 09:50:06'),
(3, 'moderator', 'Điều hành viên', '2025-10-31 09:50:06'),
(4, 'editor', 'Biên tập viên', '2025-10-31 09:50:06');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `device_info` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_activity_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_social_accounts`
--

CREATE TABLE `user_social_accounts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `provider` enum('google','facebook','apple','twitter','github','linkedin') NOT NULL,
  `provider_user_id` varchar(255) NOT NULL,
  `provider_email` varchar(255) DEFAULT NULL,
  `provider_name` varchar(255) DEFAULT NULL,
  `provider_avatar` varchar(500) DEFAULT NULL,
  `access_token` text DEFAULT NULL,
  `refresh_token` text DEFAULT NULL,
  `token_expires_at` timestamp NULL DEFAULT NULL,
  `raw_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_data`)),
  `is_primary` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_two_factor_auth`
--

CREATE TABLE `user_two_factor_auth` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `method` enum('totp','sms','email') NOT NULL,
  `secret` varchar(255) NOT NULL,
  `backup_codes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`backup_codes`)),
  `is_enabled` tinyint(1) DEFAULT 0,
  `enabled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `verification_codes`
--

CREATE TABLE `verification_codes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `code` varchar(255) NOT NULL,
  `type` enum('email_verification','phone_verification','password_reset','2fa') NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `verification_codes`
--

INSERT INTO `verification_codes` (`id`, `user_id`, `email`, `phone`, `code`, `type`, `expires_at`, `is_used`, `created_at`) VALUES
(2, 7, 'nguyenhuypm1@gmail.com', NULL, '5b1adbdfbf0d296795a95b4df3d22c6026c75a7d42ea5d81ea387ee6fc18f12d', 'email_verification', '2025-11-01 03:55:35', 1, '2025-11-01 03:54:35'),
(3, 8, 'maianhkhoi04@gmail.com', NULL, '94daeba1add95dfbe9179087b46e8041a1c9aed62884869c267be4418079334c', 'email_verification', '2025-11-01 06:10:05', 1, '2025-11-01 06:09:41');

-- --------------------------------------------------------

--
-- Cấu trúc đóng vai cho view `v_login_statistics`
-- (See below for the actual view)
--
CREATE TABLE `v_login_statistics` (
`user_id` int(11)
,`total_logins` bigint(21)
,`successful_logins` bigint(21)
,`failed_logins` bigint(21)
,`last_login` timestamp
,`login_methods_used` bigint(21)
);

-- --------------------------------------------------------

--
-- Cấu trúc đóng vai cho view `v_order_details`
-- (See below for the actual view)
--
CREATE TABLE `v_order_details` (
`id` int(11)
,`order_number` varchar(50)
,`total_amount` decimal(10,2)
,`payment_method` enum('credit_card','debit_card','paypal','bank_transfer','cod','payos')
,`payment_status` enum('pending','paid','failed','refunded')
,`status_name` varchar(50)
,`first_name` varchar(100)
,`last_name` varchar(100)
,`email` varchar(255)
,`created_at` timestamp
);

-- --------------------------------------------------------

--
-- Cấu trúc đóng vai cho view `v_product_details`
-- (See below for the actual view)
--
CREATE TABLE `v_product_details` (
`id` int(11)
,`name` varchar(255)
,`slug` varchar(255)
,`description` text
,`price` decimal(10,2)
,`sale_price` decimal(10,2)
,`stock_quantity` int(11)
,`is_active` tinyint(1)
,`is_featured` tinyint(1)
,`category_name` varchar(100)
,`brand_name` varchar(100)
,`primary_image` varchar(500)
,`average_rating` decimal(14,4)
,`review_count` bigint(21)
);

-- --------------------------------------------------------

--
-- Cấu trúc đóng vai cho view `v_users_with_social`
-- (See below for the actual view)
--
CREATE TABLE `v_users_with_social` (
`id` int(11)
,`email` varchar(255)
,`first_name` varchar(100)
,`last_name` varchar(100)
,`avatar` varchar(500)
,`auth_provider` enum('local','google','facebook','apple','twitter')
,`is_active` tinyint(1)
,`last_login_at` timestamp
,`connected_providers` mediumtext
,`social_accounts_count` bigint(21)
);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `wishlist_items`
--

CREATE TABLE `wishlist_items` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc cho view `payment_details_view`
--
DROP TABLE IF EXISTS `payment_details_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `payment_details_view`  AS SELECT `pt`.`id` AS `transaction_id`, `pt`.`payos_transaction_id` AS `payos_transaction_id`, `pt`.`payos_order_code` AS `payos_order_code`, `pt`.`amount` AS `amount`, `pt`.`currency` AS `currency`, `pt`.`payment_method` AS `payment_method`, `pt`.`status` AS `payment_status`, `pt`.`paid_at` AS `paid_at`, `pt`.`created_at` AS `transaction_created_at`, `o`.`id` AS `order_id`, `o`.`order_number` AS `order_number`, `o`.`status_id` AS `order_status_id`, `os`.`status_name` AS `order_status`, `os`.`color` AS `order_status_color`, `o`.`total_amount` AS `order_total`, `o`.`payment_status` AS `order_payment_status`, `u`.`id` AS `user_id`, `u`.`email` AS `user_email`, concat(`u`.`first_name`,' ',`u`.`last_name`) AS `user_name`, (select count(0) from `payment_refunds` where `payment_refunds`.`transaction_id` = `pt`.`id`) AS `refund_count`, (select sum(`payment_refunds`.`refund_amount`) from `payment_refunds` where `payment_refunds`.`transaction_id` = `pt`.`id` and `payment_refunds`.`status` = 'completed') AS `total_refunded` FROM (((`payment_transactions` `pt` left join `orders` `o` on(`pt`.`order_id` = `o`.`id`)) left join `order_statuses` `os` on(`o`.`status_id` = `os`.`id`)) left join `users` `u` on(`pt`.`user_id` = `u`.`id`)) ;

-- --------------------------------------------------------

--
-- Cấu trúc cho view `product_full_info`
--
DROP TABLE IF EXISTS `product_full_info`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `product_full_info`  AS SELECT `p`.`id` AS `id`, `p`.`name` AS `name`, `p`.`slug` AS `slug`, `p`.`description` AS `description`, `p`.`short_description` AS `short_description`, `p`.`sku` AS `sku`, `p`.`price` AS `price`, `p`.`sale_price` AS `sale_price`, `p`.`cost_price` AS `cost_price`, `p`.`stock_quantity` AS `stock_quantity`, `p`.`min_stock_level` AS `min_stock_level`, `p`.`weight` AS `weight`, `p`.`dimensions` AS `dimensions`, `p`.`category_id` AS `category_id`, `p`.`gender` AS `gender`, `p`.`season` AS `season`, `p`.`brand_id` AS `brand_id`, `p`.`is_active` AS `is_active`, `p`.`is_featured` AS `is_featured`, `p`.`is_trending` AS `is_trending`, `p`.`is_bestseller` AS `is_bestseller`, `p`.`is_new` AS `is_new`, `p`.`is_sale` AS `is_sale`, `p`.`meta_title` AS `meta_title`, `p`.`meta_description` AS `meta_description`, `p`.`view_count` AS `view_count`, `p`.`created_at` AS `created_at`, `p`.`updated_at` AS `updated_at`, `c`.`name` AS `category_name`, `c`.`slug` AS `category_slug`, `c`.`gender` AS `category_gender`, `b`.`name` AS `brand_name`, `b`.`slug` AS `brand_slug`, (select `product_images`.`image_url` from `product_images` where `product_images`.`product_id` = `p`.`id` and `product_images`.`is_primary` = 1 limit 1) AS `primary_image`, (select group_concat(`product_images`.`image_url` separator ',') from `product_images` where `product_images`.`product_id` = `p`.`id`) AS `all_images`, (select avg(`product_reviews`.`rating`) from `product_reviews` where `product_reviews`.`product_id` = `p`.`id` and `product_reviews`.`is_approved` = 1) AS `average_rating`, (select count(0) from `product_reviews` where `product_reviews`.`product_id` = `p`.`id` and `product_reviews`.`is_approved` = 1) AS `review_count`, (select count(0) from `product_variants` where `product_variants`.`product_id` = `p`.`id` and `product_variants`.`is_active` = 1) AS `variant_count`, CASE WHEN `p`.`sale_price` is not null AND `p`.`sale_price` > 0 THEN round((`p`.`price` - `p`.`sale_price`) / `p`.`price` * 100,0) ELSE 0 END AS `discount_percentage` FROM ((`products` `p` left join `categories` `c` on(`p`.`category_id` = `c`.`id`)) left join `brands` `b` on(`p`.`brand_id` = `b`.`id`)) ;

-- --------------------------------------------------------

--
-- Cấu trúc cho view `v_login_statistics`
--
DROP TABLE IF EXISTS `v_login_statistics`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_login_statistics`  AS SELECT `login_history`.`user_id` AS `user_id`, count(0) AS `total_logins`, count(case when `login_history`.`status` = 'success' then 1 end) AS `successful_logins`, count(case when `login_history`.`status` = 'failed' then 1 end) AS `failed_logins`, max(`login_history`.`created_at`) AS `last_login`, count(distinct `login_history`.`login_method`) AS `login_methods_used` FROM `login_history` GROUP BY `login_history`.`user_id` ;

-- --------------------------------------------------------

--
-- Cấu trúc cho view `v_order_details`
--
DROP TABLE IF EXISTS `v_order_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_order_details`  AS SELECT `o`.`id` AS `id`, `o`.`order_number` AS `order_number`, `o`.`total_amount` AS `total_amount`, `o`.`payment_method` AS `payment_method`, `o`.`payment_status` AS `payment_status`, `os`.`status_name` AS `status_name`, `u`.`first_name` AS `first_name`, `u`.`last_name` AS `last_name`, `u`.`email` AS `email`, `o`.`created_at` AS `created_at` FROM ((`orders` `o` join `order_statuses` `os` on(`o`.`status_id` = `os`.`id`)) join `users` `u` on(`o`.`user_id` = `u`.`id`)) ;

-- --------------------------------------------------------

--
-- Cấu trúc cho view `v_product_details`
--
DROP TABLE IF EXISTS `v_product_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_product_details`  AS SELECT `p`.`id` AS `id`, `p`.`name` AS `name`, `p`.`slug` AS `slug`, `p`.`description` AS `description`, `p`.`price` AS `price`, `p`.`sale_price` AS `sale_price`, `p`.`stock_quantity` AS `stock_quantity`, `p`.`is_active` AS `is_active`, `p`.`is_featured` AS `is_featured`, `c`.`name` AS `category_name`, `b`.`name` AS `brand_name`, (select `product_images`.`image_url` from `product_images` where `product_images`.`product_id` = `p`.`id` and `product_images`.`is_primary` = 1 limit 1) AS `primary_image`, (select avg(`product_reviews`.`rating`) from `product_reviews` where `product_reviews`.`product_id` = `p`.`id` and `product_reviews`.`is_approved` = 1) AS `average_rating`, (select count(0) from `product_reviews` where `product_reviews`.`product_id` = `p`.`id` and `product_reviews`.`is_approved` = 1) AS `review_count` FROM ((`products` `p` left join `categories` `c` on(`p`.`category_id` = `c`.`id`)) left join `brands` `b` on(`p`.`brand_id` = `b`.`id`)) ;

-- --------------------------------------------------------

--
-- Cấu trúc cho view `v_users_with_social`
--
DROP TABLE IF EXISTS `v_users_with_social`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_users_with_social`  AS SELECT `u`.`id` AS `id`, `u`.`email` AS `email`, `u`.`first_name` AS `first_name`, `u`.`last_name` AS `last_name`, `u`.`avatar` AS `avatar`, `u`.`auth_provider` AS `auth_provider`, `u`.`is_active` AS `is_active`, `u`.`last_login_at` AS `last_login_at`, group_concat(distinct `usa`.`provider` separator ',') AS `connected_providers`, count(distinct `usa`.`provider`) AS `social_accounts_count` FROM (`users` `u` left join `user_social_accounts` `usa` on(`u`.`id` = `usa`.`user_id`)) GROUP BY `u`.`id` ;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_position` (`position`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_order` (`display_order`);

--
-- Chỉ mục cho bảng `blog_categories`
--
ALTER TABLE `blog_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `blog_posts`
--
ALTER TABLE `blog_posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_blog_author` (`author_id`),
  ADD KEY `idx_blog_category` (`category_id`),
  ADD KEY `idx_blog_status` (`status`),
  ADD KEY `idx_blog_published` (`published_at`);

--
-- Chỉ mục cho bảng `blog_post_tags`
--
ALTER TABLE `blog_post_tags`
  ADD PRIMARY KEY (`post_id`,`tag_id`),
  ADD KEY `tag_id` (`tag_id`);

--
-- Chỉ mục cho bảng `blog_tags`
--
ALTER TABLE `blog_tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `brands`
--
ALTER TABLE `brands`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_product` (`user_id`,`product_id`,`selected_color`,`selected_size`),
  ADD KEY `idx_cart_user` (`user_id`),
  ADD KEY `idx_cart_product` (`product_id`);

--
-- Chỉ mục cho bảng `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Chỉ mục cho bảng `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Chỉ mục cho bảng `coupon_usage`
--
ALTER TABLE `coupon_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `coupon_id` (`coupon_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `order_id` (`order_id`);

--
-- Chỉ mục cho bảng `login_history`
--
ALTER TABLE `login_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_login_user` (`user_id`),
  ADD KEY `idx_login_status` (`status`),
  ADD KEY `idx_login_created` (`created_at`);

--
-- Chỉ mục cho bảng `oauth_providers`
--
ALTER TABLE `oauth_providers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `provider_name` (`provider_name`);

--
-- Chỉ mục cho bảng `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `idx_orders_user` (`user_id`),
  ADD KEY `idx_orders_status` (`status_id`),
  ADD KEY `idx_orders_created` (`created_at`),
  ADD KEY `idx_orders_number` (`order_number`),
  ADD KEY `idx_payment_status` (`payment_status`);

--
-- Chỉ mục cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Chỉ mục cho bảng `order_statuses`
--
ALTER TABLE `order_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `status_name` (`status_name`);

--
-- Chỉ mục cho bảng `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `status_id` (`status_id`);

--
-- Chỉ mục cho bảng `page_views`
--
ALTER TABLE `page_views`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `payment_refunds`
--
ALTER TABLE `payment_refunds`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payos_refund_id` (`payos_refund_id`),
  ADD KEY `processed_by` (`processed_by`),
  ADD KEY `idx_transaction` (`transaction_id`),
  ADD KEY `idx_status` (`status`);

--
-- Chỉ mục cho bảng `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payos_transaction_id` (`payos_transaction_id`),
  ADD UNIQUE KEY `payos_order_code` (`payos_order_code`),
  ADD KEY `idx_order` (`order_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_payos_transaction` (`payos_transaction_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Chỉ mục cho bảng `payment_webhooks`
--
ALTER TABLE `payment_webhooks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_transaction` (`transaction_id`),
  ADD KEY `idx_event` (`event_type`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Chỉ mục cho bảng `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `idx_products_category` (`category_id`),
  ADD KEY `idx_products_brand` (`brand_id`),
  ADD KEY `idx_products_active` (`is_active`),
  ADD KEY `idx_products_featured` (`is_featured`),
  ADD KEY `idx_products_price` (`price`),
  ADD KEY `idx_products_created` (`created_at`),
  ADD KEY `idx_gender` (`gender`);

--
-- Chỉ mục cho bảng `product_attributes`
--
ALTER TABLE `product_attributes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Chỉ mục cho bảng `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Chỉ mục cho bảng `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `idx_reviews_product` (`product_id`),
  ADD KEY `idx_reviews_user` (`user_id`),
  ADD KEY `idx_reviews_rating` (`rating`);

--
-- Chỉ mục cho bảng `product_tags`
--
ALTER TABLE `product_tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `product_tag_relations`
--
ALTER TABLE `product_tag_relations`
  ADD PRIMARY KEY (`product_id`,`tag_id`),
  ADD KEY `tag_id` (`tag_id`);

--
-- Chỉ mục cho bảng `product_variants`
--
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_variant` (`product_id`,`size`,`color`),
  ADD KEY `idx_product` (`product_id`),
  ADD KEY `idx_sku` (`sku`);

--
-- Chỉ mục cho bảng `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_refresh_user` (`user_id`),
  ADD KEY `idx_refresh_token` (`token`);

--
-- Chỉ mục cho bảng `review_images`
--
ALTER TABLE `review_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `review_id` (`review_id`);

--
-- Chỉ mục cho bảng `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_role` (`role_id`),
  ADD KEY `idx_users_active` (`is_active`),
  ADD KEY `idx_users_provider` (`auth_provider`,`provider_id`),
  ADD KEY `idx_users_email_active` (`email`,`is_active`),
  ADD KEY `idx_users_last_login` (`last_login_at`);

--
-- Chỉ mục cho bảng `user_activity_logs`
--
ALTER TABLE `user_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Chỉ mục cho bảng `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_token` (`session_token`),
  ADD KEY `idx_session_user` (`user_id`),
  ADD KEY `idx_session_token` (`session_token`),
  ADD KEY `idx_session_expires` (`expires_at`);

--
-- Chỉ mục cho bảng `user_social_accounts`
--
ALTER TABLE `user_social_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_provider_user` (`provider`,`provider_user_id`),
  ADD KEY `idx_social_user` (`user_id`),
  ADD KEY `idx_social_provider` (`provider`,`provider_user_id`),
  ADD KEY `idx_social_updated` (`updated_at`);

--
-- Chỉ mục cho bảng `user_two_factor_auth`
--
ALTER TABLE `user_two_factor_auth`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `verification_codes`
--
ALTER TABLE `verification_codes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_verification_email` (`email`,`type`),
  ADD KEY `idx_verification_code` (`code`,`type`);

--
-- Chỉ mục cho bảng `wishlist_items`
--
ALTER TABLE `wishlist_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_wishlist` (`user_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `banners`
--
ALTER TABLE `banners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `blog_categories`
--
ALTER TABLE `blog_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `blog_posts`
--
ALTER TABLE `blog_posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `blog_tags`
--
ALTER TABLE `blog_tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `brands`
--
ALTER TABLE `brands`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT cho bảng `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `coupon_usage`
--
ALTER TABLE `coupon_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `login_history`
--
ALTER TABLE `login_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT cho bảng `oauth_providers`
--
ALTER TABLE `oauth_providers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `order_statuses`
--
ALTER TABLE `order_statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `order_status_history`
--
ALTER TABLE `order_status_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `page_views`
--
ALTER TABLE `page_views`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `payment_refunds`
--
ALTER TABLE `payment_refunds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `payment_transactions`
--
ALTER TABLE `payment_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `payment_webhooks`
--
ALTER TABLE `payment_webhooks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT cho bảng `product_attributes`
--
ALTER TABLE `product_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT cho bảng `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT cho bảng `product_reviews`
--
ALTER TABLE `product_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `product_tags`
--
ALTER TABLE `product_tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `product_variants`
--
ALTER TABLE `product_variants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `review_images`
--
ALTER TABLE `review_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `user_activity_logs`
--
ALTER TABLE `user_activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `user_addresses`
--
ALTER TABLE `user_addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `user_roles`
--
ALTER TABLE `user_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `user_social_accounts`
--
ALTER TABLE `user_social_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `user_two_factor_auth`
--
ALTER TABLE `user_two_factor_auth`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `verification_codes`
--
ALTER TABLE `verification_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `wishlist_items`
--
ALTER TABLE `wishlist_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `blog_posts`
--
ALTER TABLE `blog_posts`
  ADD CONSTRAINT `blog_posts_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `blog_posts_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `blog_categories` (`id`);

--
-- Các ràng buộc cho bảng `blog_post_tags`
--
ALTER TABLE `blog_post_tags`
  ADD CONSTRAINT `blog_post_tags_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `blog_posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `blog_post_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `blog_tags` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `coupon_usage`
--
ALTER TABLE `coupon_usage`
  ADD CONSTRAINT `coupon_usage_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`),
  ADD CONSTRAINT `coupon_usage_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `coupon_usage_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);

--
-- Các ràng buộc cho bảng `login_history`
--
ALTER TABLE `login_history`
  ADD CONSTRAINT `login_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`status_id`) REFERENCES `order_statuses` (`id`);

--
-- Các ràng buộc cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Các ràng buộc cho bảng `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_status_history_ibfk_2` FOREIGN KEY (`status_id`) REFERENCES `order_statuses` (`id`);

--
-- Các ràng buộc cho bảng `page_views`
--
ALTER TABLE `page_views`
  ADD CONSTRAINT `page_views_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `payment_refunds`
--
ALTER TABLE `payment_refunds`
  ADD CONSTRAINT `payment_refunds_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `payment_transactions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payment_refunds_ibfk_2` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD CONSTRAINT `payment_transactions_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payment_transactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `payment_webhooks`
--
ALTER TABLE `payment_webhooks`
  ADD CONSTRAINT `payment_webhooks_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `payment_transactions` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`);

--
-- Các ràng buộc cho bảng `product_attributes`
--
ALTER TABLE `product_attributes`
  ADD CONSTRAINT `product_attributes_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_reviews_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `product_tag_relations`
--
ALTER TABLE `product_tag_relations`
  ADD CONSTRAINT `product_tag_relations_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_tag_relations_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `product_tags` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `review_images`
--
ALTER TABLE `review_images`
  ADD CONSTRAINT `review_images_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `product_reviews` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `user_roles` (`id`);

--
-- Các ràng buộc cho bảng `user_activity_logs`
--
ALTER TABLE `user_activity_logs`
  ADD CONSTRAINT `user_activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `user_social_accounts`
--
ALTER TABLE `user_social_accounts`
  ADD CONSTRAINT `user_social_accounts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `user_two_factor_auth`
--
ALTER TABLE `user_two_factor_auth`
  ADD CONSTRAINT `user_two_factor_auth_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `verification_codes`
--
ALTER TABLE `verification_codes`
  ADD CONSTRAINT `verification_codes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `wishlist_items`
--
ALTER TABLE `wishlist_items`
  ADD CONSTRAINT `wishlist_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlist_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

DELIMITER $$
--
-- Sự kiện
--
CREATE DEFINER=`root`@`localhost` EVENT `cleanup_expired_sessions` ON SCHEDULE EVERY 1 HOUR STARTS '2025-10-31 16:50:06' ON COMPLETION NOT PRESERVE ENABLE DO CALL CleanupExpiredSessions()$$

CREATE DEFINER=`root`@`localhost` EVENT `cleanup_old_login_history` ON SCHEDULE EVERY 1 DAY STARTS '2025-10-31 16:50:06' ON COMPLETION NOT PRESERVE ENABLE DO DELETE FROM login_history 
    WHERE created_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 90 DAY)$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;




