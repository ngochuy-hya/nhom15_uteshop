// src/services/wishlist/wishlist.service.ts
import { apiClient } from "../client";
import { API_ENDPOINTS } from "../../config/api";
import type {
  WishlistItem,
  ApiWishlistItem,
  WishlistListApiResponse,
  WishlistListResult,
} from "../../types/wishlist/wishlistItem.types";

/* =============== Mapper & Utils =============== */
export function mapWishlistItemFromApi(api: ApiWishlistItem): WishlistItem {
  const basePrice = Number(api.price) || 0;
  const salePrice = Number(api.sale_price) || 0;
  const hasSale = salePrice > 0 && salePrice < basePrice;

  const price = hasSale ? salePrice : basePrice;
  const oldPrice = hasSale ? basePrice : null;
  const discount = hasSale ? basePrice - salePrice : 0;
  const salePercent = hasSale
    ? Math.round(((basePrice - salePrice) / basePrice) * 100)
    : 0;

  // Ảnh chính & ảnh hover (tách biệt, có fallback hợp lý)
  const imgMain =
    api.product_image ||
    (api as any).primary_image ||
    (api as any).image_url ||
    "/images/default-product.png";

  // CHỈ gán hover nếu BE có field riêng cho hover
  const imgHover =
    (api as any).product_image_hover ||
    (api as any).image_hover ||
    null;

  return {
    id: api.id,                      // wishlist_item_id
    productId: api.product_id,       // id sản phẩm
    title: api.product_name,
    slug: api.product_slug,
    price,
    oldPrice,
    discount,
    stock: api.stock_quantity,
    isActive: api.is_active === 1 || api.is_active === true,
    imgSrc: imgMain,
    imgHover: imgHover,              // để null nếu không có
    saleLabel: hasSale ? `-${salePercent}%` : null,
  };
}


/* ================== Service ================== */
/** GET /wishlist → { items, total } (đã map)
 *  LƯU Ý: ApiClient.get<T> trả về ApiResponse<T>, nên phải đọc qua res.data
 */
/** GET /wishlist → { items, total } (đã map) */
export const getWishlist = async (): Promise<WishlistListResult> => {
  const url = API_ENDPOINTS.WISHLIST?.LIST ?? "/wishlist";

  // Hỗ trợ cả 2 shape: T hoặc { data: T }
  type MaybeWrapped<T> = T | { data: T };

  const res = await apiClient.get<MaybeWrapped<WishlistListApiResponse>>(url);

  // unbox: nếu có data thì lấy data, không thì lấy chính nó
  const container: WishlistListApiResponse =
    (res as any)?.data ?? (res as any);

  const apiItems: ApiWishlistItem[] = Array.isArray(container?.items)
    ? container.items
    : [];

  const items = apiItems.map(mapWishlistItemFromApi);
  const total =
    Number(container?.total_items ?? items.length) || items.length;

  return { items, total };
};


/** POST /wishlist { product_id } → có thể trả { item } hoặc chỉ message */
export const addToWishlist = async (
  productId: number
): Promise<{ added: boolean; item?: WishlistItem }> => {
  const url = API_ENDPOINTS.WISHLIST?.ADD ?? "/wishlist";

  // res = ApiResponse<any>
  const res = await apiClient.post<any>(url, { product_id: productId });

  // Một số BE trả { data: { item } }, số khác trả { data: { ...itemFields } }
  const payload = res.data ?? {};
  const apiItem: ApiWishlistItem | undefined =
    payload.item && typeof payload.item === "object"
      ? payload.item
      : typeof payload.product_id !== "undefined"
      ? (payload as ApiWishlistItem)
      : undefined;

  if (apiItem && typeof apiItem === "object" && "product_id" in apiItem) {
    return { added: true, item: mapWishlistItemFromApi(apiItem) };
  }
  return { added: true };
};

/** GET /wishlist/check/:productId → { exists: boolean } hoặc { in_wishlist: boolean } */
export const checkInWishlist = async (
  productId: number
): Promise<{ exists: boolean }> => {
  const base = API_ENDPOINTS.WISHLIST?.CHECK ?? "/wishlist/check";
  const url = `${base}/${productId}`;

  // res = ApiResponse<any>
  const res = await apiClient.get<any>(url);
  const payload = res.data ?? {};

  const exists =
    Boolean(payload.exists) || Boolean(payload.in_wishlist) || false;

  return { exists };
};

/** DELETE /wishlist/:id → xóa 1 item theo id bản ghi wishlist_items */
export const removeFromWishlist = async (
  wishlistItemId: number
): Promise<{ deleted: boolean }> => {
  const base = API_ENDPOINTS.WISHLIST?.REMOVE ?? "/wishlist";
  const url = `${base}/${wishlistItemId}`;

  // res = ApiResponse<any>
  const res = await apiClient.delete<any>(url);
  const payload = res.data ?? {};

  const ok = Boolean(payload.deleted) || res.success === true;
  return { deleted: ok || true };
};

/** DELETE /wishlist → xóa toàn bộ */
export const clearWishlist = async (): Promise<{ cleared: boolean }> => {
  const url = API_ENDPOINTS.WISHLIST?.CLEAR ?? "/wishlist";

  // res = ApiResponse<any>
  const res = await apiClient.delete<any>(url);
  const payload = res.data ?? {};

  const ok = Boolean(payload.cleared) || res.success === true;
  return { cleared: ok || true };
};

export const wishlistService = {
  getWishlist,
  addToWishlist,
  checkInWishlist,
  removeFromWishlist,
  clearWishlist,
};

export default wishlistService;
