import express from 'express';
import {
  createPayment,
  checkPaymentStatus,
  handlePayOSWebhook,
  getMyPayments,
  handlePaymentReturn,
  cancelPayment,
  retryPayment,
  refundPayment,
} from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Webhook từ PayOS (không cần authentication)
router.post('/payos/webhook', handlePayOSWebhook);

// Return URL sau khi thanh toán (redirect từ PayOS)
router.get('/payos/return', handlePaymentReturn);

// Kiểm tra trạng thái thanh toán (có thể public hoặc auth tùy yêu cầu)
router.get('/payos/check/:orderCode', checkPaymentStatus);

// ============================================
// USER ROUTES (Yêu cầu authentication)
// ============================================

// Tạo payment link
router.post('/payos/create', authenticateToken, createPayment);

// Hủy payment
router.post('/cancel', authenticateToken, cancelPayment);

// Hoàn tiền (refund) cho đơn hàng đã thanh toán
router.post('/refund', authenticateToken, refundPayment);

// Retry payment - tạo lại payment link
router.post('/retry', authenticateToken, retryPayment);

// Lấy lịch sử thanh toán của user
router.get('/my-payments', authenticateToken, getMyPayments);

export default router;

