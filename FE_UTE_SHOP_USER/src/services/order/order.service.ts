import { apiClient } from "../client";
import { API_ENDPOINTS } from "../../config/api";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  GetMyOrdersResponse,
  GetOrderDetailResponse,
  CancelOrderRequest,
  CancelOrderResponse,
  GetAllOrdersResponse,
  GetOrderStatisticsResponse,
  GetOrderInvoiceResponse,
  RequestOrderReturnRequest,
  RequestOrderReturnResponse,
} from "@/types/order/order.type";

export type ApiSuccessResponse<T = any> = {
  success: boolean;
  message: string;
  data: T;
};

/* =========================
   ORDER SERVICE
========================= */

/** Tạo đơn hàng */
export const createOrder = async (payload: CreateOrderRequest) => {
  const res = await apiClient.post<CreateOrderResponse>(
    API_ENDPOINTS.ORDERS.CREATE ?? "/orders",
    payload
  );
  return res.data;
};

/** Lấy danh sách đơn hàng của user */
export const getMyOrders = async (params?: {
  page?: number;
  limit?: number;
  status_id?: number;
}) => {
  const res = await apiClient.get<GetMyOrdersResponse>(
    API_ENDPOINTS.ORDERS.MY_ORDERS ?? "/orders/my-orders",
    { params }
  );
  return res.data;
};

/** Lấy chi tiết đơn hàng */
export const getOrderDetail = async (id: number | string) => {
  if (id === undefined || id === null || id === '' || Number.isNaN(Number(id))) {
    throw new Error('orderService.getOrderDetail: invalid id');
  }
  const url =
    typeof API_ENDPOINTS.ORDERS.DETAIL === "function"
      ? API_ENDPOINTS.ORDERS.DETAIL(id)  // gọi hàm với id
      : `${API_ENDPOINTS.ORDERS.DETAIL ?? "/orders"}/${id}`; // fallback nếu là string

  const res = await apiClient.get<GetOrderDetailResponse>(url);
  return res.data;
};


/** Hủy đơn hàng */
export const cancelOrder = async (id: number | string, payload?: CancelOrderRequest) => {
  // Guard: tránh gọi /orders/undefined
  if (id === undefined || id === null || id === '' || Number.isNaN(Number(id))) {
    throw new Error('orderService.cancelOrder: invalid id');
  }

  const res = await apiClient.post<CancelOrderResponse>(
    `${API_ENDPOINTS.ORDERS.CANCEL(id) ?? `/orders/${id}/cancel`}`,
    payload
  );
  return res.data;
};

/** Lấy hóa đơn */
export const getOrderInvoice = async (id: number | string) => {
  const res = await apiClient.get<GetOrderInvoiceResponse>(
    `${API_ENDPOINTS.ORDERS.INVOICE(id) ?? `/orders/${id}/invoice`}`
  );
  return res.data;
};

/** Yêu cầu trả hàng */
export const requestOrderReturn = async (
  id: number | string,
  payload: RequestOrderReturnRequest
) => {
  const res = await apiClient.post<RequestOrderReturnResponse>(
    `${API_ENDPOINTS.ORDERS.RETURN(id) ?? `/orders/${id}/return`}`,
    payload
  );
  return res.data;
};

/* ================= ADMIN ================= */

/** Danh sách tất cả đơn hàng (admin) */
export const getAllOrders = async (params?: {
  page?: number;
  limit?: number;
  status_id?: number;
  payment_status?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}) => {
  const res = await apiClient.get<GetAllOrdersResponse>(
    API_ENDPOINTS.ORDERS.ADMIN_ALL ?? "/orders/admin/all",
    { params }
  );
  return res.data;
};

/** Cập nhật trạng thái đơn hàng (admin) */
export const updateOrderStatus = async (
  id: number | string,
  payload: { status_id: number; notes?: string }
) => {
  const res = await apiClient.put<ApiSuccessResponse>(
    API_ENDPOINTS.ORDERS.ADMIN_UPDATE_STATUS(id) ??
      `/orders/admin/${id}/status`,
    payload
  );
  return res.data;
};

/** Thống kê đơn hàng (admin) */
export const getOrderStatistics = async (params?: {
  start_date?: string;
  end_date?: string;
}) => {
  const res = await apiClient.get<GetOrderStatisticsResponse>(
    API_ENDPOINTS.ORDERS.ADMIN_STATISTICS ?? "/orders/admin/statistics",
    { params }
  );
  return res.data;
};

/* ================= EXPORT ================= */

export const orderService = {
  createOrder,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  getOrderInvoice,
  requestOrderReturn,
  getAllOrders,
  updateOrderStatus,
  getOrderStatistics,
};

export default orderService;
