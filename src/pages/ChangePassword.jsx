import React from "react";
import Sidebar from "@/components/AcoountPage/Sidebar";
import ChangePasswordMain from "@/components/ChangePasswordPage/MainContent";
import { HeadProvider, Title, Meta } from "react-head";
import { useTranslation } from "react-i18next";

const ChangePassword = () => {
  const { t } = useTranslation("changePassword");
  return (
    <>
      <HeadProvider>
        <Title>{t("seoTitle", "تغيير كلمة المرور | المحامي")}</Title>
        <Meta name="description" content={t("seoDescription", "Change password page")} />
      </HeadProvider>
      <div className="relative flex flex-col md:flex-row items-start justify-between w-full   container">
        <Sidebar hideOnMobile />
        <ChangePasswordMain />
      </div>
    </>
  );
};

export default ChangePassword;
