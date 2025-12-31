import React, { useEffect, useMemo, useState } from "react";
import styles from "./index.module.scss";
import homeStyles from "@/pages/Home.module.scss";

import PageHeader from "@/components/common/PageHeader";
import Skeleton from "@/components/Skeleton";

import SearchIcon from "@/assets/icons/Search";
import CalendarIcon from "@/assets/icons/Calendar";

import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

/* ================================
   Constants
================================ */

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://fawaz-law-firm.apphub.my.id";

const ORDERS_API_URL = `${API_BASE}/client/orders`;

// FILTER_TABS and TASK_STATUS_TABS moved inside component for translation support

const TASK_GROUPS = [
  {
    status: "pending",
    title: "مهام لم تبدأ بعد",
    link: "عرض المزيد",
    tasks: [
      {
        age: "منذ يومين",
        priority: "متوسطة",
        title: "نقل ملكية",
        description:
          "المطلوب هو استلام ملف نقل الملكية والتأكد من جميع تفاصيله القانونية...",
        date: "12 يناير 2026",
        time: "9:00 AM",
      },
      {
        age: "منذ يومين",
        priority: "متوسطة",
        title: "نقل ملكية",
        description:
          "المطلوب هو استلام ملف نقل الملكية والتأكد من جميع تفاصيله القانونية...",
        date: "12 يناير 2026",
        time: "9:00 AM",
      },
    ],
  },
  {
    status: "active",
    title: "مهام قيد التنفيذ",
    link: "عرض المزيد",
    tasks: [
      {
        age: "منذ يومين",
        priority: "متوسطة",
        title: "نقل ملكية",
        description:
          "المطلوب هو استلام ملف نقل الملكية والتأكد من جميع تفاصيله القانونية...",
        date: "12 يناير 2026",
        time: "9:00 AM",
      },
    ],
  },
];

/* ================================
   Icons
================================ */

const TaskFlagIcon = () => (
  <svg viewBox="0 0 16 16">
    <path d="M3 2.5V13.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4.5 3h7l-1.6 2 1.6 2h-7V3Z" fill="currentColor" />
  </svg>
);

const TaskCalendarIcon = () => (
  <svg viewBox="0 0 20 20">
    <rect x="3" y="4.5" width="14" height="12" rx="2" fill="none" stroke="currentColor" />
    <path d="M3 7.5h14M6.2 3v3M13.8 3v3" stroke="currentColor" />
  </svg>
);

const TaskClockIcon = () => (
  <svg viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" />
    <path d="M10 6.2v4.2l2.8 1.6" stroke="currentColor" />
  </svg>
);

/* ================================
   Helpers
================================ */

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getUserToken = () =>
  typeof window !== "undefined"
    ? window.localStorage.getItem("access_token")
    : null;

/* ================================
   Reusable UI
================================ */

const Tabs = ({ items, value, onChange, dir }) => (
  <Swiper
    modules={[FreeMode]}
    freeMode
    slidesPerView="auto"
    spaceBetween={8}
    dir={dir}
    className={styles.tabs}
  >
    {items.map((tab) => (
      <SwiperSlide key={tab.key} style={{ width: "auto" }}>
        <button
          type="button"
          onClick={() => onChange(tab.key)}
          className={`${styles.tab} ${
            value === tab.key ? styles.active : styles.inactive
          }`}
        >
          {tab.label}
        </button>
      </SwiperSlide>
    ))}
  </Swiper>
);

const SearchInput = ({ value, onChange, placeholder }) => (
  <div className={styles.searchWrap}>
    <input value={value} onChange={onChange} placeholder={placeholder} />
    <SearchIcon size={18} />
  </div>
);

/* ================================
   Main Component
================================ */

