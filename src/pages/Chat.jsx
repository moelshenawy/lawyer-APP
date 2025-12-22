import React from "react";
import MobileChatPage from "@/components/HomePage/Chat/MobilePage";
import { HeadProvider, Title, Meta } from "react-head";
import ChatPerson from "@/components/HomePage/Chat/ChatPerson";

const Chat = () => {
  return (
    <>
      <HeadProvider>
        <Title>مكتب فواز للمحاماة </Title>

        <Meta name="description" content="Lawyer Client chat and management app." />
      </HeadProvider>
      <>
        {/* Mobile: full-screen chat page */}
        <ChatPerson />
      </>
    </>
  );
};

export default Chat;
