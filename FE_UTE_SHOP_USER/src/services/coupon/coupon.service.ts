// src/services/coupon/coupon.service.ts
import { apiClient } from "../client";
import { API_ENDPOINTS } from "../../config/api";
import type {
  Coupon,
  CouponValidateResult,
  CouponResponse,       // nếu bạn đã có generic ApiResponse<T> thì thay bằng ApiResponse<T>
  ValidateCouponRequest // { code: string; subtotal: number }
} from "@/types/coupon/coupon.types";

/** 1) Lấy danh sách coupon khả dụng (yêu cầu login) */
export const getAvailableCoupons = async (): Promise<Coupon[]> => {
  const url =
    API_ENDPOINTS.COUPON?.AVAILABLE ?? "/coupons/available";

  const res = await apiClient.get<CouponResponse<Coupon[]>>(url);
  // res: CouponResponse<Coupon[]>
  return res.data ?? []; // <-- Coupon[]
};

/** 2) Validate coupon với subtotal hiện tại (yêu cầu login) */
export const validateCoupon = async (
  payload: ValidateCouponRequest
): Promise<CouponValidateResult> => {
  const url =
    API_ENDPOINTS.COUPON?.VALIDATE ?? "/coupons/validate";

  const res = await apiClient.post<CouponResponse<CouponValidateResult>>(url, payload);

  // Trả về đúng shape { coupon, discount_amount }
  if (!res.data) {
    // đồng bộ với cách bạn check ở deleteAddress (dựa vào success)
    // có thể throw để FE bắt và hiển thị toast
    throw new Error(res.message ?? "Không xác định được dữ liệu mã giảm giá");
  }
  return res.data; // <-- CouponValidateResult
};

export const couponService = {
  getAvailableCoupons,
  validateCoupon,
};

export default couponService;
