import { Router } from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  changePassword,
  deleteUser,
  getUserStatistics,
  updateUserByAdmin,
  activateUser,
  deactivateUser,
  getUserOrders,
} from '../controllers/user.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Routes cho user (cần đăng nhập)
router.put('/profile', authenticateToken, updateUser);
router.post('/change-password', authenticateToken, changePassword);

// Routes cho admin
router.get('/', authenticateToken, requireAdmin, getUsers);
router.get('/statistics', authenticateToken, requireAdmin, getUserStatistics);
router.get('/:id', authenticateToken, requireAdmin, getUserById);
router.put('/:id', authenticateToken, requireAdmin, updateUserByAdmin);
router.get('/:id/orders', authenticateToken, requireAdmin, getUserOrders);
router.put('/:id/activate', authenticateToken, requireAdmin, activateUser);
router.put('/:id/deactivate', authenticateToken, requireAdmin, deactivateUser);
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

export default router;
