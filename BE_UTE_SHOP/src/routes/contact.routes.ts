import { Router } from 'express';
import {
  sendContact,
  getContactMessages,
  replyContactMessage,
  deleteContactMessage,
  contactValidation,
} from '../controllers/contact.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public route
router.post('/', contactValidation, sendContact);

// Admin routes
router.get('/admin/messages', requireAuth, requireAdmin, getContactMessages);
router.put('/admin/:id/reply', requireAuth, requireAdmin, replyContactMessage);
router.delete('/admin/:id', requireAuth, requireAdmin, deleteContactMessage);

export default router;

