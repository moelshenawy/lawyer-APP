import PackagesPage from "@/components/PackagesPage";
import React from "react";

import { HeadProvider, Title, Meta } from "react-head";

const Packages = () => {
  return (
    <>
      <HeadProvider>
        <Title>مكتب فواز للمحاماة | الباقات </Title>
        <Meta name="description" content="Lawyer Client — chat and management app." />
      </HeadProvider>
      <>
        <PackagesPage />
      </>
    </>
  );
};

export default Packages;
