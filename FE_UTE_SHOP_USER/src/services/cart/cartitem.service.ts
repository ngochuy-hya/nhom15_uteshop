// src/services/cart/cartitem.service.ts
import { apiClient } from "../client";
import { API_ENDPOINTS } from "../../config/api";
import type {
  ApiCartItem,
  CartItem,
  CartListApiResponse,
  CartListResult,
} from "../../types/cart/cartItem.types";

/* =============== Utils & Mapper =============== */
const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Chọn đơn giá áp dụng:
 *  - Ưu tiên sale_price nếu hợp lệ và < current_price
 *  - Nếu item.price có sẵn từ BE (đã “chốt” giá), ưu tiên dùng
 *  - Fallback current_price -> sale_price -> price -> 0
 */
function pickUnitPrice(api: ApiCartItem): {
  unitPrice: number;
  oldPrice: number | null;
  discount: number;
  salePercentLabel: string | null;
} {
  const priceRaw = toNum(api.price);                // có thể là giá đã áp cho item
  const base = toNum(api.current_price);
  const sale = toNum(api.sale_price);

  // Nếu BE đã gửi thẳng price cho item, dùng luôn
  if (priceRaw > 0) {
    // Thử tính oldPrice dựa vào base/sale nếu có
    const hasSale = sale > 0 && sale < base;
    const oldPrice = hasSale ? base : null;
    const discount = hasSale ? Math.max(base - priceRaw, 0) : 0;
    const salePercentLabel =
      hasSale && base > 0 ? `-${Math.round(((base - priceRaw) / base) * 100)}%` : null;

    return {
      unitPrice: priceRaw,
      oldPrice,
      discount,
      salePercentLabel,
    };
  }

  // Nếu chưa có price, tự chọn theo sale/base
  const hasSale = sale > 0 && sale < base;
  const unitPrice = hasSale ? sale : base || sale || 0;
  const oldPrice = hasSale ? base : null;
  const discount = hasSale ? base - unitPrice : 0;
  const salePercentLabel =
    hasSale && base > 0 ? `-${Math.round(((base - unitPrice) / base) * 100)}%` : null;

  return { unitPrice, oldPrice, discount, salePercentLabel };
}

export function mapCartItemFromApi(api: ApiCartItem): CartItem {
  const { unitPrice, oldPrice, discount, salePercentLabel } = pickUnitPrice(api);
  const qty = toNum(api.quantity);

  return {
    id: api.id,
    productId: api.product_id,
    title: api.product_name,
    slug: api.product_slug,

    quantity: qty,
    unitPrice,
    oldPrice,
    discount,
    saleLabel: salePercentLabel,

    stock: toNum(api.stock_quantity),
    isActive: api.is_active === 1 || api.is_active === true,

    color: api.selected_color ?? null,
    size: api.selected_size ?? null,
    imgSrc:
      api.product_image ||
      (api as any).primary_image ||
      (api as any).image_url ||
      "/images/default-product.png",

    lineTotal: unitPrice * qty,
  };
}

/* =============== Service =============== */

/** Unbox helper: res có thể là { data: T } hoặc T */
function unbox<T>(res: any): T {
  return (res && res.data) ?? res;
}

/** GET /cart → { items, subtotal, totalItems } (đã map) */
export const getCart = async (): Promise<CartListResult> => {
  const url = API_ENDPOINTS.CART?.LIST ?? "/cart";

  type Envelope =
    | { success: boolean; message?: string; data: CartListApiResponse }
    | CartListApiResponse;

  const res = await apiClient.get<Envelope>(url);
  const un = unbox<Envelope>(res);

  const container: CartListApiResponse =
    (un as any)?.data ?? (un as any);

  const apiItems: ApiCartItem[] = Array.isArray(container?.items)
    ? container.items
    : [];

  const items = apiItems.map(mapCartItemFromApi);

  // Ưu tiên subtotal của BE, nếu không có thì tự tính
  const subtotalFromBE = toNum(container?.subtotal);
  const subtotal =
    subtotalFromBE > 0
      ? subtotalFromBE
      : items.reduce((s, it) => s + it.lineTotal, 0);

  const totalItems = toNum(container?.total_items ?? items.length);

  return { items, subtotal, totalItems };
};

/** POST /cart → thêm item
 * body: { product_id, quantity, selected_color?, selected_size? }
 * BE có thể trả { data: { item } } hoặc { data: { items, subtotal, total_items } } hoặc chỉ message
 */
