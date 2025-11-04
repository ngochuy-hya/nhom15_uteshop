"use client";
import { useContextElement } from "@/context/Context";

import React, { useEffect, useState } from "react";
import QuantitySelect from "../common/QuantitySelect";
import { stickyProduct } from "@/data/products";
import { formatImageUrl } from "@/utlis/image.utils";

export default function StickyProducts({ product }: { product?: any }) {
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const myElement = document.querySelector(".tf-sticky-btn-atc");

      if (myElement) {
        if (scrollPosition >= 500) {
          myElement.classList.add("show");
        } else {
          myElement.classList.remove("show");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const {
    addProductToCart,
    isAddedToCartProducts,

    cartProducts,
    updateQuantity,
  } = useContextElement();
  return (
    <div className="tf-sticky-btn-atc">
      <div className="container">
        <div className="tf-height-observer w-100 d-flex align-items-center">
          <div className="tf-sticky-atc-product d-flex align-items-center">
            <div className="tf-sticky-atc-img">
              <img
                className="lazyload"
                alt={product?.name || "Product"}
                src={formatImageUrl(product?.imgSrc || product?.primary_image || product?.image_url)}
                width={828}
                height={1241}
              />
            </div>
            <div className="tf-sticky-atc-title fw-5 d-xl-block d-none">
              {product?.name || product?.title || stickyProduct[0]?.title || "Product"}
            </div>
          </div>
          <div className="tf-sticky-atc-infos">
            <form className="">
              {product && product.colors && product.sizes && (product.colors.length > 0 || product.sizes.length > 0) && (
                <div className="tf-sticky-atc-variant-price text-center tf-select">
                  <select>
                    {product.colors.slice(0, 3).map((color: any, colorIdx: number) =>
                      product.sizes.slice(0, 3).map((size: any, sizeIdx: number) => {
                        const price = product.price || 0;
                        const priceFormatted = price >= 1000 
                          ? `${new Intl.NumberFormat('vi-VN').format(price)}đ`
                          : `$${price.toFixed(2)}`;
                        return (
                          <option key={`${colorIdx}-${sizeIdx}`}>
                            {color.label || color} / {size} - {priceFormatted}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              )}
              <div className="tf-sticky-atc-btns">
                <div className="tf-product-info-quantity">
                  <QuantitySelect
                    quantity={
                      isAddedToCartProducts(product?.id || stickyProduct[0]?.id)
                        ? cartProducts.filter(
                            (elm) => elm.id == (product?.id || stickyProduct[0]?.id)
                          )[0]?.quantity
                        : quantity
                    }
                    setQuantity={(qty) => {
                      const productId = product?.id || stickyProduct[0]?.id;
                      if (isAddedToCartProducts(productId)) {
                        updateQuantity(productId, qty);
                      } else {
                        setQuantity(qty);
                      }
                    }}
                  />
                </div>
                <a
                  href="#shoppingCart"
                  data-bs-toggle="offcanvas"
                  onClick={() =>
                    addProductToCart(product?.id || stickyProduct[0]?.id, quantity)
                  }
                  className="tf-btn animate-btn d-inline-flex justify-content-center"
                >
                  {isAddedToCartProducts(product?.id || stickyProduct[0]?.id)
                    ? "Already Added"
                    : "Add to cart"}
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

