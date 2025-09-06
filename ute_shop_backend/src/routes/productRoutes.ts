import { Router } from 'express';
import { ProductController } from '../controllers/productController';

const router = Router();

// Public routes - không cần auth
router.get('/latest', ProductController.getLatestProducts);
router.get('/best-selling', ProductController.getBestSellingProducts);
router.get('/most-viewed', ProductController.getMostViewedProducts);
router.get('/highest-discount', ProductController.getHighestDiscountProducts);
router.get('/search', ProductController.getProducts);
router.get('/:id', ProductController.getProductDetail);
router.get('/:id/related', ProductController.getRelatedProducts);

export default router;
