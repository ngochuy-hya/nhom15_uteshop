# UTESHOP API Postman Collection

File Postman collection để test API Coupons và Products.

## Cách Import vào Postman

1. Mở Postman application
2. Click vào **Import** button (góc trên bên trái)
3. Chọn file `UTESHOP_API_Collection.postman_collection.json`
4. Click **Import**

## Cấu hình Variables

Collection đã có sẵn các variables:
- `base_url`: `http://localhost:5000/api` (mặc định)
- `auth_token`: JWT token để authentication (cần set sau khi login)
- `coupon_id`: ID coupon để test
- `product_id`: ID product để test

### Cách set auth_token:

1. Login qua API `/api/auth/login`
2. Copy JWT token từ response
3. Vào Postman collection → Variables tab
4. Set giá trị cho `auth_token`

Hoặc có thể set trong mỗi request:
- Vào request → Authorization tab
- Chọn Type: Bearer Token
- Paste token vào Token field

## API Endpoints

### Coupons

#### User APIs (cần auth)
- `GET /coupons/available` - Lấy danh sách coupon khả dụng
- `POST /coupons/validate` - Validate coupon code khi checkout

#### Admin APIs (cần auth + admin role)
- `GET /coupons` - Lấy danh sách tất cả coupons (có pagination, filter)
- `GET /coupons/:id` - Lấy chi tiết coupon
- `POST /coupons` - Tạo coupon mới
- `PUT /coupons/:id` - Cập nhật coupon
- `DELETE /coupons/:id` - Xóa coupon

### Products

#### Public APIs (không cần auth)
- `GET /products` - Lấy danh sách sản phẩm (có filter, pagination)
- `GET /products/new` - Lấy sản phẩm mới
- `GET /products/featured` - Lấy sản phẩm nổi bật
- `GET /products/bestseller` - Lấy sản phẩm bán chạy
- `GET /products/:id` - Lấy chi tiết sản phẩm
- `GET /products/:id/related` - Lấy sản phẩm liên quan

#### Admin APIs (cần auth + admin role)
- `GET /products/admin/:id` - Lấy chi tiết sản phẩm (admin view - bao gồm cả inactive)
- `POST /products` - Tạo sản phẩm mới (JSON)
- `POST /products/with-images` - Tạo sản phẩm với upload ảnh (Form-Data)
- `PUT /products/:id` - Cập nhật sản phẩm
- `DELETE /products/:id` - Xóa sản phẩm (soft delete)
- `POST /products/:id/attributes` - Thêm thuộc tính (color, size, etc.)
- `PUT /products/:id/attributes/:attrId` - Cập nhật thuộc tính
- `DELETE /products/:id/attributes/:attrId` - Xóa thuộc tính
- `DELETE /products/:id/images/:imageId` - Xóa ảnh sản phẩm

### Product Attributes (Standalone APIs)

#### Public APIs
- `GET /product-attributes/product/:productId` - Lấy tất cả attributes (chỉ active)
- `GET /product-attributes/product/:productId/type/:type` - Lấy attributes theo type
- `GET /product-attributes/product/:productId/:attributeId` - Lấy một attribute theo ID

#### Admin APIs
- `GET /product-attributes/admin/product/:productId` - Lấy tất cả attributes (bao gồm inactive)
- `POST /product-attributes/product/:productId` - Tạo attribute mới
- `PUT /product-attributes/product/:productId/:attributeId` - Cập nhật attribute
- `DELETE /product-attributes/product/:productId/:attributeId` - Xóa attribute

## Ví dụ Request Body

### Create Coupon
```json
{
  "code": "SAVE20",
  "name": "Giảm giá 20%",
  "description": "Áp dụng cho đơn hàng từ 500.000đ",
  "type": "percentage",
  "value": 20,
  "minimum_amount": 500000,
  "maximum_discount": 100000,
  "usage_limit": 100,
  "is_active": true,
  "starts_at": "2024-01-01T00:00:00Z",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

### Validate Coupon
```json
{
  "code": "SAVE20",
  "subtotal": 1000000
}
```

### Create Product
```json
{
  "name": "Áo thun nam cao cấp",
  "slug": "ao-thun-nam-cao-cap",
  "description": "Mô tả chi tiết sản phẩm",
  "short_description": "Mô tả ngắn",
  "sku": "PROD001",
  "price": 500000,
  "sale_price": 400000,
  "stock_quantity": 100,
  "category_id": 1,
  "brand_id": 1,
  "is_featured": true,
  "is_new": true,
  "is_sale": true
}
```

### Add Product Attribute
```json
{
  "attribute_type": "color",
  "attribute_name": "Color",
  "attribute_value": "Red",
  "price_adjustment": 0,
  "stock_quantity": 50,
  "is_active": true
}
```

## Lưu ý

1. **Authentication**: 
   - User APIs cần token (Bearer Token)
   - Admin APIs cần token + admin role

2. **Coupon Types**:
   - `percentage`: Giảm theo phần trăm (value: 0-100)
   - `fixed`: Giảm số tiền cố định

3. **Attribute Types**:
   - `color`, `size`, `material`, `style`

4. **Date Format**: 
   - Sử dụng ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
   - Ví dụ: `2024-01-01T00:00:00Z`

5. **File Upload**:
   - Endpoint `POST /products/with-images` sử dụng Form-Data
   - Field name cho file: `images` (có thể upload nhiều file)

## Testing Flow

1. **Login** để lấy token
2. Set token vào `auth_token` variable
3. Test các endpoints theo thứ tự:
   - Create → Read → Update → Delete
4. Test với các giá trị hợp lệ và không hợp lệ để kiểm tra validation

