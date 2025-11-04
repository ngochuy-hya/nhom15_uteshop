import { useState, useCallback } from "react";
import { authAPI } from "../config/api";
import { apiClient } from "../services/client";

// ======================
// API response generic
// ======================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

// ======================
// User Type
// ======================
export interface User {
  id: string | number;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  avatar?: string | null;
  [key: string]: any;
}

// ======================
// Stored User Type (cho localStorage)
// ======================
export type StoredUser = {
  id: number | string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  access_expires_at?: number | null;
  refresh_expires_at?: number | null;
};

// ======================
// Auth Response chuẩn hóa cho FE
// ======================
export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token?: string;
    user?: User;
    [key: string]: any;
  };
}

// ======================
// Token Manager
// ======================
export const tokenManager = {
  setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("authToken", token);
  },
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("authToken");
  },
  removeToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("authToken");
  },
  hasToken(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("authToken");
  },
};

// ======================
// User Manager (quản lý user + token trong localStorage)
// ======================
const LS_USER_KEY = "app_user";
const LS_TOKEN_KEY = "access_token";
const LS_REFRESH_KEY = "refresh_token";

export const userManager = {
  getUser(): StoredUser | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      return raw ? (JSON.parse(raw) as StoredUser) : null;
    } catch {
      return null;
    }
  },

  setUser(u: StoredUser): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LS_USER_KEY, JSON.stringify(u));
      if (u.access_token) {
        localStorage.setItem(LS_TOKEN_KEY, u.access_token);
        tokenManager.setToken(u.access_token);
      }
      if (u.refresh_token) {
        localStorage.setItem(LS_REFRESH_KEY, u.refresh_token);
      }
    } catch {}
  },

  update(partial: Partial<StoredUser>): StoredUser {
    const current = this.getUser() || ({} as StoredUser);
    const merged = { ...current, ...partial };
    this.setUser(merged);
    return merged;
  },

  removeUser(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(LS_USER_KEY);
      localStorage.removeItem(LS_TOKEN_KEY);
      localStorage.removeItem(LS_REFRESH_KEY);
      tokenManager.removeToken();
    } catch {}
  },

  /** Lấy nhanh access token (ưu tiên trong user, fallback key riêng) */
  getToken(): string | null {
    const u = this.getUser();
    return u?.access_token || localStorage.getItem(LS_TOKEN_KEY);
  },

  isLoggedIn(): boolean {
    if (typeof window === "undefined") return false;
    return !!this.getToken() && !!this.getUser();
  },
};

