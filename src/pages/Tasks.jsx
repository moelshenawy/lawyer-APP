import { HeadProvider, Title, Meta } from "react-head";
import { useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import TasksCard from "@/components/TasksCard";
import SearchIcon from "@/assets/icons/Search";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { useState, useMemo } from "react";
import styles from "@/components/OrdersPage/UserOrders/index.module.scss";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Tasks = () => {
  const { lng } = useParams();
  const { t } = useTranslation("orders");
  const base = `/${lng || "ar"}`;
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";
  
  const [taskQuery, setTaskQuery] = useState("");
  const [taskStatus, setTaskStatus] = useState("all");

  const TASK_STATUS_TABS = useMemo(() => [
    { key: "all", label: t("tabAll") },
    { key: "todo", label: t("todoLabel") },
    { key: "in_progress", label: t("inProgressLabel") },
    { key: "blocked", label: t("blockedLabel") },
    { key: "done", label: t("doneLabel") },
  ], [t]);

  const FILTER_TABS = useMemo(() => [
    { key: "tasks", label: t("tasks") },
    { key: "cases", label: t("cases") },
  ], [t]);

  return (
    <>
      <HeadProvider>
        <Title>{t("tasksSeoTitle", "المهمات | المحامي")}</Title>
        <Meta name="description" content={t("tasksSeoDescription", "Tasks page")} />
      </HeadProvider>

      <section id="Tasks" dir={dir} className={`pb-24 ${styles.orders}`}>
        <PageHeader title={t("tasksAndCases")} />

        <div className="mt-2">
          <Swiper
            modules={[FreeMode]}
            freeMode
            slidesPerView="auto"
            spaceBetween={8}
            dir={dir}
            className={styles.tabs}
          >
            {FILTER_TABS.map((tab) => (
              <SwiperSlide key={tab.key} style={{ width: "auto" }}>
                <Link
                  to={`${base}/${tab.key}`}
                  className={`${styles.tab} ${tab.key === "tasks" ? styles.active : styles.inactive}`}
                >
                  {tab.label}
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="mt-1">
          <div className={styles.searchWrap}>
            <input
              type="text"
              value={taskQuery}
              onChange={(e) => setTaskQuery(e.target.value)}
              placeholder={t("searchSmall")}
            />
            <SearchIcon size={18} />
          </div>
        </div>

        <div className="mt-2">
          <Swiper
            modules={[FreeMode]}
            freeMode
            slidesPerView="auto"
            spaceBetween={8}
            dir={dir}
            className={styles.tabs}
          >
            {TASK_STATUS_TABS.map((tab) => (
              <SwiperSlide key={tab.key} style={{ width: "auto" }}>
                <button
                  className={`${styles.tab} ${
                    taskStatus === tab.key ? styles.active : styles.inactive
                  }`}
                  onClick={() => setTaskStatus(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="mt-3">
          <TasksCard searchQuery={taskQuery} statusFilter={taskStatus} />
        </div>
      </section>
    </>
  );
};

export default Tasks;
