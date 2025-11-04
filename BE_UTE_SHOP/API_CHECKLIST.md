# ✅ API CHECKLIST - UTESHOP

## 🔐 Authentication APIs
- [x] POST `/api/auth/register` - Đăng ký tài khoản
- [x] POST `/api/auth/verify-otp` - Xác thực OTP
- [x] POST `/api/auth/resend-otp` - Gửi lại OTP
- [x] POST `/api/auth/login` - Đăng nhập
- [x] GET `/api/auth/profile` - Lấy thông tin profile
- [x] POST `/api/auth/logout` - Đăng xuất
- [x] POST `/api/auth/forgot-password` - Quên mật khẩu ⬆️
- [x] POST `/api/auth/reset-password` - Đặt lại mật khẩu ⬆️
- [x] POST `/api/auth/refresh-token` - Refresh token ⬆️
- [x] POST `/api/auth/google` - Đăng nhập Google (ID Token)
- [x] GET `/api/auth/google/login` - Đăng nhập Google (Redirect) ⬆️
- [x] GET `/api/auth/google/callback` - Google callback ⬆️
- [x] POST `/api/auth/facebook` - Đăng nhập Facebook (Access Token)
- [x] GET `/api/auth/facebook/login` - Đăng nhập Facebook (Redirect) ⬆️
- [x] GET `/api/auth/facebook/callback` - Facebook callback ⬆️

## 👤 User APIs
- [x] GET `/api/users` - Lấy danh sách users (Admin)
- [x] GET `/api/users/statistics` - Thống kê users (Admin)
- [x] GET `/api/users/:id` - Lấy user theo ID (Admin)
- [x] PUT `/api/users/profile` - Cập nhật profile (User)
- [x] PUT `/api/users/:id` - Cập nhật user (Admin) ⬆️
- [x] POST `/api/users/change-password` - Đổi mật khẩu
- [x] DELETE `/api/users/:id` - Xóa user (Admin)
- [x] GET `/api/users/:id/orders` - Lấy đơn hàng của user (Admin)
- [x] PUT `/api/users/:id/activate` - Kích hoạt user (Admin)
- [x] PUT `/api/users/:id/deactivate` - Vô hiệu hóa user (Admin)

## 🛍️ Product APIs
- [x] GET `/api/products` - Lấy danh sách sản phẩm (có filter, sort, pagination)
- [x] GET `/api/products/new` - Lấy sản phẩm mới ⬆️
- [x] GET `/api/products/featured` - Lấy sản phẩm nổi bật
- [x] GET `/api/products/bestseller` - Lấy sản phẩm bán chạy
- [x] GET `/api/products/bestdeal` - Lấy sản phẩm giảm giá tốt
- [x] GET `/api/products/category/:categoryId` - Lấy sản phẩm theo danh mục
- [x] GET `/api/products/brand/:brandId` - Lấy sản phẩm theo thương hiệu
- [x] GET `/api/products/:id` - Lấy chi tiết sản phẩm
- [x] GET `/api/products/:id/related` - Lấy sản phẩm liên quan
- [x] POST `/api/products` - Tạo sản phẩm mới (Admin)
- [x] PUT `/api/products/:id` - Cập nhật sản phẩm (Admin)
- [x] DELETE `/api/products/:id` - Xóa sản phẩm (Admin)
- [x] POST `/api/products/:id/images` - Upload ảnh sản phẩm (Admin) ⬆️
- [x] DELETE `/api/products/:id/images/:imageId` - Xóa ảnh sản phẩm (Admin) ⬆️
- [x] POST `/api/products/:id/attributes` - Thêm thuộc tính (Admin) ⬆️
- [x] PUT `/api/products/:id/attributes/:attrId` - Cập nhật thuộc tính (Admin) ⬆️
- [x] DELETE `/api/products/:id/attributes/:attrId` - Xóa thuộc tính (Admin) ⬆️

## 📂 Category APIs
- [x] GET `/api/categories` - Lấy danh sách danh mục
- [x] GET `/api/categories/:id` - Lấy chi tiết danh mục
- [x] GET `/api/categories/slug/:slug` - Lấy danh mục theo slug
- [x] POST `/api/categories` - Tạo danh mục (Admin)
- [x] PUT `/api/categories/:id` - Cập nhật danh mục (Admin)
- [x] DELETE `/api/categories/:id` - Xóa danh mục (Admin)

