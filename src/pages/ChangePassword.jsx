import React from "react";
import Sidebar from "@/components/AcoountPage/Sidebar";
import ChangePasswordMain from "@/components/ChangePasswordPage/MainContent";
import { HeadProvider, Title, Meta } from "react-head";

const ChangePassword = () => {
  return (
    <>
      <HeadProvider>
        <Title>Change Password | Lawyer Client</Title>
        <Meta name="description" content="Change password page" />
      </HeadProvider>
      <div className="relative flex flex-col md:flex-row items-start justify-between w-full my-0 md:my-[158px] container">
        <Sidebar hideOnMobile />
        <ChangePasswordMain />
      </div>
    </>
  );
};

export default ChangePassword;
