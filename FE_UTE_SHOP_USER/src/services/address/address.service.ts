// src/services/address/address.service.ts
import { apiClient } from "../client";
import { API_ENDPOINTS } from "../../config/api";
import type {
  Address,
  AddressResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
} from "@/types/address/address.types";

/** 1) Lấy danh sách địa chỉ */
export const getAddresses = async (): Promise<Address[]> => {
  const res = await apiClient.get<AddressResponse<Address[]>>(
    API_ENDPOINTS.ADDRESS?.LIST ?? "/addresses"
  );
  // res: AddressResponse<Address[]>
  return res.data; // <-- Address[]
};

/** 2) Tạo địa chỉ mới */
export const createAddress = async (
  payload: CreateAddressRequest
): Promise<Address> => {
  const res = await apiClient.post<AddressResponse<Address>>(
    API_ENDPOINTS.ADDRESS?.CREATE ?? "/addresses",
    payload
  );
  return res.data; // <-- Address
};

/** 3) Cập nhật địa chỉ */
export const updateAddress = async (
  id: number,
  payload: UpdateAddressRequest
): Promise<Address> => {
  const url = API_ENDPOINTS.ADDRESS?.UPDATE
    ? API_ENDPOINTS.ADDRESS.UPDATE(id)
    : `/addresses/${id}`;

  const res = await apiClient.put<AddressResponse<Address>>(url, payload);
  return res.data; // <-- Address
};

/** 4) Xóa địa chỉ */
export const deleteAddress = async (id: number): Promise<boolean> => {
  const url = API_ENDPOINTS.ADDRESS?.DELETE
    ? API_ENDPOINTS.ADDRESS.DELETE(id)
    : `/addresses/${id}`;

  const res = await apiClient.delete<AddressResponse<null>>(url);
  // res KHÔNG phải null; là AddressResponse<null> => kiểm tra success
  return !!res.success;
};

/** 5) Đặt địa chỉ mặc định */
export const setDefaultAddress = async (id: number): Promise<Address> => {
  const url = API_ENDPOINTS.ADDRESS?.SET_DEFAULT
    ? API_ENDPOINTS.ADDRESS.SET_DEFAULT(id)
    : `/addresses/${id}/default`;

  const res = await apiClient.put<AddressResponse<Address>>(url);
  return res.data; // <-- Address
};

export const addressService = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
export default addressService;
