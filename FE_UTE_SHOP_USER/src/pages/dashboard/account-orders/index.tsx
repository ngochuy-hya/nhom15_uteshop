import Orders from "@/components/dashboard/Orders";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";

import OrderDetails from "@/components/modals/OrderDetails";
import React from "react";

import MetaComponent from "@/components/common/MetaComponent";
import Breadcumb from "@/components/common/Breadcumb";
const metadata = {
  title: "Account Orders || Vineta - Multipurpose Reactjs eCommerce Template",
  description: "Vineta - Multipurpose Reactjs eCommerce Template",
};
export default function AccountOrderPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <Header1 />
      <Breadcumb pageName="Orders" pageTitle="My Orders" />
      <Orders />
      <Footer1 />
      <OrderDetails />
    </>
  );
}

