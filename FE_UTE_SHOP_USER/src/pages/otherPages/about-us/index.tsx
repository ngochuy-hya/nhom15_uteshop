import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import About from "@/components/otherPages/About";
import Features from "@/components/otherPages/Features";
import Features2 from "@/components/otherPages/Features2";
import Testimonials from "@/components/otherPages/Testimonials";
import React from "react";

import MetaComponent from "@/components/common/MetaComponent";
const metadata = {
  title: "About Us || Vineta - Multipurpose Reactjs eCommerce Template",
  description: "Vineta - Multipurpose Reactjs eCommerce Template",
};
export default function AboutUsPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <Header1 />
      <About />
      <Features />
      <Features2 />
      <Testimonials />
      <Footer1 />
    </>
  );
}

