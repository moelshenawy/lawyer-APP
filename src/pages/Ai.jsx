import React from "react";
import { HeadProvider, Title, Meta } from "react-head";
import MobileChatPage from "@/components/HomePage/Chat/MobilePage";

const Ai = () => {
  return (
    <>
      <HeadProvider>
        <Title>مكتب فواز للمحاماة | المساعد القانوني</Title>

        <Meta name="description" content="Lawyer Client — chat and management app." />
        <Meta name="description" content="Lawyer Client AI chat and management app." />
      </HeadProvider>
      <>
        {/* Mobile: full-screen AI chat page */}
        <MobileChatPage />
      </>
    </>
  );
};

export default Ai;
