// import Hero from "@/components/HomePage/Hero";
// import Notifications from "@/components/HomePage/Notifications";
// import Packages from "@/components/HomePage/Packages";
// import Reminders from "@/components/HomePage/Reminders";
// import Services from "@/components/HomePage/Services";
// import User from "@/components/HomePage/User";
import UserOrders from "@/components/OrdersPage/UserOrders";
import { HeadProvider, Title, Meta } from "react-head";

const Orders = () => {
  return (
    <>
      <HeadProvider>
        <Title>مكتب فواز للمحاماة | الطلبات </Title>
        <Meta name="description" content="Lawyer Client — chat and management app." />
      </HeadProvider>
      <>
        <UserOrders />
      </>
    </>
  );
};

export default Orders;
