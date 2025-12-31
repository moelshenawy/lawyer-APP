import React from "react";
import ForgotPasswordPage from "@/components/ForgotPasswordPage";
import { HeadProvider, Title, Meta } from "react-head";
import { useTranslation } from "react-i18next";

const ForgotPassword = () => {
  const { t } = useTranslation("authForgotPassword");
  return (
    <>
      <HeadProvider>
        <Title>{t("seoTitle", "نسيت كلمة المرور | المحامي")}</Title>
        <Meta name="description" content={t("seoDescription", "Forgot password page")} />
      </HeadProvider>
      <ForgotPasswordPage />
    </>
  );
};

export default ForgotPassword;
