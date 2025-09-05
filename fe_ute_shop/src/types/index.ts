export type Slide = {
    id: number;
    title: React.ReactNode;
    desc: string;
    img: string;
    cta: string;
};


export type Category = {
    id: number;
    name: string;
    items: number;
    img: string;
};


export type Product = {
    id: number;
    name: string;
    priceNew: number;
    priceOld: number;
    img: string;
    discount?: number;
};