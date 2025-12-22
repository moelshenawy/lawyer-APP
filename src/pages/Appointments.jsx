import Sidebar from "@/components/AcoountPage/Sidebar";
import Calendar from "@/components/AppoinmentsPage/Calendar";
import { HeadProvider, Title, Meta } from "react-head";

const Appointments = () => {
  return (
    <>
      <HeadProvider>
        <Title>مكتب فواز للمحاماة | مواعيدي </Title>

        <Meta name="description" content="Lawyer Client — chat and management app." />
      </HeadProvider>
      <>
        <div className="relative flex flex-col md:flex-row items-start justify-between w-full my-0 md:my-[158px]  gap-5">
          <Sidebar hideOnMobile />
          <Calendar />
        </div>
      </>
    </>
  );
};

export default Appointments;
