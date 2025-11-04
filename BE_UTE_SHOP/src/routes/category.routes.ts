import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  getCategoriesTree,
  getCategoriesAdmin,
  getCategoriesTreeAdmin,
  getCategoryByIdAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  categoryValidation,
} from '../controllers/category.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// ==========================================
// PUBLIC ROUTES (Không cần auth)
// ==========================================

router.get('/tree', getCategoriesTree); // GET /categories/tree - Danh sách danh mục dạng tree (phân cấp, chỉ active)
router.get('/', getCategories); // GET /categories - Danh sách danh mục flat (chỉ active)
router.get('/slug/:slug', getCategoryBySlug); // GET /categories/slug/:slug - Lấy danh mục theo slug
router.get('/:id', getCategoryById); // GET /categories/:id - Chi tiết danh mục (chỉ active)

// ==========================================
// ADMIN ROUTES (Cần auth + admin)
// ==========================================

// Admin - Category CRUD
router.get('/admin/tree', requireAuth, requireAdmin, getCategoriesTreeAdmin); // GET /categories/admin/tree - Danh sách danh mục dạng tree cho admin (bao gồm inactive)
router.get('/admin/list', requireAuth, requireAdmin, getCategoriesAdmin); // GET /categories/admin/list - Danh sách danh mục flat cho admin (bao gồm inactive)
router.get('/admin/:id', requireAuth, requireAdmin, getCategoryByIdAdmin); // GET /categories/admin/:id - Chi tiết danh mục cho admin (bao gồm inactive)
router.post('/', requireAuth, requireAdmin, categoryValidation, createCategory); // POST /categories - Tạo danh mục mới
router.put('/:id', requireAuth, requireAdmin, updateCategory); // PUT /categories/:id - Cập nhật danh mục
router.delete('/:id', requireAuth, requireAdmin, deleteCategory); // DELETE /categories/:id - Xóa danh mục (soft delete: is_active = 0)

export default router;