## 🏷️ Brand APIs
- [x] GET `/api/brands` - Lấy danh sách thương hiệu
- [x] GET `/api/brands/:id` - Lấy chi tiết thương hiệu
- [x] GET `/api/brands/slug/:slug` - Lấy thương hiệu theo slug
- [x] POST `/api/brands` - Tạo thương hiệu (Admin)
- [x] PUT `/api/brands/:id` - Cập nhật thương hiệu (Admin)
- [x] DELETE `/api/brands/:id` - Xóa thương hiệu (Admin)

## 🛒 Cart APIs
- [x] GET `/api/cart` - Lấy giỏ hàng
- [x] POST `/api/cart` - Thêm vào giỏ hàng
- [x] PUT `/api/cart/:id` - Cập nhật số lượng
- [x] DELETE `/api/cart/:id` - Xóa sản phẩm khỏi giỏ
- [x] DELETE `/api/cart` - Xóa toàn bộ giỏ hàng

## ❤️ Wishlist APIs
- [x] GET `/api/wishlist` - Lấy wishlist
- [x] POST `/api/wishlist` - Thêm vào wishlist
- [x] GET `/api/wishlist/check/:product_id` - Kiểm tra sản phẩm trong wishlist
- [x] DELETE `/api/wishlist/:id` - Xóa khỏi wishlist
- [x] DELETE `/api/wishlist` - Xóa toàn bộ wishlist

## 📦 Order APIs
- [x] POST `/api/orders` - Tạo đơn hàng
- [x] GET `/api/orders/my-orders` - Lấy đơn hàng của tôi
- [x] GET `/api/orders/:id` - Lấy chi tiết đơn hàng
- [x] POST `/api/orders/:id/cancel` - Hủy đơn hàng
- [x] GET `/api/orders/admin/all` - Lấy tất cả đơn hàng (Admin)
- [x] PUT `/api/orders/admin/:id/status` - Cập nhật trạng thái (Admin)
- [x] GET `/api/orders/admin/statistics` - Thống kê đơn hàng (Admin)
- [x] GET `/api/orders/:id/invoice` - Tải hóa đơn ⬆️
- [x] POST `/api/orders/:id/return` - Yêu cầu trả hàng ⬆️

## ⭐ Review APIs
- [x] GET `/api/reviews/product/:productId` - Lấy đánh giá sản phẩm
- [x] POST `/api/reviews` - Tạo đánh giá
- [x] PUT `/api/reviews/:id` - Cập nhật đánh giá
- [x] DELETE `/api/reviews/:id` - Xóa đánh giá
- [x] POST `/api/reviews/:id/helpful` - Đánh dấu hữu ích
- [x] GET `/api/reviews/admin/pending` - Đánh giá chờ duyệt (Admin)
- [x] PUT `/api/reviews/admin/:id/approve` - Duyệt đánh giá (Admin)
- [x] PUT `/api/reviews/admin/:id/reject` - Từ chối đánh giá (Admin)

## 🎟️ Coupon APIs
- [x] GET `/api/coupons` - Lấy danh sách coupon (Admin)
- [x] GET `/api/coupons/available` - Lấy coupon khả dụng
- [x] POST `/api/coupons/validate` - Validate coupon
- [x] POST `/api/coupons` - Tạo coupon (Admin)
- [x] PUT `/api/coupons/:id` - Cập nhật coupon (Admin)
- [x] DELETE `/api/coupons/:id` - Xóa coupon (Admin)

## 📍 Address APIs
- [x] GET `/api/addresses` - Lấy danh sách địa chỉ
- [x] POST `/api/addresses` - Thêm địa chỉ
- [x] PUT `/api/addresses/:id` - Cập nhật địa chỉ
- [x] DELETE `/api/addresses/:id` - Xóa địa chỉ
- [x] PUT `/api/addresses/:id/default` - Đặt địa chỉ mặc định

## 💳 Payment APIs
- [ ] POST `/api/payments/create` - Tạo payment intent
- [ ] POST `/api/payments/vnpay/create` - Tạo thanh toán VNPay
- [ ] GET `/api/payments/vnpay/return` - VNPay return URL
- [ ] POST `/api/payments/momo/create` - Tạo thanh toán MoMo
- [ ] POST `/api/payments/momo/notify` - MoMo IPN
- [ ] GET `/api/payments/:orderId/status` - Kiểm tra trạng thái thanh toán

