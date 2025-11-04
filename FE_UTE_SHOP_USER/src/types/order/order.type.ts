import { ApiSuccessResponse } from "../auth/auth.types";
import type { User } from "../user/user.types";

/* ======================== ORDER TYPES ======================== */

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_color?: string | null;
  selected_size?: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status_id: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: "pending" | "paid" | "refunded" | "failed";
  shipping_address: string;
  billing_address: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  user?: Pick<User, "id" | "first_name" | "last_name" | "email" | "phone">;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  status_id: number;
  status_name: string;
  note?: string | null;
  created_at: string;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  status_history: OrderStatusHistory[];
}

/* ======================== REQUEST / RESPONSE ======================== */

export interface CreateOrderItemInput {
  product_id: number;
  quantity: number;
  selected_color?: string | null;
  selected_size?: string | null;
}

export interface CreateOrderRequest {
  items: CreateOrderItemInput[];
  shipping_address: string;
  billing_address: string;
  payment_method: "cod" | "payos";
  notes?: string;
  coupon_code?: string;
}

export interface CancelOrderRequest {
  reason?: string;
}

export interface RequestOrderReturnRequest {
  reason: string;
  items: { product_id: number; quantity: number }[];
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/* ======================== RESPONSE WRAPPERS ======================== */

export interface CreateOrderResponse extends ApiSuccessResponse<{ 
  id: number;
  order_number: string;
  total_amount: number;
}> {}

export interface GetMyOrdersResponse extends ApiSuccessResponse<{
  orders: Order[];
  pagination: PaginationMeta;
}> {}

export interface GetOrderDetailResponse extends ApiSuccessResponse<OrderDetail> {}

export interface CancelOrderResponse extends ApiSuccessResponse<{
  refund?: {
    refund_id: number;
    payos_refund_id?: string;
    amount: number;
    status: string;
  };
}> {}

export interface GetAllOrdersResponse extends ApiSuccessResponse<{
  orders: Order[];
  pagination: PaginationMeta;
}> {}

export interface GetOrderStatisticsResponse extends ApiSuccessResponse<{
  total_orders: number;
  total_revenue: number;
  total_cancelled: number;
  total_refunded: number;
}> {}

export interface GetOrderInvoiceResponse extends ApiSuccessResponse<{
  order: Order;
  items: OrderItem[];
}> {}

export interface RequestOrderReturnResponse extends ApiSuccessResponse<{
  return_id: number;
}> {}
