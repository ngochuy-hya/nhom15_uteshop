# 📊 ADMIN DASHBOARD - API Documentation

## 🎯 Tổng quan

Admin Dashboard cung cấp các API để quản lý và theo dõi hoạt động của hệ thống.

**Base URL:** `/api/dashboard` hoặc `/api/analytics` (tùy route)

**Authentication:** Tất cả API đều yêu cầu `Bearer Token` và quyền `admin`

---

## 📈 1. THỐNG KÊ TỔNG QUAN (Overview)

### Endpoint
```
GET /api/dashboard/overview
```

### Query Parameters
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD

### Response Structure
```json
{
  "success": true,
  "message": "Lấy tổng quan thành công",
  "data": {
    "total_orders": 150,          // Tổng số đơn hàng
    "total_revenue": 50000000,    // Tổng doanh thu (đã thanh toán)
    "total_users": 120,           // Tổng số user
    "total_products": 50,          // Tổng số sản phẩm active
    "pending_orders": 5,          // Đơn hàng đang chờ xử lý
    "pending_reviews": 3,         // Đánh giá chờ duyệt
    "order_growth": "15.5",       // % tăng trưởng đơn hàng so kỳ trước
    "revenue_growth": "20.3"      // % tăng trưởng doanh thu so kỳ trước
  }
}
```

### UI Components đề xuất:
- 📊 6 Cards hiển thị số liệu tổng quan
- 📈 Charts so sánh tăng trưởng (%)
- 🔔 Badge hiển thị số pending cần xử lý

---

## 💰 2. THỐNG KÊ DOANH THU (Revenue)

### Endpoint
```
GET /api/dashboard/revenue
```

### Query Parameters
- `period` (optional): `day` | `week` | `month` | `year` (default: `day`)
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD

### Response Structure
```json
{
  "success": true,
  "message": "Lấy doanh thu thành công",
  "data": [
    {
      "period": "2024-01-15",           // Mốc thời gian
      "total_orders": 10,                // Số đơn hàng trong kỳ
      "total_revenue": 5000000,          // Doanh thu
      "average_order_value": 500000      // Giá trị trung bình đơn hàng
    },
    {
      "period": "2024-01-16",
      "total_orders": 12,
      "total_revenue": 6000000,
      "average_order_value": 500000
    }
  ]
}
```

### UI Components đề xuất:
- 📊 Line Chart / Area Chart: Doanh thu theo thời gian
- 📊 Bar Chart: Số đơn hàng theo thời gian
- 📊 Metric Cards: Tổng doanh thu, AOV, Tổng đơn hàng
- 🔄 Filter: Chọn period (day/week/month/year)

---

## 🔥 3. SẢN PHẨM BÁN CHẠY (Top Products)

### Endpoint
```
GET /api/dashboard/top-products
```

### Query Parameters
- `limit` (optional): Số lượng sản phẩm (default: 10)
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD

### Response Structure
```json
{
  "success": true,
  "message": "Lấy sản phẩm bán chạy thành công",
  "data": [
    {
      "id": 1,
      "name": "Áo sơ mi nam",
      "slug": "ao-so-mi-nam",
      "price": 500000,
      "sale_price": 400000,
      "total_sold": 150,                 // Tổng số lượng bán
      "total_revenue": 60000000,         // Tổng doanh thu từ sản phẩm
      "image": "/images/products/ao-so-mi-1.jpg"
    }
  ]
}
```

### UI Components đề xuất:
- 📊 Table/Bảng: Top 10 sản phẩm bán chạy
- 🖼️ Product Cards: Hiển thị hình ảnh + thông tin
- 📈 Progress bars: So sánh số lượng bán
- 🔄 Filter: Chọn khoảng thời gian

---

## 📦 4. ĐƠN HÀNG GẦN ĐÂY (Recent Orders)

### Endpoint
```
GET /api/dashboard/recent-orders
```

### Query Parameters
- `limit` (optional): Số lượng đơn hàng (default: 10)

### Response Structure
```json
{
  "success": true,
  "message": "Lấy đơn hàng gần đây thành công",
  "data": [
    {
      "id": 1,
      "order_number": "UTE-2024-001",
      "total_amount": 1500000,
      "payment_status": "paid",
      "created_at": "2024-01-15T10:30:00Z",
      "status_name": "delivered",
      "status_color": "#28a745",
      "first_name": "Nguyễn",
      "last_name": "Văn A",
      "email": "nguyenvana@email.com"
    }
  ]
}
```

### UI Components đề xuất:
- 📋 Table: Danh sách đơn hàng với các cột
- 🏷️ Status badges: Màu sắc theo status_color
- 🔗 Link: Click vào order_number để xem chi tiết
- ⏰ Relative time: "2 giờ trước", "Hôm qua"

---

## 👥 5. THỐNG KÊ KHÁCH HÀNG (Customer Stats)

### Endpoint
```
GET /api/dashboard/customers
```

### Query Parameters
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD

### Response Structure
```json
{
  "success": true,
  "message": "Lấy thống kê khách hàng thành công",
  "data": {
    "stats": {
      "total_customers": 120,           // Tổng số khách hàng
      "verified_customers": 100,         // Khách hàng đã xác thực email
      "active_customers": 110,           // Khách hàng active
      "local_customers": 80,             // Đăng ký bằng email/password
      "oauth_customers": 40              // Đăng ký bằng OAuth (Google, Facebook)
    },
    "top_customers": [
      {
        "id": 1,
        "first_name": "Nguyễn",
        "last_name": "Văn A",
        "email": "nguyenvana@email.com",
        "avatar": "/images/avatars/user1.jpg",
        "total_orders": 15,              // Tổng số đơn hàng
        "total_spent": 50000000          // Tổng chi tiêu
      }
    ]
  }
}
```

