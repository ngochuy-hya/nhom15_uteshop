// API Configuration cho Frontend
interface ApiConfig {
  BASE_URL: string;
  TIMEOUT: number;
  DEFAULT_HEADERS: Record<string, string>;
}

const API_CONFIG: ApiConfig = {
  // Base URL của API
  BASE_URL: 'http://localhost:5000/api',
  
  // Timeout cho requests (ms)
  TIMEOUT: 10000,
  
  // Headers mặc định
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh-token',
    GOOGLE_LOGIN: '/auth/google',
    FACEBOOK_LOGIN: '/auth/facebook',
  },
    USERS: {
    UPDATE_PROFILE: "/users/profile",        // <— thêm dòng này
    CHANGE_PASSWORD: "/users/change-password"// <— thêm dòng này
  },
    ADDRESS: {
    LIST: "/addresses",
    CREATE: "/addresses",
    UPDATE: (id: number) => `/addresses/${id}`,
    DELETE: (id: number) => `/addresses/${id}`,
    SET_DEFAULT: (id: number) => `/addresses/${id}/default`,
  },
    COUPON: {
    AVAILABLE: "/coupons/available", // GET
    VALIDATE: "/coupons/validate",   // POST { code, subtotal }
  },
  // Product endpoints
  PRODUCTS: {
      LIST: '/products',
      DETAIL: (id: string | number) => `/products/${id}`,
      DETAIL_ADMIN: (id: string | number) => `/products/admin/${id}`,
      RELATED: (id: string | number) => `/products/${id}/related`,
      FEATURED: '/products/featured',
      BESTSELLER: '/products/bestseller',
      NEW: '/products/new',
  },
    PAYMENT: {
    PAYOS_CREATE: "/payment/payos/create",  // POST { order_id, description }
    PAYOS_STATUS: "/payment/payos/status",  // (nếu có) GET ?order_id=
  },
    ORDERS: {
    CREATE: "/orders",
    MY_ORDERS: "/orders/my-orders",
    DETAIL: (id: number | string) => `/orders/${id}`,
    CANCEL: (id: number | string) => `/orders/${id}/cancel`,
    INVOICE: (id: number | string) => `/orders/${id}/invoice`,
    RETURN: (id: number | string) => `/orders/${id}/return`,
    ADMIN_ALL: "/orders/admin/all",
    ADMIN_UPDATE_STATUS: (id: number | string) => `/orders/admin/${id}/status`,
    ADMIN_STATISTICS: "/orders/admin/statistics",
  },

  
  CART: {
    LIST: "/cart",
    ADD: "/cart",
    UPDATE: "/cart",     // dùng `${UPDATE}/${id}`
    REMOVE: "/cart",     // dùng `${REMOVE}/${id}`
    CLEAR: "/cart",
  },

  WISHLIST: {
    LIST: '/wishlist',
    ADD: '/wishlist/add',
    DELETE: (id: number) => `/wishlist/${id}`,
    REMOVE: (id: number) => `/wishlist/${id}/remove`, // thêm dòng này
    CHECK: (id: number) => `/wishlist/${id}/check`,   // thêm dòng này
    CLEAR: '/wishlist/clear',
  },
  // Upload endpoints
  UPLOAD: {
    IMAGE: '/upload/image',
    IMAGES: '/upload/images',
  },
  
  // Category endpoints
  CATEGORIES: {
    LIST: '/categories',
    DETAIL: (id: string | number) => `/categories/${id}`,
    BY_SLUG: (slug: string) => `/categories/slug/${slug}`,
  },
  
  // Brand endpoints
  BRANDS: {
    LIST: '/brands',
    DETAIL: (id: string | number) => `/brands/${id}`,
    BY_SLUG: (slug: string) => `/brands/slug/${slug}`,
  },
  
  // Health check
  HEALTH: '/health',
};

// API Response types
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// API Helper Functions
export class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Tạo headers với token
  getHeaders(token: string | null = null): Record<string, string> {
    const headers = { ...API_CONFIG.DEFAULT_HEADERS };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Xử lý response
  async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    // Log response status và headers để debug
    console.log(`API Response: ${response.url} - Status: ${response.status}`);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
        throw new Error(`Network error: ${response.status}`);
      }
    }
    
    try {
      const jsonData = await response.json();
      console.log('API Success Response:', jsonData);
      return jsonData;
    } catch (jsonError) {
      console.error('Failed to parse success response:', jsonError);
      throw new Error('Invalid response format');
    }
  }

  // GET request
  async get<T>(endpoint: string, token: string | null = null, params: Record<string, any> = {}): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    // Thêm query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse<T>(response);
  }

  // POST request
  async post<T>(endpoint: string, data: any = {}, token: string | null = null): Promise<ApiResponse<T>> {
    console.log(`Making POST request to: ${this.baseURL}${endpoint}`);
    console.log('Request data:', JSON.stringify(data, null, 2));
    console.log('Request headers:', this.getHeaders(token));
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('POST request failed:', error);
      throw error;
    }
  }

  // PUT request
  async put<T>(endpoint: string, data: any = {}, token: string | null = null): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  // DELETE request
  async delete<T>(endpoint: string, token: string | null = null): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    return this.handleResponse<T>(response);
  }

  // Upload file (multipart/form-data)
  async uploadFile<T>(endpoint: string, file: File, token: string | null = null, folder: string = 'products'): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }

  // Upload multiple files
  async uploadFiles<T>(endpoint: string, files: File[], token: string | null = null, folder: string = 'products'): Promise<ApiResponse<T>> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    formData.append('folder', folder);

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}

// Tạo instance
export const apiClient = new ApiClient();

