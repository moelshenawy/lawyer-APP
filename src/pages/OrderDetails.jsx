import React from "react";
import { HeadProvider, Title, Meta } from "react-head";
import OrderDetails from "@/components/OrdersPage/OrderDetails";

const OrderDetailsPage = () => {
  return (
    <>
      <HeadProvider>
        <Title>مكتب فواز للمحاماة | تفاصيل الطلب </Title>
        <Meta name="description" content="Lawyer Client order details" />
      </HeadProvider>
      <OrderDetails />
    </>
  );
};

export default OrderDetailsPage;
