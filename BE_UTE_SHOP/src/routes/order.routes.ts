import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStatistics,
  getOrderInvoice,
  requestOrderReturn,
} from '../controllers/order.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Routes cho user (cần đăng nhập)
router.post('/', authenticateToken, createOrder);
router.get('/my-orders', authenticateToken, getMyOrders);
router.get('/:id', authenticateToken, getOrderById);
router.get('/:id/invoice', authenticateToken, getOrderInvoice);
router.post('/:id/cancel', authenticateToken, cancelOrder);
router.post('/:id/return', authenticateToken, requestOrderReturn);

// Routes cho admin
router.get('/admin/all', authenticateToken, requireAdmin, getAllOrders);
router.put('/admin/:id/status', authenticateToken, requireAdmin, updateOrderStatus);
router.get('/admin/statistics', authenticateToken, requireAdmin, getOrderStatistics);

export default router;
