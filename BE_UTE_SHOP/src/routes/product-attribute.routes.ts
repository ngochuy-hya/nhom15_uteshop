import { Router } from 'express';
import {
  getProductAttributes,
  getAllProductAttributesAdmin,
  getProductAttributeById,
  createProductAttribute,
  updateProductAttribute,
  deleteProductAttribute,
  getAttributesByType,
  productAttributeValidation,
} from '../controllers/product-attribute.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes - xem attributes (không cần auth, chỉ trả về active)
// QUAN TRỌNG: Route cụ thể phải đặt trước route generic để tránh conflict
router.get('/product/:productId/type/:type', getAttributesByType);
router.get('/product/:productId/:attributeId', getProductAttributeById);
router.get('/product/:productId', getProductAttributes);

// Admin routes - CRUD attributes
router.get('/admin/product/:productId', authenticateToken, requireAdmin, getAllProductAttributesAdmin);
router.post('/product/:productId', authenticateToken, requireAdmin, productAttributeValidation, createProductAttribute);
router.put('/product/:productId/:attributeId', authenticateToken, requireAdmin, productAttributeValidation, updateProductAttribute);
router.delete('/product/:productId/:attributeId', authenticateToken, requireAdmin, deleteProductAttribute);

export default router;

