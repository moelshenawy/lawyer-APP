import React, { useEffect, useMemo, useState } from "react";
import styles from "./index.module.scss";
import PageHeader from "@/components/common/PageHeader";
import SearchIcon from "@/assets/icons/Search";
import CalendarIcon from "@/assets/icons/Calendar";
import Skeleton from "@/components/Skeleton";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import homeStyles from "@/pages/Home.module.scss";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id";
const ORDERS_API_URL = `${API_BASE}/client/orders`;

const FILTER_TABS = [
  { key: "tasks", label: "مهمات" },
  { key: "cases", label: "قضايا" },
];

const TASK_STATUS_TABS = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "لم تبدأ" },
  { key: "active", label: "قيد التنفيذ" },
  { key: "completed", label: "تمت" },
];

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
          "المطلوب هو استلام ملف نقل الملكية والتأكد من جميع تفاصيله القانونية. تشمل المهمة مراجعة المستندات المطلوبة، التأكد من صحة بيانات الأطراف...",
        date: "12 يناير 2026",
        time: "9:00 AM",
      },
      {
        age: "منذ يومين",
        priority: "متوسطة",
        title: "نقل ملكية",
        description:
          "المطلوب هو استلام ملف نقل الملكية والتأكد من جميع تفاصيله القانونية. تشمل المهمة مراجعة المستندات المطلوبة، التأكد من صحة بيانات الأطراف...",
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
          "المطلوب هو استلام ملف نقل الملكية والتأكد من جميع تفاصيله القانونية. تشمل المهمة مراجعة المستندات المطلوبة، التأكد من صحة بيانات الأطراف...",
        date: "12 يناير 2026",
        time: "9:00 AM",
      },
    ],
  },
];

const TaskFlagIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 2.5V13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M4.5 3h7l-1.6 2 1.6 2h-7V3Z" fill="currentColor" />
  </svg>
);

const TaskCalendarIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <rect x="3" y="4.5" width="14" height="12" rx="2" fill="none" stroke="currentColor" />
    <path d="M3 7.5h14" stroke="currentColor" />
    <path d="M6.2 3v3M13.8 3v3" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

const TaskClockIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" />
    <path d="M10 6.2v4.2l2.8 1.6" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
};

const getStoredUserToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("access_token");
};

