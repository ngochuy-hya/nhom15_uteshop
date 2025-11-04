# 💳 PAYMENT API - Tài liệu đầy đủ

## 📋 Tổng quan

API Payment quản lý thanh toán qua PayOS trong hệ thống UTESHOP. Tích hợp với PayOS payment gateway để xử lý thanh toán online.

**Base URL:** `/api/payment`

---

## 🔗 DANH SÁCH API

### 1. Tạo Payment Link (Tạo link thanh toán PayOS)

```
POST /api/payment/payos/create
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "order_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo payment link thành công",
  "data": {
    "transaction_id": 1,
    "payment_url": "https://pay.payos.vn/web/...",
    "qr_code_url": "https://img.vietqr.io/...",
    "order_code": 1234567890,
    "amount": 600000,
    "expired_at": 1705294200
  }
}
```

**Luồng xử lý:**
1. Kiểm tra order tồn tại và thuộc về user
2. Kiểm tra order chưa thanh toán
3. Kiểm tra transaction đã tồn tại chưa (nếu có trả về luôn)
4. Lấy thông tin order items
5. Tạo payment request với PayOS
6. Lưu transaction vào database
7. Trả về payment link

**Lưu ý:**
- Payment link có thời hạn 30 phút
- Nếu đã có transaction pending, trả về link cũ
- Tự động cập nhật `payment_method = 'payos'` cho order

---

### 2. Kiểm tra trạng thái thanh toán

```
GET /api/payment/payos/check/:orderCode
```

**Response:**
```json
{
  "success": true,
  "message": "Lấy trạng thái thanh toán thành công",
  "data": {
    "transaction_id": 1,
    "order_code": "1234567890",
    "status": "completed",
    "amount": 600000,
    "paid_at": "2024-01-15T10:35:00Z",
    "payos_data": {
      "status": "PAID",
      "amount": 600000,
      "transactionDateTime": "2024-01-15T10:35:00Z"
    }
  }
}
```

**Status có thể là:**
- `pending` - Chờ thanh toán
- `processing` - Đang xử lý
- `completed` - Đã thanh toán thành công
- `failed` - Thanh toán thất bại
- `cancelled` - Đã hủy

**Luồng xử lý:**
1. Lấy transaction từ database
2. Gọi API PayOS để kiểm tra status mới nhất
3. Cập nhật status nếu có thay đổi
4. Nếu completed → Cập nhật order payment_status = 'paid' và status_id = 2

---

### 3. Webhook từ PayOS (Nhận thông báo thanh toán)

```
POST /api/payment/payos/webhook
```

**Headers từ PayOS:**
```
x-signature: <signature>
Content-Type: application/json
```

