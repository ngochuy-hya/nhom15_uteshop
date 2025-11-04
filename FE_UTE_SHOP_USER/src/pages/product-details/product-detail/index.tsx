// src/pages/product/ProductDetailPage.tsx
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Breadcumb from "@/components/productDetails/Breadcumb";
import Description1 from "@/components/productDetails/Description1";
import Details1 from "@/components/productDetails/Details1";
import RecentlyViewedProducts from "@/components/productDetails/RecentlyViewedProducts";
import RecommendedProdtcts from "@/components/productDetails/RecommendedProdtcts";
import { allProducts } from "@/data/products";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import MetaComponent from "@/components/common/MetaComponent";
// ❗ Sửa import: dùng service thay vì config/api
import { productAPI } from "@/services/product/product.service";
import type { ProductDetail } from "@/types/products/product.types";

const metadata = {
  title: "Product Details || Vineta - Multipurpose Reactjs eCommerce Template",
  description: "Vineta - Multipurpose Reactjs eCommerce Template",
};

export default function ProductDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getProduct(id);

        if (response.success && response.data) {
          setProduct(response.data);
        } else {
          const staticProduct =
            allProducts.find((p: any) => p.id == id) || allProducts[0];
          setProduct(staticProduct as unknown as ProductDetail);
        }
      } catch (err: any) {
        console.error("Error fetching product:", err);
        setError(err?.message ?? "Unknown error");
        const staticProduct =
          allProducts.find((p: any) => p.id == id) || allProducts[0];
        setProduct(staticProduct as unknown as ProductDetail);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <>
        <MetaComponent meta={metadata} />
        <Header1 />
        <div className="container py-5">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Đang tải thông tin sản phẩm...</p>
          </div>
        </div>
        <Footer1 paddingBottom />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <MetaComponent meta={metadata} />
        <Header1 />
        <div className="container py-5">
          <div className="alert alert-danger">Không tìm thấy sản phẩm</div>
        </div>
        <Footer1 paddingBottom />
      </>
    );
  }

  return (
    <>
      <MetaComponent meta={metadata} />
      <Header1 />
      <Breadcumb product={product} />
      <Details1 product={product} />
      {/* ❗ Truyền product cho Description1 */}
      <Description1 product={product} />
      {/* ❗ Truyền productId để lấy related từ API (nếu component đã hỗ trợ) */}
      {/* <RecentlyViewedProducts /> */}
      <Footer1 paddingBottom />
    </>
  );
}
