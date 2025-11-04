import Account from "@/components/dashboard/Account";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";

import React from "react";

import MetaComponent from "@/components/common/MetaComponent";
import Breadcumb from "@/components/common/Breadcumb";
import AccountProfile from "@/components/dashboard/AccountProfile";
const metadata = {
  title: "Account Page || Vineta - Multipurpose Reactjs eCommerce Template",
  description: "Vineta - Multipurpose Reactjs eCommerce Template",
};
export default function AccountProfilePage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <Header1 />
      <Breadcumb pageName="Tài khoản" pageTitle="Cập nhật thông tin" />

    <AccountProfile></AccountProfile>
      <Footer1 />
    </>
  );
}

