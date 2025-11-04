// src/context/Context.tsx
"use client";

import React, { useEffect, useContext, useState, ReactNode } from "react";
import { allProducts } from "@/data/products";
import { openCartModal } from "@/utlis/openCartModal"; // đổi utlis -> utils nếu cần
import { cartService } from "@/services/cart/cartitem.service";
import wishlistService from "@/services/wishlist/wishlistItem.service";
// import { userManager } from "@/utils/auth"; // nếu chưa dùng thì có thể xoá
import type { CartItem, CartListResult } from "@/types/cart/cartItem.types";

/* ================== Types ================== */
interface Product {
  /** cart item id (PUT/DELETE /cart/:id) */
  id: string | number;
  /** id sản phẩm thực (POST /cart) */
  productId?: number;
  name: string;
  price: number;
  quantity: number;
  imgSrc?: string;
  color?: string;
  size?: string;
  [key: string]: any;
}

interface ContextType {
  cartProducts: Product[];
  setCartProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  totalPrice: number;

  addProductToCart: (id: string | number, qty?: number, isModal?: boolean) => Promise<void>;
  isAddedToCartProducts: (id: string | number) => boolean;
  updateQuantity: (id: string | number, qty: number) => Promise<void>;
  removeFromCart: (cartItemId: number) => Promise<void>;

  // Wishlist (đồng bộ BE)
  removeFromWishlist: (id: string | number) => Promise<void>;
  addToWishlist: (id: string | number) => Promise<void>;
  isAddedtoWishlist: (id: string | number) => boolean;
  wishList: (string | number)[];

  // Quick view
  quickViewItem: Product;
  setQuickViewItem: React.Dispatch<React.SetStateAction<Product>>;

  quickAddItem: number;
  setQuickAddItem: React.Dispatch<React.SetStateAction<number>>;

  // Compare (local)
  addToCompareItem: (id: string | number) => void;
  isAddedtoCompareItem: (id: string | number) => boolean;
  removeFromCompareItem: (id: string | number) => void;
  compareItem: (string | number)[];
  setCompareItem: React.Dispatch<React.SetStateAction<(string | number)[]>>;
}

/* ================== Context ================== */
const dataContext = React.createContext<ContextType | undefined>(undefined);

export const useContextElement = (): ContextType => {
  const context = useContext(dataContext);
  if (context === undefined) {
    throw new Error("useContextElement must be used within a Context provider");
  }
  return context;
};

interface ContextProps {
  children: ReactNode;
}

/* ================== Helpers ================== */
/** Chuẩn hoá shape cart item từ BE về FE */
const mapCartItem = (item: any, fallbackPid?: number, fallbackQty: number = 1): Product => ({
  id: item?.id ?? item?.cart_item_id, // cart_item_id cho PUT/DELETE
  productId: Number(
    (item as any)?.productId ?? (item as any)?.product_id ?? fallbackPid
  ),
  name: item?.title ?? item?.product_name ?? "Unknown",
  title: item?.title ?? item?.product_name ?? "Unknown",
  price: Number(item?.unitPrice ?? item?.price ?? 0),
  quantity: Number(item?.quantity ?? fallbackQty),
  imgSrc: item?.imgSrc ?? item?.image_url ?? "/images/default-product.png",
  color: item?.color ?? "",
  size: item?.size ?? "",
});

