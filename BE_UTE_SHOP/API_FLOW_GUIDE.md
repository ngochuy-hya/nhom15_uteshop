# 🔄 LUỒNG API HOÀN CHỈNH - HƯỚNG DẪN ĐỌC VÀ SỬ DỤNG

## 📋 Tổng quan

Tài liệu này mô tả chi tiết luồng xử lý của một API từ đầu đến cuối, giúp bạn hiểu cách đọc và sử dụng API trong project.

---

## 🎯 VÍ DỤ: API "Lấy danh sách đơn hàng của user"

**Endpoint:** `GET /api/orders/my-orders`

**Yêu cầu:** User phải đăng nhập (có token)

---

## 🔀 LUỒNG XỬ LÝ (Từ đầu đến cuối)

### **BƯỚC 1: Client gửi Request** 
```
Frontend (React/Vue/etc)
    ↓
HTTP Request: GET /api/orders/my-orders
Headers: {
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
Query: ?page=1&limit=10&status_id=1
```

**Ví dụ code Frontend:**
```javascript
// 1. Gửi request từ Frontend
const response = await fetch('http://localhost:5000/api/orders/my-orders?page=1&limit=10', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

---

### **BƯỚC 2: Server nhận Request (server.ts)**

**File:** `src/server.ts`

```typescript
// 1. Request đến Express Server
app.use('/api/orders', orderRoutes);  // Dòng 86
```

**Giải thích:**
- Express nhận request tại `/api/orders`
- Route handler sẽ chuyển request đến `orderRoutes` (file routes)

---

### **BƯỚC 3: Route Handler (routes/order.routes.ts)**

**File:** `src/routes/order.routes.ts`

```typescript
// Dòng 19
router.get('/my-orders', authenticateToken, getMyOrders);
```

**Giải thích:**
- Route pattern: `/my-orders` → URL đầy đủ: `/api/orders/my-orders`
- Middleware: `authenticateToken` - Kiểm tra token trước
- Controller: `getMyOrders` - Function xử lý logic

**Luồng middleware:**
```
Request → authenticateToken → getMyOrders
           ↓
      (Nếu pass)
