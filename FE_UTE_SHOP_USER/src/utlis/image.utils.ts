// Utility functions for handling image URLs from API

/**
 * Get base URL for API (without /api suffix)
 */
export const getApiBaseUrl = (): string => {
  // Get base URL from environment or use default
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  return baseUrl.replace('/api', '').replace(/\/$/, ''); // Remove /api suffix and trailing slash
};

/**
 * Format image URL from API
 * CHỈ dùng ảnh từ API, KHÔNG dùng ảnh từ public folder
 * Handles:
 * - Full URLs (http://, https://) - use as is
 * - Cloudinary URLs - use as is
 * - Relative paths starting with / - prepend with base URL
 * - Relative paths without / - prepend with base URL + /uploads/
 * - No image - return empty string (không fallback về public images)
 */
export const formatImageUrl = (imageUrl: string | null | undefined): string | null => {
  // If no URL provided, return null (không dùng default image từ public)
  if (!imageUrl) {
    return null;
  }

  // Trim whitespace
  imageUrl = imageUrl.trim();

  // Nếu là path từ public folder (/images/, /assets/), bỏ qua - chỉ dùng API
  if (imageUrl.startsWith('/images/') || imageUrl.startsWith('/assets/')) {
    return null; // Không dùng ảnh từ public folder
  }

  // If already a full URL (http://, https://), use as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If starts with /, it's a relative path from root (nhưng không phải /images/)
  if (imageUrl.startsWith('/')) {
    // Prepend with API base URL
    return `${getApiBaseUrl()}${imageUrl}`;
  }

  // If relative path without leading /, assume it's in uploads folder
  return `${getApiBaseUrl()}/uploads/${imageUrl}`;
};

/**
 * Format multiple image URLs
 */
export const formatImageUrls = (imageUrls: (string | null | undefined)[]): string[] => {
  return imageUrls.map(url => formatImageUrl(url));
};

/**
 * Check if URL is a full URL
 */
export const isFullUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Get optimized image URL (for Cloudinary optimization)
 */
export const getOptimizedImageUrl = (
  imageUrl: string | null | undefined,
  width?: number,
  height?: number,
  quality: 'auto' | number = 'auto'
): string => {
  const url = formatImageUrl(imageUrl);

  // If it's a Cloudinary URL, add transformation parameters
  if (url.includes('cloudinary.com') || url.includes('res.cloudinary.com')) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      const transformations: string[] = [];
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      if (quality) transformations.push(`q_${quality}`);
      
      const transformString = transformations.length > 0 
        ? `/${transformations.join(',')}`
        : '';
      
      return `${parts[0]}/upload${transformString}/${parts[1]}`;
    }
  }

  return url;
};

