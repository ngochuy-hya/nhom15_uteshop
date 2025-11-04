import { Router } from 'express';
import {
  getBrands,
  getBrandById,
  getBrandBySlug,
  getBrandsAdmin,
  getBrandByIdAdmin,
  createBrand,
  updateBrand,
  deleteBrand,
  brandValidation,
} from '../controllers/brand.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// ==========================================
// PUBLIC ROUTES (Không cần auth)
// ==========================================

router.get('/', getBrands); // GET /brands - Danh sách thương hiệu (chỉ active)
router.get('/slug/:slug', getBrandBySlug); // GET /brands/slug/:slug - Lấy thương hiệu theo slug
router.get('/:id', getBrandById); // GET /brands/:id - Chi tiết thương hiệu (chỉ active)

// ==========================================
// ADMIN ROUTES (Cần auth + admin)
// ==========================================

// Admin - Brand CRUD
router.get('/admin/list', requireAuth, requireAdmin, getBrandsAdmin); // GET /brands/admin/list - Danh sách thương hiệu cho admin (bao gồm inactive)
router.get('/admin/:id', requireAuth, requireAdmin, getBrandByIdAdmin); // GET /brands/admin/:id - Chi tiết thương hiệu cho admin (bao gồm inactive)
router.post('/', requireAuth, requireAdmin, brandValidation, createBrand); // POST /brands - Tạo thương hiệu mới
router.put('/:id', requireAuth, requireAdmin, updateBrand); // PUT /brands/:id - Cập nhật thương hiệu
router.delete('/:id', requireAuth, requireAdmin, deleteBrand); // DELETE /brands/:id - Xóa thương hiệu (soft delete: is_active = 0)

export default router;
