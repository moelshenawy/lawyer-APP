import React from "react";
import { HeadProvider, Meta, Title } from "react-head";
import PaymentPage from "@/components/PaymentPage";

const Payment = () => {
  return (
    <>
      <HeadProvider>
        <Title>مكتب فواز للمحاماة | الدفع </Title>

        <Meta name="description" content="إتمام الدفع للطلبات أو الباقات المختارة." />
      </HeadProvider>
      <PaymentPage />
    </>
  );
};

export default Payment;
