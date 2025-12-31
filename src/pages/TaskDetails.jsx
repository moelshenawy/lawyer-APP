import React from "react";
import { HeadProvider, Title, Meta } from "react-head";
import OrderDetails from "@/components/OrdersPage/OrderDetails";
import { useTranslation } from "react-i18next";

const TaskDetails = () => {
  const { t } = useTranslation("orderDetails");
  return (
    <>
      <HeadProvider>
        <Title>{t("taskSeoTitle", "تفاصيل المهمة | المحامي")}</Title>
        <Meta name="description" content={t("taskSeoDescription", "Task details page")} />
      </HeadProvider>
      <OrderDetails viewType="task" />
    </>
  );
};

export default TaskDetails;
