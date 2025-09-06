import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Category } from '../models';

export class CategoryController {
  // Lấy tất cả danh mục
  static async getAllCategories(req: Request, res: Response) {
    try {
      const categories = await Category.findAll({
        where: { status: 'active' },
        include: [{
          model: Category,
          as: 'children',
          where: { status: 'active' },
          required: false,
          attributes: ['id', 'name', 'slug', 'image', 'icon']
        }],
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
      });

      res.json({
        success: true,
        message: 'Lấy danh sách danh mục thành công',
        data: categories
      });
    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách danh mục'
      });
    }
  }

  // Lấy danh mục cha (root categories)
  static async getRootCategories(req: Request, res: Response) {
    try {
      const categories = await Category.findAll({
        where: { 
          status: 'active',
          parentId: null as any
        },
        include: [{
          model: Category,
          as: 'children',
          where: { status: 'active' },
          required: false,
          attributes: ['id', 'name', 'slug', 'image', 'icon']
        }],
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
      });

      res.json({
        success: true,
        message: 'Lấy danh mục cha thành công',
        data: categories
      });
    } catch (error) {
      console.error('Error getting root categories:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh mục cha'
      });
    }
  }

  // Lấy chi tiết danh mục
  static async getCategoryDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          success: false,
          message: 'ID danh mục không hợp lệ'
        });
        return;
      }

      const category = await Category.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'children',
            where: { status: 'active' },
            required: false
          },
          {
            model: Category,
            as: 'parent',
            attributes: ['id', 'name', 'slug']
          }
        ]
      });

      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy danh mục'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Lấy chi tiết danh mục thành công',
        data: category
      });
    } catch (error) {
      console.error('Error getting category detail:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy chi tiết danh mục'
      });
    }
  }
}
