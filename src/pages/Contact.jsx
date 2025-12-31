import React from "react";
import ContactPage from "@/components/ContactPage";
import { HeadProvider, Title, Meta } from "react-head";
import { useTranslation } from "react-i18next";

const Contact = () => {
  const { t } = useTranslation("contact");
  return (
    <>
      <HeadProvider>
        <Title>{t("seoTitle", "مكتب فواز للمحاماة | تواصل معنا")}</Title>

        <Meta name="description" content={t("metaDescription")} />
      </HeadProvider>
      <ContactPage />
    </>
  );
};

export default Contact;
