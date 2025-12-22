import MainContent from "@/components/AcoountPage/MainContent";
import Sidebar from "@/components/AcoountPage/Sidebar";
import { HeadProvider, Title, Meta } from "react-head";

const Accounts = () => {
  return (
    <>
      <HeadProvider>
        <Title>Accounts | Lawyer Client</Title>
        <Meta name="description" content="Lawyer Client — chat and management app." />
      </HeadProvider>
      <>
        <div className="relative flex flex-wrap md:flex-nowrap justify-center md:justify-between items-start w-full my-0 md:my-[158px] container">
          <Sidebar />
        </div>
      </>
    </>
  );
};

export default Accounts;
