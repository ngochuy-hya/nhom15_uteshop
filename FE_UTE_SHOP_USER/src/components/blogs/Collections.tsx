"use client";
import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import { blogCategories } from "@/data/blogs";

// nhớ đã import css Swiper ở đâu đó global:
// import "swiper/css";
// import "swiper/css/navigation";
// import "swiper/css/pagination";

export default function Collections() {
  return (
    <div className="flat-spacing-24 pb-0">
      <div className="container">
        {/* Prev / Next buttons (nếu bạn có style riêng) */}
        <button className="nav-prev-cls">Prev</button>
        <button className="nav-next-cls">Next</button>

        <Swiper
          dir="ltr"
          className="swiper tf-swiper hover-sw-nav wow fadeInUp"
          slidesPerView={2}
          spaceBetween={12}
          speed={800}
          observer={true}
          observeParents={true}
          slidesPerGroup={2}
          // navigation KHÔNG có clickable
          navigation={{
            nextEl: ".nav-next-cls",
            prevEl: ".nav-prev-cls",
          }}
          // pagination có clickable
          pagination={{
            el: ".sw-pagination-cls",
            clickable: true,
          }}
          breakpoints={{
            768: { slidesPerView: 3, spaceBetween: 20, slidesPerGroup: 3 },
            1200: { slidesPerView: 5, spaceBetween: 20, slidesPerGroup: 3 },
          }}
          modules={[Pagination, Navigation]}
        >
          {blogCategories.map((category, index) => (
            <SwiperSlide className="swiper-slide" key={index}>
              <div className="wg-cls style-abs2 hover-img">
                <Link
                  to={`/blog-single/${category.id}`}
                  className="image-wrap relative"
                >
                  <div className="image img-style">
                    <img
                      src={category.imgSrc}
                      alt={category.title || "blog category"}
                      className="lazyload"
                      width={408}
                      height={408}
                    />
                  </div>
                  <div className="cls-btn text-center">
                    <button className="tf-btn btn-white hover-dark">
                      View all
                    </button>
                  </div>
                  <span className="tf-overlay" />
                </Link>

                <div className="cls-content text-center">
                  <Link
                    to={`/blog-single/${category.id}`}
                    className="text-type text-xl-2 fw-medium link"
                  >
                    {category.title}
                  </Link>
                  <span className="count-item body-text-2 text-main">
                    10 posts
                  </span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* pagination bullets target */}
        <div className="d-flex d-xl-none sw-dot-default sw-pagination-category justify-content-center sw-pagination-cls" />
        {/* thêm class sw-pagination-cls để khớp với pagination.el */}
      </div>
    </div>
  );
}