```

---

### **BƯỚC 4: Middleware Authentication (middleware/auth.middleware.ts)**

**File:** `src/middleware/auth.middleware.ts`

```typescript
// Dòng 6-50
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1. Lấy token từ header
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer TOKEN" → "TOKEN"
  
  // 2. Verify token (kiểm tra hợp lệ)
  const decoded = verifyToken(token);
  
  // 3. Lấy thông tin user từ database
  const [users] = await pool.execute(
    'SELECT id, email, first_name, role_id FROM users WHERE id = ?',
    [decoded.userId]
  );
  
  // 4. Gắn user vào request để controller sử dụng
  req.user = user;
  
  // 5. Cho phép tiếp tục → gọi next()
  next();
};
```

**Nếu token hợp lệ:**
- ✅ Gắn `req.user` (thông tin user đã đăng nhập)
- ✅ Gọi `next()` → Tiếp tục đến controller

**Nếu token không hợp lệ:**
- ❌ Trả về 401 Unauthorized
- ❌ Không tiếp tục (không gọi next())

---

### **BƯỚC 5: Controller xử lý Logic (controllers/order.controller.ts)**

**File:** `src/controllers/order.controller.ts`

```typescript
// Dòng 157-189
export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Lấy userId từ req.user (đã được set bởi middleware)
    const userId = req.user!.id;
    
    // 2. Lấy query parameters (page, limit, status_id)
    const { page, limit, status_id } = req.query;
    
    // 3. Gọi Model để lấy dữ liệu từ database
    const result = await OrderModel.getByUserId(userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status_id: status_id ? Number(status_id) : undefined,
    });
    
    // 4. Trả về response cho client
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: {
        orders: result.orders,
        pagination: {
          current_page: Number(page) || 1,
          per_page: Number(limit) || 10,
          total: result.total,
          total_pages: Math.ceil(result.total / (Number(limit) || 10)),
        },
      },
    });
  } catch (error) {
    // 5. Xử lý lỗi
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};
```

**Giải thích:**
- Controller = Business Logic Layer
- Không truy cập database trực tiếp
- Gọi Model để lấy dữ liệu
- Format response theo chuẩn dự án

---

### **BƯỚC 6: Model truy vấn Database (models/order.model.ts)**

**File:** `src/models/order.model.ts`

```typescript
// Dòng 119-159
static async getByUserId(userId: number, params: {
  page?: number;
  limit?: number;
  status_id?: number;
}): Promise<{ orders: any[]; total: number }> {
  
  // 1. Setup pagination
  const { page = 1, limit = 10, status_id } = params;
  const offset = (page - 1) * limit;
  
  // 2. Build WHERE conditions
  let whereConditions = ['o.user_id = ?'];
  let queryParams: any[] = [userId];
  
  if (status_id) {
    whereConditions.push('o.status_id = ?');
    queryParams.push(status_id);
  }
  
  // 3. Query database để lấy orders
  const [orders] = await pool.execute<RowDataPacket[]>(
    `SELECT 
      o.*,
      os.status_name,
      os.color as status_color
    FROM orders o
    JOIN order_statuses os ON o.status_id = os.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?`,
    [...queryParams, limit, offset]
  );
  
  // 4. Query để đếm tổng số (cho pagination)
  const [countResult] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM orders o WHERE ${whereConditions.join(' AND ')}`,
    queryParams
  );
  
  // 5. Return data về controller
  return {
    orders,
    total: countResult[0].total,
  };
}
```

**Giải thích:**
- Model = Data Access Layer
- Chỉ làm việc với database
- Không có business logic
- Return raw data về controller

---

### **BƯỚC 7: Database Connection (config/database.ts)**

**File:** `src/config/database.ts`

```typescript
import mysql from 'mysql2/promise';

// Tạo connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  connectionLimit: 10
});

export default pool;
```

**Giải thích:**
- Connection pool = Quản lý nhiều connections
- Tái sử dụng connections (hiệu quả hơn)
- Tự động xử lý timeout, retry

---

### **BƯỚC 8: Response trả về Client**

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy danh sách đơn hàng thành công",
  "data": {
    "orders": [
      {
        "id": 1,
        "order_number": "UTE-2024-001",
        "total_amount": 1500000,
        "status_name": "delivered",
        "status_color": "#28a745",
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

**Error Response (500):**
```json
{
  "success": false,
  "message": "Lỗi server khi lấy danh sách đơn hàng",
  "error": { /* chi tiết lỗi (chỉ trong development) */ }
}
```

---

## 📊 SƠ ĐỒ LUỒNG TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT (Frontend)                                           │
│  - Gửi HTTP Request với token                                │
│  - Nhận và hiển thị Response                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP Request
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  SERVER.TS (Express App)                                    │
│  - Nhận request tại /api/orders                             │
│  - Chuyển đến orderRoutes                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  ROUTES (order.routes.ts)                                   │
│  - Định nghĩa endpoint /my-orders                           │
│  - Áp dụng middleware: authenticateToken                    │
│  - Gọi controller: getMyOrders                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  MIDDLEWARE (auth.middleware.ts)                            │
│  - Verify token                                             │
│  - Lấy user từ DB                                           │
│  - Gắn req.user                                             │
│  - next() → Controller                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  CONTROLLER (order.controller.ts)                           │
│  - Nhận req.user.id                                         │
│  - Lấy query params                                         │
│  - Gọi Model.getByUserId()                                  │
│  - Format Response                                          │
│  - Trả về JSON                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  MODEL (order.model.ts)                                     │
│  - Build SQL query                                          │
│  - pool.execute() → Database                                │
│  - Return data                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  DATABASE (MySQL)                                            │
│  - Thực thi SQL query                                       │
│  - Trả về kết quả                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ (Data flow ngược lại)
```

---

## 🗂️ CẤU TRÚC THƯ MỤC VÀ VAI TRÒ

```
BE_UTE_SHOP_V2/
├── src/
│   ├── server.ts              ← Entry point, register routes
│   ├── config/
│   │   └── database.ts        ← Database connection pool
│   ├── routes/                ← Định nghĩa endpoints
│   │   └── order.routes.ts
│   ├── controllers/           ← Business logic
│   │   └── order.controller.ts
│   ├── models/                ← Data access layer
│   │   └── order.model.ts
│   └── middleware/            ← Authentication, validation
│       └── auth.middleware.ts
```

---

## 📝 CÁCH ĐỌC VÀ TÌM API

### **Bước 1: Xác định endpoint bạn cần**

Ví dụ: "Tôi muốn lấy danh sách sản phẩm"

### **Bước 2: Tìm trong routes/**

```
routes/
  ├── product.routes.ts    ← Có thể có API sản phẩm
  ├── order.routes.ts
  └── ...
```

**Mở file `product.routes.ts`:**
```typescript
router.get('/', getProducts);  // ← Có thể là endpoint này
```

### **Bước 3: Xem controller tương ứng**

```typescript
// Từ routes, thấy controller là getProducts
// Tìm file: controllers/product.controller.ts
```

**Mở file `product.controller.ts`:**
```typescript
export const getProducts = async (req, res) => {
  // Logic xử lý
  // Gọi model để lấy data
}
```

### **Bước 4: Xem model để hiểu query**

```typescript
// Controller gọi ProductModel.getAll()
// Mở file: models/product.model.ts
```

### **Bước 5: Xem middleware nếu có**

```typescript
// Trong routes: router.get('/', authenticateToken, getProducts)
// Middleware: authenticateToken
// File: middleware/auth.middleware.ts
```

---

## 🔍 VÍ DỤ TÌM API: "Tạo đơn hàng mới"

### **1. Tìm trong routes/**

```bash
grep -r "POST.*order" routes/
# Hoặc mở order.routes.ts
```

```typescript
// routes/order.routes.ts
router.post('/', authenticateToken, createOrder);  // ← Tìm thấy!
```

**Endpoint:** `POST /api/orders`

### **2. Xem controller**

```typescript
// controllers/order.controller.ts
export const createOrder = async (req: AuthRequest, res: Response) => {
  // Logic tạo đơn hàng
  const orderId = await OrderModel.create(orderData);
}
```

### **3. Xem model**

```typescript
// models/order.model.ts
static async create(orderData) {
  // SQL INSERT INTO orders ...
}
```

### **4. Kiểm tra request body**

```typescript
// Từ controller, xem req.body có gì:
const {
  shipping_address,
  billing_address,
  items,
  payment_method,
  // ...
} = req.body;
```

---

## 🎯 CẤU TRÚC RESPONSE CHUẨN

Tất cả API trong project đều follow format này:

```typescript
// Success Response
{
  "success": true,
  "message": "Thông báo thành công",
  "data": {
    // Dữ liệu trả về
  }
}

// Error Response
{
  "success": false,
  "message": "Thông báo lỗi",
  "error": { /* chi tiết lỗi (chỉ dev) */ }
}
```

---

## 🔐 AUTHENTICATION FLOW

```
Client Request
    ↓
Header: Authorization: Bearer <token>
    ↓
Middleware authenticateToken
    ↓
Verify token (JWT)
    ↓
Lấy userId từ token
    ↓
Query database: SELECT user WHERE id = userId
    ↓
Gắn req.user = { id, email, role_id, ... }
    ↓
Controller có thể dùng req.user.id
```

---

## 📚 CÁC LOẠI API TRONG PROJECT

### **1. Public API (Không cần auth)**
```typescript
router.get('/products', getProducts);  // Không có middleware
```

### **2. Protected API (Cần đăng nhập)**
```typescript
router.get('/my-orders', authenticateToken, getMyOrders);
```

### **3. Admin Only API**
```typescript
router.get('/admin/all', authenticateToken, requireAdmin, getAllOrders);
//                                      ↑              ↑
//                                  Cần đăng nhập    Cần là admin
```

---

## 🛠️ CÁCH TEST API

### **1. Dùng Postman/Thunder Client**

```
GET http://localhost:5000/api/orders/my-orders?page=1&limit=10

Headers:
  Authorization: Bearer <your_token>
  Content-Type: application/json
```

### **2. Dùng curl**

```bash
curl -X GET \
  'http://localhost:5000/api/orders/my-orders?page=1&limit=10' \
  -H 'Authorization: Bearer <your_token>'
```

### **3. Dùng JavaScript (Frontend)**

```javascript
const response = await fetch('http://localhost:5000/api/orders/my-orders?page=1&limit=10', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

---

## 💡 TIPS QUAN TRỌNG

1. **Luôn kiểm tra middleware trước** - Biết API có cần auth không
2. **Đọc controller để hiểu logic** - Controller cho biết API làm gì
3. **Xem model để hiểu data structure** - Model cho biết database trả về gì
4. **Check response format** - Tất cả đều có `success`, `message`, `data`
5. **Query params vs Body params:**
   - `GET` → Dùng query params (`?page=1`)
   - `POST/PUT` → Dùng body (`req.body`)

---

## 📌 TỔNG KẾT

**Luồng cơ bản:**
```
Client → Server.ts → Routes → Middleware → Controller → Model → Database
                                                                  ↓
Client ← Response JSON ← Controller ← Model ← Database Result
```

**Quy tắc:**
- **Routes**: Định nghĩa endpoint và middleware
- **Controllers**: Xử lý business logic, format response
- **Models**: Truy vấn database, return raw data
- **Middleware**: Authentication, validation, logging

**Đọc API:**
1. Tìm trong `routes/` → Xác định endpoint
2. Xem `controllers/` → Hiểu logic
3. Xem `models/` → Hiểu data structure
4. Xem `middleware/` → Biết yêu cầu auth

---

Chúc bạn code vui vẻ! 🚀
