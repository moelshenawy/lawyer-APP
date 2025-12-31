import LoginPage from "@/components/LoginPage";
import React from "react";
import { HeadProvider, Title, Meta } from "react-head";
import { useTranslation } from "react-i18next";

const Login = () => {
  const { t } = useTranslation("authLogin");
  return (
    <>
      <HeadProvider>
        <Title>{t("seoTitle", "تسجيل الدخول | المحامي")}</Title>
        <Meta name="description" content={t("seoDescription", "Login page")} />
      </HeadProvider>
      <LoginPage />
    </>
  );
};

export default Login;
