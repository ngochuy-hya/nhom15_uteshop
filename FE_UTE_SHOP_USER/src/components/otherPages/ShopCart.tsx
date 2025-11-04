"use client";

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import QuantitySelect from "../common/QuantitySelect";
import { cartService } from "@/services/cart/cartitem.service";
import { useContextElement } from "@/context/Context";
import type { CartListResult } from "@/types/cart/cartItem.types";

export interface CartProduct {
  id: string | number;
  productId: number;
  title: string;
  imgSrc: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
}

interface CartContextValue {
  cartProducts: CartProduct[];
  setCartProducts: React.Dispatch<React.SetStateAction<CartProduct[]>>;
  totalPrice: number;
  updateQuantity: (id: CartProduct["id"], nextQty: number) => void;
  removeFromCart: (cartItemId: number) => Promise<void>;
}

function useCartContextTyped(): CartContextValue {
  return useContextElement() as unknown as CartContextValue;
}
interface ShopCartProps {
  onChanged?: () => void;        // callback khi cập nhật giỏ
  loading?: boolean;             // trạng thái loading
  cartData?: CartListResult | null; // dữ liệu giỏ
}


export default function ({ onChanged, loading, cartData }: ShopCartProps) {
  const { cartProducts, setCartProducts, totalPrice, updateQuantity, removeFromCart } =
    useCartContextTyped();

  // ====== Xóa item ======
const removeItem = async (cartItemId: CartProduct["id"]) => {
  console.log("🖱 Click detected on Remove button! id =", cartItemId);
  alert("Clicked × with id=" + cartItemId); // thử popup luôn
  if (!removeFromCart) {
    console.log("❌ removeFromCart is undefined!");
    return;
  }
  try {
    await removeFromCart(Number(cartItemId));
    console.log("✅ [UI] Remove success id =", cartItemId);
  } catch (err) {
    console.error("❌ Remove item failed", err);
  }
};



  // ====== Cập nhật số lượng ======
  const onChangeQty = async (item: CartProduct, next: number) => {
    const clamped = Math.max(1, next);
    try {
      await cartService.updateCartQuantity(Number(item.id), clamped);
      updateQuantity(Number(item.id), clamped);
      console.log("🔢 Updated qty for id =", item.id, "to", clamped);
    } catch (err) {
      console.error("❌ Update qty failed", err);
    }
  };

  // ====== Tổng tiền ======
  const computedTotal = useMemo(() => {
    if (typeof totalPrice === "number") return totalPrice;
    return cartProducts.reduce((s, p) => s + p.price * p.quantity, 0);
  }, [totalPrice, cartProducts]);

  return (
    <div className="flat-spacing-2 pt-0">
      <div className="container">
        <div className="row">
          <div className="col-xl-14">
            <div className="tf-page-cart-main">
              <form
                className="form-cart"
                onSubmit={(e) => e.preventDefault()}
              >
                {cartProducts.length ? (
                  <table className="table-page-cart">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartProducts.map((product) => (
                        <tr key={product.id} className="tf-cart-item">
                          <td className="tf-cart-item_product">
                            <Link
                              to={`/product-detail/${product.productId}`}
                              className="img-box"
                            >
                              <img
                                alt="img-product"
                                src={product.imgSrc}
                                width={684}
                                height={972}
                              />
                            </Link>
                            <div className="cart-info">
                              <Link
                                to={`/product-detail/${product.productId}`}
                                className="name text-md link fw-medium"
                              >
                                {product.title}
                              </Link>
                              <div className="variants">
                                {product.color || "White"} / {product.size || "L"}
                              </div>
                              {/* <button
                                type="button"
                                onClick={() => removeItem(product.id)}
                                className="remove-btn"
                              >
                                ×
                              </button> */}
                            </div>
                          </td>
                          <td className="tf-cart-item_price text-center">
                            ${product.price.toFixed(2)}
                          </td>
                          <td className="tf-cart-item_quantity" data-cart-title="Quantity">
                            <QuantitySelect
                              quantity={product.quantity}
                              setQuantity={(qty) => onChangeQty(product, qty)}
                            />
                          </td>
                          <td className="tf-cart-item_total text-center">
                            ${(product.price * product.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4">
                    Your Cart is empty. Start adding favorite products to cart!
                    <br />
                    <Link className="tf-btn btn-dark2 animate-btn mt-3 inline-flex" to="/shop-default">
                      Explore Products
                    </Link>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* RIGHT: thanh toán, estimate,... */}
          {/* <div className="col-xl-6">
            <div className="tf-page-cart-sidebar">
              <div className="checkout-summary">
                <div>Total: ${computedTotal.toFixed(2)} USD</div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
