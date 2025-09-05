import { useRef } from "react";
import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";

export default function ShopHeader() {
    const phoneRef = useRef<HTMLAnchorElement>(null);

    return (
        <header className="w-full text-black bg-white">
            {/* Top row */}
            <div className="flex items-center gap-6 px-6 py-3">
                {/* Brand / Shop name */}
                <div className="flex-1">
                    <Link to="/" className="inline-block">
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                            FASHION SHOP
                        </h1>
                    </Link>
                </div>

                {/* Search */}
                <div className="flex-[1.6] max-w-[720px]">
                    <SearchBar />
                </div>

                {/* Right options */}
                <div className="flex-1 hidden md:flex items-center justify-end gap-6 text-lg font-semibold">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 hover:text-rose-600"
                    >
                        <i className="fa-regular fa-user" />
                        <span>Login</span>
                    </Link>

                    <button className="inline-flex items-center gap-2 hover:text-rose-600">
                        <i className="fa-regular fa-heart" />
                        <span>Wishlist</span>
                    </button>

                    <button className="inline-flex items-center gap-2 hover:text-rose-600">
                        <i className="fa-solid fa-cart-shopping" />
                        <span>$0.00</span>
                    </button>
                </div>
            </div>

            <hr className="border-none h-px bg-neutral-200" />

            {/* Bottom row */}
            <div className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-6">
                    <button className="inline-flex items-center gap-2 text-base md:text-xl font-semibold">
                        <i className="fa-solid fa-bars" />
                        <span className="hidden sm:inline">BROWSE CATEGORIES</span>
                    </button>

                    <span className="hidden md:inline-block w-px h-6 bg-neutral-200" />

                    <nav className="hidden md:flex items-center gap-8 lg:gap-10 text-sm lg:text-lg font-medium">
                        <Link to="/" className="inline-flex items-center gap-1 hover:text-rose-600">
                            <span>HOME</span>
                            <i className="fa-solid fa-angle-down text-xs" />
                        </Link>
                        <Link to="#" className="inline-flex items-center gap-1 hover:text-rose-600">
                            <span>SHOP</span>
                            <i className="fa-solid fa-angle-down text-xs" />
                        </Link>
                        <Link to="#" className="inline-flex items-center gap-1 hover:text-rose-600">
                            <span>PRODUCTS</span>
                            <i className="fa-solid fa-angle-down text-xs" />
                        </Link>
                        <Link to="#" className="inline-flex items-center gap-1 hover:text-rose-600">
                            <span>PAGES</span>
                            <i className="fa-solid fa-angle-down text-xs" />
                        </Link>
                        <Link to="#" className="hover:text-rose-600">BUY THEMES</Link>
                    </nav>
                </div>

                <a
                    ref={phoneRef}
                    href="tel:+84912345678"
                    className="inline-flex items-center gap-3 text-base md:text-lg font-bold"
                >
          <span className="rounded-full bg-rose-600 p-3 text-white">
            <i className="fa-regular fa-headphones" />
          </span>
                    <span className="hidden sm:inline">+84 912 345 678</span>
                </a>
            </div>

            <hr className="border-none h-px bg-neutral-200" />
        </header>
    );
}
