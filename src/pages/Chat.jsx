import React from "react";
import MobileChatPage from "@/components/HomePage/Chat/MobilePage";
import { HeadProvider, Title, Meta } from "react-head";
import ChatPerson from "@/components/HomePage/Chat/ChatPerson";
import { useTranslation } from "react-i18next";

const Chat = () => {
  const { t } = useTranslation("chatMobile");
  return (
    <>
      <HeadProvider>
        <Title>{t("seoTitle", "المحادثة | المحامي")}</Title>
        <Meta name="description" content={t("seoDescription", "Lawyer Client chat page")} />
      </HeadProvider>
      <>
        {/* Mobile: full-screen chat page */}
        <ChatPerson />
      </>
    </>
  );
};

export default Chat;
