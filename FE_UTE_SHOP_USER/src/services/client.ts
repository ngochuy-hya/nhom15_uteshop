import { axiosInstance } from "./http";
import { normalizeHttpError } from "./errors";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

type RequestConfig = {
  params?: any;
  headers?: Record<string, string>;
  // Cho phép truyền thêm config nếu cần
  // signal?: AbortSignal; ...
};

async function request<T>(
  method: HttpMethod,
  url: string,
  bodyOrConfig?: any | RequestConfig,
  maybeConfig?: RequestConfig
): Promise<T> {
  // Cho phép overload: (method, url, { params, headers }) hoặc có body
  const hasBody = method !== "get" && method !== "delete";
  const data = hasBody ? bodyOrConfig : undefined;
  const cfg: RequestConfig = hasBody ? (maybeConfig || {}) : (bodyOrConfig || {});

  try {
    const res = await axiosInstance.request<T>({
      method,
      url,
      data,
      params: cfg.params,
      headers: cfg.headers,
    });
    return res.data as T;
  } catch (err) {
    throw normalizeHttpError(err);
  }
}

export const apiClient = {
  get<T>(url: string, config?: RequestConfig) {
    return request<T>("get", url, config);
  },
  delete<T>(url: string, config?: RequestConfig) {
    return request<T>("delete", url, config);
  },
  post<T>(url: string, body?: any, config?: RequestConfig) {
    return request<T>("post", url, body, config);
  },
  put<T>(url: string, body?: any, config?: RequestConfig) {
    return request<T>("put", url, body, config);
  },
  patch<T>(url: string, body?: any, config?: RequestConfig) {
    return request<T>("patch", url, body, config);
  },
};
