import { Request, Response } from 'express';
import pool from '../config/database';
import { body, validationResult } from 'express-validator';

// Validation rules
export const contactValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Tên không được để trống'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('subject').trim().isLength({ min: 1 }).withMessage('Tiêu đề không được để trống'),
  body('message').trim().isLength({ min: 10 }).withMessage('Nội dung phải có ít nhất 10 ký tự'),
];

// Gửi liên hệ
export const sendContact = async (req: Request, res: Response): Promise<void> => {
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

    const { name, email, phone, subject, message } = req.body;

    await pool.execute(
      'INSERT INTO contact_messages (name, email, phone, subject, message, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone || null, subject, message, 'pending']
    );

    res.status(201).json({
      success: true,
      message: 'Gửi liên hệ thành công. Chúng tôi sẽ phản hồi sớm nhất!',
    });
  } catch (error) {
    console.error('Send contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi liên hệ',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// ADMIN

// Lấy danh sách tin nhắn (Admin)
export const getContactMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereCondition = '1=1';
    let queryParams: any[] = [];

    if (status) {
      whereCondition += ' AND status = ?';
      queryParams.push(status);
    }

    const [messages] = await pool.execute(
      `SELECT * FROM contact_messages 
       WHERE ${whereCondition}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, Number(limit), offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM contact_messages WHERE ${whereCondition}`,
      queryParams
    );
    const total = (countResult as any[])[0].total;

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách tin nhắn thành công',
      data: {
        messages,
        pagination: {
          current_page: Number(page),
          per_page: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách tin nhắn',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Trả lời tin nhắn (Admin)
export const replyContactMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply || reply.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Nội dung trả lời không được để trống',
      });
      return;
    }

    // Kiểm tra tin nhắn tồn tại
    const [messages] = await pool.execute('SELECT * FROM contact_messages WHERE id = ?', [id]);
    if ((messages as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin nhắn',
      });
      return;
    }

    await pool.execute(
      'UPDATE contact_messages SET reply = ?, status = ?, replied_at = NOW(), updated_at = NOW() WHERE id = ?',
      [reply, 'replied', id]
    );

    // Gửi email trả lời cho khách hàng

    res.status(200).json({
      success: true,
      message: 'Trả lời tin nhắn thành công',
    });
  } catch (error) {
    console.error('Reply contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi trả lời tin nhắn',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa tin nhắn (Admin)
export const deleteContactMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [messages] = await pool.execute('SELECT id FROM contact_messages WHERE id = ?', [id]);
    if ((messages as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin nhắn',
      });
      return;
    }

    await pool.execute('DELETE FROM contact_messages WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Xóa tin nhắn thành công',
    });
  } catch (error) {
    console.error('Delete contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa tin nhắn',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

