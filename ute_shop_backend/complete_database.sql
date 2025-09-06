-- =============================================
-- UTEShop - Complete Database Setup
-- Tạo database hoàn chỉnh cho XAMPP
-- =============================================

-- Tạo database
DROP DATABASE IF EXISTS uteshop;
CREATE DATABASE uteshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE uteshop;

-- =============================================
-- Bảng Users
-- =============================================
CREATE TABLE users (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  email varchar(100) NOT NULL,
  password varchar(255) NOT NULL,
  fullName varchar(100) NOT NULL,
  phone varchar(15) DEFAULT NULL,
  address text DEFAULT NULL,
  avatar varchar(255) DEFAULT NULL,
  isVerified tinyint(1) NOT NULL DEFAULT 0,
  createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_email (email),
  KEY idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Bảng OTPs
-- =============================================
CREATE TABLE otps (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  email varchar(100) NOT NULL,
  otp varchar(6) NOT NULL,
  type enum('register','forgot-password') NOT NULL,
  expiresAt datetime NOT NULL,
  createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_otps_email_type (email, type),
  KEY idx_otps_expires (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Bảng Categories
-- =============================================
CREATE TABLE categories (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  name varchar(100) NOT NULL,
  description text DEFAULT NULL,
  slug varchar(120) NOT NULL,
  parentId int(10) unsigned DEFAULT NULL,
  image varchar(500) DEFAULT NULL,
  icon varchar(100) DEFAULT NULL,
  status enum('active','inactive') NOT NULL DEFAULT 'active',
  sortOrder int(11) NOT NULL DEFAULT 0,
  createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_slug (slug),
  KEY idx_categories_parent (parentId),
  KEY idx_categories_status (status),
  KEY idx_categories_sort (sortOrder),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parentId) REFERENCES categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Bảng Products
-- =============================================
CREATE TABLE products (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  name varchar(200) NOT NULL,
  description text NOT NULL,
  price decimal(12,2) NOT NULL,
  originalPrice decimal(12,2) DEFAULT NULL,
  discountPercent int(11) DEFAULT 0,
  categoryId int(10) unsigned NOT NULL,
  stock int(11) NOT NULL DEFAULT 0,
  images json NOT NULL,
  thumbnailUrl varchar(500) NOT NULL,
  brand varchar(100) DEFAULT NULL,
  sku varchar(50) NOT NULL,
  weight decimal(8,2) DEFAULT NULL,
  dimensions varchar(100) DEFAULT NULL,
  status enum('active','inactive','out_of_stock') NOT NULL DEFAULT 'active',
  viewCount int(11) NOT NULL DEFAULT 0,
  soldCount int(11) NOT NULL DEFAULT 0,
  rating decimal(3,2) NOT NULL DEFAULT 0.00,
  reviewCount int(11) NOT NULL DEFAULT 0,
  isFeatures tinyint(1) NOT NULL DEFAULT 0,
  isBestSeller tinyint(1) NOT NULL DEFAULT 0,
  isNewArrival tinyint(1) NOT NULL DEFAULT 0,
  tags json DEFAULT NULL,
  specifications json DEFAULT NULL,
  createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_sku (sku),
  KEY idx_products_category (categoryId),
  KEY idx_products_status (status),
  KEY idx_products_view_count (viewCount),
  KEY idx_products_sold_count (soldCount),
  KEY idx_products_rating (rating),
  KEY idx_products_discount (discountPercent),
  KEY idx_products_created (createdAt),
  CONSTRAINT fk_products_category FOREIGN KEY (categoryId) REFERENCES categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Bảng Orders (Thêm cho tính năng đơn hàng)
-- =============================================
CREATE TABLE orders (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  userId int(10) unsigned NOT NULL,
  orderNumber varchar(50) NOT NULL,
  status enum('pending','confirmed','shipping','delivered','cancelled') NOT NULL DEFAULT 'pending',
  totalAmount decimal(12,2) NOT NULL,
  shippingAddress text NOT NULL,
  paymentMethod varchar(50) DEFAULT 'cod',
  paymentStatus enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
  notes text DEFAULT NULL,
  createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_order_number (orderNumber),
  KEY idx_orders_user (userId),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_user FOREIGN KEY (userId) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Bảng Order Items
-- =============================================
CREATE TABLE order_items (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  orderId int(10) unsigned NOT NULL,
  productId int(10) unsigned NOT NULL,
  quantity int(11) NOT NULL,
  price decimal(12,2) NOT NULL,
  totalPrice decimal(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (orderId),
  KEY idx_order_items_product (productId),
  CONSTRAINT fk_order_items_order FOREIGN KEY (orderId) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (productId) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Insert dữ liệu mẫu Users
-- =============================================
INSERT INTO users (email, password, fullName, phone, address, avatar, isVerified) VALUES
('admin@uteshop.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin UTEShop', '0123456789', '123 Đường ABC, Quận 1, TP.HCM', 'https://ui-avatars.com/api/?name=Admin&background=3b82f6&color=ffffff', 1),
('user1@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nguyễn Văn An', '0987654321', '456 Đường XYZ, Quận 2, TP.HCM', 'https://ui-avatars.com/api/?name=Nguyen+Van+An&background=10b981&color=ffffff', 1),
('user2@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Trần Thị Bình', '0123456780', '789 Đường DEF, Quận 3, TP.HCM', 'https://ui-avatars.com/api/?name=Tran+Thi+Binh&background=f59e0b&color=ffffff', 0),
('customer1@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lê Văn Cường', '0901234567', '321 Đường GHI, Quận 4, TP.HCM', 'https://ui-avatars.com/api/?name=Le+Van+Cuong&background=ef4444&color=ffffff', 1),
('customer2@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Phạm Thị Dung', '0912345678', '654 Đường JKL, Quận 5, TP.HCM', 'https://ui-avatars.com/api/?name=Pham+Thi+Dung&background=8b5cf6&color=ffffff', 1);

-- =============================================
-- Insert dữ liệu mẫu Categories
-- =============================================
INSERT INTO categories (name, description, slug, parentId, image, icon, status, sortOrder) VALUES
('Thời trang Nam', 'Quần áo và phụ kiện dành cho nam giới', 'thoi-trang-nam', NULL, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&h=300&fit=crop', '👔', 'active', 1),
('Thời trang Nữ', 'Quần áo và phụ kiện dành cho nữ giới', 'thoi-trang-nu', NULL, 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=500&h=300&fit=crop', '👗', 'active', 2),
('Điện tử', 'Thiết bị điện tử và công nghệ', 'dien-tu', NULL, 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=500&h=300&fit=crop', '📱', 'active', 3),
('Gia dụng', 'Đồ dùng gia đình và nội thất', 'gia-dung', NULL, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=300&fit=crop', '🏠', 'active', 4),
('Giày dép', 'Giày dép nam nữ các loại', 'giay-dep', NULL, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=300&fit=crop', '👟', 'active', 5),

-- Sub categories for Thời trang Nam
('Áo thun Nam', 'Áo thun các loại cho nam', 'ao-thun-nam', 1, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=200&fit=crop', NULL, 'active', 1),
('Quần Jean Nam', 'Quần jean nam thời trang', 'quan-jean-nam', 1, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=200&fit=crop', NULL, 'active', 2),
('Áo sơ mi Nam', 'Áo sơ mi công sở và casual', 'ao-so-mi-nam', 1, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300&h=200&fit=crop', NULL, 'active', 3),

-- Sub categories for Thời trang Nữ
('Váy Nữ', 'Váy các loại cho nữ', 'vay-nu', 2, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=200&fit=crop', NULL, 'active', 1),
('Áo khoác Nữ', 'Áo khoác thời trang nữ', 'ao-khoac-nu', 2, 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=300&h=200&fit=crop', NULL, 'active', 2),
('Áo thun Nữ', 'Áo thun nữ đa dạng kiểu dáng', 'ao-thun-nu', 2, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=300&h=200&fit=crop', NULL, 'active', 3),

-- Sub categories for Điện tử
('Điện thoại', 'Smartphone và thiết bị di động', 'dien-thoai', 3, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=200&fit=crop', NULL, 'active', 1),
('Laptop', 'Máy tính xách tay các hãng', 'laptop', 3, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=200&fit=crop', NULL, 'active', 2),
('Phụ kiện điện tử', 'Tai nghe, sạc, ốp lưng...', 'phu-kien-dien-tu', 3, 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300&h=200&fit=crop', NULL, 'active', 3);

-- =============================================
-- Insert dữ liệu mẫu Products
-- =============================================
INSERT INTO products (name, description, price, originalPrice, discountPercent, categoryId, stock, images, thumbnailUrl, brand, sku, weight, dimensions, status, viewCount, soldCount, rating, reviewCount, isFeatures, isBestSeller, isNewArrival, tags, specifications) VALUES

-- Thời trang Nam
('Áo thun cotton cao cấp nam', 'Áo thun nam chất liệu cotton 100% thoáng mát, form regular fit. Thiết kế đơn giản, phù hợp mọi lứa tuổi và phong cách.', 299000, 399000, 25, 6, 150, 
'["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1503341338985-95b72d5ad3df?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1559563458-527698bf5295?w=500&h=500&fit=crop"]', 
'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop', 'Fashion Pro', 'MTS001', 0.3, '40x30x2 cm', 'active', 1250, 289, 4.5, 67, 1, 0, 1, '["cotton", "thời trang", "basic", "nam"]', '{"material": "Cotton 100%", "fit": "Regular", "care": "Machine wash", "origin": "Vietnam"}'),

('Quần jean skinny nam cao cấp', 'Quần jean nam form skinny, chất liệu denim cao cấp co giãn nhẹ. Thiết kế hiện đại, phù hợp đi làm và đi chơi.', 599000, 799000, 25, 7, 80, 
'["https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1514554591549-4fd63078100b?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1508932465655-6e503b1c07cd?w=500&h=500&fit=crop"]',
'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=500&fit=crop', 'Denim Master', 'MJ001', 0.8, '45x35x5 cm', 'active', 980, 156, 4.3, 45, 0, 1, 0, '["denim", "skinny", "thời trang", "nam"]', '{"material": "Denim 98% Cotton 2% Spandex", "fit": "Skinny", "wash": "Dark blue", "origin": "Vietnam"}'),

('Áo sơ mi trắng công sở nam', 'Áo sơ mi nam màu trắng phong cách công sở, chất liệu cotton blend thoáng mát. Thiết kế lịch lãm, phù hợp môi trường làm việc.', 449000, 599000, 25, 8, 120, 
'["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=500&fit=crop"]',
'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&h=500&fit=crop', 'Office Style', 'MS001', 0.35, '42x32x2 cm', 'active', 789, 145, 4.1, 34, 0, 0, 0, '["sơ mi", "công sở", "formal", "nam"]', '{"material": "Cotton blend", "collar": "Spread", "fit": "Slim", "origin": "Vietnam"}'),

-- Thời trang Nữ
('Váy maxi hoa nhí dịu dàng', 'Váy maxi nữ họa tiết hoa nhí dịu dàng, chất liệu chiffon nhẹ nhàng. Phù hợp dạo phố, đi chơi cuối tuần.', 549000, 699000, 22, 9, 60, 
'["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1485646029578-a7a18b69e1e6?w=500&h=500&fit=crop"]',
'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=500&fit=crop', 'Pretty Girl', 'WD001', 0.4, '50x40x3 cm', 'active', 2100, 67, 4.7, 31, 1, 0, 1, '["maxi", "hoa nhí", "dạo phố", "nữ"]', '{"material": "Chiffon", "length": "Maxi", "pattern": "Floral", "origin": "Vietnam"}'),

('Áo khoác bomber nữ streetwear', 'Áo khoác bomber nữ phong cách streetwear hiện đại. Chất liệu polyester bền đẹp, thiết kế trẻ trung năng động.', 899000, 1199000, 25, 10, 45, 
'["https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500&h=500&fit=crop"]',
'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=500&h=500&fit=crop', 'Street Style', 'WJ001', 0.6, '55x45x4 cm', 'active', 876, 123, 4.4, 28, 0, 1, 0, '["bomber", "streetwear", "thời trang", "nữ"]', '{"material": "Polyester", "style": "Bomber", "season": "Fall/Winter", "origin": "Vietnam"}'),

('Áo thun nữ basic cotton', 'Áo thun nữ thiết kế basic, chất liệu cotton mềm mại. Form áo vừa vặn, dễ phối đồ với nhiều trang phục khác.', 199000, 299000, 33, 11, 200, 
'["https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1544441893-675973e31985?w=500&h=500&fit=crop"]',
'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&h=500&fit=crop', 'Basic Fashion', 'WT001', 0.25, '38x28x2 cm', 'active', 567, 334, 4.2, 89, 0, 1, 1, '["basic", "cotton", "thời trang", "nữ"]', '{"material": "Cotton 100%", "fit": "Regular", "care": "Machine wash", "origin": "Vietnam"}'),

-- Điện tử
('iPhone 15 Pro Max 256GB', 'iPhone 15 Pro Max 256GB màu Titanium Natural. Chip A17 Pro mạnh mẽ, camera 48MP chuyên nghiệp. Bảo hành chính hãng 12 tháng.', 29999000, 31999000, 6, 12, 25, 
'["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&h=500&fit=crop&auto=format&fit=crop&w=500&q=60"]',
'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&h=500&fit=crop', 'Apple', 'IP15PM256', 0.221, '16x7.8x0.83 cm', 'active', 3420, 89, 4.8, 156, 1, 1, 1, '["iPhone", "Pro Max", "Apple", "5G"]', '{"storage": "256GB", "color": "Titanium Natural", "display": "6.7 inch", "chip": "A17 Pro", "camera": "48MP", "warranty": "12 months"}'),

('MacBook Air M2 13 inch', 'MacBook Air 13 inch với chip M2 8-core, RAM 8GB, SSD 256GB. Thiết kế mỏng nhẹ, hiệu năng mạnh mẽ cho công việc và giải trí.', 26999000, 28999000, 7, 13, 15, 
'["https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop"]',
'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&h=500&fit=crop', 'Apple', 'MBA13M2256', 1.24, '30.4x21.5x1.13 cm', 'active', 2890, 45, 4.6, 89, 1, 1, 0, '["MacBook", "Air", "M2", "laptop"]', '{"processor": "Apple M2", "memory": "8GB", "storage": "256GB SSD", "display": "13.6 inch", "battery": "Up to 18 hours", "warranty": "12 months"}'),

('Samsung Galaxy S24 Ultra 512GB', 'Samsung Galaxy S24 Ultra 512GB màu Titanium Gray. Camera 200MP zoom 100x, S Pen tích hợp. Hiệu năng đỉnh cao với Snapdragon 8 Gen 3.', 27999000, 29999000, 7, 12, 30, 
'["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500&h=500&fit=crop"]',
'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&h=500&fit=crop', 'Samsung', 'SGS24U512', 0.232, '16.3x7.9x0.86 cm', 'active', 2156, 67, 4.5, 98, 1, 1, 1, '["Samsung", "Galaxy", "S24 Ultra", "5G"]', '{"storage": "512GB", "display": "6.8 inch", "camera": "200MP", "battery": "5000mAh", "spen": "Yes", "warranty": "12 months"}'),

('Laptop Gaming ASUS ROG Strix G15', 'ASUS ROG Strix G15 gaming laptop AMD Ryzen 7, RTX 4060, RAM 16GB DDR5, SSD 512GB. Màn hình 15.6" 144Hz, hiệu năng gaming mạnh mẽ.', 23999000, 25999000, 8, 13, 20, 
'["https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1664735212829-71bb18c2f47a?w=500&h=500&fit=crop"]',
'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&h=500&fit=crop', 'ASUS', 'ROGG15RTX4060', 2.3, '35.4x25.9x2.34 cm', 'active', 1890, 34, 4.4, 76, 1, 0, 1, '["gaming", "ASUS", "ROG", "laptop"]', '{"processor": "AMD Ryzen 7", "graphics": "RTX 4060", "memory": "16GB DDR5", "storage": "512GB SSD", "display": "15.6 inch 144Hz", "warranty": "24 months"}'),

-- Giày dép 
('Giày sneaker nam Nike Air Force 1', 'Giày sneaker Nike Air Force 1 classic màu trắng. Thiết kế iconic, phù hợp với mọi phong cách thời trang. Chất liệu da cao cấp bền đẹp.', 2799000, 3299000, 15, 5, 75, 
'["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500&h=500&fit=crop"]',
'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop', 'Nike', 'NAF1WHITE', 0.8, '32x22x12 cm', 'active', 1456, 198, 4.3, 87, 0, 1, 0, '["Nike", "Air Force 1", "sneaker", "nam"]', '{"material": "Leather", "sole": "Rubber", "color": "White", "sizes": "39-44", "warranty": "6 months"}'),

('Giày cao gót nữ 7cm thanh lịch', 'Giày cao gót nữ 7cm màu nude, thiết kế thanh lịch phù hợp đi làm. Chất liệu da mềm, đế êm ái thoải mái cả ngày dài.', 1299000, 1699000, 24, 5, 65, 
'["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1533720535419-d0b1c6f37a45?w=500&h=500&fit=crop"]',
'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=500&fit=crop', 'Elegant', 'WH7NUDE', 0.4, '28x18x8 cm', 'active', 892, 156, 4.2, 43, 0, 0, 1, '["cao gót", "nữ", "công sở", "thanh lịch"]', '{"material": "Genuine leather", "heel": "7cm", "color": "Nude", "sizes": "35-40", "warranty": "3 months"}'),

-- Thêm sản phẩm bán chạy và được xem nhiều
('Áo polo nam basic cao cấp', 'Áo polo nam chất liệu pique cotton thoáng mát, thiết kế basic dễ phối đồ. Form áo vừa vặn, phù hợp đi làm và đi chơi.', 399000, 499000, 20, 6, 180, 
'["https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&h=500&fit=crop"]',
'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=500&h=500&fit=crop', 'Basic Fashion', 'MP001', 0.28, '38x28x2 cm', 'active', 2567, 434, 4.4, 167, 0, 1, 0, '["polo", "basic", "cotton", "nam"]', '{"material": "Cotton Pique", "collar": "Polo", "fit": "Regular", "origin": "Vietnam"}'),

('Chân váy chữ A nữ thời trang', 'Chân váy chữ A dáng xòe phối màu trẻ trung, chất liệu polyester blend. Thiết kế hiện đại, dễ phối với áo thun, áo sơ mi.', 329000, 429000, 23, 9, 90, 
'["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1485463611174-f302f6a5c1c9?w=500&h=500&fit=crop"]',
'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=500&fit=crop', 'Youth Style', 'WS001', 0.3, '45x35x3 cm', 'active', 1823, 278, 4.3, 89, 0, 1, 1, '["chữ A", "xòe", "trẻ trung", "nữ"]', '{"material": "Polyester blend", "length": "Knee length", "fit": "A-line", "origin": "Vietnam"}'),

('Điện thoại Xiaomi Redmi Note 13', 'Xiaomi Redmi Note 13 8GB/256GB màu xanh dương. Camera 108MP, pin 5000mAh, sạc nhanh 33W. Hiệu năng ổn định, giá cả phải chăng.', 5999000, 6999000, 14, 12, 150, 
'["https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=500&h=500&fit=crop"]',
'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&h=500&fit=crop', 'Xiaomi', 'XRN13256', 0.189, '16.2x7.6x0.8 cm', 'active', 3890, 567, 4.1, 234, 0, 1, 1, '["Xiaomi", "Redmi", "smartphone", "5G"]', '{"storage": "256GB", "memory": "8GB", "camera": "108MP", "battery": "5000mAh", "charging": "33W", "warranty": "18 months"}');

-- =============================================
-- Insert dữ liệu mẫu Orders
-- =============================================
INSERT INTO orders (userId, orderNumber, status, totalAmount, shippingAddress, paymentMethod, paymentStatus, notes) VALUES
(2, 'ORD-2024-001', 'delivered', 1498000, '456 Đường XYZ, Quận 2, TP.HCM', 'cod', 'paid', 'Giao hàng giờ hành chính'),
(2, 'ORD-2024-002', 'shipping', 549000, '456 Đường XYZ, Quận 2, TP.HCM', 'banking', 'paid', 'Giao hàng nhanh'),
(4, 'ORD-2024-003', 'confirmed', 2799000, '321 Đường GHI, Quận 4, TP.HCM', 'cod', 'pending', 'Kiểm tra hàng trước khi thanh toán'),
(5, 'ORD-2024-004', 'pending', 898000, '654 Đường JKL, Quận 5, TP.HCM', 'banking', 'pending', '');

-- =============================================
-- Insert dữ liệu mẫu Order Items
-- =============================================
INSERT INTO order_items (orderId, productId, quantity, price, totalPrice) VALUES
-- Order 1
(1, 1, 2, 299000, 598000),
(1, 2, 1, 599000, 599000),
(1, 15, 1, 399000, 399000),
-- Order 2  
(2, 4, 1, 549000, 549000),
-- Order 3
(3, 11, 1, 2799000, 2799000),
-- Order 4
(4, 5, 1, 899000, 899000);

-- =============================================
-- Insert dữ liệu mẫu OTPs (cho test)
-- =============================================
INSERT INTO otps (email, otp, type, expiresAt) VALUES
('user2@test.com', '123456', 'register', DATE_ADD(NOW(), INTERVAL 10 MINUTE)),
('test@example.com', '654321', 'forgot-password', DATE_ADD(NOW(), INTERVAL 10 MINUTE));

-- =============================================
-- Stored Procedures
-- =============================================

-- Procedure để xóa OTP hết hạn
DELIMITER //
CREATE PROCEDURE CleanExpiredOTPs()
BEGIN
    DELETE FROM otps WHERE expiresAt < NOW();
END //
DELIMITER ;

-- Procedure để lấy thông tin user theo email
DELIMITER //
CREATE PROCEDURE GetUserByEmail(IN user_email VARCHAR(100))
BEGIN
    SELECT * FROM users WHERE email = user_email;
END //
DELIMITER ;

-- Procedure để lấy sản phẩm bán chạy
DELIMITER //
CREATE PROCEDURE GetBestSellingProducts(IN limit_count INT)
BEGIN
    SELECT p.*, c.name as categoryName, c.slug as categorySlug 
    FROM products p 
    LEFT JOIN categories c ON p.categoryId = c.id 
    WHERE p.status = 'active' AND p.stock > 0
    ORDER BY p.soldCount DESC 
    LIMIT limit_count;
END //
DELIMITER ;

-- Procedure để lấy sản phẩm được xem nhiều
DELIMITER //
CREATE PROCEDURE GetMostViewedProducts(IN limit_count INT)
BEGIN
    SELECT p.*, c.name as categoryName, c.slug as categorySlug 
    FROM products p 
    LEFT JOIN categories c ON p.categoryId = c.id 
    WHERE p.status = 'active' AND p.stock > 0
    ORDER BY p.viewCount DESC 
    LIMIT limit_count;
END //
DELIMITER ;

-- =============================================
-- Events
-- =============================================

-- Event để tự động xóa OTP hết hạn (chạy mỗi giờ)
CREATE EVENT IF NOT EXISTS clean_expired_otps_event
ON SCHEDULE EVERY 1 HOUR
DO CALL CleanExpiredOTPs();

-- =============================================
-- Indexes để tối ưu hiệu suất
-- =============================================
CREATE INDEX idx_products_created_featured ON products(createdAt, isFeatures);
CREATE INDEX idx_products_bestseller_stock ON products(isBestSeller, stock);
CREATE INDEX idx_products_newarrival_stock ON products(isNewArrival, stock);
CREATE INDEX idx_orders_user_status ON orders(userId, status);
CREATE INDEX idx_order_items_order_product ON order_items(orderId, productId);

-- =============================================
-- Views để truy vấn dễ dàng
-- =============================================

-- View sản phẩm với thông tin category
CREATE VIEW v_products_with_category AS
SELECT 
    p.*,
    c.name as categoryName,
    c.slug as categorySlug,
    c.image as categoryImage,
    pc.name as parentCategoryName
FROM products p
LEFT JOIN categories c ON p.categoryId = c.id
LEFT JOIN categories pc ON c.parentId = pc.id
WHERE p.status = 'active';

-- View đơn hàng với thông tin user
CREATE VIEW v_orders_with_user AS
SELECT 
    o.*,
    u.fullName as customerName,
    u.email as customerEmail,
    u.phone as customerPhone
FROM orders o
LEFT JOIN users u ON o.userId = u.id;

-- =============================================
-- Kết thúc setup
-- =============================================

-- Show summary
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_orders FROM orders;
SELECT COUNT(*) as total_otps FROM otps;

-- Show sample data
SELECT 'Sample Users:' as info;
SELECT id, email, fullName, isVerified FROM users LIMIT 5;

SELECT 'Sample Products:' as info;
SELECT id, name, price, stock, categoryId FROM products LIMIT 5;

SELECT 'Sample Categories:' as info;
SELECT id, name, slug, parentId FROM categories LIMIT 10;
