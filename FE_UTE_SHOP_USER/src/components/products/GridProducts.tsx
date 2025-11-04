import React from "react";
import ProductCard1 from "../productCards/ProductCard1";

export interface GridProductsProps {
products: any[];
cardStyleClass?: string;
tooltipDirection?: string;
}

export default function GridProducts({
products,
cardStyleClass = "grid style-1",
tooltipDirection = "left",
}: GridProductsProps) {
return (
<>
{products.map((product, i) => (
<ProductCard1 key={i} product={product} styleClass={cardStyleClass} tooltipDirection={tooltipDirection} />
))}
</>
);
}