import React from "react";
import { HeadProvider, Title, Meta } from "react-head";
import OrderDetails from "@/components/OrdersPage/OrderDetails";
import { useTranslation } from "react-i18next";

const CaseDetails = () => {
  const { t } = useTranslation("orderDetails");
  return (
    <>
      <HeadProvider>
        <Title>{t("caseSeoTitle", "تفاصيل القضية | المحامي")}</Title>
        <Meta name="description" content={t("caseSeoDescription", "Case details page")} />
      </HeadProvider>
      <OrderDetails viewType="case" />
    </>
  );
};

export default CaseDetails;
