import Sidebar from "@/components/AcoountPage/Sidebar";
import Calendar from "@/components/AppoinmentsPage/Calendar";
import { HeadProvider, Title, Meta } from "react-head";
import { useTranslation } from "react-i18next";

const Appointments = () => {
  const { t } = useTranslation("appointments");
  return (
    <>
      <HeadProvider>
        <Title>{t("seoTitle", "المواعيد | المحامي")}</Title>
        <Meta name="description" content={t("seoDescription", "Appointments page")} />
      </HeadProvider>
      <>
        <Calendar />
      </>
    </>
  );
};

export default Appointments;
