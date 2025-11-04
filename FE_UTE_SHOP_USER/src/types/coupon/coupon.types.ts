// src/types/coupon/coupon.types.ts
export interface Coupon {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: "fixed" | "percentage";
  value: string | number;
  minimum_amount?: string | number | null;
  maximum_discount?: string | number | null;
  usage_limit?: number | null;
  used_count?: number | null;
  is_active?: boolean | number;
  starts_at?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_usage_count?: number | null;
}

export interface CouponValidateResult {
  coupon: Coupon;
  discount_amount: number;
}

export type ValidateCouponRequest = {
  code: string;
  subtotal: number;
};

// Nếu bạn đã dùng chung Response generic cho toàn FE:
export interface CouponResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
