import React from "react";
import { HeadProvider, Title, Meta } from "react-head";
import MobileChatPage from "@/components/HomePage/Chat/MobilePage";
import { useTranslation } from "react-i18next";

const Ai = () => {
  const { t } = useTranslation("chatMobile");
  return (
    <>
      <HeadProvider>
        <Title>{t("aiSeoTitle", "المساعد القانوني | المحامي")}</Title>
        <Meta name="description" content={t("aiSeoDescription", "Lawyer Client AI assistant")} />
      </HeadProvider>
      <>
        {/* Mobile: full-screen AI chat page */}
        <MobileChatPage />
      </>
    </>
  );
};

export default Ai;
