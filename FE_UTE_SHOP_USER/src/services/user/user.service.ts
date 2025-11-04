// src/services/user/user.service.ts
import { apiClient } from "../client";
import { API_ENDPOINTS } from "../../config/api";
import { userManager } from "@/utlis/auth";
import type { User, ProfileResponse } from "@/types/user/user.types";

export interface UpdateProfileRequest {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

/** GET /auth/profile → trả về User (inner data) */
export const getProfile = async (): Promise<User> => {
  const res = await apiClient.get<ProfileResponse<User>>(
    API_ENDPOINTS.AUTH.PROFILE ?? "/auth/profile"
  );
  return res.data; // do apiClient đã unwrap AxiosResponse -> res là ProfileResponse<User>
};

/** PUT /users/profile → trả về User + sync localStorage */
export const updateProfile = async (
  payload: UpdateProfileRequest
): Promise<User> => {
  const res = await apiClient.put<ProfileResponse<User>>(
    API_ENDPOINTS.USERS.UPDATE_PROFILE ?? "/users/profile",
    payload
  );
  const updatedUser = res.data;

  try {
    const current = userManager.getUser?.();
    if (current && updatedUser) {
      userManager.setUser?.({
        ...current,
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name ?? null,
        last_name: updatedUser.last_name ?? null,
        avatar: updatedUser.avatar ?? null,
      });
      window.dispatchEvent?.(new Event("userLoggedIn"));
    }
  } catch {}
  return updatedUser;
};

/** POST /users/change-password → trả { updated:boolean } | null */
export const changePassword = async (
  payload: ChangePasswordRequest
): Promise<{ updated: boolean } | null> => {
  const res = await apiClient.post<
    ProfileResponse<{ updated: boolean } | null>
  >(API_ENDPOINTS.USERS.CHANGE_PASSWORD ?? "/users/change-password", payload);
  return res.data;
};

export const userService = { getProfile, updateProfile, changePassword };
export default userService;