const UserOrders = () => {
  const { lng } = useParams();
  const dir = lng === "ar" ? "rtl" : "ltr";
  const base = `/${lng || "ar"}`;
  const { t } = useTranslation("orders");

  const [view, setView] = useState("tasks");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [taskQuery, setTaskQuery] = useState("");
  const [taskStatus, setTaskStatus] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");

  const taskStatusTabs = useMemo(
    () => [
      { key: "all", label: t("tabAll") },
      { key: "pending", label: t("todo") },
      { key: "active", label: t("inProgress") },
      { key: "completed", label: t("done") },
    ],
    [t]
  );

  const filterTabs = useMemo(
    () => [
      { key: "tasks", label: t("tasks") },
      { key: "cases", label: t("cases") },
    ],
    [t]
  );

  const orderTabs = useMemo(
    () => [
      { key: "all", label: t("tabAll") },
      { key: "active", label: t("tabActive") },
      { key: "paused", label: t("tabPaused") },
      { key: "completed", label: t("tabCompleted") },
      { key: "canceled", label: t("tabCanceled") },
    ],
    [t]
  );

  /* ================================
     Fetch Orders
  ================================ */

  useEffect(() => {
    let mounted = true;

    const fetchOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const token = getUserToken();
        const res = await fetch(ORDERS_API_URL, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                userToken: token,
                UserToken: token,
              }
            : {},
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || t("fetchFailed"));

        if (mounted) setOrders(Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => (mounted = false);
  }, [t]);

  /* ================================
     Derived Data
  ================================ */

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeStatus !== "all" && order.status !== activeStatus) return false;
      if (!query) return true;

      return [order.name, order.number, order.status_label]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
    });
  }, [orders, query, activeStatus]);

  const taskGroups = useMemo(() => {
    const ids = orders.map((o) => o.id).filter(Boolean);
    let index = 0;

    return TASK_GROUPS
      .map((group) => ({
        ...group,
        tasks: group.tasks
          .map((task) => ({
            ...task,
            id: ids[index++ % (ids.length || 1)],
          }))
          .filter((task) =>
            [task.title, task.description]
              .join(" ")
              .toLowerCase()
              .includes(taskQuery.toLowerCase())
          ),
      }))
      .filter(
        (g) => (taskStatus === "all" || g.status === taskStatus) && g.tasks.length
      );
  }, [orders, taskQuery, taskStatus]);

  /* ================================
     Render
  ================================ */

  return (
    <section dir={dir} className={`pb-24 ${styles.orders}`}>
      <PageHeader title={t("pageTitle")} />

      <Tabs items={filterTabs} value={view} onChange={setView} dir={dir} />

      {view === "tasks" ? (
        <>
          <SearchInput
            value={taskQuery}
            onChange={(e) => setTaskQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
          />

          <Tabs
            items={taskStatusTabs}
            value={taskStatus}
            onChange={setTaskStatus}
            dir={dir}
          />

          {loading ? (
            <Skeleton variant="rect" height={160} radius={16} />
          ) : (
            taskGroups.map((group) => (
              <div key={group.title} className={homeStyles.taskGroup}>
                <h3>{group.title}</h3>

                {group.tasks.map((task) => (
                  <Link
                    key={task.id}
                    to={`${base}/task/${task.id}`}
                    className={homeStyles.taskCard}
                  >
                    <h4>{task.title}</h4>
                    <p>{task.description}</p>

                    <div>
                      <TaskCalendarIcon /> {task.date}
                      <TaskClockIcon /> {task.time}
                      <TaskFlagIcon /> {task.priority}
                    </div>
                  </Link>
                ))}
              </div>
            ))
          )}
        </>
      ) : (
        <>
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
          />

          <Tabs
            items={orderTabs}
            value={activeStatus}
            onChange={setActiveStatus}
            dir={dir}
          />

          {loading ? (
            <Skeleton variant="rect" height={78} radius={16} />
          ) : (
            filteredOrders.map((order) => (
              <Link
                key={order.id}
                to={`${base}/task/${order.id}`}
                className={styles.card}
              >
                <strong>{order.name}</strong>
                <span>{order.status_label}</span>
                <CalendarIcon size={16} />
                {formatDate(order.updated_at)}
              </Link>
            ))
          )}
        </>
      )}

      {error && <div className="text-red-500 text-sm">{error}</div>}
    </section>
  );
};

export default UserOrders;
