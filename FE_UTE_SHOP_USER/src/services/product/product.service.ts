// src/services/product/product.service.ts
import { apiClient } from "@/services/client";
import { API_ENDPOINTS } from "@/config/api";
import type {
  ApiProductDetail,
  ApiRelatedProduct,
  ProductDetail,
  RelatedProduct,
  ApiProductImage,
  ApiProductAttribute,
} from "@/types/products/product.types";

/* ========== helpers ========== */
const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Chọn giá hiển thị: ưu tiên sale nếu hợp lệ */
function pickPrice(base: number, sale: number) {
  const hasSale = sale > 0 && sale < base;
  const price = hasSale ? sale : base || sale || 0;
  const oldPrice = hasSale ? base : null;
  const discount = hasSale ? Math.max(base - price, 0) : 0;
  const salePercent =
    hasSale && base > 0 ? Math.round(((base - price) / base) * 100) : null;
  return { price, oldPrice, discount, salePercent };
}

/* ========== mapper: API -> FE ProductDetail ========== */
export function mapProductFromApi(api: ApiProductDetail): ProductDetail {
  const base = toNum(api.price);
  const sale = toNum(api.sale_price);
  const { price, oldPrice, discount, salePercent } = pickPrice(base, sale);

  // ảnh chính
  const sortedImgs = [...(api.images ?? [])].sort(
    (a, b) => (Number(b.is_primary ? 1 : 0) - Number(a.is_primary ? 1 : 0)) || (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  const primary = sortedImgs.find((i) => i.is_primary === 1 || i.is_primary === true) ?? sortedImgs[0];

  // slide list
  const slideItems = sortedImgs.map((i: ApiProductImage) => i.image_url);

  // colors / sizes từ attributes
  const attrs = api.attributes ?? [];
  const colorSet = new Set<string>();
  const sizeSet = new Set<string>();

  attrs.forEach((a: ApiProductAttribute) => {
    if ((a.attribute_type || "").toLowerCase() === "color" && a.attribute_value) {
      colorSet.add(a.attribute_value);
    }
    if ((a.attribute_type || "").toLowerCase() === "size" && a.attribute_value) {
      sizeSet.add(a.attribute_value);
    }
  });

  const colors = Array.from(colorSet).map((c) => ({ label: c, value: c }));
  const sizes = Array.from(sizeSet);

  const stock = toNum(api.stock_quantity);
  const isActive = api.is_active === 1 || api.is_active === true;

  return {
    id: api.id,
    name: api.name,
    title: api.name,
    slug: api.slug,
    description: api.description ?? null,
    short_description: api.short_description ?? null,
    sku: api.sku ?? null,

    price,
    oldPrice,
    discount,
    salePercent,

    stock,
    isActive,
    isOutofSale: !isActive || stock <= 0,

    category_name: api.category_name ?? null,
    category_slug: api.category_slug ?? null,
    brand_name: api.brand_name ?? null,

    imgSrc: primary?.image_url || "/images/default-product.png",
    slideItems,

    colors,
    sizes,

    reviews: api.reviews ?? [],
  };
}

/* ========== mapper: API -> FE RelatedProduct ========== */
export function mapRelatedFromApi(r: ApiRelatedProduct): RelatedProduct {
  const base = toNum(r.price);
  const sale = toNum(r.sale_price);
  const { price, oldPrice } = pickPrice(base, sale);
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    price,
    oldPrice,
    imgSrc: r.primary_image ?? null,
    isSale: !!(oldPrice && oldPrice > price),
    rating: r.average_rating ?? null,
  };
}

/* ========== Service ========== */
function unbox<T>(res: any): T {
  // chấp các dạng: axios {data}, hoặc raw
  return (res?.data ?? res) as T;
}

export const productAPI = {
  /** GET /products/:id */
  async getProduct(id: number): Promise<{ success: boolean; data?: ProductDetail; raw?: ApiProductDetail }> {
    const url = API_ENDPOINTS.PRODUCTS.DETAIL(id);
    const res = await apiClient.get(url);
    const payload = unbox<any>(res);

    // chấp cả {success, data} hoặc trả thẳng data
    const api: ApiProductDetail | undefined =
      payload?.data ?? (payload?.success ? undefined : payload);

    if (!api || typeof api !== "object") {
      return { success: false };
    }
    return { success: true, data: mapProductFromApi(api), raw: api };
  },

  /** GET /products/:id/related?limit=4 */
async getRelated(id: number, limit = 4): Promise<RelatedProduct[]> {
  try {
    const url = `${API_ENDPOINTS.PRODUCTS.RELATED(id)}?limit=${limit}`;
    const res = await apiClient.get(url);

    const payload = unbox<any>(res);

    // ✅ Đảm bảo dữ liệu trả về là mảng
    const list: ApiRelatedProduct[] = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [];

    // ✅ Log dữ liệu gốc (debug)
    console.log("📦 [getRelated] Raw payload:", payload);
    console.log("🧩 [getRelated] Product list:", list);

    // ✅ Map sang kiểu FE
    return list.map(mapRelatedFromApi);
  } catch (error) {
    console.error("❌ [getRelated] Lỗi khi lấy sản phẩm liên quan:", error);
    return [];
  }
}


};

export default productAPI;
