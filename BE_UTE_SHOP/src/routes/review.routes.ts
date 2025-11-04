import { Router } from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
  getPendingReviews,
  approveReview,
  rejectReview,
} from '../controllers/review.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/product/:productId', getProductReviews);

// User routes (cần đăng nhập)
router.post('/', authenticateToken, createReview);
router.put('/:id', authenticateToken, updateReview);
router.delete('/:id', authenticateToken, deleteReview);
router.post('/:id/helpful', authenticateToken, markHelpful);

// Admin routes
router.get('/admin/pending', authenticateToken, requireAdmin, getPendingReviews);
router.put('/admin/:id/approve', authenticateToken, requireAdmin, approveReview);
router.put('/admin/:id/reject', authenticateToken, requireAdmin, rejectReview);

export default router;

