/**
 * Services Exports
 * Central export point for all services
 */

// ========= Auth =========
export * from "./auth";                      // nếu có barrel trong /auth
export { default as authService } from "./auth/auth.service";

// ========= User =========
export * from "./user/user.service";
export { userService } from "./user/user.service";

// ========= Address =========
export * from "./address/address.service";   // xuất các function + types
export { addressService } from "./address/address.service";

// ========= API Client & HTTP =========
export { apiClient } from "./client";
export { axiosInstance } from "./http";
export { normalizeHttpError } from "./errors";
export type { NormalizedError } from "./errors";
