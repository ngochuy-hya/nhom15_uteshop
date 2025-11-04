import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { body, validationResult } from 'express-validator';

// Validation cho product attribute
export const productAttributeValidation = [
  body('attribute_type')
    .isIn(['color', 'size', 'material', 'style'])
    .withMessage('Loại thuộc tính không hợp lệ (color, size, material, style)'),
  body('attribute_name')
    .notEmpty()
    .withMessage('Tên thuộc tính không được để trống')
    .isLength({ max: 100 })
    .withMessage('Tên thuộc tính tối đa 100 ký tự'),
  body('attribute_value')
    .notEmpty()
    .withMessage('Giá trị thuộc tính không được để trống')
    .isLength({ max: 100 })
    .withMessage('Giá trị thuộc tính tối đa 100 ký tự'),
  body('price_adjustment')
    .optional()
    .isNumeric()
    .withMessage('Điều chỉnh giá phải là số'),
  body('stock_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Số lượng tồn kho phải là số nguyên >= 0'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active phải là boolean'),
];

// Lấy tất cả attributes của một product (Public API - chỉ trả về attributes active)
export const getProductAttributes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const [attributes] = await pool.execute(
      `SELECT 
        id,
        product_id,
        attribute_type,
        attribute_name,
        attribute_value,
        price_adjustment,
        stock_quantity,
        is_active,
        created_at
      FROM product_attributes 
      WHERE product_id = ? AND is_active = 1
      ORDER BY attribute_type, attribute_name, created_at`,
      [productId]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách thuộc tính sản phẩm thành công',
      data: {
        attributes,
        total: (attributes as any[]).length,
      },
    });
  } catch (error) {
    console.error('Get product attributes error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thuộc tính',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy một attribute theo ID
export const getProductAttributeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, attributeId } = req.params;

    const [attributes] = await pool.execute(
      'SELECT * FROM product_attributes WHERE id = ? AND product_id = ?',
      [attributeId, productId]
    );

    const attribute = (attributes as any[])[0];
    if (!attribute) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuộc tính',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin thuộc tính thành công',
      data: attribute,
    });
  } catch (error) {
    console.error('Get product attribute by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin thuộc tính',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Thêm attribute mới cho product
export const createProductAttribute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array(),
      });
      return;
    }

    const { productId } = req.params;
    const {
      attribute_type,
      attribute_name,
      attribute_value,
      price_adjustment = 0,
      stock_quantity = 0,
      is_active = true,
    } = req.body;

    // Kiểm tra product tồn tại
    const [products] = await pool.execute('SELECT id FROM products WHERE id = ?', [productId]);
    if ((products as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
      return;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Thêm attribute
      const [result] = await connection.execute(
        `INSERT INTO product_attributes 
        (product_id, attribute_type, attribute_name, attribute_value, price_adjustment, stock_quantity, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [productId, attribute_type, attribute_name, attribute_value, price_adjustment, stock_quantity, is_active ? 1 : 0]
      );

      const attributeId = (result as any).insertId;

      // Tính tổng stock_quantity từ tất cả attributes và cập nhật product
      const [stockResult] = await connection.execute(
        'SELECT SUM(stock_quantity) as total_stock FROM product_attributes WHERE product_id = ? AND is_active = 1',
        [productId]
      );

      const totalStock = (stockResult as any[])[0]?.total_stock || 0;

      await connection.execute(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [totalStock, productId]
      );

      await connection.commit();
      connection.release();

      res.status(201).json({
        success: true,
        message: 'Thêm thuộc tính sản phẩm thành công',
        data: {
          id: attributeId,
          product_id: productId,
          attribute_type,
          attribute_name,
          attribute_value,
          price_adjustment,
          stock_quantity,
          is_active,
          product_stock_updated: totalStock,
        },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Create product attribute error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm thuộc tính sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cập nhật attribute
export const updateProductAttribute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array(),
      });
      return;
    }

    const { productId, attributeId } = req.params;
    const {
      attribute_type,
      attribute_name,
      attribute_value,
      price_adjustment,
      stock_quantity,
      is_active,
    } = req.body;

    // Kiểm tra attribute tồn tại
    const [attributes] = await pool.execute(
      'SELECT * FROM product_attributes WHERE id = ? AND product_id = ?',
      [attributeId, productId]
    );

    if ((attributes as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuộc tính',
      });
      return;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Build update query
      const updates: string[] = [];
      const values: any[] = [];

      if (attribute_type !== undefined) {
        updates.push('attribute_type = ?');
        values.push(attribute_type);
      }
      if (attribute_name !== undefined) {
        updates.push('attribute_name = ?');
        values.push(attribute_name);
      }
      if (attribute_value !== undefined) {
        updates.push('attribute_value = ?');
        values.push(attribute_value);
      }
      if (price_adjustment !== undefined) {
        updates.push('price_adjustment = ?');
        values.push(price_adjustment);
      }
      if (stock_quantity !== undefined) {
        updates.push('stock_quantity = ?');
        values.push(stock_quantity);
      }
      if (is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(is_active ? 1 : 0);
      }

      if (updates.length === 0) {
        await connection.rollback();
        connection.release();
        res.status(400).json({
          success: false,
          message: 'Không có dữ liệu để cập nhật',
        });
        return;
      }

      values.push(attributeId, productId);

      // Cập nhật attribute
      await connection.execute(
        `UPDATE product_attributes SET ${updates.join(', ')} WHERE id = ? AND product_id = ?`,
        values
      );

      // Tính lại tổng stock_quantity và cập nhật product
      const [stockResult] = await connection.execute(
        'SELECT SUM(stock_quantity) as total_stock FROM product_attributes WHERE product_id = ? AND is_active = 1',
        [productId]
      );

      const totalStock = (stockResult as any[])[0]?.total_stock || 0;

      await connection.execute(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [totalStock, productId]
      );

      await connection.commit();
      connection.release();

      // Lấy attribute đã cập nhật
      const [updatedAttributes] = await pool.execute(
        'SELECT * FROM product_attributes WHERE id = ?',
        [attributeId]
      );

      res.status(200).json({
        success: true,
        message: 'Cập nhật thuộc tính sản phẩm thành công',
        data: {
          attribute: (updatedAttributes as any[])[0],
          product_stock_updated: totalStock,
        },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Update product attribute error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thuộc tính sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa attribute
export const deleteProductAttribute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, attributeId } = req.params;

    // Kiểm tra attribute tồn tại
    const [attributes] = await pool.execute(
      'SELECT id FROM product_attributes WHERE id = ? AND product_id = ?',
      [attributeId, productId]
    );

    if ((attributes as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuộc tính',
      });
      return;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Xóa attribute
      await connection.execute('DELETE FROM product_attributes WHERE id = ?', [attributeId]);

      // Tính lại tổng stock_quantity và cập nhật product
      const [stockResult] = await connection.execute(
        'SELECT SUM(stock_quantity) as total_stock FROM product_attributes WHERE product_id = ? AND is_active = 1',
        [productId]
      );

      const totalStock = (stockResult as any[])[0]?.total_stock || 0;

      await connection.execute(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [totalStock, productId]
      );

      await connection.commit();
      connection.release();

      res.status(200).json({
        success: true,
        message: 'Xóa thuộc tính sản phẩm thành công',
        data: {
          product_stock_updated: totalStock,
        },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Delete product attribute error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa thuộc tính sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy tất cả attributes của một product cho Admin (bao gồm cả inactive)
export const getAllProductAttributesAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const [attributes] = await pool.execute(
      `SELECT 
        id,
        product_id,
        attribute_type,
        attribute_name,
        attribute_value,
        price_adjustment,
        stock_quantity,
        is_active,
        created_at
      FROM product_attributes 
      WHERE product_id = ? 
      ORDER BY attribute_type, attribute_name, created_at`,
      [productId]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách thuộc tính sản phẩm thành công (Admin - tất cả attributes)',
      data: {
        attributes,
        total: (attributes as any[]).length,
      },
    });
  } catch (error) {
    console.error('Get all product attributes admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thuộc tính',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy attributes theo type (size, color, etc)
export const getAttributesByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, type } = req.params; // Lấy từ params thay vì query

    if (!type) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng chỉ định loại thuộc tính (type)',
      });
      return;
    }

    // Validate type
    const validTypes = ['color', 'size', 'material', 'style'];
    if (!validTypes.includes(type)) {
      res.status(400).json({
        success: false,
        message: `Loại thuộc tính không hợp lệ. Phải là một trong: ${validTypes.join(', ')}`,
      });
      return;
    }

    const [attributes] = await pool.execute(
      `SELECT 
        id,
        product_id,
        attribute_type,
        attribute_name,
        attribute_value,
        price_adjustment,
        stock_quantity,
        is_active,
        created_at
      FROM product_attributes 
      WHERE product_id = ? AND attribute_type = ? AND is_active = 1
      ORDER BY attribute_name, attribute_value`,
      [productId, type]
    );

    res.status(200).json({
      success: true,
      message: `Lấy danh sách thuộc tính loại ${type} thành công`,
      data: {
        attributes,
        type,
        total: (attributes as any[]).length,
      },
    });
  } catch (error) {
    console.error('Get attributes by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thuộc tính',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

