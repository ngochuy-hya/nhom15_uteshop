import { axiosInstance } from "./http";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { authService, userManager } from "@/utlis/auth";

/** 
 * Mở rộng type cho Axios để đánh dấu request đã retry hay chưa
 */
declare module "axios" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

/** Helper lấy token linh hoạt (ưu tiên store của bạn, fallback localStorage) */
const getAccessToken = (): string | null => {
  try {
    // tuỳ bạn cài: userManager.getToken?.() / userManager.getUser()?.access_token ...
    const t1 = (userManager as any)?.getToken?.();
    if (t1) return t1;
    const t2 = (userManager as any)?.getUser?.()?.access_token;
    if (t2) return t2;
  } catch {}
  return localStorage.getItem("access_token");
};

let isRefreshing = false;
let subscribers: Array<() => void> = [];

/** Đợi refresh hoàn tất rồi retry tất cả request đang pending */
const subscribe = (cb: () => void) => subscribers.push(cb);
const flush = () => {
  subscribers.forEach((cb) => cb());
  subscribers = [];
};

/** Gắn Authorization token cho mọi request */
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers = (config.headers || {}) as any;
    config.headers.Authorization = `Bearer ${token}`
  }
  return config;
});

/** Xử lý 401: refresh token (chống đua), rồi retry request */
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      if (isRefreshing) {
        // Có refresh đang diễn ra: chờ xong rồi retry
        await new Promise<void>((resolve) => subscribe(resolve));
        original._retry = true;
        return axiosInstance(original);
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Gọi refresh; authService tự cập nhật token (storage)
        await authService.refreshToken();
        flush(); // thông báo các request đang chờ
        return axiosInstance(original);
      } catch (refreshErr) {
        subscribers = [];
        // Dọn session + điều hướng tuỳ ý
        try {
          userManager?.removeUser?.();
        } catch {}
        try {
          await authService?.logout?.();
        } catch {}
        // Option: điều hướng về login
        // window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Không export gì thêm; chỉ cần import file này 1 lần ở bootstrap (App.tsx / main.tsx)
