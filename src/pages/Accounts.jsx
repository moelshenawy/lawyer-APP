import MainContent from "@/components/AcoountPage/MainContent";
import Sidebar from "@/components/AcoountPage/Sidebar";
import { HeadProvider, Title, Meta } from "react-head";
import { useTranslation } from "react-i18next";

const Accounts = () => {
  const { t } = useTranslation("accountSettings");
  return (
    <>
      <HeadProvider>
        <Title>{t("seoTitle", "الحسابات | المحامي")}</Title>
        <Meta name="description" content={t("seoDescription", "Accounts page.")} />
      </HeadProvider>
      <>
        <div className="relative flex flex-wrap md:flex-nowrap justify-center md:justify-between items-start w-full   container">
          <Sidebar />
        </div>
      </>
    </>
  );
};

export default Accounts;
