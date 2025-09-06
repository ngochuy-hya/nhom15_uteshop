import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';

const router = Router();

// Public routes - không cần auth
router.get('/', CategoryController.getAllCategories);
router.get('/root', CategoryController.getRootCategories);
router.get('/:id', CategoryController.getCategoryDetail);

export default router;
