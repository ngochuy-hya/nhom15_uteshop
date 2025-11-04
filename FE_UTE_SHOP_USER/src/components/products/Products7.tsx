"use client";

import ListProducts from "./ListProducts";
import GridProducts from "./GridProducts";
import FilterModal from "./FilterModal";
import LayoutHandler from "./LayoutHandler";
import { useEffect, useReducer, useRef, useState } from "react";
import { initialState, reducer } from "@/reducer/filterReducer";
import { products } from "@/data/products";

export default function Products7({ fullWidth = false }) {
  const [activeLayout, setActiveLayout] = useState<number>(4);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loading, setLoading] = useState(false);
  const [loadedItems, setLoadedItems] = useState<any[]>([]);

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
    setAvailability: (value: string) =>
      dispatch({ type: "SET_AVAILABILITY", payload: value }),
    setBrands: (newBrand: string) =>
      dispatch({ type: "SET_BRANDS", payload: newBrand }),
    removeBrand: (_brand: string) =>
      dispatch({ type: "SET_BRANDS", payload: "All" }),
    setSortingOption: (value: string) =>
      dispatch({ type: "SET_SORTING_OPTION", payload: value }),
    setCurrentPage: (value: number) =>
      dispatch({ type: "SET_CURRENT_PAGE", payload: value }),
    setItemPerPage: (value: number) => {
      dispatch({ type: "SET_CURRENT_PAGE", payload: 1 });
      dispatch({ type: "SET_ITEM_PER_PAGE", payload: value });
    },
    clearFilter: () => dispatch({ type: "CLEAR_FILTER" }),
  };

  useEffect(() => {
    let filteredArrays: any[] = [];

    if (brands !== "All") {
      const filteredByBrands = products.filter((elm) =>
        elm.filterBrands.includes(brands)
      );
      filteredArrays.push(filteredByBrands);
    }

    if (availability !== "All") {
      const wantInStock = availability === "In Stock";
      const filteredByAvailability = products.filter(
        (elm) => elm.inStock === wantInStock
      );
      filteredArrays.push(filteredByAvailability);
    }

    if (color !== "All") {
      const filteredByColor = products.filter((elm) =>
        elm.filterColor.includes(color)
      );
      filteredArrays.push(filteredByColor);
    }

    if (size !== "All" && size !== "Free Size") {
      const filteredBySize = products.filter((elm) =>
        elm.filterSizes.includes(size)
      );
      filteredArrays.push(filteredBySize);
    }

    const filteredByPrice = products.filter(
      (elm) => elm.price >= price[0] && elm.price <= price[1]
    );
    filteredArrays.push(filteredByPrice);

    const commonItems = products.filter((item) =>
      filteredArrays.every((array) => array.includes(item))
    );

    dispatch({ type: "SET_FILTERED", payload: commonItems });
  }, [price, availability, color, size, brands]);

  useEffect(() => {
    let sortedProducts = [...filtered];
    switch (sortingOption) {
      case "Price Ascending":
        sortedProducts.sort((a, b) => a.price - b.price);
        break;
      case "Price Descending":
        sortedProducts.sort((a, b) => b.price - a.price);
        break;
      case "Title Ascending":
        sortedProducts.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "Title Descending":
        sortedProducts.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }
    dispatch({ type: "SET_SORTED", payload: sortedProducts });
    dispatch({ type: "SET_CURRENT_PAGE", payload: 1 });
  }, [filtered, sortingOption]);

  useEffect(() => {
    setLoadedItems(sorted.slice(0, 8));
  }, [sorted]);

  const handleLoad = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      setLoadedItems((pre) => [
        ...pre,
        ...sorted.slice(pre.length, pre.length + 4),
      ]);
      setLoading(false);
    }, 1000);
  };

  const elementRef = useRef<HTMLDivElement | null>(null);
  const elementRef2 = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) handleLoad();
      },
      { threshold: 0.1 }
    );
    const current = elementRef.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [sorted]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) handleLoad();
      },
      { threshold: 0.1 }
    );
    const current = elementRef2.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [sorted]);

  return (
    <>
      <section className="flat-spacing-24">
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
                        sortingOption === elm ? "active" : ""
                      }`}
                      onClick={() => allProps.setSortingOption(elm)}
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
            {activeLayout === 1 ? (
              <div className="tf-list-layout wrapper-shop" id="listLayout">
                <ListProducts products={loadedItems} />
                {!(
                  loadedItems.length >= sorted.length
                ) && (
                  <div className="wd-load" ref={elementRef}>
                    <button
                      id="loadMoreListBtn"
                      className={`tf-btn btn-out-line-dark2 tf-loading loadmore ${
                        loading ? "loading" : ""
                      }`}
                    >
                      <span className="text">Load more</span>
                      <div className="spinner-circle">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <span
                            key={i}
                            className={`spinner-circle${i + 1} spinner-child`}
                          />
                        ))}
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`wrapper-shop tf-grid-layout tf-col-${activeLayout}`}
                id="gridLayout"
              >
                <GridProducts
                  products={loadedItems}
                  cardStyleClass=""
                  tooltipDirection="top"
                />
                {!(
                  loadedItems.length >= sorted.length
                ) && (
                  <div
                    className="wd-load d-flex justify-content-center"
                    ref={elementRef2}
                  >
                    <button
                      id="loadMoreGridBtn"
                      className={`tf-btn btn-out-line-dark2 tf-loading loadmore ${
                        loading ? "loading" : ""
                      }`}
                    >
                      <span className="text">Load more</span>
                      <div className="spinner-circle">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <span
                            key={i}
                            className={`spinner-circle${i + 1} spinner-child`}
                          />
                        ))}
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      <FilterModal allProps={allProps} />
    </>
  );
}
