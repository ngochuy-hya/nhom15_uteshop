import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  uploadLogo,
  uploadBanner,
} from '../controllers/settings.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public route
router.get('/', getSettings);

// Admin routes
router.put('/', authenticateToken, requireAdmin, updateSettings);
router.post('/logo', authenticateToken, requireAdmin, uploadLogo);
router.post('/banner', authenticateToken, requireAdmin, uploadBanner);

export default router;

