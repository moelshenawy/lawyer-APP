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
        <Calendar />
      </>
    </>
  );
};

export default Appointments;
