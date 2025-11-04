/** ===== Kiểu dữ liệu Address ===== */
export interface Address {
  id: number;
  user_id: number;
  address_type?: "home" | "work" | "other" | string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code?: string | null;
  country?: string | null;
  is_default: number; // 1 hoặc 0
  created_at?: string;
  updated_at?: string;
}

/** ===== Request ===== */
export interface CreateAddressRequest {
  full_name: string;
  phone: string;
  address_line1: string;
  ward?: string;
  district?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_default?: number;
}

export interface UpdateAddressRequest {
  full_name?: string;
  phone?: string;
  address_line1?: string;
  ward?: string;
  district?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_default?: number;
}

/** ===== Response wrapper ===== */
export interface AddressResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
