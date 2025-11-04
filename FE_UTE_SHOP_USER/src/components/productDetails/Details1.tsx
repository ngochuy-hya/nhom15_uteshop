"use client";
import React, { useState, useMemo, useEffect } from "react";
import Slider1 from "./sliders/Slider1";
import BoughtTogether from "./BoughtTogether";
import { Link } from "react-router-dom";

import ColorSelect1 from "./ColorSelect1";
import SizePicker from "./SizeSelect";
import { useContextElement } from "@/context/Context";
import QuantitySelect from "../common/QuantitySelect";
import StickyProducts from "./StickyProducts";
import ProgressBarComponent from "../common/Progressbar";
import ProductHeading from "./ProductHeading";

export default function Details1({ product }) {
  // Debug: Log product prop
  useEffect(() => {
    console.log("Details1 received product:", product);
  }, [product]);

  const [quantity, setQuantity] = useState(1);
  const [activeColor, setActiveColor] = useState("Black");

  const {
    addProductToCart,
    isAddedToCartProducts,
    addToWishlist,
    isAddedtoWishlist,
    addToCompareItem,
    isAddedtoCompareItem,
    cartProducts,
    updateQuantity,
  } = useContextElement();

  /** Tìm cartItem theo product.id
   *  (cartItem.id = cart_item_id; cartItem.productId = id sản phẩm)
   */
  const cartItem = useMemo(
    () =>
      cartProducts.find(
        (p) => (p.productId ?? p.id) == Number(product?.id)
      ),
    [cartProducts, product?.id]
  );
  

  const inCart = !!cartItem;

  return (
    <section className="flat-single-product">
      <div className="tf-main-product section-image-zoom">
        <div className="container">
          <div className="row">
            {/* Product Images */}
            <div className="col-md-6">
              <div className="tf-product-media-wrap sticky-top">
                <div className="product-thumbs-slider">
                  <Slider1
                    activeColor={activeColor}
                    firstItem={product.imgSrc}
                    slideItems={product.slideItems || []}
                    setActiveColor={setActiveColor as any}
                  />
                </div>
              </div>
            </div>
            {/* /Product Images */}

            {/* Product Info */}
            <div className="col-md-6">
              <div className="tf-zoom-main" />
              <div className="tf-product-info-wrap position-relative">
                <div className="tf-product-info-list other-image-zoom">
                  <ProductHeading product={product} inStock={!product.isOutofSale} />

                  <div className="tf-product-total-quantity">
                    <div className="group-btn">
                      <QuantitySelect
                        // Nếu đã có trong giỏ, ưu tiên số lượng từ giỏ
                        quantity={inCart ? cartItem.quantity : quantity}
                        setQuantity={(qty) => {
                          if (inCart) {
                            // QUAN TRỌNG: dùng cartItem.id (cart_item_id), KHÔNG dùng product.id
                            updateQuantity(cartItem.id, qty);
                          } else {
                            setQuantity(qty);
                          }
                        }}
                      />

<button
  type="button"
  data-bs-toggle="offcanvas"
  data-bs-target="#shoppingCart" // nếu bạn vẫn muốn mở giỏ bên phải
  className="tf-btn hover-primary btn-add-to-cart"
  onClick={async () => {
    console.log("[UI] Click Add to Cart", {
      productId: product?.id,
      quantity: inCart ? cartItem?.quantity : quantity,
    });

    try {
      await addProductToCart(
        product.id,
        inCart ? cartItem?.quantity : quantity
      );
      console.log("[UI] ✅ addProductToCart success");
    } catch (err) {
      console.error("[UI] ❌ addProductToCart failed", err);
    }
  }}
>
  {inCart ? "Already Added" : "Add to cart"}
</button>

                    </div>
                  </div>

                  <ul className="tf-product-cate-sku text-md">
                    {product?.sku && (
                      <li className="item-cate-sku">
                        <span className="label">SKU:</span>
                        <span className="value">{product.sku}</span>
                      </li>
                    )}
                    {product?.category_name && (
                      <li className="item-cate-sku">
                        <span className="label">Categories:</span>
                        <span className="value">{product.category_name}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
            {/* /Product Info */}
          </div>
        </div>
      </div>

      <StickyProducts product={product} />
    </section>
  );
}
