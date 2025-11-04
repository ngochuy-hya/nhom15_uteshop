# 🛍️ UTESHOP - E-Commerce Platform

Dự án thương mại điện tử UTESHOP - Nền tảng bán hàng thời trang online với đầy đủ tính năng quản lý sản phẩm, đơn hàng, thanh toán và quản trị.

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Chạy dự án](#chạy-dự-án)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Đóng góp](#đóng-góp)
- [License](#license)

## 🎯 Tổng quan

UTESHOP là một nền tảng thương mại điện tử hoàn chỉnh được xây dựng với kiến trúc fullstack, bao gồm:

- **Backend API**: RESTful API với Node.js, Express, TypeScript
- **Frontend User**: Giao diện người dùng với React, TypeScript, Vite
- **Frontend Admin**: Dashboard quản trị với React, Ant Design, Refine

Dự án được thiết kế để hỗ trợ quản lý sản phẩm, đơn hàng, thanh toán, và các tính năng e-commerce hiện đại.

## 🏗️ Kiến trúc hệ thống

```
FINAL_UTELSHOP/
├── BE_UTE_SHOP/          # Backend API Server
├── FE_UTE_SHOP_USER/     # Frontend User Interface
└── FE_UTE_SHOP_ADMIN/    # Frontend Admin Dashboard
```

### Component Diagram

```
┌─────────────────┐
│  Frontend User  │ ←→ ┌──────────────┐
│   (React/Vite)  │    │              │
└─────────────────┘    │  Backend API │
                       │ (Express/TS) │
┌─────────────────┐    │              │
│ Frontend Admin  │ ←→ │              │
│ (React/Ant Design)│  └──────┬───────┘
└─────────────────┘           │
                              │
                       ┌──────▼──────┐
                       │   MySQL DB  │
                       └─────────────┘
```

## ✨ Tính năng

### 👤 Quản lý người dùng
- ✅ Đăng ký/Đăng nhập với email và password
- ✅ Xác thực email qua OTP (6 chữ số)
- ✅ Đăng nhập với Google OAuth
- ✅ Quản lý profile người dùng
- ✅ Quản lý địa chỉ giao hàng
- ✅ Quên mật khẩu và đặt lại mật khẩu

### 🛍️ Sản phẩm
- ✅ Quản lý sản phẩm (CRUD)
- ✅ Tìm kiếm và lọc sản phẩm
- ✅ Phân loại sản phẩm theo danh mục
- ✅ Quản lý thương hiệu (Brands)
- ✅ Thuộc tính sản phẩm (màu sắc, kích thước, v.v.)
- ✅ Đánh giá và nhận xét sản phẩm
- ✅ Sản phẩm nổi bật, bán chạy, mới về
- ✅ Upload hình ảnh với Cloudinary

### 🛒 Giỏ hàng & Đơn hàng
- ✅ Thêm/sửa/xóa sản phẩm trong giỏ hàng
- ✅ Quản lý wishlist
- ✅ Tạo và quản lý đơn hàng
- ✅ Theo dõi trạng thái đơn hàng
- ✅ Lịch sử đơn hàng

### 💳 Thanh toán
- ✅ Tích hợp PayOS payment gateway
- ✅ Xử lý thanh toán online
- ✅ Quản lý hoàn tiền (Refund)
- ✅ Mã giảm giá (Coupons)

### 📊 Dashboard & Analytics
- ✅ Dashboard quản trị với thống kê
- ✅ Quản lý sản phẩm, đơn hàng, người dùng
- ✅ Phân tích doanh thu, bán hàng
- ✅ Quản lý blog, banner, settings
- ✅ Quản lý liên hệ và thông báo

### 🎨 Giao diện
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ UI/UX hiện đại với Bootstrap và SCSS
- ✅ Dark mode support
- ✅ Tối ưu hiệu suất và SEO

## 🛠️ Công nghệ sử dụng

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL
- **Authentication**: JWT, bcrypt
- **Email**: Nodemailer (Gmail SMTP)
- **File Upload**: Multer + Cloudinary
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator

### Frontend User
- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: SCSS, Bootstrap 5
- **Routing**: React Router DOM
- **State Management**: React Context API
- **HTTP Client**: Axios
- **UI Libraries**: Swiper, React QR Code, Sonner (Toast)

### Frontend Admin
- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Framework**: Ant Design
- **Admin Framework**: Refine
- **Charts**: Recharts
- **Editor**: UIW React MD Editor

## 📦 Yêu cầu hệ thống

- **Node.js**: >= 16.0.0 (khuyến nghị >= 18.0.0)
- **MySQL**: >= 8.0
- **npm**: >= 8.0.0 hoặc **yarn**: >= 1.22.0
- **Git**: Để clone repository

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd FINAL_UTELSHOP
```

### 2. Cài đặt Backend

```bash
cd BE_UTE_SHOP
npm install
```

### 3. Cài đặt Frontend User

```bash
cd ../FE_UTE_SHOP_USER
npm install
```

### 4. Cài đặt Frontend Admin

```bash
cd ../FE_UTE_SHOP_ADMIN/admin
npm install
```

## ⚙️ Cấu hình

### Backend Configuration

1. Tạo file `.env` trong thư mục `BE_UTE_SHOP/`:

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

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# PayOS
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
```

2. **Cấu hình Gmail SMTP**:
   - Bật 2-Factor Authentication cho Gmail
   - Tạo App Password: Google Account Settings → Security → 2-Step Verification → App passwords
   - Copy password và dán vào `EMAIL_PASS`

3. **Import Database**:
   ```bash
   mysql -u root -p uteshop_db < BE_UTE_SHOP/uteshop_db_schema.sql
   ```

### Frontend User Configuration

1. Cập nhật API endpoint trong `FE_UTE_SHOP_USER/src/config/api.ts`:

```typescript
export const API_BASE_URL = 'http://localhost:5000/api';
```

### Frontend Admin Configuration

1. Cập nhật API endpoint trong `FE_UTE_SHOP_ADMIN/admin/src/` (tùy theo cấu hình của bạn)

## ▶️ Chạy dự án

### Development Mode

#### 1. Chạy Backend

```bash
cd BE_UTE_SHOP
npm run dev
```

Backend sẽ chạy tại: `http://localhost:5000`

#### 2. Chạy Frontend User

```bash
cd FE_UTE_SHOP_USER
npm run dev
```

Frontend User sẽ chạy tại: `http://localhost:5173`

#### 3. Chạy Frontend Admin

```bash
cd FE_UTE_SHOP_ADMIN/admin
npm run dev
```

Frontend Admin sẽ chạy tại: `http://localhost:3000` (hoặc port khác)

### Production Build

#### Backend

```bash
cd BE_UTE_SHOP
npm run build
npm start
```

#### Frontend User

```bash
cd FE_UTE_SHOP_USER
npm run build
npm run preview
```

#### Frontend Admin

```bash
cd FE_UTE_SHOP_ADMIN/admin
npm run build
npm start
```

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/verify-otp` - Xác thực OTP
- `POST /api/auth/resend-otp` - Gửi lại OTP
- `GET /api/auth/profile` - Lấy thông tin profile
- `POST /api/auth/logout` - Đăng xuất

#### Products
- `GET /api/products` - Lấy danh sách sản phẩm (có pagination, filter, search)
- `GET /api/products/:id` - Lấy chi tiết sản phẩm
- `GET /api/products/featured` - Sản phẩm nổi bật
- `GET /api/products/bestseller` - Sản phẩm bán chạy

#### Categories
- `GET /api/categories` - Lấy danh sách danh mục
- `GET /api/categories/:id` - Lấy chi tiết danh mục

#### Brands
- `GET /api/brands` - Lấy danh sách thương hiệu
- `GET /api/brands/:id` - Lấy chi tiết thương hiệu

#### Cart
- `GET /api/cart` - Lấy giỏ hàng
- `POST /api/cart` - Thêm sản phẩm vào giỏ hàng
- `PUT /api/cart/:id` - Cập nhật giỏ hàng
- `DELETE /api/cart/:id` - Xóa sản phẩm khỏi giỏ hàng

#### Orders
- `GET /api/orders` - Lấy danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng
- `PUT /api/orders/:id` - Cập nhật đơn hàng

#### Payment
- `POST /api/payment/create` - Tạo link thanh toán PayOS
- `POST /api/payment/webhook` - Webhook từ PayOS
- `POST /api/payment/refund` - Hoàn tiền

#### Reviews
- `GET /api/reviews/product/:productId` - Lấy đánh giá sản phẩm
- `POST /api/reviews` - Tạo đánh giá mới
- `PUT /api/reviews/:id` - Cập nhật đánh giá
- `DELETE /api/reviews/:id` - Xóa đánh giá

### API Documentation Files

Chi tiết API được mô tả trong các file:
- `BE_UTE_SHOP/AUTH_API_REQUEST_RESPONSE.md`
- `BE_UTE_SHOP/ORDER_API_DOCUMENTATION.md`
- `BE_UTE_SHOP/PAYMENT_API_DOCUMENTATION.md`
- `BE_UTE_SHOP/API_FLOW_GUIDE.md`

### Postman Collection

Import Postman collection để test API:
- `BE_UTE_SHOP/UTESHOP_API_Collection.postman_collection.json`

## 🚀 Deployment

### Backend Deployment

#### Option 1: Vercel/Railway/Render

1. Build project:
```bash
npm run build
```

2. Deploy với environment variables đã cấu hình

#### Option 2: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

### Frontend Deployment

#### Vercel (Recommended)

```bash
cd FE_UTE_SHOP_USER
npm run build
# Deploy folder dist/ lên Vercel
```

#### Netlify

```bash
npm run build
# Deploy folder dist/ lên Netlify
```

### Environment Variables cho Production

Đảm bảo cập nhật các biến môi trường:
- Database connection strings
- JWT secret
- Email credentials
- Cloudinary credentials
- PayOS credentials
- CORS origins

## 📁 Cấu trúc thư mục

### Backend Structure

```
BE_UTE_SHOP/
├── src/
│   ├── config/          # Database config
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth, error handling, upload
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilities (JWT, email, OTP, etc.)
│   └── server.ts        # Entry point
├── uploads/             # Uploaded files
├── package.json
└── tsconfig.json
```

### Frontend User Structure

```
FE_UTE_SHOP_USER/
├── src/
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── context/         # React Context
│   ├── types/           # TypeScript types
│   ├── config/          # Configuration
│   └── main.tsx         # Entry point
├── public/              # Static assets
└── package.json
```

### Frontend Admin Structure

```
FE_UTE_SHOP_ADMIN/admin/
├── src/
│   ├── pages/           # Admin pages
│   ├── components/      # Reusable components
│   ├── services/        # API services
│   ├── types/           # TypeScript types
│   └── App.tsx          # Entry point
└── package.json
```

## 🔒 Security Features

- ✅ JWT Authentication
- ✅ Password hashing với bcrypt
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Input validation và sanitization
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection

## 🧪 Testing

### API Testing

Sử dụng Postman collection hoặc các file `.http`:

```bash
# Test files trong BE_UTE_SHOP/
test-api-complete.http
test-auth-apis.http
test-order-flow.http
test-payment-apis.http
```

### Manual Testing

1. **Authentication Flow**:
   - Đăng ký → Nhận OTP → Xác thực → Đăng nhập

2. **Product Flow**:
   - Xem danh sách → Filter → Xem chi tiết → Thêm vào giỏ hàng

3. **Order Flow**:
   - Thêm vào giỏ hàng → Checkout → Thanh toán → Xác nhận đơn hàng

## 🐛 Troubleshooting

### Lỗi kết nối Database

```bash
# Kiểm tra MySQL đang chạy
sudo service mysql status  # Linux
# hoặc MySQL Workbench

# Kiểm tra database tồn tại
mysql -u root -p -e "SHOW DATABASES;"
```

### Lỗi gửi Email

1. Kiểm tra Gmail App Password đã đúng
2. Kiểm tra 2FA đã bật
3. Kiểm tra firewall/antivirus
4. Kiểm tra EMAIL_USER và EMAIL_PASS trong .env

### Lỗi CORS

Cập nhật `CORS_ORIGIN` trong `.env` với đúng URL frontend.

### Lỗi Port đã được sử dụng

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill
```

## 📝 Scripts

### Backend

- `npm run dev` - Chạy development server với nodemon
- `npm run build` - Build TypeScript sang JavaScript
- `npm start` - Chạy production server

### Frontend User

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Frontend Admin

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm start` - Chạy production server

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 👥 Authors

- Development Team - UTESHOP Project

## 🙏 Acknowledgments

- Express.js community
- React community
- Ant Design team
- Refine framework team
- All open-source contributors

## 📞 Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs trong console
2. Kiểm tra database connection
3. Kiểm tra email configuration
4. Xem các file documentation trong `BE_UTE_SHOP/`
5. Tạo issue trên GitHub

---

**Happy Coding! 🚀**

