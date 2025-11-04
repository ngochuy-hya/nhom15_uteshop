import { ApiSuccessResponse } from "../auth/auth.types";

// src/types/User.ts
export interface User {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;  // dạng ISO string
  gender: "male" | "female" | "other" | null;
  avatar: string | null;
  role_id: number;
  is_active: number;        // 1 = active, 0 = inactive
  email_verified: number;   // 1 = verified, 0 = not verified
  created_at: string;       // ISO string
}

// Nếu muốn kèm luôn response wrapper của API
export interface ProfileResponse<T> {
  success: boolean;
  message: string;
  data: T;
}


  export interface GetProfileResponseData extends Omit<User, 'is_active' | 'email_verified' | 'gender'> {
    phone: string | null;
    date_of_birth: string | null;
    gender: "male" | "female" | "other" | null;
    avatar: string | null;
    role_id: number;
    is_active: boolean;
    email_verified: boolean;
    created_at: string;
  }

  export interface GetProfileResponse extends ApiSuccessResponse<GetProfileResponseData> {}