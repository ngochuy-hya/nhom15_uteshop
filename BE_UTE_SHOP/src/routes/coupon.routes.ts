import { Router } from 'express';
import {
  getAllCoupons,
  getCouponById,
  getAvailableCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/coupon.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// User routes
router.get('/available', authenticateToken, getAvailableCoupons);
router.post('/validate', authenticateToken, validateCoupon);

// Admin routes
router.get('/', authenticateToken, requireAdmin, getAllCoupons);
router.post('/', authenticateToken, requireAdmin, createCoupon);
router.get('/:id', authenticateToken, requireAdmin, getCouponById);
router.put('/:id', authenticateToken, requireAdmin, updateCoupon);
router.delete('/:id', authenticateToken, requireAdmin, deleteCoupon);

export default router;

