import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Faqs from "@/components/otherPages/Faqs";
import React from "react";
import { Link } from "react-router-dom";
import MetaComponent from "@/components/common/MetaComponent";
import Breadcumb from "@/components/common/Breadcumb";
const metadata = {
  title: "Faq || Vineta - Multipurpose Reactjs eCommerce Template",
  description: "Vineta - Multipurpose Reactjs eCommerce Template",
};
export default function FaqPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <Header1 />
      <Breadcumb pageName="FAQs" pageTitle="Frequently Asked Questions" />

      <Faqs />
      <Footer1 />
    </>
  );
}

