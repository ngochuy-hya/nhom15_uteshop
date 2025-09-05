import type { Product } from "../../types/shop";

type Props = {
    p: Product;
    onAddToCart?: (p: Product) => void;
    onView?: (p: Product) => void;
    onWish?: (p: Product) => void;
    onCompare?: (p: Product) => void;
    /** Điều chỉnh kích thước hình ảnh: "normal" mặc định, "large" để cao hơn */
    imageSize?: "normal" | "large";
};

export default function ProductCard({
                                        p,
                                        onAddToCart,
                                        onView,
                                        onWish,
                                        onCompare,
                                        imageSize = "normal",
                                    }: Props) {
    // Kích thước HỘP ẢNH (wrapper)
    const imgBoxClass =
        imageSize === "large"
            ? "w-[95%] h-[22rem] md:h-[24rem] lg:h-[26rem]"
            : "w-4/5 h-80";

    return (
        <div className="group relative bg-white rounded-2xl shadow hover:shadow-xl transition p-4">
            {/* Image + hover actions */}
            <div className="text-center flex justify-center">
                {/* Wrapper ảnh: relative để icon/label bám vào, overflow-hidden để icon không tràn */}
                <div className={`relative ${imgBoxClass} overflow-hidden rounded-md`}>
                    {/* Badge giảm giá nằm trong ảnh */}
                    {!!p.discountPercent && (
                        <span className="absolute left-2 top-2 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded">
              {p.discountPercent}% Off
            </span>
                    )}

                    <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                    />

                    {/* Overlay mờ đáy ảnh cho icon dễ nhìn (tùy chọn) */}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/10 to-transparent pointer-events-none z-0" />

                    {/* Floating actions: tuyệt đối bên trong ảnh */}
                    <div
                        className="
              pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-6 md:bottom-8 z-10
              flex gap-3 opacity-0 translate-y-2
              group-hover:opacity-100 group-hover:translate-y-0
              transition
            "
                    >
                        <IconBtn
                            label="Wishlist"
                            onClick={() => onWish?.(p)}
                            iconClass="fa-regular fa-heart"
                        />
                        <IconBtn
                            label="Quick view"
                            onClick={() => onView?.(p)}
                            iconClass="fa-regular fa-eye"
                        />
                        <IconBtn
                            label="Compare"
                            onClick={() => onCompare?.(p)}
                            iconClass="fa-solid fa-code-compare"
                        />
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="pt-4 text-center">
                <div className="font-semibold text-lg line-clamp-1">{p.name}</div>

                <div className="flex items-center justify-center gap-3 mt-2">
          <span className="text-rose-700 font-bold text-xl">
            ${p.price.toFixed(2)}
          </span>
                    {typeof p.priceOld === "number" && (
                        <span className="text-neutral-400 line-through">
              ${p.priceOld.toFixed(2)}
            </span>
                    )}
                </div>

                <button
                    onClick={() => onAddToCart?.(p)}
                    className="mt-5 w-full rounded-full !bg-red-800 text-white py-4 text-lg font-bold transition-transform duration-200 hover:!bg-red-600 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                    Add to Cart
                </button>
            </div>
        </div>
    );
}

/** Small round icon button used in hover actions */
function IconBtn({
                     iconClass,
                     label,
                     onClick,
                 }: {
    iconClass: string;
    label: string;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className="
        pointer-events-auto w-12 h-12 rounded-full bg-white
        flex items-center justify-center shadow-md
        transition transform hover:-translate-y-1 hover:scale-110
        hover:bg-rose-100
        focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400
      "
            title={label}
        >
            <i className={`${iconClass} text-2xl text-gray-700`} />
        </button>
    );
}
