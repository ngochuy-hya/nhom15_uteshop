"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useContextElement } from "@/context/Context";
import { formatImageUrl } from "@/utlis/image.utils";

type CardProduct = {
  id: number;                // wishlist_item_id (DELETE /wishlist/:id)
  productId: number;         // id sản phẩm (add/check/compare/link)
  title: string;
  slug?: string;
  price: number;
  oldPrice?: number | null;
  imgSrc?: string | null;
  imgHover?: string | null;
  primary_image?: string | null;
  image_url?: string | null;
  saleLabel?: string | null;
  isOutofSale?: boolean;
};

export default function ProductCard12({
  product,
  tooltipDirection = "top",
  textCenter = false,
}: {
  product: CardProduct;
  tooltipDirection?: "top" | "bot" | "left" | "right";
  textCenter?: boolean;
}) {
  const {
    addToWishlist,
    isAddedtoWishlist,
    removeFromWishlist,
    // ✅ khôi phục các hàm này
    addToCompareItem,
    isAddedtoCompareItem,
    removeFromCompareItem,
    setQuickViewItem,
  } = useContextElement();

  // Ảnh chính & ảnh hover (không fallback hover = ảnh chính)
  const primaryImage = useMemo(
    () =>
      formatImageUrl(
        product.imgSrc || product.primary_image || product.image_url || "/images/default-product.png"
      ),
    [product.imgSrc, product.primary_image, product.image_url]
  );
  const hoverImage = useMemo(
    () => (product.imgHover ? formatImageUrl(product.imgHover) : null),
    [product.imgHover]
  );

  // Dùng CSS swap, state chỉ để fallback initial
  const [loadedPrimary, setLoadedPrimary] = useState(primaryImage);
  useEffect(() => setLoadedPrimary(primaryImage), [primaryImage]);

  const inWishlist = isAddedtoWishlist(product.productId);
  const inCompare = isAddedtoCompareItem(product.productId);

  const detailHref = product.slug
    ? `/product/${product.slug}`
    : `/product-detail/${product.productId}`;

  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.currentTarget as HTMLImageElement).src = "/images/default-product.png";
  };

  // Adapter Quick View: Context.Product yêu cầu { id,name,price,quantity }
  const openQuickView = () => {
    setQuickViewItem?.({
      id: product.productId,
      name: product.title,
      price: product.price,
      quantity: 1,
      // tuỳ bạn muốn xem thêm gì trong modal:
      image: primaryImage,
      oldPrice: product.oldPrice ?? undefined,
      slug: product.slug ?? undefined,
      // spread để modal có thêm thuộc tính nếu cần
      ...product,
    });
    // nếu cần mở modal qua data-bs-toggle, bạn đã có href="#quickView" ở nơi khác
  };

  const toggleCompare = () => {
    if (inCompare) {
      removeFromCompareItem?.(product.productId);
    } else {
      addToCompareItem?.(product.productId);
    }
  };

  return (
    <div
      className={`card-product grid file-delete style-wishlist style-3 ${
        product.isOutofSale ? "out-of-stock" : ""
      }`}
    >
      {/* Xoá khỏi wishlist theo wishlist_item_id */}
      <i className="icon icon-close remove" onClick={() => removeFromWishlist(product.id)} />

      <div className="card-product-wrapper">
        {/* 2 ảnh chồng lên, swap bằng CSS */}
        <Link to={detailHref} className="product-img img-swap">
          <img
            className="img-primary"
            alt={product.title}
            src={loadedPrimary}
            width={513}
            height={729}
            onError={onImgError}
          />
          {hoverImage && hoverImage !== primaryImage && (
            <img
              className="img-hover"
              alt={`${product.title} (hover)`}
              src={hoverImage}
              width={513}
              height={729}
              onError={onImgError}
            />
          )}
        </Link>

        {product.saleLabel && (
          <div className="on-sale-wrap">
            <span className="on-sale-item">{product.saleLabel}</span>
          </div>
        )}

        <ul className="list-product-btn">
          {/* Wishlist */}
          <li className={`wishlist ${inWishlist ? "addwishlist" : ""}`}>
            <a
              onClick={() => addToWishlist(product.productId)}
              className={`hover-tooltip tooltip-${tooltipDirection} box-icon`}
            >
              <span className={`icon ${inWishlist ? "icon-trash" : "icon-heart2"}`} />
              <span className="tooltip">
                {inWishlist ? "Remove Wishlist" : "Add to Wishlist"}
              </span>
            </a>
          </li>

          {/* Quick View */}
          <li>
            <a
              href="#quickView"
              data-bs-toggle="modal"
              onClick={openQuickView}
              className={`hover-tooltip tooltip-${tooltipDirection} box-icon quickview`}
            >
              <span className="icon icon-view" />
              <span className="tooltip">Quick View</span>
            </a>
          </li>

          {/* Compare */}
          <li className="compare">
            <a
              href="#compare"
              onClick={toggleCompare}
              data-bs-toggle="modal"
              className={`hover-tooltip tooltip-${tooltipDirection} box-icon`}
            >
              <span className="icon icon-compare" />
              <span className="tooltip">
                {inCompare ? "Already compared" : "Add to Compare"}
              </span>
            </a>
          </li>
        </ul>
      </div>

      <div className={`card-product-info ${textCenter ? "text-center" : ""}`}>
        <Link to={detailHref} className="name-product link fw-medium text-md">
          {product.title}
        </Link>
        <p className="price-wrap fw-medium">
          <span className={`price-new ${product.oldPrice ? "text-primary" : ""}`}>
            {product.price.toLocaleString("vi-VN")}₫
          </span>{" "}
          {product.oldPrice != null && (
            <span className="price-old text-dark">
              {product.oldPrice.toLocaleString("vi-VN")}₫
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
