import Address from "@/components/dashboard/Address";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";

import React from "react";

import MetaComponent from "@/components/common/MetaComponent";
import Breadcumb from "@/components/common/Breadcumb";
const metadata = {
  title: "Accout Address || Vineta - Multipurpose Reactjs eCommerce Template",
  description: "Vineta - Multipurpose Reactjs eCommerce Template",
};
export default function AccountAddressPage() {
  return (
    <>
      <MetaComponent meta={metadata} />

      <Header1 />
      <Breadcumb pageName="Addresses" pageTitle="Addresses" />
      <Address />
      <Footer1 />
    </>
  );
}

