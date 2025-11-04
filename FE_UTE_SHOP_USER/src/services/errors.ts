import type { AxiosError } from "axios";

export type NormalizedError = {
  status?: number;
  code?: string;
  message: string;
  details?: unknown;
  raw?: unknown;        // giữ nguyên payload gốc nếu cần debug
};

/** Gom lỗi về 1 format thống nhất cho UI */
export function normalizeHttpError(err: unknown): NormalizedError {
  const ax = err as AxiosError<any>;
  const status = ax?.response?.status;
  const data = ax?.response?.data;

  // Một số BE trả { message, code, errors } hoặc { error, error_description }
  const code = data?.code ?? data?.error ?? undefined;

  // Tổng hợp message dễ đọc nhất
  let message =
    data?.message ||
    data?.error_description ||
    ax?.message ||
    "Request failed";

  // Nếu là lỗi validate: cố gắng ghép chuỗi gọn
  if (data?.errors && typeof data.errors === "object") {
    try {
      const parts: string[] = [];
      Object.entries(data.errors).forEach(([field, msgs]) => {
        if (Array.isArray(msgs)) {
          parts.push(`${field}: ${msgs.join(", ")}`);
        } else if (typeof msgs === "string") {
          parts.push(`${field}: ${msgs}`);
        }
      });
      if (parts.length) {
        message = `${message} (${parts.join(" | ")})`;
      }
    } catch {
      // bỏ qua nếu format khác
    }
  }

  // Network error (không có response)
  if (!status && ax?.request && !ax?.response) {
    message = "Network error. Please check your connection.";
  }

  return {
    status,
    code,
    message,
    details: data?.details ?? data?.errors,
    raw: data,
  };
}
