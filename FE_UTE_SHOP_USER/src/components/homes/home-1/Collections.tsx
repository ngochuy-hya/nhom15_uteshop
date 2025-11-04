"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import { categories } from "@/data/collections";

// đảm bảo ở chỗ global (ví dụ layout chính) bạn đã có:
// import "swiper/css";
// import "swiper/css/navigation";
// import "swiper/css/pagination";

export default function Collections() {
  return (
    <div className="pt-24">
      <div className="container">
        <Swiper
          dir="ltr"
          className="swiper tf-swiper hover-sw-nav wow fadeInUp"
          modules={[Pagination, Navigation]}
          slidesPerView={1}
          spaceBetween={12}
          speed={800}
          observer={true}
          observeParents={true}
          slidesPerGroup={1}
          navigation={{
            // clickable: true, // ❌ không hợp lệ trong NavigationOptions
            nextEl: ".nav-next-cls",
            prevEl: ".nav-prev-cls",
          }}
          pagination={{
            el: ".sw-pagination-cls",
            clickable: true,
          }}
          breakpoints={{
            575: { slidesPerView: 2, spaceBetween: 12, slidesPerGroup: 2 },
            768: { slidesPerView: 3, spaceBetween: 12, slidesPerGroup: 3 },
            1200: { slidesPerView: 3, spaceBetween: 24, slidesPerGroup: 3 },
          }}
        >
          {categories.map((category, index) => (
            <SwiperSlide className="swiper-slide" key={index}>
              <div className="wg-cls style-abs asp-1 hover-img">
                <Link to={`/shop-default`} className="image img-style d-block">
                  <img
                    src={category.imageSrc}
                    alt=""
                    className="lazyload"
                    width={String(category.width)}
                    height={String(category.height)}
                  />
                </Link>
                <div className="cls-btn text-center">
                  <Link
                    to={`/shop-default`}
                    className="tf-btn btn-cls btn-white hover-dark hover-icon-2"
                  >
                    {category.label}
                    <i className="icon icon-arrow-top-left" />
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          ))}

          {/* pagination bullets target */}
          <div className="d-flex d-xl-none sw-dot-default sw-pagination-cls justify-content-center" />

          {/* navigation buttons target */}
          <div className="d-none d-xl-flex swiper-button-next nav-swiper nav-next-cls" />
          <div className="d-none d-xl-flex swiper-button-prev nav-swiper nav-prev-cls" />
        </Swiper>
      </div>
    </div>
  );
}
