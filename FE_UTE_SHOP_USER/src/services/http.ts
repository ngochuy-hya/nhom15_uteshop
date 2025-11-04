import axios, { AxiosInstance } from "axios";

/**
 * Cấu hình baseURL của API (lấy từ biến môi trường)
 * Ví dụ: VITE_API_URL=https://api.myshop.com/api/v1
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Tạo 1 instance axios dùng chung cho toàn dự án
 */
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // 20s
  withCredentials: true, // cho phép cookie nếu cần
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Log request/response trong môi trường dev
 */
if (import.meta.env.DEV) {
  axiosInstance.interceptors.request.use((config) => {
    console.log("➡️ [Request]", config.method?.toUpperCase(), config.url, config);
    return config;
  });

  axiosInstance.interceptors.response.use(
    (res) => {
      console.log("✅ [Response]", res.status, res.config.url, res.data);
      return res;
    },
    (error) => {
      console.error("❌ [Error]", error.response?.status, error.config?.url, error.response?.data);
      return Promise.reject(error);
    }
  );
}
