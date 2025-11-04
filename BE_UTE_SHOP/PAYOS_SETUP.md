# PayOS Payment Integration Guide

## 📋 Thông tin cần cung cấp

Để tích hợp PayOS, bạn cần cung cấp các thông tin sau:

### 1. **Thông tin tài khoản PayOS**
- [ ] Client ID
- [ ] API Key
- [ ] Checksum Key
- [ ] Partner Code (nếu có)

### 2. **Môi trường**
- [ ] Sandbox (test): https://api-merchant.payos.vn/
- [ ] Production: https://api-merchant.payos.vn/

### 3. **URLs cần config**
- [ ] Return URL: `http://localhost:5173/payment/payos/return`
- [ ] Cancel URL: `http://localhost:5173/payment/payos/cancel`
- [ ] IPN/Webhook URL: `http://localhost:5000/api/payment/payos/webhook`

## 🚀 Các bước setup

### Bước 1: Đăng ký tài khoản PayOS
1. Truy cập https://payos.vn
2. Đăng ký tài khoản merchant
3. Xác thực thông tin
4. Lấy API credentials

### Bước 2: Cấu hình môi trường
Thêm vào file `.env`:

```env
# PayOS Payment Gateway
PAYOS_CLIENT_ID=your_client_id_here
PAYOS_API_KEY=your_api_key_here
PAYOS_CHECKSUM_KEY=your_checksum_key_here
PAYOS_PARTNER_CODE=your_partner_code_here
PAYOS_ENVIRONMENT=sandbox
# sandbox hoặc production

# PayOS URLs
PAYOS_RETURN_URL=http://localhost:5173/payment/payos/return
PAYOS_CANCEL_URL=http://localhost:5173/payment/payos/cancel
PAYOS_IPN_URL=http://localhost:5000/api/payment/payos/webhook
```

### Bước 3: Cài đặt package
```bash
npm install crypto axios
```

### Bước 4: Chạy migration database
```bash
# Import file database_payment.sql
mysql -u root -p uteshop_db < database_payment.sql
```

## 📚 API Endpoints sẽ được tạo

### Public APIs
- `POST /api/payment/payos/create` - Tạo payment link
- `GET /api/payment/payos/check/:orderId` - Kiểm tra trạng thái thanh toán
- `POST /api/payment/payos/webhook` - Nhận thông báo từ PayOS

### User APIs (Required Authentication)
- `GET /api/payment/my-payments` - Lịch sử thanh toán của user
- `GET /api/payment/:transactionId` - Chi tiết giao dịch

### Admin APIs (Required Admin Role)
- `GET /api/payment/admin/all` - Tất cả giao dịch
- `GET /api/payment/admin/stats` - Thống kê thanh toán
- `POST /api/payment/admin/:id/refund` - Hoàn tiền

## 🔄 Luồng thanh toán

```
1. User tạo order
   ↓
2. Backend tạo payment link với PayOS
   ↓
3. User được redirect đến PayOS
   ↓
4. User thanh toán trên PayOS
   ↓
5. PayOS gửi webhook về backend
   ↓
6. Backend cập nhật trạng thái order
   ↓
7. User được redirect về Return URL
```

## 🔐 Bảo mật

- Sử dụng checksum/signature để xác thực webhook
- Validate tất cả dữ liệu từ PayOS
- Log tất cả giao dịch
- Không expose API keys

## 📞 Hỗ trợ

- Documentation: https://payos.vn/docs
- Support: support@payos.vn

---

**Lưu ý**: Trong môi trường development, sử dụng sandbox. Chỉ chuyển sang production khi đã test kỹ.

