import Account from "@/components/dashboard/Account";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";

import React from "react";

import MetaComponent from "@/components/common/MetaComponent";
import Breadcumb from "@/components/common/Breadcumb";
const metadata = {
  title: "Account Page || Vineta - Multipurpose Reactjs eCommerce Template",
  description: "Vineta - Multipurpose Reactjs eCommerce Template",
};
export default function AccountPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <Header1 />
      <Breadcumb pageName="Tài khoản" pageTitle="Tài khoản của tôi" />

      <Account />
      <Footer1 />
    </>
  );
}