### UI Components đề xuất:
- 📊 Stats Cards: 5 số liệu về khách hàng
- 📋 Top Customers Table: Top 10 khách hàng VIP
- 👤 Avatar + Name: Hiển thị thông tin khách hàng
- 💰 Currency format: Định dạng tiền tệ
- 🔄 Filter: Chọn khoảng thời gian

---

## 📦 6. QUẢN LÝ ĐƠN HÀNG (Orders Management)

### 6.1. Lấy tất cả đơn hàng
```
GET /api/orders/admin/all
```
**Query Parameters:**
- `page` (optional): Trang
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
  "data": {
    "orders": [...],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

### 6.2. Cập nhật trạng thái đơn hàng
```
PUT /api/orders/admin/:id/status
```
**Body:**
```json
{
  "status_id": 3,
  "notes": "Đã gửi hàng"
}
```

### 6.3. Thống kê đơn hàng
```
GET /api/orders/admin/statistics?start_date=2024-01-01&end_date=2024-12-31
```
**Response:**
```json
{
  "total_orders": 150,
  "total_revenue": 50000000,
  "average_order_value": 333333,
  "paid_orders": 140,
  "pending_orders": 10,
  "delivered_orders": 130,
  "cancelled_orders": 5
}
```

---

## 👤 7. QUẢN LÝ NGƯỜI DÙNG (Users Management)

### 7.1. Lấy danh sách users
```
GET /api/users?page=1&limit=20&search=nguyen&role_id=1&is_active=1
```

### 7.2. Thống kê users
```
GET /api/users/statistics
```
**Response:**
```json
{
  "total_users": 120,
  "active_users": 110,
  "new_users_today": 5,
  "new_users_this_month": 20
}
```

### 7.3. Lấy đơn hàng của user
```
GET /api/users/:id/orders?page=1&limit=10
```

### 7.4. Cập nhật user (Admin)
```
PUT /api/users/:id
```

### 7.5. Kích hoạt/Vô hiệu hóa user
```
PUT /api/users/:id/activate
PUT /api/users/:id/deactivate
```

---

## 🎨 8. GỢI Ý THIẾT KẾ FRONTEND

### Layout Dashboard:
```
┌─────────────────────────────────────────────────┐
│  Header: Logo, User Menu, Notifications        │
├─────────────────────────────────────────────────┤
│  Sidebar │  Main Content Area                   │
│  - Dashboard                                    │
│  - Orders                                       │
│  - Products                                     │
│  - Users                                        │
│  - Analytics                                     │
│  - Settings                                     │
│          │  ┌──────────────────────────────┐   │
│          │  │ Overview Cards (6 cards)     │   │
│          │  ├──────────────────────────────┤   │
│          │  │ Revenue Chart               │   │
│          │  ├──────────────────────────────┤   │
│          │  │ Top Products Table          │   │
│          │  ├──────────────────────────────┤   │
│          │  │ Recent Orders Table         │   │
│          │  └──────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Components cần thiết:

1. **Overview Cards** - Hiển thị 6 metrics chính
2. **Revenue Chart** - Line/Area chart doanh thu
3. **Orders Chart** - Bar chart số đơn hàng
4. **Top Products Table** - Bảng sản phẩm bán chạy
5. **Recent Orders Table** - Bảng đơn hàng mới nhất
6. **Customer Stats Cards** - Thống kê khách hàng
7. **Date Range Picker** - Chọn khoảng thời gian
8. **Status Badges** - Hiển thị trạng thái với màu
9. **Pagination** - Phân trang cho tables
10. **Filters** - Bộ lọc cho các danh sách

### Màu sắc đề xuất:
- Primary: Blue (#007bff)
- Success: Green (#28a745)
- Warning: Yellow (#ffc107)
- Danger: Red (#dc3545)
- Info: Cyan (#17a2b8)

### Responsive:
- Desktop: Full layout với sidebar
- Tablet: Collapsible sidebar
- Mobile: Bottom navigation bar

---

## 🔗 Tổng hợp Routes

### Dashboard Routes (`/api/dashboard`)
- `GET /overview` - Tổng quan
- `GET /revenue` - Doanh thu
- `GET /top-products` - Sản phẩm bán chạy
- `GET /recent-orders` - Đơn hàng gần đây
- `GET /customers` - Thống kê khách hàng

### Analytics Routes (`/api/analytics`) - Alternative
- `GET /overview` - Tổng quan (alternative)
- `GET /revenue` - Doanh thu (alternative)
- `GET /top-products` - Sản phẩm bán chạy (alternative)
- `GET /customers` - Thống kê khách hàng (alternative)

### Orders Routes (`/api/orders`)
- `GET /admin/all` - Tất cả đơn hàng
- `PUT /admin/:id/status` - Cập nhật trạng thái
- `GET /admin/statistics` - Thống kê đơn hàng

### Users Routes (`/api/users`)
- `GET /` - Danh sách users
- `GET /statistics` - Thống kê users
- `GET /:id/orders` - Đơn hàng của user
- `PUT /:id` - Cập nhật user
- `PUT /:id/activate` - Kích hoạt user
- `PUT /:id/deactivate` - Vô hiệu hóa user

---

## 📝 Notes

- Tất cả API đều yêu cầu authentication token trong header: `Authorization: Bearer <token>`
- Tất cả API đều yêu cầu quyền admin
- Date format: `YYYY-MM-DD`
- Số tiền: Lưu dạng number (VND), format khi hiển thị
- Pagination: Default page = 1, limit tùy endpoint
- Timezone: UTC (convert khi hiển thị)
