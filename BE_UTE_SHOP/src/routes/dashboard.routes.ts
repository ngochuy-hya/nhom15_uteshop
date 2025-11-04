import { Router } from 'express';
import {
  getOverview,
  getRevenue,
  getTopProducts,
  getRecentOrders,
  getCustomerStats,
} from '../controllers/dashboard.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Tất cả routes đều cần admin
router.get('/overview', authenticateToken, requireAdmin, getOverview);
router.get('/revenue', authenticateToken, requireAdmin, getRevenue);
router.get('/top-products', authenticateToken, requireAdmin, getTopProducts);
router.get('/recent-orders', authenticateToken, requireAdmin, getRecentOrders);
router.get('/customers', authenticateToken, requireAdmin, getCustomerStats);

export default router;

