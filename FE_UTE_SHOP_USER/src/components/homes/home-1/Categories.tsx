"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import { categories2, categories22 } from "@/data/collections";
import { categoryAPI } from "@/config/api";

// đảm bảo ở chỗ global của app bạn đã import css Swiper:
// import "swiper/css";
// import "swiper/css/navigation";
// import "swiper/css/pagination";

interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
  imgSrc?: string;
  title?: string;
}

export default function Categories() {
  const [womenCategories, setWomenCategories] = useState<Category[]>([]);
  const [menCategories, setMenCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryAPI.getCategories();
        if ((response as any)?.success && (response as any)?.data) {
          const categories = (response as any).data.categories || (response as any).data || [];
          
          // Map categories sang format component cần
          const mappedCategories = categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            title: cat.name,
            imgSrc: cat.image || cat.image_url || '/images/category/default-category.jpg',
          }));

          // Phân loại theo gender (giả sử có field gender hoặc name chứa "women"/"men")
          const women = mappedCategories.filter((cat: Category) => 
            cat.name?.toLowerCase().includes('women') || 
            cat.name?.toLowerCase().includes('nữ') ||
            cat.name?.toLowerCase().includes('girl')
          );
          const men = mappedCategories.filter((cat: Category) => 
            cat.name?.toLowerCase().includes('men') || 
            cat.name?.toLowerCase().includes('nam') ||
            cat.name?.toLowerCase().includes('boy')
          );

          // Nếu không tìm thấy phân loại theo gender, chia đôi
          if (women.length === 0 && men.length === 0) {
            const half = Math.ceil(mappedCategories.length / 2);
            setWomenCategories(mappedCategories.slice(0, half));
            setMenCategories(mappedCategories.slice(half));
          } else {
            setWomenCategories(women.length > 0 ? women : mappedCategories.slice(0, Math.ceil(mappedCategories.length / 2)));
            setMenCategories(men.length > 0 ? men : mappedCategories.slice(Math.ceil(mappedCategories.length / 2)));
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback về mock data
        setWomenCategories(categories2 as Category[]);
        setMenCategories(categories22 as Category[]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="flat-spacing-3">
        <div className="container">
          <div className="flat-title">
            <h4 className="title">Categories</h4>
          </div>
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const displayWomenCategories = womenCategories.length > 0 ? womenCategories : (categories2 as Category[]);
  const displayMenCategories = menCategories.length > 0 ? menCategories : (categories22 as Category[]);
  return (
    <section className="flat-spacing-3">
      <div className="container">
        <div className="flat-animate-tab">
          <div className="flat-title-tab-categories wow fadeInUp text-center">
            <h4 className="title">Categories</h4>
            <ul className="menu-tab-line justify-content-center" role="tablist">
              <li className="nav-tab-item" role="presentation">
                <a
                  href="#womens"
                  className="tab-link active"
                  data-bs-toggle="tab"
                >
                  Womens
                </a>
              </li>
              <li className="nav-tab-item" role="presentation">
                <a href="#mens" className="tab-link" data-bs-toggle="tab">
                  Mens
                </a>
              </li>
            </ul>
          </div>

          <div className="tab-content">
            {/* TAB WOMENS */}
            <div className="tab-pane active show" id="womens" role="tabpanel">
              <Swiper
                dir="ltr"
                className="swiper tf-swiper"
                slidesPerView={2}
                spaceBetween={12}
                speed={800}
                observer={true}
                observeParents={true}
                slidesPerGroup={2}
                navigation={{
                  // clickable: true, // ❌ KHÔNG hợp lệ cho NavigationOptions
                  nextEl: ".nav-next-women",
                  prevEl: ".nav-prev-women",
                }}
                pagination={{
                  el: ".sw-pagination-women",
                  clickable: true,
                }}
                breakpoints={{
                  575: {
                    slidesPerView: 3,
                    spaceBetween: 12,
                    slidesPerGroup: 2,
                  },
                  768: {
                    slidesPerView: 4,
                    spaceBetween: 24,
                    slidesPerGroup: 3,
                  },
                  1200: {
                    slidesPerView: 6,
                    spaceBetween: 64,
                    slidesPerGroup: 3,
                  },
                }}
                modules={[Pagination, Navigation]}
              >
                {displayWomenCategories.map((item, index) => (
                  <SwiperSlide className="swiper-slide" key={item.id || index}>
                    <div className="wg-cls style-circle hover-img">
                      <Link
                        to={`/shop-default?category=${item.slug || item.id}`}
                        className="image img-style d-block"
                      >
                        <img
                          src={item.imgSrc || '/images/category/default-category.jpg'}
                          alt={item.name || item.title || 'category'}
                          className="lazyload"
                          width="300"
                          height="300"
                        />
                      </Link>
                      <div className="cls-content text-center">
                        <Link
                          to={`/shop-default?category=${item.slug || item.id}`}
                          className="link text-md fw-medium"
                        >
                          {item.name || item.title}
                        </Link>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}

                {/* pagination bullets container */}
                <span className="d-flex d-xl-none sw-dot-default sw-pagination-women justify-content-center" />

                {/* nếu bạn có nút prev/next custom thì đảm bảo HTML tồn tại đâu đó với class nav-prev-women / nav-next-women */}
              </Swiper>
            </div>

            {/* TAB MENS */}
            <div className="tab-pane" id="mens" role="tabpanel">
              <Swiper
                dir="ltr"
                className="swiper tf-swiper"
                slidesPerView={2}
                spaceBetween={12}
                speed={800}
                observer={true}
                observeParents={true}
                slidesPerGroup={2}
                navigation={{
                  // clickable: true, // ❌ bỏ
                  nextEl: ".nav-next-women",
                  prevEl: ".nav-prev-women",
                }}
                pagination={{
                  el: ".sw-pagination-women",
                  clickable: true,
                }}
                breakpoints={{
                  575: {
                    slidesPerView: 3,
                    spaceBetween: 12,
                    slidesPerGroup: 2,
                  },
                  768: {
                    slidesPerView: 4,
                    spaceBetween: 24,
                    slidesPerGroup: 3,
                  },
                  1200: {
                    slidesPerView: 6,
                    spaceBetween: 64,
                    slidesPerGroup: 3,
                  },
                }}
                modules={[Pagination, Navigation]}
              >
                {displayMenCategories.map((item, index) => (
                  <SwiperSlide className="swiper-slide" key={item.id || index}>
                    <div className="wg-cls style-circle hover-img">
                      <Link
                        to={`/shop-default?category=${item.slug || item.id}`}
                        className="image img-style d-block"
                      >
                        <img
                          src={item.imgSrc || '/images/category/default-category.jpg'}
                          alt={item.name || item.title || 'category'}
                          className="lazyload"
                          width="300"
                          height="300"
                        />
                      </Link>
                      <div className="cls-content text-center">
                        <Link
                          to={`/shop-default?category=${item.slug || item.id}`}
                          className="link text-md fw-medium"
                        >
                          {item.name || item.title}
                        </Link>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}

                <span className="d-flex d-xl-none sw-dot-default sw-pagination-women justify-content-center" />
              </Swiper>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
