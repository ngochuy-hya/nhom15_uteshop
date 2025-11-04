// "use client";

// import { useEffect, useRef, useState } from "react";
// import { Navigation, Thumbs } from "swiper/modules";
// import { Swiper, SwiperSlide } from "swiper/react";
// import PhotoSwipeLightbox from "photoswipe/lightbox";
// import Drift from "drift-zoom";
// import type { Swiper as SwiperType } from "swiper";

// const slides = [
//   { id: 1, color: "Black", size: "small", imgSrc: "/images/products/fashion/women-black-1.jpg" },
//   { id: 2, color: "Black", size: "medium", imgSrc: "/images/products/fashion/women-black-2.jpg" },
//   {
//     id: 3,
//     color: "Black",
//     size: "large",
//     imgSrc: "/images/video/thumb-3d.jpg",
//     model: "/images/video/bag-3d.glb",
//   },
//   { id: 4, color: "Black", size: "extra large", imgSrc: "/images/products/fashion/women-black-4.jpg" },
//   { id: 5, color: "Yellow", size: "small", imgSrc: "/images/products/fashion/women-yellow-1.jpg" },
//   { id: 6, color: "Yellow", size: "medium", imgSrc: "/images/products/fashion/women-yellow-2.jpg" },
//   { id: 7, color: "Grey", size: "large", imgSrc: "/images/products/fashion/women-grey-1.jpg" },
//   { id: 8, color: "Grey", size: "extra large", imgSrc: "/images/products/fashion/women-grey-2.jpg" },
// ];

// interface Slider8Props {
//   activeColor?: string;
//   setActiveColor?: (color: string) => void;
//   firstItem?: string;
//   slideItems?: typeof slides;
// }

// export default function Slider8({
//   activeColor = "Black",
//   setActiveColor = () => {},
//   firstItem,
//   slideItems = slides,
// }: Slider8Props) {
//   const items = [...slideItems];
//   items[0].imgSrc = firstItem ?? items[0].imgSrc;

//   // ✅ Type-safe Swiper
//   const [thumbSwiper, setThumbSwiper] = useState<SwiperType | null>(null);
//   const [activeIndex, setActiveIndex] = useState(0);
//   const swiperRef = useRef<SwiperType | null>(null);

//   // === Zoom setup ===
//   useEffect(() => {
//     if (window.innerWidth < 1200) return;
//     const driftAll = document.querySelectorAll(".tf-image-zoom");
//     const pane = document.querySelector(".tf-zoom-main");
//     const driftInstances: Drift[] = [];

//     driftAll.forEach((el) => {
//       driftInstances.push(
//         new Drift(el as HTMLElement, {
//           zoomFactor: 2,
//           paneContainer: pane as HTMLElement,
//           inlinePane: false,
//           handleTouch: false,
//           hoverBoundingBox: true,
//           containInline: true,
//         })
//       );
//     });

//     const zoomElements = document.querySelectorAll(".tf-image-zoom");
//     const handleMouseOver = (e: Event) => {
//       const target = e.target as HTMLElement;
//       target.closest(".section-image-zoom")?.classList.add("zoom-active");
//     };
//     const handleMouseLeave = (e: Event) => {
//       const target = e.target as HTMLElement;
//       target.closest(".section-image-zoom")?.classList.remove("zoom-active");
//     };

//     zoomElements.forEach((el) => {
//       el.addEventListener("mouseover", handleMouseOver);
//       el.addEventListener("mouseleave", handleMouseLeave);
//     });

//     return () => {
//       zoomElements.forEach((el) => {
//         el.removeEventListener("mouseover", handleMouseOver);
//         el.removeEventListener("mouseleave", handleMouseLeave);
//       });
//       driftInstances.forEach((d) => d.destroy());
//     };
//   }, []);

//   // === PhotoSwipe Lightbox ===
//   const lightboxRef = useRef<PhotoSwipeLightbox | null>(null);
//   useEffect(() => {
//     const lightbox = new PhotoSwipeLightbox({
//       gallery: "#gallery-swiper-started",
//       children: ".item",
//       pswpModule: () => import("photoswipe"),
//     });
//     lightbox.init();
//     lightboxRef.current = lightbox;
//     return () => lightbox.destroy();
//   }, []);

