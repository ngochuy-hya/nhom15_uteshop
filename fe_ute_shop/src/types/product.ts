export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  categoryId: number;
  stock: number;
  images: string[];
  thumbnailUrl: string;
  brand?: string;
  sku: string;
  weight?: number;
  dimensions?: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  viewCount: number;
  soldCount: number;
  rating: number;
  reviewCount: number;
  isFeatures: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  tags?: string[];
  specifications?: Record<string, any>;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  slug: string;
  parentId?: number;
  image?: string;
  icon?: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  children?: Category[];
  parent?: {
    id: number;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: Product[] | {
    products: Product[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface ProductDetailResponse {
  success: boolean;
  message: string;
  data: Product;
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: Category[];
}
