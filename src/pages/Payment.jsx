import React from "react";
import { HeadProvider, Meta, Title } from "react-head";
import PaymentPage from "@/components/PaymentPage";
import { useTranslation } from "react-i18next";

const Payment = () => {
  const { t } = useTranslation("payment");
  return (
    <>
      <HeadProvider>
        <Title>{t("seoTitle", "الدفع | المحامي")}</Title>
        <Meta name="description" content={t("seoDescription", "Payment page")} />
      </HeadProvider>
      <PaymentPage />
    </>
  );
};

export default Payment;
