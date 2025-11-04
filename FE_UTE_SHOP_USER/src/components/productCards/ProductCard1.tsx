"use client";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useContextElement } from "@/context/Context";
import { formatImageUrl } from "@/utlis/image.utils";
import CountdownTimer from "../common/Countdown";

export default function ProductCard1({ 
  product, 
  styleClass = "grid style-1",
  tooltipDirection = "left",
  textCenter = false 
}: {
  product: any;
  styleClass?: string;
  tooltipDirection?: string;
  textCenter?: boolean;
}) {
  const [currentImage, setCurrentImage] = useState(() => 
    formatImageUrl(product?.imgSrc || product?.primary_image || product?.image_url)
  );

  const {
    addToWishlist,
    isAddedtoWishlist,
    addToCompareItem,
    isAddedtoCompareItem,
    setQuickViewItem,
    addProductToCart,
    isAddedToCartProducts,
  } = useContextElement();

  useEffect(() => {
    const imageUrl = formatImageUrl(product?.imgSrc || product?.primary_image || product?.image_url);
    setCurrentImage(imageUrl);
  }, [product]);

  // Format price
  const formatPrice = (price: number) => {
    if (!price) return "0";
    if (price >= 1000) {
      return new Intl.NumberFormat('vi-VN').format(price);
    }
    return price.toFixed(2);
  };

  const priceDisplay = product?.price 
    ? (product.price >= 1000 ? `${formatPrice(product.price)}đ` : `$${formatPrice(product.price)}`)
    : "$0.00";

  const oldPriceDisplay = product?.oldPrice 
    ? (product.oldPrice >= 1000 ? `${formatPrice(product.oldPrice)}đ` : `$${formatPrice(product.oldPrice)}`)
    : null;

  return (
    <div className={`card-product ${styleClass} ${product?.isOutofSale ? "out-of-stock" : ""}`}>
      <div className="card-product-wrapper">
        <Link to={`/product-detail/${product?.id}`} className="product-img">
          <img
            className="img-product lazyload"
            alt={product?.name || product?.title || "Product"}
            src={currentImage}
            width={684}
            height={972}
          />
          {(product?.imgHover || product?.primary_image) && (
            <img
              className="img-hover lazyload"
              data-src={formatImageUrl(product?.imgHover || product?.primary_image)}
              alt={product?.name || product?.title || "Product"}
              src={formatImageUrl(product?.imgHover || product?.primary_image)}
              width={684}
              height={972}
            />
          )}
        </Link>
        {!product?.isOutofSale && (
          <ul className={`list-product-btn tooltip-${tooltipDirection}`}>
        `  <li>
            <a
              href="#shoppingCart"
              onClick={async (e) => {
                e.preventDefault();                     // 👈 tránh nhảy hash
                await addProductToCart(product.id, 1);  // 👈 gọi BE với productId
              }}
              data-bs-toggle="offcanvas"
              className={`box-icon hover-tooltip tooltip-${tooltipDirection}`}
            >
              <span className="icon icon-cart2" />
              <span className="tooltip">
                {isAddedToCartProducts(product.id) ? "Already Added" : "Add to Cart"}
              </span>
            </a>
          </li>`

            <li
              className={`wishlist ${
                isAddedtoWishlist(product?.id) ? "addwishlist" : ""
              }`}
            >
              <a
                onClick={() => addToWishlist(product?.id)}
                className={`box-icon hover-tooltip tooltip-${tooltipDirection}`}
              >
                <span
                  className={`icon ${
                    isAddedtoWishlist(product?.id) ? "icon-trash" : "icon-heart2"
                  } `}
                />
                <span className="tooltip">
                  {isAddedtoWishlist(product?.id)
                    ? "Remove Wishlist"
                    : "Add to Wishlist"}
                </span>
              </a>
            </li>
            <li>
              <a
                href="#quickView"
                data-bs-toggle="modal"
                onClick={() => setQuickViewItem(product)}
                className={`box-icon quickview hover-tooltip tooltip-${tooltipDirection}`}
              >
                <span className="icon icon-view" />
                <span className="tooltip">Quick View</span>
              </a>
            </li>
            <li className="compare">
              <a
                href="#compare"
                data-bs-toggle="modal"
                onClick={() => addToCompareItem(product?.id)}
                aria-controls="compare"
                className={`box-icon hover-tooltip tooltip-${tooltipDirection}`}
              >
                <span className="icon icon-compare" />
                <span className="tooltip">
                  {isAddedtoCompareItem(product?.id)
                    ? "Already compared"
                    : "Add to Compare"}
                </span>
              </a>
            </li>
          </ul>
        )}
        {product?.sizes && product.sizes.length > 0 && (
          <ul className="size-box">
            {product.sizes.slice(0, 4).map((size: any, index: number) => (
              <li key={index} className="size-item text-xs text-white">
                {typeof size === 'string' ? size : size.value || size}
              </li>
            ))}
          </ul>
        )}
        {product?.countdownTimer && (
          <div className="countdown-box">
            <span className="js-countdown">
              <CountdownTimer style={1} />
            </span>
          </div>
        )}
        {(product?.isSale || product?.discountPercent || product?.isNew || product?.isFeatured) && (
          <div className="on-sale-wrap flex-column">
            {product?.isNew && (
              <span className="on-sale-item new">New</span>
            )}
            {product?.isFeatured && (
              <span className="on-sale-item featured">Featured</span>
            )}
            {product?.isSale && (
              <span className="on-sale-item sale">Sale</span>
            )}
            {product?.discountPercent && product.discountPercent > 0 && (
              <span className="on-sale-item">{product.discountPercent}% Off</span>
            )}
          </div>
        )}
      </div>
      <div className={`card-product-info ${textCenter ? "text-center" : ""}`}>
        <Link
          to={`/product-detail/${product?.id}`}
          className="name-product link fw-medium text-md"
        >
          {product?.name || product?.title || "Product"}
        </Link>
        <p className="price-wrap fw-medium">
          <span
            className={`price-new ${product?.oldPrice ? "text-primary" : ""}`}
          >
            {priceDisplay}
          </span>{" "}
          {oldPriceDisplay && (
            <span className="price-old">{oldPriceDisplay}</span>
          )}
        </p>
        {product?.colors && product.colors.length > 0 && (
          <ul className="list-color-product">
            {product.colors.slice(0, 6).map((color: any, index: number) => {
              const colorImg = formatImageUrl(color?.img || color?.image_url || currentImage);
              const colorLabel = color?.label || (typeof color === 'string' ? color : color.value || `Color ${index + 1}`);
              const colorValue = color?.value || (typeof color === 'string' ? `bg-${color.toLowerCase()}` : `bg-default`);
              
              return (
                <li
                  className={`list-color-item color-swatch hover-tooltip tooltip-bot ${
                    currentImage == colorImg ? "active" : ""
                  } ${colorValue == "bg-white" ? "line" : ""}`}
                  key={index}
                  onMouseOver={() => setCurrentImage(colorImg)}
                >
                  <span className="tooltip color-filter">{colorLabel}</span>
                  <span className={`swatch-value ${colorValue}`} />
                  <img
                    className="lazyload"
                    data-src={colorImg}
                    alt="image-product"
                    src={colorImg}
                    width={684}
                    height={972}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

