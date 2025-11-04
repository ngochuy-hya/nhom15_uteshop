"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import Drift from "drift-zoom";
import type { Swiper as SwiperType } from "swiper";

const defaultSlides = [
  { id: 1, color: "Black", size: "small", imgSrc: "/images/products/fashion/women-black-1.jpg" },
  { id: 2, color: "Black", size: "medium", imgSrc: "/images/products/fashion/women-black-2.jpg" },
  { id: 3, color: "Black", size: "large", imgSrc: "/images/products/fashion/women-black-3.jpg" },
  { id: 4, color: "Black", size: "extra large", imgSrc: "/images/products/fashion/women-black-4.jpg" },
  { id: 5, color: "Yellow", size: "small", imgSrc: "/images/products/fashion/women-yellow-1.jpg" },
  { id: 6, color: "Yellow", size: "medium", imgSrc: "/images/products/fashion/women-yellow-2.jpg" },
  { id: 7, color: "Grey", size: "large", imgSrc: "/images/products/fashion/women-grey-1.jpg" },
  { id: 8, color: "Grey", size: "extra large", imgSrc: "/images/products/fashion/women-grey-2.jpg" },
];

interface Slider1Props {
  activeColor?: string;
  setActiveColor?: (color: string) => void;
  firstItem?: string;
  slideItems?: typeof defaultSlides;
}

export default function Slider1({
  activeColor = "Black",
  setActiveColor = () => {},
  firstItem,
  slideItems = defaultSlides,
}: Slider1Props) {
  const [items, setItems] = useState(() => {
    const copy = [...(slideItems ?? defaultSlides)];
    if (firstItem && copy.length > 0) copy[0] = { ...copy[0], imgSrc: firstItem };
    return copy;
  });

  const [thumbSwiper, setThumbSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const mainSwiperRef = useRef<SwiperType | null>(null);
  const lightboxRef = useRef<PhotoSwipeLightbox | null>(null);

  // === Drift Zoom ===
  useEffect(() => {
    if (window.innerWidth < 1200) return;

    const driftAll = document.querySelectorAll(".tf-image-zoom");
    const pane = document.querySelector(".tf-zoom-main");
    driftAll.forEach((el) => {
      new Drift(el as HTMLElement, {
        zoomFactor: 2,
        paneContainer: pane as HTMLElement,
        inlinePane: false,
        handleTouch: false,
        hoverBoundingBox: true,
        containInline: true,
      });
    });

    const handleMouseOver = (e: Event) => {
      const parent = (e.target as HTMLElement).closest(".section-image-zoom");
      parent?.classList.add("zoom-active");
    };
    const handleMouseLeave = (e: Event) => {
      const parent = (e.target as HTMLElement).closest(".section-image-zoom");
      parent?.classList.remove("zoom-active");
    };

    driftAll.forEach((el) => {
      el.addEventListener("mouseover", handleMouseOver);
      el.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      driftAll.forEach((el) => {
        el.removeEventListener("mouseover", handleMouseOver);
        el.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, [items]);

  // === PhotoSwipe Lightbox ===
  useEffect(() => {
    const lightbox = new PhotoSwipeLightbox({
      gallery: "#gallery-swiper-started",
      children: ".item",
      pswpModule: () => import("photoswipe"),
    });
    lightbox.init();
    lightboxRef.current = lightbox;
    return () => lightbox.destroy();
  }, []);

  // === Sync active color with swiper ===
  useEffect(() => {
    if (!mainSwiperRef.current) return;
    const targetIndex = items.findIndex((item) => item.color === activeColor);
    if (targetIndex >= 0 && targetIndex !== activeIndex) {
      mainSwiperRef.current.slideTo(targetIndex);
      setActiveIndex(targetIndex);
    }
  }, [activeColor, items]);

  useEffect(() => {
  if (!slideItems) return;
  const copy = [...slideItems].map(item => ({ ...item })); // copy an toàn
  if (firstItem && copy.length > 0) copy[0] = { ...copy[0], imgSrc: firstItem };
  setItems(copy);
}, [slideItems, firstItem]);

  return (
    <>
      {/* Thumbnails
      <Swiper
        dir="ltr"
        slidesPerView={4}
        direction="vertical"
        spaceBetween={8}
        onSwiper={setThumbSwiper}
        modules={[Thumbs]}
        className="swiper tf-product-media-thumbs other-image-zoom"
      >
        console.log("Items array trước khi render:", items);

      {items.map(({ color, size, imgSrc }, idx) => {
        console.log("Thumbnail image src:", imgSrc); // <-- log ảnh nhỏ
        return (
          <SwiperSlide key={idx} data-color={color} data-size={size}>
            <div className="item">
              <img
                className="lazyload"
                data-src={imgSrc}
                src={imgSrc}
                alt={`product-${idx}`}
                width={828}
                height={1241}
              />
            </div>
          </SwiperSlide>
        );
      })}

      </Swiper> */}

      {/* Main Gallery */}
      <div className="flat-wrap-media-product">
        <Swiper
          dir="ltr"
          id="gallery-swiper-started"
          modules={[Thumbs, Navigation]}
          thumbs={{ swiper: thumbSwiper }}
          navigation={{
            prevEl: ".snbp1",
            nextEl: ".snbn1",
          }}
          onSwiper={(swiper) => (mainSwiperRef.current = swiper)}
          onSlideChange={(swiper) => {
            const idx = swiper.activeIndex;
            setActiveIndex(idx);
            setActiveColor(items[idx].color);
          }}
          className="swiper tf-product-media-main"
        >
          {items.map((item, idx) => (
        
            <SwiperSlide key={idx} data-color={item.color} data-size={item.size}>
              <a
                href={item.imgSrc}
                target="_blank"
                className="item"
                data-pswp-width="552px"
                data-pswp-height="827px"
              >
                <img
                  className="tf-image-zoom lazyload"
                  data-src={item.imgSrc}
                  data-zoom={item.imgSrc}
                  src={item.imgSrc}
                  alt={`product-${idx}`}
                  width={828}
                  height={1241}
                />
              </a>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="swiper-button-next nav-swiper thumbs-next snbn1" />
        <div className="swiper-button-prev nav-swiper thumbs-prev snbp1" />
      </div>
    </>
  );
}
