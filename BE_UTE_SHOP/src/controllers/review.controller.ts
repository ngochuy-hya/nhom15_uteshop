import { Request, Response } from 'express';
import { ReviewModel } from '../models/review.model';
import { AuthRequest } from '../types';

// Lấy đánh giá của sản phẩm
export const getProductReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { page, limit, rating, sort_by } = req.query;

    const result = await ReviewModel.getByProductId(Number(productId), {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      rating: rating ? Number(rating) : undefined,
      sort_by: sort_by as string,
    });

    // Lấy thống kê rating
    const stats = await ReviewModel.getRatingStats(Number(productId));

    res.status(200).json({
      success: true,
      message: 'Lấy đánh giá thành công',
      data: {
        reviews: result.reviews,
        stats,
        pagination: {
          current_page: Number(page) || 1,
          per_page: Number(limit) || 10,
          total: result.total,
          total_pages: Math.ceil(result.total / (Number(limit) || 10)),
        },
      },
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy đánh giá',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Tạo đánh giá
export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { product_id, order_id, rating, title, comment, images } = req.body;

    // Validate
    if (!product_id || !rating) {
      res.status(400).json({
        success: false,
        message: 'Product ID và rating là bắt buộc',
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        message: 'Rating phải từ 1 đến 5',
      });
      return;
    }

    // Kiểm tra đã review chưa
    const hasReviewed = await ReviewModel.hasUserReviewed(userId, product_id);
    if (hasReviewed) {
      res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá sản phẩm này rồi',
      });
      return;
    }

    // Kiểm tra đã mua sản phẩm chưa
    const hasPurchased = await ReviewModel.hasUserPurchased(userId, product_id);
    if (!hasPurchased) {
      res.status(400).json({
        success: false,
        message: 'Bạn chỉ có thể đánh giá sản phẩm đã mua',
      });
      return;
    }

    // Tạo review
    const reviewId = await ReviewModel.create({
      user_id: userId,
      product_id,
      order_id,
      rating,
      title,
      comment,
    });

    // Thêm ảnh nếu có
    if (images && Array.isArray(images)) {
      for (const imageUrl of images) {
        await ReviewModel.addImage(reviewId, imageUrl);
      }
    }

    const review = await ReviewModel.findById(reviewId);

    res.status(201).json({
      success: true,
      message: 'Tạo đánh giá thành công. Đánh giá của bạn đang chờ phê duyệt.',
      data: review,
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo đánh giá',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cập nhật đánh giá
export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    const review = await ReviewModel.findById(Number(id));
    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá',
      });
      return;
    }

    if (review.user_id !== userId) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật đánh giá này',
      });
      return;
    }

    const updated = await ReviewModel.update(Number(id), {
      rating,
      title,
      comment,
    });

    if (!updated) {
      res.status(400).json({
        success: false,
        message: 'Không thể cập nhật đánh giá',
      });
      return;
    }

    const updatedReview = await ReviewModel.findById(Number(id));

    res.status(200).json({
      success: true,
      message: 'Cập nhật đánh giá thành công',
      data: updatedReview,
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật đánh giá',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa đánh giá
export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role_id;
    const { id } = req.params;

    const review = await ReviewModel.findById(Number(id));
    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá',
      });
      return;
    }

    // Chỉ cho phép user xóa review của mình hoặc admin xóa bất kỳ
    if (review.user_id !== userId && userRole !== 2) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa đánh giá này',
      });
      return;
    }

    await ReviewModel.delete(Number(id));

    res.status(200).json({
      success: true,
      message: 'Xóa đánh giá thành công',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa đánh giá',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Đánh dấu hữu ích
export const markHelpful = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await ReviewModel.findById(Number(id));
    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá',
      });
      return;
    }

    await ReviewModel.incrementHelpful(Number(id));

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu hữu ích',
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy đánh giá chờ duyệt (Admin)
export const getPendingReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit } = req.query;

    const result = await ReviewModel.getPending({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({
      success: true,
      message: 'Lấy đánh giá chờ duyệt thành công',
      data: {
        reviews: result.reviews,
        pagination: {
          current_page: Number(page) || 1,
          per_page: Number(limit) || 20,
          total: result.total,
          total_pages: Math.ceil(result.total / (Number(limit) || 20)),
        },
      },
    });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy đánh giá chờ duyệt',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Duyệt đánh giá (Admin)
export const approveReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await ReviewModel.findById(Number(id));
    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá',
      });
      return;
    }

    await ReviewModel.approve(Number(id));

    res.status(200).json({
      success: true,
      message: 'Duyệt đánh giá thành công',
    });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi duyệt đánh giá',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Từ chối đánh giá (Admin)
export const rejectReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await ReviewModel.findById(Number(id));
    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá',
      });
      return;
    }

    await ReviewModel.reject(Number(id));

    res.status(200).json({
      success: true,
      message: 'Từ chối đánh giá thành công',
    });
  } catch (error) {
    console.error('Reject review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi từ chối đánh giá',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

