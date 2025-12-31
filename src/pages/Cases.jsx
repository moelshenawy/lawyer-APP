import { HeadProvider, Title, Meta } from "react-head";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/common/PageHeader";
import SearchIcon from "@/assets/icons/Search";
import CalendarIcon from "@/assets/icons/Calendar";
import Skeleton from "@/components/Skeleton";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import styles from "@/components/OrdersPage/UserOrders/index.module.scss";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id";
const ORDERS_API_URL = `${API_BASE}/user/orders`;

const FILTER_TABS = [
  { key: "tasks", label: "مهمات" },
  { key: "cases", label: "قضايا" },
];

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

const Cases = () => {
  const { lng } = useParams();
  const base = `/${lng || "ar"}`;
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";
  const { t } = useTranslation("orders");

  const [query, setQuery] = useState("");
  const [active, setActive] = useState("all");
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

  return (
    <>
      <HeadProvider>
        <Title>{t("casesSeoTitle", "القضايا | المحامي")}</Title>
        <Meta name="description" content={t("casesSeoDescription", "Cases page")} />
      </HeadProvider>

      <section id="Cases" dir={dir} className={`pb-24 ${styles.orders}`}>
        <PageHeader title="قضايا ومهمات" />

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
                  className={`${styles.tab} ${tab.key === "cases" ? styles.active : styles.inactive}`}
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
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

        <div className="mt-3 flex flex-col gap-[16px]">
          {loading ? (
            <>
              <Skeleton variant="rect" height={78} radius={16} />
              <Skeleton variant="rect" height={78} radius={16} />
              <Skeleton variant="rect" height={78} radius={16} />
            </>
          ) : (
            filtered.map((order) => (
              <Link
                to={`${base}/case/${order.id}`}
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

        </div>
      </section>
    </>
  );
};

export default Cases;
