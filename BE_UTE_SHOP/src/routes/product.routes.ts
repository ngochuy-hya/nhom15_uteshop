import { Router } from 'express';
import {
  getProducts,
  getNewProducts,
  getProductById,
  getProductByIdAdmin,
  getRelatedProducts,
  getFeaturedProducts,
  getBestSellerProducts,
  createProduct,
  createProductWithImages,
  updateProduct,
  deleteProduct,
  // uploadProductImages, // Đã comment - không dùng (dùng /with-images thay thế)
  deleteProductImage,
  addProductAttribute,
  updateProductAttribute,
  deleteProductAttribute,
  productValidation,
} from '../controllers/product.controller';
import { optionalAuth, requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { upload, handleUploadError } from '../middleware/upload.middleware';

const router = Router();

// ==========================================
// PUBLIC ROUTES (Không cần auth)
// ==========================================

router.get('/', optionalAuth, getProducts); // GET /products - Danh sách sản phẩm
router.get('/new', getNewProducts); // GET /products/new - Sản phẩm mới
router.get('/featured', getFeaturedProducts); // GET /products/featured - Sản phẩm nổi bật
router.get('/bestseller', getBestSellerProducts); // GET /products/bestseller - Sản phẩm bán chạy
router.get('/:id/related', getRelatedProducts); // GET /products/:id/related - Sản phẩm liên quan
router.get('/:id', getProductById); // GET /products/:id - Chi tiết sản phẩm (PUBLIC)

// ==========================================
// ADMIN ROUTES (Cần auth + admin)
// ==========================================

// Admin - Product CRUD
router.get('/admin/:id', requireAuth, requireAdmin, getProductByIdAdmin); // GET /products/admin/:id - Chi tiết đầy đủ cho admin
router.post('/with-images', requireAuth, requireAdmin, upload.array('images', 10), handleUploadError, createProductWithImages); // POST /products/with-images - Tạo product + upload ảnh từ local (Form-Data)
router.post('/', requireAuth, requireAdmin, productValidation, createProduct); // POST /products - Tạo product với JSON (ảnh URL sẵn có từ Cloudinary)
router.put('/:id', requireAuth, requireAdmin, updateProduct); // PUT /products/:id - Cập nhật product
router.delete('/:id', requireAuth, requireAdmin, deleteProduct); // DELETE /products/:id - Xóa product (soft delete: is_active = 0)

// Admin - Product Images Management
router.delete('/:id/images/:imageId', requireAuth, requireAdmin, deleteProductImage); // DELETE /products/:id/images/:imageId - Xóa ảnh sản phẩm
// NOTE: POST /products/:id/images đã bị comment vì trùng với /with-images, nhưng giữ lại nếu cần thêm ảnh sau khi tạo product
// router.post('/:id/images', requireAuth, requireAdmin, uploadProductImages); // POST /products/:id/images - Thêm ảnh vào product đã có (JSON với image_url)

// Admin - Product Attributes Management
router.post('/:id/attributes', requireAuth, requireAdmin, addProductAttribute); // POST /products/:id/attributes - Thêm thuộc tính (size, color, etc.)
router.put('/:id/attributes/:attrId', requireAuth, requireAdmin, updateProductAttribute); // PUT /products/:id/attributes/:attrId - Cập nhật thuộc tính
router.delete('/:id/attributes/:attrId', requireAuth, requireAdmin, deleteProductAttribute); // DELETE /products/:id/attributes/:attrId - Xóa thuộc tính

export default router;
