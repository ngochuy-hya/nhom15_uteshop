// Utility functions for localStorage (RealM alternative)
import type { User } from '../store/slices/authSlice';

const STORAGE_KEYS = {
  USER_INFO: 'uteshop_user_info',
  ACCESS_TOKEN: 'uteshop_access_token',
  REFRESH_TOKEN: 'uteshop_refresh_token',
  REMEMBER_LOGIN: 'uteshop_remember_login',
  CART_ITEMS: 'uteshop_cart_items',
  RECENT_PRODUCTS: 'uteshop_recent_products',
} as const;

// User information storage
export const userStorage = {
  save: (user: User, remember: boolean = false) => {
    try {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.REMEMBER_LOGIN, remember.toString());
    } catch (error) {
      console.error('Error saving user info:', error);
    }
  },

  get: (): User | null => {
    try {
      const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER_LOGIN) === 'true';
      const storage = remember ? localStorage : sessionStorage;
      const userInfo = storage.getItem(STORAGE_KEYS.USER_INFO);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  },

  update: (updates: Partial<User>) => {
    try {
      const currentUser = userStorage.get();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates };
        const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER_LOGIN) === 'true';
        userStorage.save(updatedUser, remember);
        return updatedUser;
      }
      return null;
    } catch (error) {
      console.error('Error updating user info:', error);
      return null;
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
      sessionStorage.removeItem(STORAGE_KEYS.USER_INFO);
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_LOGIN);
    } catch (error) {
      console.error('Error clearing user info:', error);
    }
  }
};

// Token storage
export const tokenStorage = {
  save: (accessToken: string, refreshToken?: string, remember: boolean = false) => {
    try {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  },

  getAccessToken: (): string | null => {
    try {
      const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER_LOGIN) === 'true';
      const storage = remember ? localStorage : sessionStorage;
      return storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  getRefreshToken: (): string | null => {
    try {
      const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER_LOGIN) === 'true';
      const storage = remember ? localStorage : sessionStorage;
      return storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }
};

// Cart storage
export const cartStorage = {
  save: (items: any[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart items:', error);
    }
  },

  get: (): any[] => {
    try {
      const items = localStorage.getItem(STORAGE_KEYS.CART_ITEMS);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error('Error getting cart items:', error);
      return [];
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.CART_ITEMS);
    } catch (error) {
      console.error('Error clearing cart items:', error);
    }
  }
};

// Recent products storage
export const recentProductsStorage = {
  save: (products: any[]) => {
    try {
      // Chỉ lưu tối đa 10 sản phẩm gần đây
      const limitedProducts = products.slice(0, 10);
      localStorage.setItem(STORAGE_KEYS.RECENT_PRODUCTS, JSON.stringify(limitedProducts));
    } catch (error) {
      console.error('Error saving recent products:', error);
    }
  },

  get: (): any[] => {
    try {
      const products = localStorage.getItem(STORAGE_KEYS.RECENT_PRODUCTS);
      return products ? JSON.parse(products) : [];
    } catch (error) {
      console.error('Error getting recent products:', error);
      return [];
    }
  },

  add: (product: any) => {
    try {
      const current = recentProductsStorage.get();
      // Loại bỏ sản phẩm trùng lặp nếu có
      const filtered = current.filter(p => p.id !== product.id);
      // Thêm sản phẩm mới vào đầu danh sách
      const updated = [product, ...filtered];
      recentProductsStorage.save(updated);
    } catch (error) {
      console.error('Error adding recent product:', error);
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.RECENT_PRODUCTS);
    } catch (error) {
      console.error('Error clearing recent products:', error);
    }
  }
};

// Initialize storage on app start
export const initializeStorage = () => {
  try {
    // Check if user was logged in before
    const user = userStorage.get();
    const token = tokenStorage.getAccessToken();
    
    if (user && token) {
      return { user, token };
    }
    return null;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return null;
  }
};

// Clear all app storage
export const clearAllStorage = () => {
  userStorage.clear();
  tokenStorage.clear();
  cartStorage.clear();
  // Không clear recent products khi logout
};
