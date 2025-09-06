import { api } from '../lib/api';
import type { Product, Category, ProductsResponse, ProductDetailResponse, CategoriesResponse } from '../types/product';

export const productsApi = {
  // Lấy sản phẩm mới nhất
  getLatestProducts: async (limit: number = 8): Promise<Product[]> => {
    try {
      const response = await api.get<ProductsResponse>(`/products/latest?limit=${limit}`);
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching latest products:', error);
      throw error;
    }
  },

  // Lấy sản phẩm bán chạy nhất
  getBestSellingProducts: async (limit: number = 6): Promise<Product[]> => {
    try {
      const response = await api.get<ProductsResponse>(`/products/best-selling?limit=${limit}`);
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching best selling products:', error);
      throw error;
    }
  },

  // Lấy sản phẩm được xem nhiều nhất
  getMostViewedProducts: async (limit: number = 8): Promise<Product[]> => {
    try {
      const response = await api.get<ProductsResponse>(`/products/most-viewed?limit=${limit}`);
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching most viewed products:', error);
      throw error;
    }
  },

  // Lấy sản phẩm khuyến mãi cao nhất
  getHighestDiscountProducts: async (limit: number = 4): Promise<Product[]> => {
    try {
      const response = await api.get<ProductsResponse>(`/products/highest-discount?limit=${limit}`);
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching highest discount products:', error);
      throw error;
    }
  },

  // Lấy chi tiết sản phẩm
  getProductDetail: async (id: number): Promise<Product> => {
    try {
      const response = await api.get<ProductDetailResponse>(`/products/${id}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch product detail');
    } catch (error) {
      console.error('Error fetching product detail:', error);
      throw error;
    }
  },

  // Lấy sản phẩm liên quan
  getRelatedProducts: async (id: number, limit: number = 6): Promise<Product[]> => {
    try {
      const response = await api.get<ProductsResponse>(`/products/${id}/related?limit=${limit}`);
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching related products:', error);
      throw error;
    }
  },

  // Tìm kiếm sản phẩm với phân trang
  searchProducts: async (params: {
    page?: number;
    limit?: number;
    categoryId?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    minPrice?: number;
    maxPrice?: number;
  } = {}): Promise<{
    products: Product[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> => {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });

      const response = await api.get<ProductsResponse>(`/products/search?${searchParams.toString()}`);
      if (response.data.success && !Array.isArray(response.data.data)) {
        return response.data.data as {
          products: Product[];
          pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
          };
        };
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
};

export const categoriesApi = {
  // Lấy tất cả danh mục
  getAllCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get<CategoriesResponse>('/categories');
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch categories');
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Lấy danh mục cha
  getRootCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get<CategoriesResponse>('/categories/root');
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch root categories');
    } catch (error) {
      console.error('Error fetching root categories:', error);
      throw error;
    }
  },

  // Lấy chi tiết danh mục
  getCategoryDetail: async (id: number): Promise<Category> => {
    try {
      const response = await api.get<{ success: boolean; message: string; data: Category }>(`/categories/${id}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch category detail');
    } catch (error) {
      console.error('Error fetching category detail:', error);
      throw error;
    }
  }
};
