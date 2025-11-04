"use client";
import { Link } from "react-router-dom";
import React from "react";
import NavProducts from "./NavProducts";
import {
  blogMenuItems,
  demoItems,
  otherPages,
  productMenuItems,
  shopPages,
} from "@/data/menu";
import Collections from "./Collections";
import { recentBlogPosts } from "@/data/blogs";
import { useLocation } from "react-router-dom";

export default function Nav() {
  const { pathname } = useLocation();
  const isMenuActive = (link) => {
    return link.href?.split("/")[1] == pathname.split("/")[1];
  };
  const isMenuParentActive = (menu) => {
    return menu.some((elm) => isMenuActive(elm));
  };
  const isMenuParentActive2 = (menu) => {
    return menu.some((elm) => isMenuParentActive(elm.links));
  };

  return (
    <>
      {" "}
      <li className="menu-item">
        <a
          href="#"
          className={`item-link ${
            isMenuParentActive(demoItems) ? "menuActive" : ""
          } `}
        >
          Home
          {/* <i className="icon icon-arr-down" /> */}
        </a>
      </li>
      <li className="menu-item">
        <a
          href="#"
          className={`item-link ${
            isMenuParentActive2(shopPages) ? "menuActive" : ""
          }`}
        >
          Shop
        </a>
      </li>
      <li className="menu-item">
        <a
          href="#"
          className={`item-link ${
            isMenuParentActive2(productMenuItems) ? "menuActive" : ""
          } `}
        >
          Products
        </a>
      </li>
      <li className="menu-item position-relative">
        <a
          href="#"
          className={`item-link  ${
            isMenuParentActive(otherPages) ? "menuActive" : ""
          }  `}
        >
          Pages
        </a>
      </li>
      <li className="menu-item position-relative">
        <a
          href="#"
          className={`item-link  ${
            isMenuParentActive(blogMenuItems) ? "menuActive" : ""
          }  `}
        >
          Blog
        </a>
      </li>
      <li className="menu-item">
        <a href="#" className="item-link">
          Buy Theme!
        </a>
      </li>
    </>
  );
}

