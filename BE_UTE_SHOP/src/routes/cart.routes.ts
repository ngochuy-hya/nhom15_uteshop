import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  calculateCartTotal,
  checkoutCart,
} from '../controllers/cart.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Tất cả routes đều cần authentication
router.get('/', authenticateToken, getCart);
router.post('/', authenticateToken, addToCart);
router.post('/calculate', authenticateToken, calculateCartTotal); // Tính toán giá với coupon
router.post('/checkout', authenticateToken, checkoutCart); // Tạo order từ cart
router.put('/:id', authenticateToken, updateCartItem);
router.delete('/:id', authenticateToken, removeFromCart);
router.delete('/', authenticateToken, clearCart);

export default router;
