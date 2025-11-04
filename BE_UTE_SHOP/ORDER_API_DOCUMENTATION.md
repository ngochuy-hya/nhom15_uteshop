# 📦 ORDER API - Tài liệu đầy đủ

## 📋 Tổng quan

API Order quản lý đơn hàng trong hệ thống UTESHOP. Dựa trên database schema với các bảng:
- `orders` - Bảng đơn hàng chính
- `order_items` - Chi tiết sản phẩm trong đơn hàng
- `order_statuses` - Trạng thái đơn hàng
- `order_status_history` - Lịch sử thay đổi trạng thái

---

## 🔗 Base URL
```
/api/orders
```

---

## 📚 DANH SÁCH API

### 👤 USER APIs (Cần đăng nhập)

#### 1. Tạo đơn hàng mới
```
POST /api/orders
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "selected_color": "Đen",
      "selected_size": "L"
    }
  ],
  "shipping_address": {
    "full_name": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường ABC",
    "ward": "Phường 1",
    "district": "Quận 1",
    "city": "TP.HCM"
  },
  "billing_address": {
    "full_name": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường ABC",
    "ward": "Phường 1",
    "district": "Quận 1",
    "city": "TP.HCM"
  },
  "payment_method": "payos",
  "notes": "Giao hàng buổi sáng",
  "coupon_code": "SALE10" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo đơn hàng thành công",
  "data": {
    "id": 1,
    "order_number": "UTE-2024-000001",
    "user_id": 1,
    "status_id": 1,
    "status_name": "pending",
    "subtotal": 500000,
    "tax_amount": 50000,
    "shipping_amount": 50000,
    "discount_amount": 0,
    "total_amount": 600000,
    "payment_method": "payos",
    "payment_status": "pending",
    "shipping_address": {...},
    "billing_address": {...},
    "created_at": "2024-01-15T10:30:00Z",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "Áo sơ mi nam",
        "quantity": 2,
        "unit_price": 250000,
        "total_price": 500000,
        "selected_color": "Đen",
        "selected_size": "L"
      }
    ]
  }
}
```

---

#### 2. Lấy danh sách đơn hàng của user
```
GET /api/orders/my-orders
```

**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số lượng/trang (default: 10)
- `status_id` (optional): Lọc theo trạng thái (1-6)

**Response:**
```json
{
  "success": true,
  "message": "Lấy danh sách đơn hàng thành công",
  "data": {
    "orders": [
      {
        "id": 1,
        "order_number": "UTE-2024-000001",
        "total_amount": 600000,
        "status_id": 1,
        "status_name": "pending",
        "status_color": "#ffc107",
        "payment_status": "pending",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 10,
      "total": 25,
      "total_pages": 3
    }
  }
}
```

---

#### 3. Lấy chi tiết đơn hàng
```
GET /api/orders/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Lấy chi tiết đơn hàng thành công",
  "data": {
    "id": 1,
    "order_number": "UTE-2024-000001",
    "status_id": 1,
    "status_name": "pending",
    "subtotal": 500000,
    "tax_amount": 50000,
    "shipping_amount": 50000,
    "discount_amount": 0,
    "total_amount": 600000,
    "payment_method": "payos",
    "payment_status": "pending",
    "shipping_address": {...},
    "billing_address": {...},
    "tracking_number": null,
    "shipped_at": null,
    "delivered_at": null,
    "created_at": "2024-01-15T10:30:00Z",
    "items": [...],
    "status_history": [...]
  }
}
```

---

#### 4. Hủy đơn hàng
```
POST /api/orders/:id/cancel
```

**Request Body:**
```json
{
  "reason": "Không cần nữa"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hủy đơn hàng thành công"
}
```

**Lưu ý:** Chỉ có thể hủy đơn ở trạng thái `pending` (1) hoặc `processing` (2)

---

#### 5. Yêu cầu trả hàng
```
POST /api/orders/:id/return
```

**Request Body:**
```json
{
  "reason": "Sản phẩm bị lỗi",
  "items": [
    {
      "order_item_id": 1,
      "quantity": 1,
      "reason": "Bị rách"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Yêu cầu trả hàng đã được gửi",
  "data": {
    "return_id": 1
  }
}
```

**Lưu ý:** 
- Chỉ có thể trả hàng khi đơn hàng đã giao (status_id = 4)
- Thời hạn: Trong vòng 7 ngày kể từ ngày giao

---

#### 6. Xem hóa đơn (Invoice)
```
GET /api/orders/:id/invoice
```

**Response:**
```json
{
  "success": true,
  "message": "Lấy hóa đơn thành công",
  "data": {
    "order": {...},
    "items": [
      {
        "id": 1,
        "product_name": "Áo sơ mi nam",
        "product_sku": "SHIRT-001",
        "quantity": 2,
        "unit_price": 250000,
        "total_price": 500000
      }
    ],
    "user": {
      "first_name": "Nguyễn",
      "last_name": "Văn A",
      "email": "nguyenvana@email.com",
      "phone": "0123456789"
    }
  }
}
```

---

### 🔐 ADMIN APIs (Cần quyền admin)

#### 7. Lấy tất cả đơn hàng (Admin)
```
GET /api/orders/admin/all
```

