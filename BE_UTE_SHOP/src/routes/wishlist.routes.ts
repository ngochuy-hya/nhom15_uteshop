import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkWishlist,
} from '../controllers/wishlist.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Tất cả routes đều cần authentication
router.get('/', authenticateToken, getWishlist);
router.post('/', authenticateToken, addToWishlist);
router.get('/check/:product_id', authenticateToken, checkWishlist);
router.delete('/:id', authenticateToken, removeFromWishlist);
router.delete('/', authenticateToken, clearWishlist);

export default router;
