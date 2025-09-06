// src/pages/shop/ShopHomePage.tsx
import ShopHeader from "../../components/shop/ShopHeader";
import HeroSlider from "../../components/shop/HeroSlider";
import CategoryGrid from "../../components/shop/CategoryGrid";
import ProductGrid from "../../components/shop/ProductGrid";
import FeaturedProducts from "../../components/shop/FeaturedProducts";

export default function ShopHomePage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <ShopHeader />

            {/* Hero Slider */}
            <HeroSlider />

            {/* Categories */}
            <CategoryGrid />

            <ProductGrid title="Most Viewed Products" grid="6" query={{ mostViewed: true }} />

            {/* Featured Products (tabs: New/Best/Deals) */}
            <FeaturedProducts />

            {/* Footer đơn giản */}
            <footer className="mt-20 border-t border-neutral-200">
                <div className="px-6 py-10 text-center text-sm text-neutral-600">
                    <p className="font-semibold">FASHION SHOP</p>
                    <p className="mt-1">© {new Date().getFullYear()} All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