// Auth API Functions
export const authAPI = {
  // Đăng ký
  register: (userData: any) => apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData),
  
  // Đăng nhập
  login: (credentials: any) => apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
  
  // Đăng xuất
  logout: (token: string) => apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {}, token),
  
  // Lấy profile
  getProfile: (token: string) => apiClient.get(API_ENDPOINTS.AUTH.PROFILE, token),
  
  // Cập nhật profile
  updateProfile: (profileData: any, token: string) => apiClient.put(API_ENDPOINTS.AUTH.PROFILE, profileData, token),
  
  // Đổi mật khẩu
  changePassword: (passwordData: any, token: string) => apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData, token),
  
  // Quên mật khẩu
  forgotPassword: (emailData: any) => apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, emailData),
  
  // Reset mật khẩu
  resetPassword: (resetData: any) => apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, resetData),
  
  // Xác thực OTP
  verifyOTP: (data: any) => apiClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, data),
  
  // Gửi lại OTP
  resendOTP: (email: string) => apiClient.post(API_ENDPOINTS.AUTH.RESEND_OTP, { email }),
  
  // Refresh token
  refreshToken: (refreshToken: string) => apiClient.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken }),
  
  // Đăng nhập Google
  loginWithGoogle: (googleToken: string) => apiClient.post(API_ENDPOINTS.AUTH.GOOGLE_LOGIN, { token: googleToken }),
  
  // Đăng nhập Facebook
  loginWithFacebook: (facebookToken: string) => apiClient.post(API_ENDPOINTS.AUTH.FACEBOOK_LOGIN, { token: facebookToken }),
};

// Product API Functions
export const productAPI = {
  // Lấy danh sách sản phẩm
  getProducts: (params: Record<string, any> = {}, token: string | null = null) => 
    apiClient.get(API_ENDPOINTS.PRODUCTS.LIST, token, params),
  
  // Lấy chi tiết sản phẩm
  getProduct: (id: string | number, token: string | null = null) => 
    apiClient.get(API_ENDPOINTS.PRODUCTS.DETAIL(id), token),
  
  // Lấy sản phẩm liên quan
  getRelatedProducts: (id: string | number, params: Record<string, any> = {}, token: string | null = null) => 
    apiClient.get(API_ENDPOINTS.PRODUCTS.RELATED(id), token, params),
  
  // Lấy sản phẩm nổi bật
  getFeaturedProducts: (params: Record<string, any> = {}, token: string | null = null) => 
    apiClient.get(API_ENDPOINTS.PRODUCTS.FEATURED, token, params),
  
  // Lấy sản phẩm bán chạy
  getBestSellerProducts: (params: Record<string, any> = {}, token: string | null = null) => 
    apiClient.get(API_ENDPOINTS.PRODUCTS.BESTSELLER, token, params),
    
  // Lấy sản phẩm mới
  getNewProducts: (params: Record<string, any> = {}, token: string | null = null) => 
    apiClient.get(API_ENDPOINTS.PRODUCTS.NEW, token, params),
  
  // Admin functions
  getProductAdmin: (id: string | number, token: string) => 
    apiClient.get(API_ENDPOINTS.PRODUCTS.DETAIL_ADMIN(id), token),
  
  createProduct: (data: any, token: string) => 
    apiClient.post(API_ENDPOINTS.PRODUCTS.LIST, data, token),
  
  updateProduct: (id: string | number, data: any, token: string) => 
    apiClient.put(API_ENDPOINTS.PRODUCTS.DETAIL(id), data, token),
  
  deleteProduct: (id: string | number, token: string) => 
    apiClient.delete(API_ENDPOINTS.PRODUCTS.DETAIL(id), token),
};

// Upload API Functions
export const uploadAPI = {
  uploadImage: (file: File, token: string, folder: string = 'products') => 
    apiClient.uploadFile(API_ENDPOINTS.UPLOAD.IMAGE, file, token, folder),
  
  uploadImages: (files: File[], token: string, folder: string = 'products') => 
    apiClient.uploadFiles(API_ENDPOINTS.UPLOAD.IMAGES, files, token, folder),
};

// Category API Functions
export const categoryAPI = {
  // Lấy danh sách danh mục
  getCategories: (params: Record<string, any> = {}) => 
    apiClient.get(API_ENDPOINTS.CATEGORIES.LIST, null, params),
  
  // Lấy chi tiết danh mục
  getCategory: (id: string | number) => 
    apiClient.get(API_ENDPOINTS.CATEGORIES.DETAIL(id)),
  
  // Lấy danh mục theo slug
  getCategoryBySlug: (slug: string) => 
    apiClient.get(API_ENDPOINTS.CATEGORIES.BY_SLUG(slug)),
};

// Brand API Functions
export const brandAPI = {
  // Lấy danh sách thương hiệu
  getBrands: (params: Record<string, any> = {}) => 
    apiClient.get(API_ENDPOINTS.BRANDS.LIST, null, params),
  
  // Lấy chi tiết thương hiệu
  getBrand: (id: string | number) => 
    apiClient.get(API_ENDPOINTS.BRANDS.DETAIL(id)),
  
  // Lấy thương hiệu theo slug
  getBrandBySlug: (slug: string) => 
    apiClient.get(API_ENDPOINTS.BRANDS.BY_SLUG(slug)),
};

// Health check
export const healthAPI = {
  check: () => apiClient.get(API_ENDPOINTS.HEALTH),
};

// Export tất cả
export default {
  API_CONFIG,
  API_ENDPOINTS,
  ApiClient,
  apiClient,
  authAPI,
  productAPI,
  categoryAPI,
  brandAPI,
  healthAPI,
};