//   // === Auto sync color with active slide ===
//   useEffect(() => {
//     if (swiperRef.current && items[activeIndex].color !== activeColor) {
//       const slideIndex = items.findIndex((i) => i.color === activeColor);
//       if (slideIndex >= 0) swiperRef.current.slideTo(slideIndex);
//     }
//   }, [activeColor]);

//   // === Set initial slide ===
//   useEffect(() => {
//     setTimeout(() => {
//       if (swiperRef.current) {
//         const idx = items.findIndex((i) => i.color === activeColor);
//         if (idx >= 0) swiperRef.current.slideTo(idx);
//       }
//     }, 0);
//   }, []);

//   // === Import <model-viewer> once ===
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       import("@google/model-viewer");
//     }
//   }, []);

//   return (
//     <>
//       {/* === Thumbnail Swiper === */}
//       <Swiper
//         dir="ltr"
//         className="swiper tf-product-media-thumbs other-image-zoom"
//         slidesPerView={4}
//         direction="vertical"
//         onSwiper={(swiper) => setThumbSwiper(swiper)}
//         modules={[Thumbs]}
//         spaceBetween={8}
//       >
//         {items.map(({ color, size, imgSrc, model }, i) => (
//           <SwiperSlide
//             key={i}
//             className="swiper-slide stagger-item"
//             data-color={color}
//             data-size={size}
//           >
//             <div className={`item ${model ? "model" : ""}`}>
//               {model && (
//                 <div className="wrap-btn-viewer">
//                   <i className="icon icon-btn3d" />
//                 </div>
//               )}
//               <img
//                 className="lazyload"
//                 data-src={imgSrc}
//                 alt="img-product"
//                 src={imgSrc}
//                 width={828}
//                 height={1241}
//               />
//             </div>
//           </SwiperSlide>
//         ))}
//       </Swiper>

//       {/* === Main Product Viewer Swiper === */}
//       <div className="flat-wrap-media-product">
//         <Swiper
//           modules={[Thumbs, Navigation]}
//           dir="ltr"
//           className="swiper tf-product-media-main"
//           id="gallery-swiper-started"
//           thumbs={{ swiper: thumbSwiper }}
//           navigation={{ prevEl: ".snbp1", nextEl: ".snbn1" }}
//           onSwiper={(swiper) => (swiperRef.current = swiper)}
//           onSlideChange={(swiper) => {
//             setActiveIndex(swiper.activeIndex);
//             setActiveColor(items[swiper.activeIndex]?.color);
//           }}
//         >
//           {items.map((elm, i) => (
//             <SwiperSlide key={i} className="swiper-slide">
//               {elm.model ? (
//                 <div className="tf-model-viewer active" style={{ height: "100%" }}>
//                   <model-viewer
//                     src={elm.model}
//                     alt="3D Model Viewer"
//                     camera-controls
//                     poster={elm.imgSrc}
//                     reveal="auto"
//                     ar
//                     style={{ width: "100%", height: "100%" }}
//                     tabIndex={1} // ✅ fix type error (string → number)
//                   />
//                 </div>
//               ) : (
//                 <a
//                   href={elm.imgSrc}
//                   target="_blank"
//                   className="item"
//                   data-pswp-width="552px"
//                   data-pswp-height="827px"
//                 >
//                   <img
//                     className="tf-image-zoom lazyload"
//                     data-zoom={elm.imgSrc}
//                     data-src={elm.imgSrc}
//                     alt="img-product"
//                     src={elm.imgSrc}
//                     width={828}
//                     height={1241}
//                   />
//                 </a>
//               )}
//             </SwiperSlide>
//           ))}
//         </Swiper>
//         <div className="swiper-button-next nav-swiper thumbs-next snbn1" />
//         <div className="swiper-button-prev nav-swiper thumbs-prev snbp1" />
//       </div>
//     </>
//   );
// }
