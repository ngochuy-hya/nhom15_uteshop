"use client";

import { useEffect, useReducer, useState } from "react";
import ListProducts from "./ListProducts";
import GridProducts from "./GridProducts";
import FilterModal from "./FilterModal";
import LayoutHandler from "./LayoutHandler";
import { initialState, reducer } from "@/reducer/filterReducer";
import { products } from "@/data/products";

type RawProduct = (typeof products)[number];
type ReducerState = typeof initialState;

interface Products6Props {
  fullWidth?: boolean;
}

export default function Products6({ fullWidth = false }: Products6Props) {
  const [state, dispatch] = useReducer(reducer, initialState as ReducerState);

  const [activeLayout, setActiveLayout] = useState<number>(4);
  const [loading, setLoading] = useState(false);
  const [loadedItems, setLoadedItems] = useState<RawProduct[]>([]);

  const {
    price,
    availability,
    color,
    size,
    brands,
    filtered,
    sortingOption,
    sorted,
  } = state;

  // chuẩn hoá brands thành 1 string để lọc
  const brandValue: string = Array.isArray(brands)
    ? brands[0] ?? "All"
    : brands;

  // chuẩn hoá availability => boolean | null
  const isInStockWanted: boolean | null =
    availability === "All"
      ? null
      : typeof availability === "boolean"
      ? availability
      : availability === "In Stock"
      ? true
      : false;

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

    // ⬇️ chỉnh: ép payload as any để TS không bắt lỗi string | boolean
    setAvailability: (value: string | boolean) =>
      dispatch({ type: "SET_AVAILABILITY", payload: value as any }),

    // ⬇️ cho phép setBrands truyền vào string | string[]
    setBrands: (newBrand: string | string[]) =>
      dispatch({ type: "SET_BRANDS", payload: newBrand as any }),

    // ⬇️ removeBrand xử lý cả brands là mảng hay string
    removeBrand: (toRemove: string) => {
      if (Array.isArray(brands)) {
        const updated = brands.filter((b) => b !== toRemove);
        dispatch({
          type: "SET_BRANDS",
          payload: (updated.length > 0 ? updated : "All") as any,
        });
      } else {
        dispatch({ type: "SET_BRANDS", payload: "All" as any });
      }
    },

    setSortingOption: (value: string) =>
      dispatch({ type: "SET_SORTING_OPTION", payload: value }),

    clearFilter: () => dispatch({ type: "CLEAR_FILTER" }),
  };

  // FILTER
  useEffect(() => {
    const filteredGroups: RawProduct[][] = [];

    if (brandValue !== "All") {
      const byBrand = (products as RawProduct[]).filter((p) =>
        p.filterBrands.includes(brandValue)
      );
      filteredGroups.push(byBrand);
    }

    if (isInStockWanted !== null) {
      const byStock = (products as RawProduct[]).filter(
        (p) => p.inStock === isInStockWanted
      );
      filteredGroups.push(byStock);
    }

    if (color !== "All") {
      const byColor = (products as RawProduct[]).filter((p) =>
        p.filterColor.includes(color)
      );
      filteredGroups.push(byColor);
    }

    if (size !== "All" && size !== "Free Size") {
      const bySize = (products as RawProduct[]).filter((p) =>
        p.filterSizes.includes(size)
      );
      filteredGroups.push(bySize);
    }

    const byPrice = (products as RawProduct[]).filter(
      (p) => p.price >= price[0] && p.price <= price[1]
    );
    filteredGroups.push(byPrice);

    const intersection = (products as RawProduct[]).filter((item) =>
      filteredGroups.every((arr) => arr.includes(item))
    );

    dispatch({ type: "SET_FILTERED", payload: intersection });
  }, [price, isInStockWanted, color, size, brandValue]);

  // SORT
  useEffect(() => {
    let sortedProducts = [...(filtered as RawProduct[])];

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
  }, [filtered, sortingOption]);

  // PAGING INIT
  useEffect(() => {
    setLoadedItems((sorted as RawProduct[]).slice(0, 8));
  }, [sorted]);

  const handleLoad = () => {
    if (loading) return;
    setLoading(true);

    setTimeout(() => {
      setLoadedItems((prev) => [
        ...prev,
        ...(sorted as RawProduct[]).slice(prev.length, prev.length + 4),
      ]);
      setLoading(false);
    }, 1000);
  };

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
                  ].map((opt, i) => (
                    <div
                      key={i}
                      className={`select-item ${
                        sortingOption === opt ? "active" : ""
                      }`}
                      onClick={() => allProps.setSortingOption(opt)}
                    >
                      <span className="text-value-item">{opt}</span>
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

                {loadedItems.length < (sorted as RawProduct[]).length && (
                  <div className="wd-load" onClick={handleLoad}>
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
                <GridProducts products={loadedItems} />

                {loadedItems.length < (sorted as RawProduct[]).length && (
                  <div
                    className="wd-load d-flex justify-content-center"
                    onClick={handleLoad}
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
