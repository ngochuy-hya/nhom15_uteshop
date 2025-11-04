import { Router } from 'express';
import {
  getBlogs,
  getBlogById,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogComments,
  addBlogComment,
  blogValidation,
} from '../controllers/blog.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getBlogs);
router.get('/slug/:slug', getBlogBySlug);
router.get('/:id', getBlogById);
router.get('/:id/comments', getBlogComments);

// User routes
router.post('/:id/comments', requireAuth, addBlogComment);

// Admin routes
router.post('/', requireAuth, requireAdmin, blogValidation, createBlog);
router.put('/:id', requireAuth, requireAdmin, updateBlog);
router.delete('/:id', requireAuth, requireAdmin, deleteBlog);

export default router;

