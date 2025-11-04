import express from 'express';
import {
  getBanners,
  getBannerById,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  bannerValidation,
} from '../controllers/banner.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// ============================================
// ADMIN ROUTES (Yêu cầu authentication và admin role)
// ============================================

router.get('/admin/all', authenticateToken, requireAdmin, getAllBannersAdmin);
router.post('/admin', authenticateToken, requireAdmin, bannerValidation, createBanner);
router.put('/admin/:id', authenticateToken, requireAdmin, updateBanner);
router.delete('/admin/:id', authenticateToken, requireAdmin, deleteBanner);
router.patch('/admin/:id/toggle-status', authenticateToken, requireAdmin, toggleBannerStatus);

// ============================================
// PUBLIC ROUTES
// ============================================

router.get('/', getBanners);
router.get('/:id', getBannerById);

export default router;
