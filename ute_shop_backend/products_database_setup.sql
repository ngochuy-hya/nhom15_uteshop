-- Tạo bảng Categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `slug` varchar(120) NOT NULL,
  `parentId` int(10) unsigned DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_slug` (`slug`),
  KEY `idx_categories_parent` (`parentId`),
  KEY `idx_categories_status` (`status`),
  KEY `idx_categories_sort` (`sortOrder`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parentId`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng Products
CREATE TABLE IF NOT EXISTS `products` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `originalPrice` decimal(12,2) DEFAULT NULL,
  `discountPercent` int(11) DEFAULT 0,
  `categoryId` int(10) unsigned NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `images` json NOT NULL,
  `thumbnailUrl` varchar(500) NOT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `sku` varchar(50) NOT NULL,
  `weight` decimal(8,2) DEFAULT NULL,
  `dimensions` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive','out_of_stock') NOT NULL DEFAULT 'active',
  `viewCount` int(11) NOT NULL DEFAULT 0,
  `soldCount` int(11) NOT NULL DEFAULT 0,
  `rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `reviewCount` int(11) NOT NULL DEFAULT 0,
  `isFeatures` tinyint(1) NOT NULL DEFAULT 0,
  `isBestSeller` tinyint(1) NOT NULL DEFAULT 0,
  `isNewArrival` tinyint(1) NOT NULL DEFAULT 0,
  `tags` json DEFAULT NULL,
  `specifications` json DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_sku` (`sku`),
  KEY `idx_products_category` (`categoryId`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_view_count` (`viewCount`),
  KEY `idx_products_sold_count` (`soldCount`),
  KEY `idx_products_rating` (`rating`),
  KEY `idx_products_discount` (`discountPercent`),
  KEY `idx_products_created` (`createdAt`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm dữ liệu mẫu cho Categories
INSERT INTO `categories` (`name`, `description`, `slug`, `parentId`, `image`, `icon`, `status`, `sortOrder`) VALUES
('Thời trang Nam', 'Quần áo và phụ kiện dành cho nam giới', 'thoi-trang-nam', NULL, '/image/category-men.jpg', '👔', 'active', 1),
('Thời trang Nữ', 'Quần áo và phụ kiện dành cho nữ giới', 'thoi-trang-nu', NULL, '/image/category-women.jpg', '👗', 'active', 2),
('Điện tử', 'Thiết bị điện tử và công nghệ', 'dien-tu', NULL, '/image/category-electronics.jpg', '📱', 'active', 3),
('Gia dụng', 'Đồ dùng gia đình và nội thất', 'gia-dung', NULL, '/image/category-home.jpg', '🏠', 'active', 4),
('Áo thun Nam', 'Áo thun các loại cho nam', 'ao-thun-nam', 1, '/image/subcategory-men-tshirt.jpg', NULL, 'active', 1),
('Quần Jean Nam', 'Quần jean nam thời trang', 'quan-jean-nam', 1, '/image/subcategory-men-jeans.jpg', NULL, 'active', 2),
('Váy Nữ', 'Váy các loại cho nữ', 'vay-nu', 2, '/image/subcategory-women-dress.jpg', NULL, 'active', 1),
('Áo khoác Nữ', 'Áo khoác thời trang nữ', 'ao-khoac-nu', 2, '/image/subcategory-women-jacket.jpg', NULL, 'active', 2),
('Điện thoại', 'Smartphone và thiết bị di động', 'dien-thoai', 3, '/image/subcategory-phone.jpg', NULL, 'active', 1),
('Laptop', 'Máy tính xách tay các hãng', 'laptop', 3, '/image/subcategory-laptop.jpg', NULL, 'active', 2)
ON DUPLICATE KEY UPDATE `updatedAt` = CURRENT_TIMESTAMP;

-- Thêm dữ liệu mẫu cho Products
INSERT INTO `products` (`name`, `description`, `price`, `originalPrice`, `discountPercent`, `categoryId`, `stock`, `images`, `thumbnailUrl`, `brand`, `sku`, `weight`, `dimensions`, `status`, `viewCount`, `soldCount`, `rating`, `reviewCount`, `isFeatures`, `isBestSeller`, `isNewArrival`, `tags`, `specifications`) VALUES
('Áo thun cotton cao cấp', 'Áo thun nam chất liệu cotton 100% thoáng mát, form regular fit', 299000, 399000, 25, 5, 100, '["\/image\/img_1.png", "\/image\/img_2.png", "\/image\/img_3.png"]', '/image/img_1.png', 'Fashion Brand', 'MTS001', 0.3, '40x30x2 cm', 'active', 1250, 89, 4.5, 23, 1, 0, 1, '["cotton", "thời trang", "basic"]', '{"material": "Cotton 100%", "fit": "Regular", "care": "Machine wash"}'),

('Quần jean skinny nam', 'Quần jean nam form skinny, chất liệu denim cao cấp', 599000, 799000, 25, 6, 80, '["\/image\/img_2.png", "\/image\/img_1.png", "\/image\/img_3.png"]', '/image/img_2.png', 'Denim Pro', 'MJ001', 0.8, '45x35x5 cm', 'active', 980, 156, 4.3, 45, 0, 1, 0, '["denim", "skinny", "thời trang"]', '{"material": "Denim 98% Cotton 2% Spandex", "fit": "Skinny", "wash": "Dark blue"}'),

('Váy maxi hoa nhí', 'Váy maxi nữ họa tiết hoa nhí dịu dàng, phù hợp dạo phố', 449000, 599000, 25, 7, 60, '["\/image\/img_3.png", "\/image\/img_1.png", "\/image\/img_2.png"]', '/image/img_3.png', 'Pretty Girl', 'WD001', 0.4, '50x40x3 cm', 'active', 2100, 67, 4.7, 31, 1, 0, 1, '["maxi", "hoa nhí", "dạo phố"]', '{"material": "Chiffon", "length": "Maxi", "pattern": "Floral"}'),

('Áo khoác bomber nữ', 'Áo khoác bomber nữ phong cách streetwear', 699000, 899000, 22, 8, 45, '["\/image\/img_1.png", "\/image\/img_3.png", "\/image\/img_2.png"]', '/image/img_1.png', 'Street Style', 'WJ001', 0.6, '55x45x4 cm', 'active', 876, 123, 4.4, 28, 0, 1, 0, '["bomber", "streetwear", "thời trang"]', '{"material": "Polyester", "style": "Bomber", "season": "Fall/Winter"}'),

('iPhone 15 Pro Max', 'iPhone 15 Pro Max 256GB - Titanium Natural', 29999000, 31999000, 6, 9, 25, '["\/image\/img_2.png", "\/image\/img_3.png", "\/image\/img_1.png"]', '/image/img_2.png', 'Apple', 'IP15PM256', 0.221, '16x7.8x0.83 cm', 'active', 3420, 89, 4.8, 156, 1, 1, 1, '["iPhone", "Pro Max", "Apple"]', '{"storage": "256GB", "color": "Titanium Natural", "display": "6.7 inch", "chip": "A17 Pro"}'),

('MacBook Air M2', 'MacBook Air 13 inch với chip M2, 256GB SSD', 26999000, 28999000, 7, 10, 15, '["\/image\/img_3.png", "\/image\/img_2.png", "\/image\/img_1.png"]', '/image/img_3.png', 'Apple', 'MBA13M2256', 1.24, '30.4x21.5x1.13 cm', 'active', 2890, 45, 4.6, 89, 1, 1, 0, '["MacBook", "Air", "M2"]', '{"processor": "Apple M2", "memory": "8GB", "storage": "256GB SSD", "display": "13.6 inch"}'),

('Áo polo nam basic', 'Áo polo nam chất liệu pique cotton thoáng mát', 199000, 299000, 33, 5, 150, '["\/image\/img_1.png", "\/image\/img_2.png"]', '/image/img_1.png', 'Basic Fashion', 'MP001', 0.25, '38x28x2 cm', 'active', 567, 234, 4.2, 67, 0, 0, 1, '["polo", "basic", "cotton"]', '{"material": "Cotton Pique", "collar": "Polo", "fit": "Regular"}'),

('Chân váy chữ A', 'Chân váy chữ A dáng xòe phối màu trẻ trung', 329000, 429000, 23, 7, 90, '["\/image\/img_2.png", "\/image\/img_3.png"]', '/image/img_2.png', 'Youth Style', 'WS001', 0.3, '45x35x3 cm', 'active', 1123, 178, 4.3, 42, 0, 0, 1, '["chữ A", "xòe", "trẻ trung"]', '{"material": "Polyester blend", "length": "Knee length", "fit": "A-line"}'),

('Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24 Ultra 512GB màu Titanium Gray', 27999000, 29999000, 7, 9, 30, '["\/image\/img_3.png", "\/image\/img_1.png"]', '/image/img_3.png', 'Samsung', 'SGS24U512', 0.232, '16.3x7.9x0.86 cm', 'active', 2156, 67, 4.5, 98, 1, 1, 1, '["Samsung", "Galaxy", "S24 Ultra"]', '{"storage": "512GB", "display": "6.8 inch", "camera": "200MP", "battery": "5000mAh"}'),

('Laptop Gaming ASUS ROG', 'ASUS ROG Strix G15 gaming laptop RTX 4060', 23999000, 25999000, 8, 10, 20, '["\/image\/img_1.png", "\/image\/img_3.png"]', '/image/img_1.png', 'ASUS', 'ROGG15RTX4060', 2.3, '35.4x25.9x2.34 cm', 'active', 1890, 34, 4.4, 76, 1, 0, 1, '["gaming", "ASUS", "ROG"]', '{"processor": "AMD Ryzen 7", "graphics": "RTX 4060", "memory": "16GB DDR5", "storage": "512GB SSD"}'),

('Áo sơ mi nam công sở', 'Áo sơ mi nam màu trắng phong cách công sở', 249000, 349000, 29, 5, 120, '["\/image\/img_2.png", "\/image\/img_1.png"]', '/image/img_2.png', 'Office Style', 'MS001', 0.35, '42x32x2 cm', 'active', 789, 145, 4.1, 34, 0, 0, 0, '["sơ mi", "công sở", "formal"]', '{"material": "Cotton blend", "collar": "Spread", "fit": "Slim"}'),

('Blazer nữ thanh lịch', 'Blazer nữ màu be phong cách thanh lịch cho công sở', 899000, 1199000, 25, 8, 35, '["\/image\/img_3.png", "\/image\/img_2.png"]', '/image/img_3.png', 'Elegant', 'WB001', 0.7, '60x50x4 cm', 'active', 1456, 89, 4.6, 56, 1, 0, 0, '["blazer", "thanh lịch", "công sở"]', '{"material": "Wool blend", "style": "Single breasted", "fit": "Tailored"}}')
ON DUPLICATE KEY UPDATE `updatedAt` = CURRENT_TIMESTAMP;

SELECT 'Products and Categories database setup completed!' as status;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_products FROM products;
