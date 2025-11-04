import { Router } from 'express';
import {
  getOverviewStats,
  getRevenueStats,
  getTopProducts,
  getCustomerStats,
} from '../controllers/analytics.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Tất cả routes đều cần admin
router.get('/overview', authenticateToken, requireAdmin, getOverviewStats);
router.get('/revenue', authenticateToken, requireAdmin, getRevenueStats);
router.get('/top-products', authenticateToken, requireAdmin, getTopProducts);
router.get('/customers', authenticateToken, requireAdmin, getCustomerStats);

export default router;

