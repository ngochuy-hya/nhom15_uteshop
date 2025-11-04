"use client";

import ListProducts from "./ListProducts";
import GridProducts from "./GridProducts";
import LayoutHandler from "./LayoutHandler";
import { useEffect, useReducer, useState } from "react";
import { initialState, reducer } from "@/reducer/filterReducer";
import { products as productsFull } from "@/data/products";

import Sidebar from "./Sidebar";
import FilterModal from "./FilterModal";

export default function Products2() {
  // giả sử productsFull là RawProduct[]
  const products = productsFull.slice(0, 12);

  const [activeLayout, setActiveLayout] = useState<number>(3);
  const [state, dispatch] = useReducer(reducer, initialState);

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

    // brands ở state đang là string chứ không phải string[]
    setBrands: (newBrand: string) => {
      dispatch({ type: "SET_BRANDS", payload: newBrand });
    },

    removeBrand: (_brandToRemove: string) => {
      // vì chỉ chọn 1 brand tại 1 thời điểm => clear thì quay lại "All"
      dispatch({ type: "SET_BRANDS", payload: "All" });
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

  // FILTER LOGIC
  useEffect(() => {
    let filteredArrays: typeof products[] = [];

    // filter by brand
    if (brands !== "All") {
      const filteredByBrands = products.filter((elm) =>
        elm.filterBrands.includes(brands)
      );
      filteredArrays = [...filteredArrays, filteredByBrands];
    }

    // filter by availability (availability = "All" | "In Stock" | "Unavailable")
    if (availability !== "All") {
      const wantInStock = availability === "In Stock"; // boolean
      const filteredByAvailability = products.filter(
        (elm) => elm.inStock === wantInStock
      );
      filteredArrays = [...filteredArrays, filteredByAvailability];
    }

    // filter by color
    if (color !== "All") {
      const filteredByColor = products.filter((elm) =>
        elm.filterColor.includes(color)
      );
      filteredArrays = [...filteredArrays, filteredByColor];
    }

    // filter by size
    if (size !== "All" && size !== "Free Size") {
      const filteredBySize = products.filter((elm) =>
        elm.filterSizes.includes(size)
      );
      filteredArrays = [...filteredArrays, filteredBySize];
    }

    // filter by price range
    const filteredByPrice = products.filter(
      (elm) => elm.price >= price[0] && elm.price <= price[1]
    );
    filteredArrays = [...filteredArrays, filteredByPrice];

    // intersect all filters
    const commonItems = products.filter((item) =>
      filteredArrays.every((array) => array.includes(item))
    );

    dispatch({ type: "SET_FILTERED", payload: commonItems });
  }, [price, availability, color, size, brands, products]);

  // SORT LOGIC
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
        payload: [...filtered].sort((a, b) => a.title.localeCompare(b.title)),
      });
    } else if (sortingOption === "Title Descending") {
      dispatch({
        type: "SET_SORTED",
        payload: [...filtered].sort((a, b) => b.title.localeCompare(a.title)),
      });
    } else {
      dispatch({ type: "SET_SORTED", payload: filtered });
    }

    dispatch({ type: "SET_CURRENT_PAGE", payload: 1 });
  }, [filtered, sortingOption]);

  return (
    <>
      <section className="flat-spacing-24">
        <div className="container">
          <div className="row">
            {/* SIDEBAR */}
            <div className="col-xl-3">
              <div className="canvas-sidebar sidebar-filter canvas-filter left">
                <div className="canvas-wrapper">
                  <Sidebar allProps={allProps} />
                </div>
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="col-xl-9">
              <div className="tf-shop-control">
                <div className="tf-group-filter">
                  {/* mobile filter button */}
                  <a
                    href="#filterShop"
                    data-bs-toggle="offcanvas"
                    aria-controls="filterShop"
                    className="tf-btn-filter d-flex d-xl-none"
                  >
                    <span className="icon icon-filter" />
                    <span className="text">Filter</span>
                  </a>

                  {/* sort dropdown */}
                  <div
                    className="tf-dropdown-sort"
                    data-bs-toggle="dropdown"
                  >
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
                            sortingOption === elm ? "active" : ""
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

                {/* layout toggle */}
                <ul className="tf-control-layout">
                  <LayoutHandler
                    setActiveLayout={setActiveLayout}
                    activeLayout={activeLayout}
                  />
                </ul>
              </div>

              <div className="wrapper-control-shop">
                {(availability !== "All" ||
                  brands !== "All" ||
                  price.join("-") !== [20, 300].join("-") ||
                  color !== "All" ||
                  size !== "All") && (
                  <div className="meta-filter-shop" style={{}}>
                    <div id="product-count-grid" className="count-text">
                      <span className="count">{sorted.length}</span>
                      Product{sorted.length > 1 ? "s" : ""} found
                    </div>

                    {/* applied filter tags */}
                    <div id="applied-filters">
                      {availability !== "All" ? (
                        <span
                          className="filter-tag"
                          onClick={() => allProps.setAvailability("All")}
                        >
                          <span className="remove-tag icon-close" /> Availability:{" "}
                          {availability === "In Stock"
                            ? "In Stock"
                            : "Unavailable"}
                        </span>
                      ) : (
                        ""
                      )}

                      {brands !== "All" ? (
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

                      {price.join("-") !== [20, 300].join("-") ? (
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

                      {color !== "All" ? (
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

                      {size !== "All" ? (
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

                    {(availability !== "All" ||
                      brands !== "All" ||
                      price.join("-") !== [20, 300].join("-") ||
                      color !== "All" ||
                      size !== "All") && (
                      <button
                        id="remove-all"
                        className="remove-all-filters"
                        onClick={allProps.clearFilter}
                      >
                        <i className="icon icon-close" /> Clear all filter
                      </button>
                    )}
                  </div>
                )}

                {activeLayout === 1 ? (
                  <div
                    className="tf-list-layout wrapper-shop"
                    id="listLayout"
                  >
                    <ListProducts products={sorted} />

                    {/* Pagination */}
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
                      products={sorted}
                      cardStyleClass=""
                      tooltipDirection="top"
                    />

                    {/* Pagination */}
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
          </div>
        </div>
      </section>

      <FilterModal allProps={allProps} />
    </>
  );
}
