import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
// import Topbar2 from "@/components/headers/Topbar2";
import React from "react";
import { Link } from "react-router-dom";

import MetaComponent from "@/components/common/MetaComponent";
const metadata = {
  title: "Page Not Found || Vineta - Multipurpose Reactjs eCommerce Template",
  description: "Vineta - Multipurpose Reactjs eCommerce Template",
};
export default function page() {
  return (
    <>
      <MetaComponent meta={metadata} />
      {/* <Topbar2 parentClass="tf-topbar bg-dark-5 topbar-bg" /> */}
      <Header1 />
      <section className="flat-spacing">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="wg-404">
                <div className="image">
                  <img
                    src="/images/banner/404.png"
                    alt="404"
                    className="lazyload"
                    width={472}
                    height={472}
                  />

                </div>
                <p className="title">Whoops!</p>
                <p className="text-md sub text-main">
                  We couldn’t find the page you were looking for.
                </p>
                <div className="bot">
                  <Link to={`/`} className="tf-btn btn-fill animate-btn">
                    Return to Homepage
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer1 />
    </>
  );
}

