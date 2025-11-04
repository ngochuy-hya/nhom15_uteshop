import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { uploadFileToCloudinary, uploadMultipleToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.util';

// Upload single image to Cloudinary
export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Không có file nào được upload',
      });
      return;
    }

    // Upload lên Cloudinary
    const { folder = 'products' } = req.body;
    const cloudinaryResult = await uploadFileToCloudinary(req.file, folder);

    // Xóa file local sau khi upload
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).json({
      success: true,
      message: 'Upload ảnh thành công',
      data: {
        url: cloudinaryResult.secure_url,
        public_id: cloudinaryResult.public_id,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi upload ảnh',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Upload multiple images to Cloudinary
export const uploadImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Không có file nào được upload',
      });
      return;
    }

    // Upload lên Cloudinary
    const { folder = 'products' } = req.body;
    const cloudinaryResults = await uploadMultipleToCloudinary(files, folder);

    // Xóa files local sau khi upload
    files.forEach(file => {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    const uploadedFiles = cloudinaryResults.map((result, index) => ({
      url: result.secure_url,
      public_id: result.public_id,
      originalname: files[index].originalname,
      mimetype: files[index].mimetype,
      size: files[index].size,
    }));

    res.status(200).json({
      success: true,
      message: `Upload ${files.length} ảnh thành công`,
      data: uploadedFiles,
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi upload ảnh',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Delete file
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    const { folder } = req.query;

    if (!filename) {
      res.status(400).json({
        success: false,
        message: 'Filename là bắt buộc',
      });
      return;
    }

    const uploadDir = path.join(__dirname, '../../uploads');
    const folderPath = folder ? path.join(uploadDir, folder as string) : uploadDir;
    const filePath = path.join(folderPath, filename);

    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: 'File không tồn tại',
      });
      return;
    }

    // Xóa file
    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: 'Xóa file thành công',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa file',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

