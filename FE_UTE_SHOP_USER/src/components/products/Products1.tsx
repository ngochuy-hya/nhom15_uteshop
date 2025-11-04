"use client";

import ListProducts from "./ListProducts";
import GridProducts from "./GridProducts";
import FilterModal from "./FilterModal";
import LayoutHandler from "./LayoutHandler";
import { useEffect, useReducer, useState } from "react";
import { initialState, reducer, RawProduct } from "@/reducer/filterReducer";
import { products } from "@/data/products";
import { productAPI } from "@/config/api";
import { formatImageUrl } from "@/utlis/image.utils";

interface Products1Props {
  fullWidth?: boolean;
  cardStyleClass?: string;
  tooltipDirection?: string;
  parentClass?: string;
}

// kiểu phản hồi API giả định
interface ProductApiResponse {
  success: boolean;
  data?: {
    products?: RawProduct[];
    [key: string]: any;
  };
  [key: string]: any;
}

export default function Products1({
  fullWidth = false,
  cardStyleClass,
  tooltipDirection,
  parentClass = "flat-spacing-24",
}: Products1Props) {
  const [activeLayout, setActiveLayout] = useState<number>(4);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [apiProducts, setApiProducts] = useState<RawProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const {
    price,
    availability,
    color,
    size,
    brands,

    filtered,
    sortingOption,
    sorted,

    currentPage,
    itemPerPage,
  } = state;

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = (await productAPI.getProducts({
          limit: 100,
          is_active: true,
        })) as ProductApiResponse;

        if (
          response &&
          response.success &&
          response.data &&
          Array.isArray(response.data.products)
        ) {
          // Format image URLs trong products
          const formattedProducts = response.data.products.map((product: any) => ({
            ...product,
            imgSrc: formatImageUrl(product.primary_image || product.image_url),
            imgHover: formatImageUrl(product.primary_image || product.image_url),
            primary_image: formatImageUrl(product.primary_image || product.image_url),
          }));
          setApiProducts(formattedProducts);
        } else {
          // fallback nếu API không trả đúng
          setApiProducts(products as RawProduct[]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        // fallback static data
        setApiProducts(products as RawProduct[]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Use API products or fallback to static
  const productList: RawProduct[] =
    apiProducts.length > 0 ? apiProducts : (products as RawProduct[]);

  const allProps = {
    ...state,

    setPrice: (value: [number, number]) =>
      dispatch({ type: "SET_PRICE", payload: value }),

    setColor: (value: string) => {
      value === color
        ? dispatch({ type: "SET_COLOR", payload: "All" })
        : dispatch({ type: "SET_COLOR", payload: value });
    },

    setSize: (value: string) => {
      value === size
        ? dispatch({ type: "SET_SIZE", payload: "All" })
        : dispatch({ type: "SET_SIZE", payload: value });
    },

    setAvailability: (value: string) => {
      dispatch({ type: "SET_AVAILABILITY", payload: value });
    },

    setBrands: (newBrand: string) => {
      dispatch({ type: "SET_BRANDS", payload: newBrand });
    },

    // brands trong state là string, không phải array => sửa lại logic removeBrand
    removeBrand: (brandToRemove: string) => {
      // nếu brand hiện tại chính là brand cần xóa -> reset về "All"
      if (brands === brandToRemove) {
        dispatch({ type: "SET_BRANDS", payload: "All" });
      }
    },

    setSortingOption: (value: string) =>
      dispatch({ type: "SET_SORTING_OPTION", payload: value }),

    setCurrentPage: (value: number) =>
      dispatch({ type: "SET_CURRENT_PAGE", payload: value }),

    setItemPerPage: (value: number) => {
      dispatch({ type: "SET_CURRENT_PAGE", payload: 1 });
      dispatch({ type: "SET_ITEM_PER_PAGE", payload: value });
    },

    clearFilter: () => {
      dispatch({ type: "CLEAR_FILTER" });
    },
  };

  // Filter logic
  useEffect(() => {
    let filteredArrays: RawProduct[][] = [];

    if (brands !== "All") {
      const filteredByBrands = [...productList].filter((elm) =>
        elm.filterBrands?.includes(brands)
      );
      filteredArrays = [...filteredArrays, filteredByBrands];
    }

    if (availability !== "All") {
      const filteredByAvailability = [...productList].filter(
        (elm) => availability === (elm as any).inStock
      );
      filteredArrays = [...filteredArrays, filteredByAvailability];
    }

    if (color !== "All") {
      const filteredByColor = [...productList].filter((elm) =>
        (elm as any).filterColor?.includes(color)
      );
      filteredArrays = [...filteredArrays, filteredByColor];
    }

    if (size !== "All" && size !== "Free Size") {
      const filteredBySize = [...productList].filter((elm) =>
        elm.filterSizes?.includes(size)
      );
      filteredArrays = [...filteredArrays, filteredBySize];
    }

    const filteredByPrice = [...productList].filter(
      (elm) => elm.price >= price[0] && elm.price <= price[1]
    );
    filteredArrays = [...filteredArrays, filteredByPrice];

    // giao nhau tất cả mảng filter
    const commonItems = [...productList].filter((item) =>
      filteredArrays.every((array) => array.includes(item))
    );

    dispatch({ type: "SET_FILTERED", payload: commonItems });
  }, [price, availability, color, size, brands, productList]);

  // Sorting logic
  useEffect(() => {
    if (sortingOption === "Price Ascending") {
      dispatch({
        type: "SET_SORTED",
        payload: [...filtered].sort((a, b) => a.price - b.price),
      });
    } else if (sortingOption === "Price Descending") {
      dispatch({
        type: "SET_SORTED",
        payload: [...filtered].sort((a, b) => b.price - a.price),
      });
    } else if (sortingOption === "Title Ascending") {
      dispatch({
        type: "SET_SORTED",
        payload: [...filtered].sort((a, b) =>
          String(a.title ?? "").localeCompare(String(b.title ?? ""))
        ),
      });
    } else if (sortingOption === "Title Descending") {
      dispatch({
        type: "SET_SORTED",
        payload: [...filtered].sort((a, b) =>
          String(b.title ?? "").localeCompare(String(a.title ?? ""))
        ),
      });
    } else {
      dispatch({ type: "SET_SORTED", payload: filtered });
    }

    dispatch({ type: "SET_CURRENT_PAGE", payload: 1 });
  }, [filtered, sortingOption]);

  return (
    <>
      <section className={parentClass}>
        <div className={fullWidth ? "container-full" : "container"}>
          <div className="tf-shop-control">
            <div className="tf-group-filter">
              <a
                href="#filterShop"
                data-bs-toggle="offcanvas"
                aria-controls="filterShop"
                className="tf-btn-filter"
              >
                <span className="icon icon-filter" />
                <span className="text">Filter</span>
              </a>
              <div className="tf-dropdown-sort" data-bs-toggle="dropdown">
                <div className="btn-select">
                  <span className="text-sort-value">{sortingOption}</span>
                  <span className="icon icon-arr-down" />
                </div>
                <div className="dropdown-menu">
                  {[
                    "Sort by (Default)",
                    "Title Ascending",
                    "Title Descending",
                    "Price Ascending",
                    "Price Descending",
                  ].map((elm, i) => (
                    <div
                      key={i}
                      className={`select-item ${
                        sortingOption == elm ? "active" : ""
                      }`}
                      onClick={() => allProps.setSortingOption(elm)}
                      data-sort-value="best-selling"
                    >
                      <span className="text-value-item">{elm}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <ul className="tf-control-layout">
              <LayoutHandler
                setActiveLayout={setActiveLayout}
                activeLayout={activeLayout}
              />
            </ul>
          </div>

          <div className="wrapper-control-shop">
            {(availability != "All" ||
              brands != "All" ||
              price.join("-") != [20, 300].join("-") ||
              color != "All" ||
              size != "All") && (
              <div className="meta-filter-shop" style={{}}>
                <div id="product-count-grid" className="count-text">
                  <span className="count">{sorted.length}</span>
                  Product
                  {sorted.length > 1 ? "s" : ""} found
                </div>

                <div id="applied-filters">
                  {availability != "All" ? (
                    <span
                      className="filter-tag"
                      onClick={() => allProps.setAvailability("All")}
                    >
                      <span className="remove-tag icon-close"></span>{" "}
                      Availability: {availability ? "In Stock" : "Unavailable"}
                    </span>
                  ) : (
                    ""
                  )}

                  {brands != "All" ? (
                    <span
                      className="filter-tag"
                      onClick={() => allProps.setBrands("All")}
                    >
                      <span
                        className="remove-tag icon-close"
                        data-filter="brand"
                      />
                      Brand: {brands}
                    </span>
                  ) : (
                    ""
                  )}

                  {price.join("-") != [20, 300].join("-") ? (
                    <span
                      className="filter-tag"
                      onClick={() => allProps.setPrice([20, 300])}
                    >
                      <span
                        className="remove-tag icon-close"
                        data-filter="price"
                      />
                      Price: ${price[0]} - ${price[1]}
                    </span>
                  ) : (
                    ""
                  )}

                  {color != "All" ? (
                    <span
                      className="filter-tag"
                      onClick={() => allProps.setColor("All")}
                    >
                      <span
                        className="remove-tag icon-close"
                        data-filter="color"
                      />
                      Color: {color}
                    </span>
                  ) : (
                    ""
                  )}

                  {size != "All" ? (
                    <span
                      className="filter-tag"
                      onClick={() => allProps.setSize("All")}
                    >
                      <span
                        className="remove-tag icon-close"
                        data-filter="size"
                      />
                      Size: {size}
                    </span>
                  ) : (
                    ""
                  )}
                </div>

                {availability != "All" ||
                brands != "All" ||
                price.join("-") != [20, 300].join("-") ||
                color != "All" ||
                size != "All" ? (
                  <button
                    id="remove-all"
                    className="remove-all-filters"
                    onClick={allProps.clearFilter}
                  >
                    <i className="icon icon-close" /> Clear all filter
                  </button>
                ) : (
                  ""
                )}
              </div>
            )}

            {activeLayout == 1 ? (
              <div className="tf-list-layout wrapper-shop" id="listLayout">
                <ListProducts products={sorted} />
                <ul className="wg-pagination">
                  <li className="active">
                    <div className="pagination-item">1</div>
                  </li>
                  <li>
                    <a href="#" className="pagination-item">
                      2
                    </a>
                  </li>
                  <li>
                    <a href="#" className="pagination-item">
                      3
                    </a>
                  </li>
                  <li>
                    <a href="#" className="pagination-item">
                      <i className="icon-arr-right2" />
                    </a>
                  </li>
                </ul>
              </div>
            ) : (
              <div
                className={`wrapper-shop tf-grid-layout tf-col-${activeLayout}`}
                id="gridLayout"
              >
                <GridProducts
                  cardStyleClass={cardStyleClass}
                  products={sorted}
                  tooltipDirection={tooltipDirection}
                />

                <ul className="wg-pagination">
                  <li className="active">
                    <div className="pagination-item">1</div>
                  </li>
                  <li>
                    <a href="#" className="pagination-item">
                      2
                    </a>
                  </li>
                  <li>
                    <a href="#" className="pagination-item">
                      3
                    </a>
                  </li>
                  <li>
                    <a href="#" className="pagination-item">
                      <i className="icon-arr-right2" />
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
      <FilterModal allProps={allProps} />
    </>
  );
}
