# 🔧 CORS Fix Checklist

## ✅ Đã sửa trong `src/server.ts`:

1. ✅ CORS middleware đặt TRƯỚC tất cả middleware khác
2. ✅ Helmet config để không block CORS
3. ✅ Rate limiter skip OPTIONS requests
4. ✅ CORS config đầy đủ với origin, methods, headers
5. ✅ CORS middleware tự động xử lý tất cả OPTIONS preflight requests (không cần explicit handler với Express 5)
6. ✅ Helper function `setCorsHeaders()` để thêm CORS headers manually trong error cases
7. ✅ CORS headers được thêm vào 404 handler và error handler
8. ✅ Unhandled rejection và exception handlers để tránh crash server
9. ✅ CORS maxAge (24h) để cache preflight requests

## 🚨 QUAN TRỌNG: Cần restart backend!

### Cách restart:

1. **Dừng backend hiện tại:**
   - Vào terminal đang chạy backend
   - Nhấn `Ctrl + C` để dừng

2. **Chạy lại backend:**
   ```bash
   cd BE_UTE_SHOP_V2
   npm run dev
   ```

3. **Kiểm tra console output:**
   - Phải thấy: `🚀 Server is running on port 5000`
   - Nếu không thấy → có lỗi, kiểm tra lại

### Sau khi restart:

1. **Refresh frontend** (F5 hoặc Ctrl+R)
2. **Kiểm tra console:**
   - Không còn CORS errors
   - API calls thành công
   - Products hiển thị từ database

### Nếu vẫn lỗi:

1. Kiểm tra backend có đang chạy: `http://localhost:5000/api/health`
2. Kiểm tra terminal backend có lỗi gì không
3. Kiểm tra database connection
4. Xóa cache browser (Ctrl+Shift+Delete)
5. Kiểm tra Network tab trong DevTools để xem:
   - OPTIONS preflight request có thành công không (status 200)
   - Response headers có `Access-Control-Allow-Origin` không
6. Thử hard refresh: Ctrl+Shift+R (Windows) hoặc Cmd+Shift+R (Mac)
7. Kiểm tra console backend có log "Unhandled Rejection" hoặc "Uncaught Exception" không

## 🔍 Debug CORS Issues:

### Kiểm tra trong Browser DevTools:
1. Mở Network tab
2. Tìm request bị lỗi CORS
3. Kiểm tra:
   - **Request Headers**: Có `Origin: http://localhost:5173` không?
   - **Response Headers**: Có `Access-Control-Allow-Origin: http://localhost:5173` không?
   - Nếu có preflight (OPTIONS request), kiểm tra nó có thành công (200) không

### Kiểm tra trong Backend Logs:
- Tìm các lỗi database connection
- Tìm các "Unhandled Rejection" - đây có thể là nguyên nhân gây intermittent errors

