import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

/**
 * Upload file buffer lên Cloudinary
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string = 'products',
  publicId?: string
): Promise<{ url: string; public_id: string; secure_url: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' }, // Auto-resize
          { quality: 'auto' }, // Auto quality
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.url,
            public_id: result.public_id,
            secure_url: result.secure_url,
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    );

    // Convert buffer to stream
    const stream = Readable.from(fileBuffer);
    stream.pipe(uploadStream);
  });
}

/**
 * Upload từ file path (multer file)
 */
export async function uploadFileToCloudinary(
  file: Express.Multer.File,
  folder: string = 'products',
  publicId?: string
): Promise<{ url: string; public_id: string; secure_url: string }> {
  return new Promise((resolve, reject) => {
    // Upload từ file path
    cloudinary.uploader.upload(file.path, {
      folder: folder,
      public_id: publicId,
      resource_type: 'image',
      overwrite: false,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
      ],
    }, (error, result) => {
      if (error) {
        reject(error);
      } else if (result) {
        resolve({
          url: result.url,
          public_id: result.public_id,
          secure_url: result.secure_url,
        });
      } else {
        reject(new Error('Upload failed: No result returned'));
      }
    });
  });
}

/**
 * Xóa ảnh từ Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Upload nhiều ảnh cùng lúc
 */
export async function uploadMultipleToCloudinary(
  files: Express.Multer.File[],
  folder: string = 'products'
): Promise<Array<{ url: string; public_id: string; secure_url: string }>> {
  const uploadPromises = files.map(file => uploadFileToCloudinary(file, folder));
  return Promise.all(uploadPromises);
}

