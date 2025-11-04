// Type declarations for external modules
declare module 'drift-zoom' {
  export default class Drift {
    constructor(element: HTMLElement, options?: any);
    destroy(): void;
  }
}

declare module 'photoswipe' {
  export class PhotoSwipeLightbox {
    constructor(options: any);
    init(): void;
    destroy(): void;
  }
}

// declare module '@/data/products' {
//   export const products: any[];
//   // export const allProducts: any[];
// }

declare module '@/data/blogs' {
  export const blogs: any[];
}

declare module '@/data/brands' {
  export const brands: any[];
}

declare module '@/data/collections' {
  export const collections: any[];
}

// declare module '@/data/features' {
//   export const features: any[];
// }

declare module '@/data/filterOptions' {
  export const filterOptions: any;
}

declare module '@/data/menu' {
  export const menu: any[];
}

// declare module '@/data/testimonials' {
//   export const testimonials: any[];
// }

declare module '@/data/heroSlides' {
  export const heroSlides: any[];
}

// Global types
declare global {
  interface Window {
    bootstrap: any;
  }
}

// Allow <model-viewer> custom element
// ✅ Fix TypeScript: support <model-viewer> in TSX
// src/global.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      src?: string;
      alt?: string;
      poster?: string;
      "camera-controls"?: boolean;
      "auto-rotate"?: boolean;
      ar?: boolean;
      reveal?: string;
      // cho phép bất kỳ attr nào khác mà <model-viewer> hỗ trợ
      [key: string]: any;
    };
  }
}




export {};
