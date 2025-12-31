import PackagesPage from "@/components/PackagesPage";
import React from "react";
import { HeadProvider, Title, Meta } from "react-head";
import { useTranslation } from "react-i18next";

const Packages = () => {
  const { t } = useTranslation("packages");
  return (
    <>
      <HeadProvider>
        <Title>{t("seoTitle", "الباقات | المحامي")}</Title>
        <Meta name="description" content={t("seoDescription", "Packages page")} />
      </HeadProvider>
      <>
        <PackagesPage />
      </>
    </>
  );
};

export default Packages;