const UserOrders = () => {
  const { lng } = useParams();
  const base = `/${lng || "ar"}`;
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";
  const { t } = useTranslation("orders");

  const [view, setView] = useState("tasks");
  const [query, setQuery] = useState("");
  const [taskQuery, setTaskQuery] = useState("");
  const [active, setActive] = useState("all");
  const [taskStatus, setTaskStatus] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tabs = useMemo(
    () => [
      { key: "all", label: t("tabAll") },
      { key: "active", label: t("tabActive") },
      { key: "paused", label: t("tabPaused") },
      { key: "completed", label: t("tabCompleted") },
      { key: "canceled", label: t("tabCanceled") },
    ],
    [t],
  );

  useEffect(() => {
    let cancelled = false;

    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      const headers = {
        "Content-Type": "application/json",
      };

      const token = getStoredUserToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        headers.userToken = token;
        headers.UserToken = token;
      }

      try {
        const res = await fetch(ORDERS_API_URL, {
          method: "GET",
          headers,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || t("fetchFailed"));
        }
        const payload = Array.isArray(data?.data) ? data.data : [];
        if (!cancelled) {
          setOrders(payload);
        }
      } catch (err) {
        console.error("Failed to fetch orders", err);
        if (!cancelled) {
          setError(err?.message || t("fetchFailed"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = orders;
    if (active !== "all") {
      data = data.filter((order) => order.status === active);
    }
    if (!q) return data;
    return data.filter((order) => {
      const fields = [order?.name, order?.number, order?.status_label, order?.updated_at];
      return fields.some((field) =>
        String(field || "")
          .toLowerCase()
          .includes(q),
      );
    });
  }, [orders, active, query]);

  const taskGroups = useMemo(() => {
    const q = taskQuery.trim().toLowerCase();
    const orderIds = orders.map((order) => order?.id).filter(Boolean);
    let cursor = 0;
    const groups = TASK_GROUPS.map((group) => {
      const tasks = group.tasks
        .map((task) => {
          const id = orderIds.length ? orderIds[cursor % orderIds.length] : cursor + 1;
          cursor += 1;
          return { ...task, id };
        })
        .filter((task) => {
          if (!q) return true;
          const fields = [task.title, task.description, task.date, task.time];
          return fields.some((field) =>
            String(field || "")
              .toLowerCase()
              .includes(q),
          );
        });
      return { ...group, tasks };
    });

    const filteredGroups =
      taskStatus === "all" ? groups : groups.filter((group) => group.status === taskStatus);
    return filteredGroups.filter((group) => group.tasks.length > 0);
  }, [orders, taskQuery, taskStatus]);

  return (
    <section id="Orders" dir={dir} className={`pb-24 ${styles.orders} `}>
      <PageHeader title={t("pageTitle")} />

      <div className=" mt-2">
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
              <button
                className={`${styles.tab} ${view === tab.key ? styles.active : styles.inactive}`}
                onClick={() => setView(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {view === "tasks" ? (
        <>
          <div className=" mt-1">
            <div className={styles.searchWrap}>
              <input
                type="text"
                value={taskQuery}
                onChange={(e) => setTaskQuery(e.target.value)}
                placeholder="ابحث"
              />
              <SearchIcon size={18} />
            </div>
          </div>

          <div className=" mt-2">
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

          {loading ? (
            <div className=" mt-3 flex flex-col gap-3">
              <Skeleton variant="rect" height={160} radius={16} />
              <Skeleton variant="rect" height={160} radius={16} />
            </div>
          ) : (
            <div className=" mt-3">
              <div className={homeStyles.taskGroups}>
                {taskGroups.map((group) => (
                  <div className={homeStyles.taskGroup} key={group.title}>
                    <div className={homeStyles.taskGroupHeader}>
                      <h3>{group.title}</h3>
                      <button className={homeStyles.moreLink} type="button">
                        {group.link}
                      </button>
                    </div>
                    <div className={homeStyles.taskList}>
                      {group.tasks.map((task, index) => (
                        <Link
                          to={`${base}/task/${task.id}`}
                          state={{ from: "tasks", task }}
                          key={`${task.title}-${index}`}
                          className={`${homeStyles.taskCard} ${styles.taskCardLink}`}
                        >
                          <div className={homeStyles.taskMeta}>
                            <span className={homeStyles.taskBadge}>
                              {task.priority}
                              <TaskFlagIcon />
                            </span>
                            <span className={homeStyles.taskAge}>{task.age}</span>
                          </div>
                          <h4 className={homeStyles.taskTitle}>{task.title}</h4>
                          <p className={homeStyles.taskDescription}>{task.description}</p>
                          <div className={homeStyles.taskFooter}>
                            <span className={homeStyles.deadlineLabel}>موعد التسليم</span>
                            <div className={homeStyles.deadlineInfo}>
                              <span className={homeStyles.deadlineItem}>
                                <TaskCalendarIcon />
                                {task.date}
                              </span>
                              <span className={homeStyles.deadlineItem}>
                                <TaskClockIcon />
                                {task.time}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {error && !loading ? (
                <div className="text-sm text-red-500 text-start">{error}</div>
              ) : null}
            </div>
          )}
        </>
      ) : (
        <>
          <div className=" mt-1">
            <div className={styles.searchWrap}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
              />
              <SearchIcon size={18} />
            </div>
          </div>

          <div className=" mt-2">
            <Swiper
              modules={[FreeMode]}
              freeMode
              slidesPerView="auto"
              spaceBetween={8}
              dir={dir}
              className={styles.tabs}
            >
              {tabs.map((tab) => (
                <SwiperSlide key={tab.key} style={{ width: "auto" }}>
                  <button
                    className={`${styles.tab} ${
                      active === tab.key ? styles.active : styles.inactive
                    }`}
                    onClick={() => setActive(tab.key)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <div className=" mt-3 flex flex-col gap-[16px]">
            {loading ? (
              <>
                <Skeleton variant="rect" height={78} radius={16} />
                <Skeleton variant="rect" height={78} radius={16} />
                <Skeleton variant="rect" height={78} radius={16} />
              </>
            ) : (
              filtered.map((order) => (
                <Link
                  to={`${base}/task/${order.id}`}
                  state={{ from: "cases" }}
                  key={order.id}
                  className={styles.card}
                >
                  <div className="flex items-start justify-between">
                    <div className="text-[#1A1A1A] font-bold text-base">
                      {order?.name || order?.title}
                    </div>
                    <div className={`inline-flex items-center ${styles[order?.status]}`}>
                      {order?.status_label}
                    </div>
                  </div>
                  <div
                    className={`${styles.meta} mt-2 text-sm text-[#4D4D4D] flex flex-col items-start gap-4`}
                  >
                    <span className="flex items-center gap-1">
                      <CalendarIcon active={true} size={16} /> {t("lastUpdated")}{" "}
                      {formatDate(order?.updated_at)}
                    </span>
                    <span>{t("orderNumber", { number: order?.number })}</span>
                  </div>
                </Link>
              ))
            )}
            {error && !loading ? (
              <div className="text-sm text-red-500 text-start">{error}</div>
            ) : null}

            <a href={`${base}/service`} className={styles.fab} aria-label={t("addOrder")}>
              <img src="/assets/icons/plus.svg" alt="plus icon" width={24} />
            </a>
          </div>
        </>
      )}
    </section>
  );
};

export default UserOrders;
