import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Product, Category } from '../models';

export class ProductController {
  // Lấy sản phẩm mới nhất (8 sản phẩm)
  static async getLatestProducts(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 8;
      
      const products = await Product.findAll({
        where: {
          status: 'active',
          stock: { [Op.gt]: 0 }
        },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }],
        order: [['createdAt', 'DESC']],
        limit,
        attributes: {
          exclude: ['specifications']
        }
      });

      res.json({
        success: true,
        message: 'Lấy sản phẩm mới nhất thành công',
        data: products
      });
    } catch (error) {
      console.error('Error getting latest products:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy sản phẩm mới nhất'
      });
    }
  }

  // Lấy sản phẩm bán chạy nhất (6 sản phẩm)
  static async getBestSellingProducts(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      
      const products = await Product.findAll({
        where: {
          status: 'active',
          stock: { [Op.gt]: 0 }
        },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }],
        order: [['soldCount', 'DESC']],
        limit,
        attributes: {
          exclude: ['specifications']
        }
      });

      res.json({
        success: true,
        message: 'Lấy sản phẩm bán chạy thành công',
        data: products
      });
    } catch (error) {
      console.error('Error getting best selling products:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy sản phẩm bán chạy'
      });
    }
  }

  // Lấy sản phẩm được xem nhiều nhất (8 sản phẩm)
  static async getMostViewedProducts(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 8;
      
      const products = await Product.findAll({
        where: {
          status: 'active',
          stock: { [Op.gt]: 0 }
        },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }],
        order: [['viewCount', 'DESC']],
        limit,
        attributes: {
          exclude: ['specifications']
        }
      });

      res.json({
        success: true,
        message: 'Lấy sản phẩm được xem nhiều thành công',
        data: products
      });
    } catch (error) {
      console.error('Error getting most viewed products:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy sản phẩm được xem nhiều'
      });
    }
  }

  // Lấy sản phẩm khuyến mãi cao nhất (4 sản phẩm)
  static async getHighestDiscountProducts(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 4;
      
      const products = await Product.findAll({
        where: {
          status: 'active',
          stock: { [Op.gt]: 0 },
          discountPercent: { [Op.gt]: 0 }
        },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }],
        order: [['discountPercent', 'DESC']],
        limit,
        attributes: {
          exclude: ['specifications']
        }
      });

      res.json({
        success: true,
        message: 'Lấy sản phẩm khuyến mãi cao nhất thành công',
        data: products
      });
    } catch (error) {
      console.error('Error getting highest discount products:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy sản phẩm khuyến mãi'
      });
    }
  }

  // Lấy chi tiết sản phẩm
  static async getProductDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          success: false,
          message: 'ID sản phẩm không hợp lệ'
        });
        return;
      }

      const product = await Product.findByPk(id, {
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'description']
        }]
      });

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy sản phẩm'
        });
        return;
      }

      // Tăng view count
      await product.increment('viewCount');

      res.json({
        success: true,
        message: 'Lấy chi tiết sản phẩm thành công',
        data: product
      });
    } catch (error) {
      console.error('Error getting product detail:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy chi tiết sản phẩm'
      });
    }
  }

  // Lấy danh sách sản phẩm với phân trang và lọc
  static async getProducts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const categoryId = req.query.categoryId as string;
      const search = req.query.search as string;
      const sortBy = req.query.sortBy as string || 'createdAt';
      const sortOrder = req.query.sortOrder as string || 'DESC';
      const minPrice = req.query.minPrice as string;
      const maxPrice = req.query.maxPrice as string;

      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {
        status: 'active'
      };

      if (categoryId) {
        whereClause.categoryId = categoryId;
      }

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { brand: { [Op.like]: `%${search}%` } }
        ];
      }

      if (minPrice && maxPrice) {
        whereClause.price = {
          [Op.between]: [parseFloat(minPrice), parseFloat(maxPrice)]
        };
      } else if (minPrice) {
        whereClause.price = { [Op.gte]: parseFloat(minPrice) };
      } else if (maxPrice) {
        whereClause.price = { [Op.lte]: parseFloat(maxPrice) };
      }

      const { rows: products, count: total } = await Product.findAndCountAll({
        where: whereClause,
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit,
        offset,
        attributes: {
          exclude: ['specifications']
        }
      });

      res.json({
        success: true,
        message: 'Lấy danh sách sản phẩm thành công',
        data: {
          products,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit
          }
        }
      });
    } catch (error) {
      console.error('Error getting products:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách sản phẩm'
      });
    }
  }

  // Lấy sản phẩm liên quan
  static async getRelatedProducts(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 6;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          success: false,
          message: 'ID sản phẩm không hợp lệ'
        });
        return;
      }

      const currentProduct = await Product.findByPk(id);
      if (!currentProduct) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy sản phẩm'
        });
        return;
      }

      const relatedProducts = await Product.findAll({
        where: {
          status: 'active',
          categoryId: currentProduct.categoryId,
          id: { [Op.ne]: id }
        },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }],
        order: [['viewCount', 'DESC']],
        limit,
        attributes: {
          exclude: ['specifications']
        }
      });

      res.json({
        success: true,
        message: 'Lấy sản phẩm liên quan thành công',
        data: relatedProducts
      });
    } catch (error) {
      console.error('Error getting related products:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy sản phẩm liên quan'
      });
    }
  }
}
