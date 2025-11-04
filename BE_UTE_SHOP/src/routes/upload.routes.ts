import { Router } from 'express';
import { uploadImage, uploadImages, deleteFile } from '../controllers/upload.controller';
import { upload, handleUploadError } from '../middleware/upload.middleware';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Upload single image (Admin only)
router.post(
  '/image',
  authenticateToken,
  requireAdmin,
  upload.single('image'),
  handleUploadError,
  uploadImage
);

// Upload multiple images (Admin only)
router.post(
  '/images',
  authenticateToken,
  requireAdmin,
  upload.array('images', 10),
  handleUploadError,
  uploadImages
);

// Delete file (Admin only)
router.delete('/:filename', authenticateToken, requireAdmin, deleteFile);

export default router;

