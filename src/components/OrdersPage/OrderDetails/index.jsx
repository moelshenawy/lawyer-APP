import React, { useEffect, useMemo, useState, useCallback } from "react";
import styles from "./index.module.scss";
import PageHeader from "@/components/common/PageHeader";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import Reminders from "@/components/HomePage/Reminders";
import Sidebar from "@/components/AcoountPage/Sidebar";
import Skeleton from "@/components/Skeleton";
import { Link, useLocation, useParams } from "react-router-dom";
import AppointmentsCard from "./AppointmentsCard";
import DocumentsTap from "./DocumentsTap";
import PaymentsTap from "./PaymentsTap";
import ApprovalsTap from "./ApprovalsTap/ApprovalsTap";
import ErrorState from "../ErrorState.jsx";
import HearingCard from "./HearingCard";
import RequestedInformationSection from "./RequestedInformationSection";
import stylesEmpty from "./RequestedInformationSection.module.scss";
import { useTranslation } from "react-i18next";
import homeStyles from "@/pages/Home.module.scss";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id/api"
).replace(/\/$/, "");
const ORDER_DETAILS_URL = (id) => `${API_BASE}/client/orders/${id}`;

const getStoredUserToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("access_token");
};

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

const OrderDetails = () => {
  const { id, lng } = useParams();
  const base = `/${lng || "ar"}`;
  const location = useLocation();
  const { t } = useTranslation("orderDetails");
  const [activeTab, setActiveTab] = useState("details");
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errStatus, setErrStatus] = useState(200);
  const [error, setError] = useState("");

  const TAB_ITEMS = useMemo(
    () => [
      { key: "details", label: t("tabs.details") },
      { key: "docs", label: t("tabs.docs") },
      { key: "invoices", label: t("tabs.invoices") },
      { key: "info", label: t("tabs.info") },
    ],
    [t],
  );

  const fetchOrder = useCallback(
    async (signal) => {
      if (!id) {
        setLoading(false);
        setErrStatus(404);
        setError(t("orderIdNotFound"));
        setOrderData(null);
        return;
      }

      setLoading(true);
      setError("");
      setErrStatus(200);

      const headers = { "Content-Type": "application/json" };
      const token = getStoredUserToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        headers.userToken = token;
        headers.UserToken = token;
      }

      try {
        const res = await fetch(ORDER_DETAILS_URL(id), {
          method: "GET",
          headers,
          signal,
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setOrderData(null);
          setErrStatus(res.status || 500);
          setError(t("fetchDetailsFailed"));
          return;
        }

        setOrderData(json?.data || null);
        setErrStatus(200);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Failed to fetch order details", err);
        setOrderData(null);
        setError(err?.message || t("fetchDetailsFailed"));
        setErrStatus((prev) => (prev && prev !== 200 ? prev : 500));
      } finally {
        setLoading(false);
      }
    },
    [id, t],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchOrder(controller.signal);
    return () => controller.abort();
  }, [fetchOrder]);

  const appointments = orderData?.appointments || [];
  const info = orderData?.info;
  const documents = orderData?.documents || [];
  const payments = orderData?.payments || [];
  const approvals = orderData?.approvals || [];
  const hearings = orderData?.hearings || [];
  const timeline = orderData?.timeline || [];
  const requested_information = orderData?.requested_information || [];

  const tabs = useMemo(() => TAB_ITEMS, [TAB_ITEMS]);
  const taskCard =
    location?.state?.from === "tasks" && location?.state?.task ? location.state.task : null;
  const showAnalysisButton = location?.state?.from === "cases";

  return (
    <>
      {errStatus !== 200 ? (
        <ErrorState message={error} onRetry={fetchOrder} />
      ) : (
        <section id="order-details" className={`pb-24 ${styles.details}`}>
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mt-2 mb-2">
            {loading ? (
              <Skeleton variant="title" width="45%" height={28} />
            ) : (
              <PageHeader title={info?.title} />
            )}
            {loading ? (
              <Skeleton variant="rect" height={26} width={85} radius={12} />
            ) : (
              <div className={`${styles.chip} ${styles.postponed} ${info?.status}`}>
                {info?.status_label}
              </div>
            )}
          </div>
          {loading ? (
            <Skeleton variant="rect" height={10} radius={16} />
          ) : info?.notification ? (
            <div className={styles.nextBanner}>
              <img src="/assets/icons/shape.svg" alt="shape icon" width={22} />
              <p>{info.notification}</p>
            </div>
          ) : null}

          {taskCard ? (
            <div className="mt-3">
              <div className={homeStyles.taskCard}>
                <div className={homeStyles.taskMeta}>
                  <span className={homeStyles.taskBadge}>
                    {taskCard.priority}
                    <TaskFlagIcon />
                  </span>
                  <span className={homeStyles.taskAge}>{taskCard.age}</span>
                </div>
                <h4 className={homeStyles.taskTitle}>{taskCard.title}</h4>
                <p className={homeStyles.taskDescription}>{taskCard.description}</p>
                <div className={homeStyles.taskFooter}>
                  <span className={homeStyles.deadlineLabel}>موعد التسليم</span>
                  <div className={homeStyles.deadlineInfo}>
                    <span className={homeStyles.deadlineItem}>
                      <TaskCalendarIcon />
                      {taskCard.date}
                    </span>
                    <span className={homeStyles.deadlineItem}>
                      <TaskClockIcon />
                      {taskCard.time}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {showAnalysisButton ? (
            <div className="mt-3">
              <Link to={`${base}/analysis/${id}`} className={styles.analysisBtn}>
                تحليل القضية
              </Link>
            </div>
          ) : null}

          <div className="mt-3">
            <Reminders orderData={orderData?.info} loading={loading} />
          </div>

          {/* Tabs */}
          <div className="mt-3">
            <Swiper
              modules={[FreeMode]}
              freeMode
              slidesPerView="auto"
              spaceBetween={8}
              dir="rtl"
              className={styles.tabs}
            >
              {tabs.map((tab) => (
                <SwiperSlide key={tab.key} style={{ width: "auto" }}>
                  {loading ? (
                    <div className="flex justify-center">
                      <div className="h-8 w-20 rounded-full bg-gray-200 animate-pulse" />
                    </div>
                  ) : (
                    <button
                      className={`${styles.tab} ${
                        activeTab === tab.key ? styles.active : styles.inactive
                      }`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Content */}
          <div className="mt-3 flex flex-col gap-3">
            {loading ? (
              <>
                <Skeleton variant="rect" height={140} radius={16} />
                <Skeleton variant="rect" height={140} radius={16} />
              </>
            ) : (
              <>
                {/* Details Tab */}
                {activeTab === "details" && (
                  <>
                    <HearingCard hearings={hearings} />

                    {/* مواعيد الاستشارات */}
                    {appointments.length > 0 && (
                      <AppointmentsCard
                        timeline={false}
                        appointments={appointments}
                        orderId={id}
                        onConfirmSuccess={fetchOrder}
                      />
                    )}

                    {/* طلبات الموافقة */}
                    {approvals.length > 0 && (
                      <div className="mt-3 flex flex-col gap-3">
                        <ApprovalsTap
                          approvals={approvals}
                          orderId={id}
                          onApproveSuccess={fetchOrder}
                        />
                      </div>
                    )}

                    {timeline.length > 0 && (
                      <div className="mt-3 flex flex-col gap-3">
                        <AppointmentsCard
                          timeline={true}
                          appointments={timeline}
                          orderId={id}
                          onApproveSuccess={fetchOrder}
                        />
                      </div>
                    )}

                    {!timeline.length > 0 &&
                      !approvals.length > 0 &&
                      !hearings.length > 0 &&
                      !appointments.length > 0 && (
                        <>
                          <div className={stylesEmpty.empty}>
                            <div className={stylesEmpty.emptyContent}>
                              <p className={stylesEmpty.emptyTitle}>{t("emptyDetailsTitle")}</p>
                              <p className={stylesEmpty.emptySubtitle}>
                                {t("emptyDetailsSubtitle")}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                  </>
                )}

                {/* Documents Tab */}
                {activeTab === "docs" && (
                  <div className="flex flex-col gap-3">
                    <DocumentsTap documents={documents} orderId={id} onUploadSuccess={fetchOrder} />
                  </div>
                )}

                {/* Payments Tab */}
                {activeTab === "invoices" && (
                  <div className="flex flex-col gap-3">
                    <PaymentsTap payments={payments} />
                  </div>
                )}

                {/* Approvals Tab */}
                {activeTab === "info" && (
                  <div className="flex flex-col gap-3">
                    <RequestedInformationSection
                      requestedInformation={requested_information}
                      orderId={id}
                      onSuccess={fetchOrder}
                    />
                  </div>
                )}
              </>
            )}
            {error && !loading ? (
              <div className="text-sm text-red-500 text-start">{error}</div>
            ) : null}
          </div>
        </section>
      )}
    </>
  );
};

export default OrderDetails;
