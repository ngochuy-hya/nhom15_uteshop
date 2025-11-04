# UTESHOP BACKEND API

Backend API cho website thương mại điện tử UTESHOP - chuyên bán hàng thời trang.

## 🚀 Tính năng chính

- ✅ **Authentication**: Đăng ký, đăng nhập với OTP email
- ✅ **Products**: Quản lý sản phẩm, tìm kiếm, filter
- ✅ **Categories**: Quản lý danh mục sản phẩm
- ✅ **Brands**: Quản lý thương hiệu
- ✅ **Security**: JWT, Rate limiting, Helmet
- ✅ **Email**: Gửi OTP qua email

## 📋 Yêu cầu hệ thống

- Node.js >= 16.0.0
- MySQL >= 8.0
- npm hoặc yarn

## 🛠️ Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd BE_UTE_SHOP_V2
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình environment
Tạo file `.env` từ `env_example.txt`:

```bash
cp env_example.txt .env
```

Cập nhật file `.env`:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=uteshop_db
DB_PORT=3306

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=UTESHOP <noreply@uteshop.com>

# OTP
OTP_EXPIRES_MINUTES=15
```

### 4. Cấu hình Gmail SMTP

1. **Bật 2-Factor Authentication** cho Gmail
2. **Tạo App Password**:
   - Vào Google Account Settings
   - Security > 2-Step Verification
   - App passwords > Generate password
   - Copy password và dán vào `EMAIL_PASS`

### 5. Import database
```bash
# Import database hoàn chỉnh
mysql -u root -p uteshop_db < ../UTEShop_Complete_Database.sql
```

### 6. Chạy server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### 1. Đăng ký
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "0123456789",
  "date_of_birth": "1990-01-01",
  "gender": "male"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "email_sent": true
  }
}
```

#### 2. Xác thực OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Xác thực email thành công!",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role_id": 1,
      "email_verified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Gửi lại OTP
```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### 4. Đăng nhập
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 5. Lấy thông tin profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### 6. Đăng xuất
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### Product Endpoints

#### 1. Lấy danh sách sản phẩm
```http
GET /api/products?page=1&limit=12&category_id=1&search=nike&sort_by=price&sort_order=ASC
```

**Query Parameters:**
- `page`: Trang hiện tại (default: 1)
- `limit`: Số sản phẩm mỗi trang (default: 12)
- `category_id`: ID danh mục
- `brand_id`: ID thương hiệu
- `search`: Tìm kiếm theo tên
- `sort_by`: Sắp xếp theo (created_at, price, name, view_count)
- `sort_order`: Thứ tự (ASC, DESC)
- `min_price`: Giá tối thiểu
- `max_price`: Giá tối đa
- `is_featured`: Sản phẩm nổi bật (true/false)
- `is_trending`: Sản phẩm trending (true/false)
- `is_bestseller`: Sản phẩm bán chạy (true/false)
- `is_new`: Sản phẩm mới (true/false)
- `is_sale`: Sản phẩm giảm giá (true/false)

#### 2. Lấy chi tiết sản phẩm
```http
GET /api/products/:id
```

#### 3. Lấy sản phẩm liên quan
```http
GET /api/products/:id/related?limit=4
```

#### 4. Lấy sản phẩm nổi bật
```http
GET /api/products/featured?limit=8
```

#### 5. Lấy sản phẩm bán chạy
```http
GET /api/products/bestseller?limit=8
```

### Category Endpoints

#### 1. Lấy danh sách danh mục
```http
GET /api/categories?parent_id=1
```

#### 2. Lấy chi tiết danh mục
```http
GET /api/categories/:id
```

#### 3. Lấy danh mục theo slug
```http
GET /api/categories/slug/:slug
```

### Brand Endpoints

#### 1. Lấy danh sách thương hiệu
```http
GET /api/brands?limit=20
```

#### 2. Lấy chi tiết thương hiệu
```http
GET /api/brands/:id
```

#### 3. Lấy thương hiệu theo slug
```http
GET /api/brands/slug/:slug
```

## 🔐 Authentication

### JWT Token
Sau khi đăng nhập thành công, bạn sẽ nhận được JWT token. Sử dụng token này trong header:

```http
Authorization: Bearer <your_jwt_token>
```

### Token Expiry
- **Access Token**: 7 ngày
- **Refresh Token**: 30 ngày (chưa implement)

## 📧 Email Templates

### OTP Email
- Template đẹp với HTML/CSS
- Mã OTP 6 chữ số
- Thời hạn 15 phút
- Responsive design

### Welcome Email
- Gửi sau khi xác thực thành công
- Hướng dẫn sử dụng
- Call-to-action button

## 🛡️ Security Features

### Rate Limiting
- 100 requests/15 minutes per IP
- Có thể cấu hình trong `server.ts`

### Helmet
- Security headers
- XSS protection
- Content Security Policy

### Input Validation
- Email validation
- Password strength
- Phone number validation
- Sanitization

### Password Security
- Bcrypt hashing (12 rounds)
- Salt generation
- Secure comparison

## 🧪 Testing

### Test với Postman
1. Import collection từ `postman/UTEShop_API.postman_collection.json`
2. Set environment variables
3. Chạy tests

### Test với curl
```bash
# Health check
curl http://localhost:5000/api/health

# Đăng ký
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","first_name":"Test","last_name":"User"}'
```

## 🐛 Troubleshooting

### Lỗi kết nối database
```bash
# Kiểm tra MySQL đang chạy
sudo service mysql status

# Kiểm tra database tồn tại
mysql -u root -p -e "SHOW DATABASES;"
```

### Lỗi gửi email
1. Kiểm tra Gmail App Password
2. Kiểm tra 2FA đã bật
3. Kiểm tra firewall/antivirus

### Lỗi JWT
1. Kiểm tra JWT_SECRET trong .env
2. Kiểm tra token format
3. Kiểm tra token expiry

## 📝 Logs

### Development
```bash
npm run dev
# Logs sẽ hiển thị trong console
```

### Production
```bash
# Sử dụng PM2 hoặc Docker
pm2 start dist/server.js --name uteshop-api
```

## 🚀 Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

### Environment Variables
```env
NODE_ENV=production
PORT=5000
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=uteshop_db
JWT_SECRET=your_production_jwt_secret
EMAIL_USER=your_production_email
EMAIL_PASS=your_production_email_password
```

## 📞 Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs trong console
2. Kiểm tra database connection
3. Kiểm tra email configuration
4. Tạo issue trên GitHub

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.