**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số lượng/trang (default: 20)
- `status_id` (optional): Lọc theo trạng thái
- `payment_status` (optional): `pending` | `paid` | `failed` | `refunded`
- `search` (optional): Tìm theo order_number, email, tên
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "message": "Lấy danh sách đơn hàng thành công",
  "data": {
    "orders": [
      {
        "id": 1,
        "order_number": "UTE-2024-000001",
        "total_amount": 600000,
        "status_id": 1,
        "status_name": "pending",
        "status_color": "#ffc107",
        "payment_status": "pending",
        "email": "nguyenvana@email.com",
        "first_name": "Nguyễn",
        "last_name": "Văn A",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

---

#### 8. Cập nhật trạng thái đơn hàng (Admin)
```
PUT /api/orders/admin/:id/status
```

**Request Body:**
```json
{
  "status_id": 3,
  "notes": "Đã gửi hàng",
  "tracking_number": "VN1234567890" // Optional
}
```

**Trạng thái đơn hàng:**
- `1` - pending (Chờ xử lý)
- `2` - processing (Đang xử lý)
- `3` - shipped (Đã gửi hàng)
- `4` - delivered (Đã giao hàng)
- `5` - cancelled (Đã hủy)
- `6` - returned (Đã trả hàng)

**Response:**
```json
{
  "success": true,
  "message": "Cập nhật trạng thái đơn hàng thành công"
}
```

---

#### 9. Thống kê đơn hàng (Admin)
```
GET /api/orders/admin/statistics
```

**Query Parameters:**
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "message": "Lấy thống kê đơn hàng thành công",
  "data": {
    "total_orders": 150,
    "total_revenue": 50000000,
    "average_order_value": 333333,
    "paid_orders": 140,
    "pending_orders": 10,
    "delivered_orders": 130,
    "cancelled_orders": 5
  }
}
```

---

## 🗄️ DATABASE SCHEMA

### Bảng `orders`
```sql
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    status_id INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cod', 'payos') NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    shipping_address JSON NOT NULL,
    billing_address JSON NOT NULL,
    notes TEXT,
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (status_id) REFERENCES order_statuses(id)
);
```

### Bảng `order_items`
```sql
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    selected_color VARCHAR(100),
    selected_size VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### Bảng `order_statuses`
```sql
CREATE TABLE order_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Dữ liệu mẫu:**
```sql
INSERT INTO order_statuses (status_name, description, color) VALUES
('pending', 'Chờ xử lý', '#ffc107'),
('processing', 'Đang xử lý', '#17a2b8'),
('shipped', 'Đã gửi hàng', '#28a745'),
('delivered', 'Đã giao hàng', '#6c757d'),
('cancelled', 'Đã hủy', '#dc3545'),
('returned', 'Đã trả hàng', '#fd7e14');
```

---

## 🔄 LUỒNG XỬ LÝ ĐƠN HÀNG

```
1. User tạo đơn hàng
   ↓
2. Order được tạo với status_id = 1 (pending)
   ↓
3. Admin xử lý đơn (status_id = 2 - processing)
   ↓
4. Admin gửi hàng (status_id = 3 - shipped)
   ↓
5. Đơn hàng được giao (status_id = 4 - delivered)
   ↓
6. Nếu có vấn đề → Trả hàng (status_id = 6 - returned)
```

---

## 💡 CÁC TÍNH NĂNG ĐÃ CÓ

✅ Tạo đơn hàng với validation
✅ Lấy danh sách đơn hàng (có pagination, filter)
✅ Xem chi tiết đơn hàng
✅ Hủy đơn hàng (với điều kiện)
✅ Yêu cầu trả hàng
✅ Xem hóa đơn
✅ Admin quản lý tất cả đơn hàng
✅ Admin cập nhật trạng thái đơn hàng
✅ Admin xem thống kê
✅ Tự động trừ tồn kho khi tạo đơn
✅ Tự động hoàn tồn kho khi hủy đơn
✅ Lịch sử thay đổi trạng thái
✅ Tự động generate order number

---

## 📝 GHI CHÚ

1. **Order Number Format:** `UTE-YYYY-NNNNNN`
   - UTE: Prefix
   - YYYY: Năm
   - NNNNNN: Số thứ tự (6 chữ số)

2. **Payment Methods:**
   - `payos` - Thanh toán qua PayOS
   - `cod` - Thanh toán khi nhận hàng
   - `bank_transfer` - Chuyển khoản ngân hàng

3. **Payment Status:**
   - `pending` - Chờ thanh toán
   - `paid` - Đã thanh toán
   - `failed` - Thanh toán thất bại
   - `refunded` - Đã hoàn tiền

4. **Shipping Address & Billing Address:**
   - Lưu dạng JSON
   - Format: `{full_name, phone, address, ward, district, city}`

---

## 🧪 TESTING

File test: `test-api-complete.http`

**Ví dụ test tạo đơn hàng:**
```http
POST http://localhost:5000/api/orders
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ],
  "shipping_address": {
    "full_name": "Test User",
    "phone": "0123456789",
    "address": "123 Test",
    "ward": "Phường 1",
    "district": "Quận 1",
    "city": "TP.HCM"
  },
  "billing_address": {
    "full_name": "Test User",
    "phone": "0123456789",
    "address": "123 Test",
    "ward": "Phường 1",
    "district": "Quận 1",
    "city": "TP.HCM"
  },
  "payment_method": "cod"
}
```

---

Tài liệu này mô tả đầy đủ các API Order trong hệ thống! 🚀