export const addToCart = async (
  productId: number,
  quantity: number = 1,
  opts?: { color?: string | null; size?: string | null }
): Promise<{ added: boolean; item?: CartItem; cart?: CartListResult }> => {
  const url = API_ENDPOINTS.CART?.ADD ?? "/cart";
  const payload: Record<string, any> = {
    product_id: productId,
    quantity,
  };
  if (opts?.color) payload.selected_color = opts.color;
  if (opts?.size) payload.selected_size = opts.size;

  const res = await apiClient.post<any>(url, payload);
  const data = unbox<any>(res);

  // Trường hợp trả về 1 item
  const maybeItem =
    data?.data?.item ?? data?.item ?? data?.data ?? null;

  // Nếu là item giống ApiCartItem
  if (maybeItem && typeof maybeItem === "object" && "product_id" in maybeItem) {
    return { added: true, item: mapCartItemFromApi(maybeItem as ApiCartItem) };
  }

  // Trường hợp trả về nguyên giỏ { items, subtotal, total_items }
  const maybeCart: CartListApiResponse | undefined =
    data?.data && Array.isArray(data?.data?.items)
      ? (data.data as CartListApiResponse)
      : undefined;

  if (maybeCart) {
    const items = maybeCart.items.map(mapCartItemFromApi);
    const subtotal =
      toNum(maybeCart.subtotal) ||
      items.reduce((s, it) => s + it.lineTotal, 0);

    return {
      added: true,
      cart: {
        items,
        subtotal,
        totalItems: toNum(maybeCart.total_items ?? items.length),
      },
    };
  }

  // Nếu BE chỉ trả message
  return { added: true };
};

/** PUT /cart/:id → cập nhật số lượng */
export const updateCartQuantity = async (
  cartItemId: number,
  quantity: number
): Promise<{ updated: boolean; item?: CartItem; cart?: CartListResult }> => {
  const base = API_ENDPOINTS.CART?.UPDATE ?? "/cart";
  const url = `${base}/${cartItemId}`;

  const res = await apiClient.put<any>(url, { quantity });
  const data = unbox<any>(res);

  // Thử bắt 1 item
  const maybeItem = data?.data?.item ?? data?.item ?? null;
  if (maybeItem && typeof maybeItem === "object" && "product_id" in maybeItem) {
    return { updated: true, item: mapCartItemFromApi(maybeItem as ApiCartItem) };
  }

  // Thử bắt nguyên giỏ
  const maybeCart: CartListApiResponse | undefined =
    data?.data && Array.isArray(data?.data?.items)
      ? (data.data as CartListApiResponse)
      : undefined;

  if (maybeCart) {
    const items = maybeCart.items.map(mapCartItemFromApi);
    const subtotal =
      toNum(maybeCart.subtotal) ||
      items.reduce((s, it) => s + it.lineTotal, 0);

    return {
      updated: true,
      cart: {
        items,
        subtotal,
        totalItems: toNum(maybeCart.total_items ?? items.length),
      },
    };
  }

  return { updated: true };
};

/** DELETE /cart/:id → xóa 1 item */
export const removeFromCart = async (
  cartItemId: number
): Promise<{ deleted: boolean; cart?: CartListResult }> => {
  const base = API_ENDPOINTS.CART?.REMOVE ?? "/cart";
  const url = `${base}/${cartItemId}`;

  const res = await apiClient.delete<any>(url);
  const data = unbox<any>(res);

  const maybeCart: CartListApiResponse | undefined =
    data?.data && Array.isArray(data?.data?.items)
      ? (data.data as CartListApiResponse)
      : undefined;

  if (maybeCart) {
    const items = maybeCart.items.map(mapCartItemFromApi);
    const subtotal =
      toNum(maybeCart.subtotal) ||
      items.reduce((s, it) => s + it.lineTotal, 0);

    return {
      deleted: true,
      cart: {
        items,
        subtotal,
        totalItems: toNum(maybeCart.total_items ?? items.length),
      },
    };
  }

  const ok = Boolean(data?.deleted) || Boolean(res?.success);
  return { deleted: ok || true };
};

/** DELETE /cart → xóa toàn bộ */
export const clearCart = async (): Promise<{ cleared: boolean }> => {
  const url = API_ENDPOINTS.CART?.CLEAR ?? "/cart";
  const res = await apiClient.delete<any>(url);
  const data = unbox<any>(res);

  const ok = Boolean(data?.cleared) || Boolean(res?.success);
  return { cleared: ok || true };
};

export const cartService = {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
};

export default cartService;
