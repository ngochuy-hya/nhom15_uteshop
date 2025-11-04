import { Request, Response } from 'express';
import pool from '../config/database';

// Lấy cài đặt hệ thống
export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const [settings] = await pool.execute('SELECT * FROM system_settings');

    // Convert array to object
    const settingsObject: any = {};
    (settings as any[]).forEach((setting) => {
      settingsObject[setting.setting_key] = {
        value: setting.setting_value,
        type: setting.setting_type,
        description: setting.description,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Lấy cài đặt hệ thống thành công',
      data: settingsObject,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy cài đặt hệ thống',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cập nhật cài đặt hệ thống (Admin)
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu cài đặt không hợp lệ',
      });
      return;
    }

    // Update từng setting
    for (const [key, value] of Object.entries(settings)) {
      await pool.execute(
        `INSERT INTO system_settings (setting_key, setting_value, updated_at) 
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
        [key, value, value]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật cài đặt hệ thống thành công',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật cài đặt hệ thống',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Upload logo (Admin)
export const uploadLogo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { logo_url } = req.body;

    if (!logo_url) {
      res.status(400).json({
        success: false,
        message: 'URL logo là bắt buộc',
      });
      return;
    }

    await pool.execute(
      `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_at) 
       VALUES ('site_logo', ?, 'image', NOW())
       ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
      [logo_url, logo_url]
    );

    res.status(200).json({
      success: true,
      message: 'Upload logo thành công',
      data: { logo_url },
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi upload logo',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Upload banner (Admin)
export const uploadBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { banner_url, position = 'home_main' } = req.body;

    if (!banner_url) {
      res.status(400).json({
        success: false,
        message: 'URL banner là bắt buộc',
      });
      return;
    }

    const settingKey = `banner_${position}`;

    await pool.execute(
      `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_at) 
       VALUES (?, ?, 'image', NOW())
       ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
      [settingKey, banner_url, banner_url]
    );

    res.status(200).json({
      success: true,
      message: 'Upload banner thành công',
      data: { banner_url, position },
    });
  } catch (error) {
    console.error('Upload banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi upload banner',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