**Request Body (từ PayOS):**
```json
{
  "code": "00",
  "desc": "Success",
  "data": {
    "orderCode": 1234567890,
    "amount": 600000,
    "description": "Thanh toan don hang UTE-2024-000001",
    "transactionDateTime": "2024-01-15T10:35:00Z",
    "reference": "payos_transaction_id",
    "code": "00",
    "desc": "Success"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

**Luồng xử lý:**
1. Nhận webhook từ PayOS
2. Log webhook vào `payment_webhooks` table
3. Parse webhook data
4. Lấy transaction từ database
5. Cập nhật transaction status
6. Nếu completed → Cập nhật order payment_status và status_id
7. Trả về success cho PayOS

**Lưu ý:**
- Webhook được gọi tự động bởi PayOS khi có thay đổi trạng thái thanh toán
- Nên verify signature để đảm bảo an toàn (hiện đang comment)

---

### 4. Lấy lịch sử thanh toán của User

```
GET /api/payment/my-payments
```

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số lượng/trang (default: 10)
- `status` (optional): Lọc theo status (`pending`, `completed`, `failed`, etc.)

**Response:**
```json
{
  "success": true,
  "message": "Lấy lịch sử thanh toán thành công",
  "data": {
    "transactions": [
      {
        "transaction_id": 1,
        "order_id": 1,
        "order_number": "UTE-2024-000001",
        "amount": 600000,
        "payment_status": "completed",
        "paid_at": "2024-01-15T10:35:00Z",
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

## 🗄️ DATABASE SCHEMA

### Bảng `payment_transactions`
```sql
CREATE TABLE payment_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  
  -- PayOS transaction info
  payos_transaction_id VARCHAR(100) UNIQUE,
  payos_order_code VARCHAR(100) UNIQUE,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'VND',
  payment_method ENUM('payos', 'cod', 'bank_transfer') DEFAULT 'payos',
  
  -- Status
  status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
  
  -- PayOS response data
  payment_url TEXT,
  qr_code_url TEXT,
  
  -- Metadata
  description TEXT,
  bank_code VARCHAR(50),
  bank_account VARCHAR(100),
  
  -- Timestamps
  paid_at DATETIME,
  expired_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Bảng `payment_webhooks`
```sql
CREATE TABLE payment_webhooks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_id INT,
  
  -- Webhook data
  event_type VARCHAR(50),
  payos_transaction_id VARCHAR(100),
  order_code VARCHAR(100),
  
  -- Request info
  payload TEXT,
  signature VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Response
  response_status INT,
  response_message TEXT,
  
  -- Metadata
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id) ON DELETE SET NULL
);
```

---

## 🔄 LUỒNG THANH TOÁN HOÀN CHỈNH

```
1. User tạo Order
   ↓
2. User gọi API: POST /api/payment/payos/create
   Body: { order_id: 1 }
   ↓
3. Backend tạo payment link với PayOS
   ↓
4. Backend lưu transaction vào database
   Status: pending
   ↓
5. Trả về payment_url cho Frontend
   ↓
6. Frontend redirect user đến PayOS
   ↓
7. User thanh toán trên PayOS
   ↓
8. PayOS gửi webhook về Backend
   POST /api/payment/payos/webhook
   ↓
9. Backend cập nhật transaction:
   - status = 'completed'
   - paid_at = NOW()
   ↓
10. Backend cập nhật Order:
    - payment_status = 'paid'
    - status_id = 2 (processing)
    ↓
11. PayOS redirect user về Return URL
    http://localhost:5173/payment/payos/return
    ↓
12. Frontend gọi API check status:
    GET /api/payment/payos/check/:orderCode
    ↓
13. Hiển thị kết quả thanh toán
```

---

## 📝 PAYOS CONFIGURATION

**File `.env`:**
```env
PAYOS_CLIENT_ID=your_client_id_here
PAYOS_API_KEY=your_api_key_here
PAYOS_CHECKSUM_KEY=your_checksum_key_here
PAYOS_PARTNER_CODE=
PAYOS_ENVIRONMENT=sandbox
PAYOS_RETURN_URL=http://localhost:5173/payment/payos/return
PAYOS_CANCEL_URL=http://localhost:5173/payment/payos/cancel
PAYOS_IPN_URL=http://localhost:5000/api/payment/payos/webhook
```

---

## 🔐 SECURITY

1. **Authentication:** Tất cả API (trừ webhook) đều cần Bearer token
2. **Signature Verification:** Có thể bật verify signature cho webhook (hiện đang comment)
3. **Transaction Logging:** Tất cả webhooks đều được log vào database
4. **Status Validation:** Kiểm tra order thuộc về user trước khi tạo payment

---

## 🧪 TESTING

**Ví dụ tạo payment:**
```http
POST http://localhost:5000/api/payment/payos/create
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "order_id": 1
}
```

**Ví dụ check status:**
```http
GET http://localhost:5000/api/payment/payos/check/1234567890
```

**Ví dụ lấy lịch sử:**
```http
GET http://localhost:5000/api/payment/my-payments?page=1&limit=10&status=completed
Authorization: Bearer {{token}}
```

---

## 💡 CÁC TÍNH NĂNG ĐÃ CÓ

✅ Tạo payment link với PayOS
✅ Kiểm tra trạng thái thanh toán
✅ Nhận và xử lý webhook từ PayOS
✅ Lịch sử thanh toán của user
✅ Tự động cập nhật order khi thanh toán thành công
✅ Log tất cả webhooks
✅ Kiểm tra transaction trùng lặp
✅ Payment link có thời hạn (30 phút)
✅ QR Code cho thanh toán

---

## ⚠️ LƯU Ý

1. **Payment Method:** Khi tạo payment, order sẽ tự động set `payment_method = 'payos'`
2. **Order Status:** Khi thanh toán thành công, order sẽ set:
   - `payment_status = 'paid'`
   - `status_id = 2` (processing)
3. **Webhook URL:** Phải config đúng trong PayOS dashboard
4. **Return URL:** User sẽ được redirect về URL này sau khi thanh toán
5. **Cancel URL:** User sẽ được redirect về URL này nếu hủy thanh toán

---

## 🔗 LIÊN KẾT

- PayOS Documentation: https://payos.vn/docs
- Test với PayOS Sandbox
- File test: `test-payment-apis.http`

---

Tài liệu này mô tả đầy đủ Payment API với PayOS! 💳🚀

