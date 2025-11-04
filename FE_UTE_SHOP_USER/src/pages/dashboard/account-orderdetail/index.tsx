import React from "react";
import Header1 from "@/components/headers/Header1";
import Footer1 from "@/components/footers/Footer1";
import Breadcumb from "@/components/common/Breadcumb";
import MetaComponent from "@/components/common/MetaComponent";
import OrderDetail from "@/components/dashboard/OrderDetail";

const metadata = {
  title: "Chi tiết đơn hàng || Vineta",
  description: "Chi tiết đơn hàng của khách hàng",
};

export default function AccountOrderDetailPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <Header1 />
      <Breadcumb pageName="Orders" pageTitle="Chi tiết đơn hàng" />
      <OrderDetail />
      <Footer1 />
    </>
  );
}