// ======================
// Auth Service
// ======================
export const authService = {
  async register(userData: Record<string, any>): Promise<AuthResponse> {
    const response = (await authAPI.register(userData)) as ApiResponse<any>;

    if (response.success) {
      return {
        success: response.success,
        message: response.message,
        data: response.data,
      };
    }

    throw new Error(response.message || "Đăng ký thất bại");
  },

  async verifyOTP(email: string, otp: string): Promise<AuthResponse> {
    const response = (await authAPI.verifyOTP({ email, otp })) as ApiResponse<{
      token?: string;
      user: User;
    }>;

    if (response.success && response.data) {
      const token = response.data.token;
      const user = response.data.user;

      if (token) {
        tokenManager.setToken(token);
        // Lưu user với token vào localStorage
        userManager.setUser({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar: user.avatar || null,
          access_token: token,
          refresh_token: null,
        });
      }

      return {
        success: response.success,
        message: response.message,
        data: {
          token: token,
          user: user,
        },
      };
    }

    throw new Error(response.message || "Xác thực OTP thất bại");
  },

  async resendOTP(email: string): Promise<AuthResponse> {
    const response = (await authAPI.resendOTP(email)) as ApiResponse<any>;

    if (response.success) {
      return {
        success: response.success,
        message: response.message,
        data: response.data,
      };
    }

    throw new Error(response.message || "Gửi lại OTP thất bại");
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = (await authAPI.login({ email, password })) as ApiResponse<{
      token?: string;
      user: User;
    }>;

    if (response.success && response.data) {
      const token = response.data.token;
      const user = response.data.user;

      if (token) {
        tokenManager.setToken(token);
        // Lưu user với token vào localStorage
        userManager.setUser({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar: user.avatar || null,
          access_token: token,
          refresh_token: null,
        });
      }

      // Phát event để UI cập nhật
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("userLoggedIn"));
      }

      return {
        success: response.success,
        message: response.message,
        data: {
          token: token,
          user: user,
        },
      };
    }

    throw new Error(response.message || "Đăng nhập thất bại");
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const token = tokenManager.getToken();
      if (token) {
        await authAPI.logout(token);
      }
    } catch {
      // ignore lỗi BE, vẫn xóa local
    } finally {
      tokenManager.removeToken();
      userManager.removeUser();

      // Phát event để UI cập nhật
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("userLoggedIn"));
      }
    }

    return { success: true, message: "Đăng xuất thành công" };
  },

  async getProfile(): Promise<AuthResponse> {
    const token = tokenManager.getToken();
    if (!token) {
      throw new Error("Chưa đăng nhập");
    }

    const response = (await authAPI.getProfile(token)) as ApiResponse<
      User | { user: User }
    >;

    if (response.success && response.data) {
      // chuẩn hóa data trả về
      const normalizedUser =
        "user" in response.data
          ? (response.data.user as User)
          : (response.data as User);

      // Cập nhật thông tin user, giữ token cũ
      userManager.update({
        id: normalizedUser.id,
        email: normalizedUser.email,
        first_name: normalizedUser.first_name,
        last_name: normalizedUser.last_name,
        avatar: normalizedUser.avatar || null,
      });

      return {
        success: response.success,
        message: response.message,
        data: {
          user: normalizedUser,
        },
      };
    }

    throw new Error(
      response.message || "Không lấy được thông tin người dùng"
    );
  },

  /** Refresh token: BE trả token mới */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem(LS_REFRESH_KEY);
    if (!refreshToken) {
      throw new Error("Không có refresh token");
    }

    const res = await apiClient.post<{
      access_token: string;
      refresh_token?: string;
      access_expires_at?: number;
      refresh_expires_at?: number;
    }>("/auth/refresh-token", { refresh_token: refreshToken });

    // cập nhật user hiện có
    userManager.update({
      access_token: res.access_token,
      refresh_token: res.refresh_token ?? undefined,
      access_expires_at: res.access_expires_at ?? undefined,
      refresh_expires_at: res.refresh_expires_at ?? undefined,
    });

    // đồng bộ key rời
    tokenManager.setToken(res.access_token);
    if (res.refresh_token) {
      localStorage.setItem(LS_REFRESH_KEY, res.refresh_token);
    }

    return res.access_token;
  },

  isAuthenticated(): boolean {
    return userManager.isLoggedIn();
  },

  getCurrentToken(): string | null {
    return tokenManager.getToken();
  },

  getCurrentUser(): User | null {
    const stored = userManager.getUser();
    if (!stored) return null;
    return {
      id: stored.id,
      email: stored.email,
      first_name: stored.first_name,
      last_name: stored.last_name,
      avatar: stored.avatar,
    };
  },
};

// ======================
// useAuth Hook
// ======================
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResponse> => {
      setIsLoading(true);
      try {
        const res = await authService.login(email, password);
        setUser(res.data?.user || null);
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (userData: Record<string, any>): Promise<AuthResponse> => {
      setIsLoading(true);
      try {
        const res = await authService.register(userData);
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const verifyOTP = useCallback(
    async (email: string, otp: string): Promise<AuthResponse> => {
      setIsLoading(true);
      try {
        const res = await authService.verifyOTP(email, otp);
        setUser(res.data?.user || null);
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    verifyOTP,
  };
};

// ======================
// Export module
// ======================
const authModule = {
  tokenManager,
  userManager,
  authService,
  useAuth,
};

export default authModule;