## 📝 Blog APIs
- [x] GET `/api/blogs` - Lấy danh sách blog
- [x] GET `/api/blogs/:id` - Lấy chi tiết blog
- [x] GET `/api/blogs/slug/:slug` - Lấy blog theo slug
- [x] POST `/api/blogs` - Tạo blog (Admin)
- [x] PUT `/api/blogs/:id` - Cập nhật blog (Admin)
- [x] DELETE `/api/blogs/:id` - Xóa blog (Admin)
- [x] POST `/api/blogs/:id/comments` - Thêm comment
- [x] GET `/api/blogs/:id/comments` - Lấy comments

## 📧 Contact APIs
- [x] POST `/api/contact` - Gửi liên hệ
- [x] GET `/api/contact/admin/messages` - Lấy tin nhắn (Admin)
- [x] PUT `/api/contact/admin/:id/reply` - Trả lời tin nhắn (Admin)
- [x] DELETE `/api/contact/admin/:id` - Xóa tin nhắn (Admin)

## 📊 Dashboard APIs (Admin)
- [x] GET `/api/dashboard/overview` - Tổng quan
- [x] GET `/api/dashboard/revenue` - Doanh thu
- [x] GET `/api/dashboard/top-products` - Sản phẩm bán chạy
- [x] GET `/api/dashboard/recent-orders` - Đơn hàng gần đây
- [x] GET `/api/dashboard/customers` - Thống kê khách hàng

## 🔔 Notification APIs
- [x] GET `/api/notifications` - Lấy thông báo ⬆️
- [x] PUT `/api/notifications/:id/read` - Đánh dấu đã đọc ⬆️
- [x] PUT `/api/notifications/read-all` - Đánh dấu tất cả đã đọc ⬆️
- [x] DELETE `/api/notifications/:id` - Xóa thông báo ⬆️

## ⚙️ Settings APIs (Admin)
- [x] GET `/api/settings` - Lấy cài đặt ⬆️
- [x] PUT `/api/settings` - Cập nhật cài đặt ⬆️
- [x] POST `/api/settings/logo` - Upload logo ⬆️
- [x] POST `/api/settings/banner` - Upload banner ⬆️

## 📤 Upload APIs
- [x] POST `/api/upload/image` - Upload ảnh
- [x] POST `/api/upload/images` - Upload nhiều ảnh
- [x] DELETE `/api/upload/:filename` - Xóa file

## 📈 Analytics APIs (Admin)
- [x] GET `/api/analytics/overview` - Thống kê tổng quan ⬆️
- [x] GET `/api/analytics/revenue` - Phân tích doanh thu ⬆️
- [x] GET `/api/analytics/top-products` - Sản phẩm bán chạy ⬆️
- [x] GET `/api/analytics/customers` - Phân tích khách hàng ⬆️

---

## 📊 Tổng kết

### ✅ Đã hoàn thành: 118 APIs
- Authentication: 15/15 ✅ ⬆️
- User: 10/10 ✅
- Product: 17/17 ✅ ⬆️
- Category: 6/6 ✅
- Brand: 6/6 ✅
- Cart: 5/5 ✅
- Wishlist: 5/5 ✅
- Order: 9/9 ✅
- Review: 8/8 ✅
- Coupon: 6/6 ✅
- Address: 5/5 ✅
- Payment: 0/6
- Blog: 8/8 ✅
- Contact: 4/4 ✅
- Dashboard: 5/5 ✅
- Notification: 4/4 ✅ ⬆️
- Settings: 4/4 ✅ ⬆️
- Upload: 3/3 ✅
- Analytics: 4/4 ✅ ⬆️

### ⏳ Còn lại: 7 APIs (chỉ còn Payment - VNPay, MoMo, COD)

### 🎯 Ưu tiên tiếp theo:
1. ~~Review APIs~~ ✅ Hoàn thành
2. ~~Coupon APIs~~ ✅ Hoàn thành
3. ~~Address APIs~~ ✅ Hoàn thành
4. ~~Upload APIs~~ ✅ Hoàn thành
5. ~~Dashboard APIs~~ ✅ Hoàn thành
6. Blog APIs (nội dung marketing) - Tiếp theo
7. Contact APIs (hỗ trợ khách hàng) - Tiếp theo
8. Product CRUD APIs (Admin) - Tiếp theo
9. Category/Brand CRUD APIs (Admin) - Tiếp theo
10. Payment APIs (VNPay, MoMo) - Để sau

---

**Last Updated:** 2024-10-25
