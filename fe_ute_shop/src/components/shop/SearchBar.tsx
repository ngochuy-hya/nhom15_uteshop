import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client";
import type { Product } from "../../types/shop";

export default function SearchBar() {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<Product[]>([]);
    const boxRef = useRef<HTMLDivElement>(null);
    const timer = useRef<number | null>(null);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (!boxRef.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, []);

    // Gọi API tìm kiếm (debounce 300ms)
    useEffect(() => {
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(async () => {
            if (!q.trim()) {
                setData([]);
                return;
            }
            try {
                const res = await api.get<Product[]>("/api/search", { params: { q } });
                setData(res.data);
            } catch (err) {
                console.error("Search error:", err);
            }
        }, 300);
    }, [q]);

    return (
        <div ref={boxRef} className="relative w-full">
            {/* Ô search */}
            <div className="flex items-center rounded-full border border-black/20 px-3 md:px-4 py-2 bg-white">
                <input
                    value={q}
                    onChange={(e) => {
                        setQ(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder="Search product"
                    className="w-full outline-none text-sm md:text-base"
                />
                <button
                    type="button"
                    className="ml-2 rounded-full bg-black text-white px-3 md:px-4 py-2 hover:bg-rose-700 transition"
                >
                    <i className="fa-solid fa-magnifying-glass" />
                </button>
            </div>

            {/* Dropdown kết quả */}
            {open && data.length > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[min(680px,95vw)] rounded-2xl bg-neutral-100 shadow-lg p-3 z-20">
                    <ul className="divide-y divide-neutral-200">
                        {data.map((p) => (
                            <li
                                key={p.id}
                                className="py-2 hover:bg-white rounded-lg px-2 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={p.image}
                                        alt={p.name}
                                        className="w-12 h-12 md:w-14 md:h-14 object-contain"
                                    />
                                    <div className="flex-1 text-left">
                                        <div className="font-medium text-sm md:text-base">
                                            {p.name}
                                        </div>
                                        <div className="text-rose-700 font-bold text-sm md:text-base">
                                            ${p.price.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