/* ================== Provider ================== */
export default function Context({ children }: ContextProps) {
  // Cart
  const [cartProducts, setCartProducts] = useState<Product[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // Wishlist (server-synced)
  const [wishList, setWishList] = useState<(string | number)[]>([]); // productId[]
  const [wishMap, setWishMap] = useState<Record<number, number>>({}); // productId -> wishlist_item_id

  // Compare (local)
  const [compareItem, setCompareItem] = useState<(string | number)[]>([]);

  // Quick view
  const [quickViewItem, setQuickViewItem] = useState<Product>({
    ...allProducts[0],
    name:
      (allProducts[0] as any)?.name ??
      (allProducts[0] as any)?.title ??
      "Unknown",
    quantity: 1,
  });

  const [quickAddItem, setQuickAddItem] = useState<number>(1);

  /* ---------- Cart total ---------- */
  useEffect(() => {
    const subtotal = cartProducts.reduce((acc, p) => acc + p.quantity * p.price, 0);
    setTotalPrice(subtotal);
  }, [cartProducts]);

  /* ---------- Utils: fetchCart ---------- */
  const fetchCart = async () => {
    const { items } = await cartService.getCart();
    const mapped = items.map((it: any) => mapCartItem(it));
    setCartProducts(mapped);
    return mapped;
  };

  /* ---------- INIT: load cart & wishlist ---------- */
  useEffect(() => {
    (async () => {
      try {
        await fetchCart();
      } catch (err) {
        console.error("💥 [CTX] load cart fail", err);
      }
    })();
  }, []);

  /* ---------- Cart actions ---------- */
  const isAddedToCartProducts = (productId: string | number): boolean =>
    cartProducts.some(
      (elm) => Number(elm.productId ?? elm.id) === Number(productId)
    );

  const addProductToCart = async (
    id: string | number,
    qty?: number,
    isModal = true
  ): Promise<void> => {
    try {
      const pid = Number(id);
      const q = Math.max(1, Number(qty ?? 1));

      // Gọi BE
      await cartService.addToCart(pid, q);

      // ✅ Refetch giỏ sau khi thêm để đảm bảo đồng bộ dữ liệu (yêu cầu của bạn)
      await fetchCart();

      if (isModal) openCartModal();
    } catch (e) {
      console.error("Thêm sản phẩm vào giỏ thất bại:", e);
    }
  };

  const updateQuantity = async (id: string | number, qty: number): Promise<void> => {
    try {
      // Optimistic update trước
      setCartProducts((prev) =>
        prev.map((p) => (String(p.id) === String(id) ? { ...p, quantity: qty } : p))
      );

      await cartService.updateCartQuantity(Number(id), qty);

      // (Tuỳ chọn) refetch lại để chắc chắn đồng bộ số tiền/khuyến mãi từ BE
      // await fetchCart();
    } catch (e) {
      console.error("Cập nhật số lượng thất bại:", e);
      // (Tuỳ chọn) có thể rollback nếu cần
      await fetchCart();
    }
  };

  const removeFromCart = async (cartItemId: number): Promise<void> => {
    try {
      await cartService.removeFromCart(Number(cartItemId));
      // cập nhật local ngay
      setCartProducts((prev) => prev.filter((p) => Number(p.id) !== Number(cartItemId)));
      // (Tuỳ chọn) refetch lại để chắc chắn
      // await fetchCart();
    } catch (e) {
      console.error("Xoá sản phẩm khỏi giỏ thất bại:", e);
      await fetchCart();
    }
  };

  /* ---------- Wishlist (Server-synced) ---------- */
  const isAddedtoWishlist = (productId: string | number): boolean =>
    wishList.includes(productId);

  const addToWishlist = async (productId: string | number): Promise<void> => {
    try {
      const pid = Number(productId);

      // Toggle: nếu đã có -> xoá
      if (wishList.includes(pid)) {
        const wishlistItemId = wishMap[pid];
        if (wishlistItemId) {
          await wishlistService.removeFromWishlist(wishlistItemId);
          setWishList((prev) => prev.filter((x) => Number(x) !== pid));
          setWishMap((prev) => {
            const n = { ...prev };
            delete n[pid];
            return n;
          });
        }
        return;
      }

      // Chưa có -> thêm
      const { added, item } = await wishlistService.addToWishlist(pid);
      if (added) {
        if (item) {
          setWishMap((prev) => ({ ...prev, [pid]: Number(item.id) }));
        }
        setWishList((prev) => [...prev, pid]);
        window.dispatchEvent?.(new Event("wishlistUpdated"));
      }
    } catch (e) {
      console.error("Toggle wishlist thất bại:", e);
    }
  };

  const removeFromWishlist = async (id: string | number): Promise<void> => {
    try {
      const n = Number(id);

      // Nếu id là wishlist_item_id
      let foundProductId: number | null = null;
      for (const [pidStr, wid] of Object.entries(wishMap)) {
        if (Number(wid) === n) {
          foundProductId = Number(pidStr);
          break;
        }
      }

      if (foundProductId != null) {
        await wishlistService.removeFromWishlist(n);
        setWishList((prev) => prev.filter((x) => Number(x) !== foundProductId!));
        setWishMap((prev) => {
          const next = { ...prev };
          delete next[foundProductId!];
          return next;
        });
        return;
      }

      // Nếu không phải wishlist_item_id, coi như productId
      const pid = n;
      const wishlistItemId = wishMap[pid];
      if (wishlistItemId) {
        await wishlistService.removeFromWishlist(wishlistItemId);
        setWishList((prev) => prev.filter((x) => Number(x) !== pid));
        setWishMap((prev) => {
          const next = { ...prev };
          delete next[pid];
          return next;
        });
      }
    } catch (e) {
      console.error("Xoá wishlist thất bại:", e);
    }
  };

  // Load wishlist khi mount
  useEffect(() => {
    (async () => {
      try {
        // đọc cache trước (nếu muốn mở trang nhanh)
        const cache = JSON.parse(localStorage.getItem("wishlist_cache") || "[]");
        if (Array.isArray(cache) && cache.length) setWishList(cache);

        const { items } = await wishlistService.getWishlist();
        const productIds = items.map((x: any) => Number(x.productId));
        setWishList(productIds);

        const mapObj: Record<number, number> = {};
        for (const it of items) mapObj[Number(it.productId)] = Number(it.id);
        setWishMap(mapObj);
      } catch (e) {
        console.error("Không thể load wishlist:", e);
      }
    })();
  }, []);

  // cache wishlist để mở trang lại nhanh
  useEffect(() => {
    localStorage.setItem("wishlist_cache", JSON.stringify(wishList));
  }, [wishList]);

  /* ---------- Compare (local) ---------- */
  const addToCompareItem = (id: string | number): void => {
    if (!compareItem.includes(id)) setCompareItem((pre) => [...pre, id]);
  };
  const removeFromCompareItem = (id: string | number): void => {
    if (compareItem.includes(id))
      setCompareItem((pre) => pre.filter((elm) => elm != id));
  };
  const isAddedtoCompareItem = (id: string | number): boolean =>
    compareItem.includes(id);

  /* ---------- Cart persist (optional) ---------- */
  useEffect(() => {
    localStorage.setItem("cartList", JSON.stringify(cartProducts));
  }, [cartProducts]);

  /* ---------- Context value ---------- */
  const contextElement: ContextType = {
    cartProducts,
    setCartProducts,
    totalPrice,

    addProductToCart,   // luôn refetch sau khi thêm
    isAddedToCartProducts,
    updateQuantity,
    removeFromCart,

    removeFromWishlist,
    addToWishlist,
    isAddedtoWishlist,
    wishList,

    quickViewItem,
    setQuickViewItem,

    quickAddItem,
    setQuickAddItem,

    addToCompareItem,
    isAddedtoCompareItem,
    removeFromCompareItem,
    compareItem,
    setCompareItem,
  };

  return <dataContext.Provider value={contextElement}>{children}</dataContext.Provider>;
}
