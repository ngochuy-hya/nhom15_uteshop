import { Router } from 'express';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/address.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Tất cả routes đều cần authentication
router.get('/', authenticateToken, getAddresses);
router.post('/', authenticateToken, createAddress);
router.put('/:id', authenticateToken, updateAddress);
router.delete('/:id', authenticateToken, deleteAddress);
router.put('/:id/default', authenticateToken, setDefaultAddress);

export default router;

