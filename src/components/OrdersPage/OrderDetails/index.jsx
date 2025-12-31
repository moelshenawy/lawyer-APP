import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import styles from "./index.module.scss";
import PageHeader from "@/components/common/PageHeader";
// import Reminders from "@/components/HomePage/Reminders";
import Skeleton from "@/components/Skeleton";
import { Link, useLocation, useParams } from "react-router-dom";
import DocumentsTap from "./DocumentsTap";
import ErrorState from "../ErrorState.jsx";
import { useTranslation } from "react-i18next";
import TaskCard from "@/components/TaskCard";
import axiosClient from "@/api/axiosClient";

// ✅ Tabs UI (same as old)
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

// ✅ Old order details sections (case only)
import PaymentsTap from "./PaymentsTap";
import RequestedInformationSection from "./RequestedInformationSection";
import stylesEmpty from "./RequestedInformationSection.module.scss";

// ✅ NEW: task comments section
import TaskUpdatesSection from "./TaskUpdatesSection";
import CalendarCard from "@/components/AppoinmentsPage/Calendar/CalendarCard";

const getOrderDetailsPath = (id, viewType) => {
  if (viewType === "task") return `/user/tasks/${id}`;
  if (viewType === "case") return `/user/orders/${id}`;
  return `/user/tasks/${id}`;
};

const OrderDetails = ({ viewType }) => {
  const { id, lng } = useParams();
  const base = `/${lng || "ar"}`;
  const location = useLocation();
  const { t } = useTranslation("orderDetails");

  // ✅ Tabs state (used ONLY for case)
  const [activeTab, setActiveTab] = useState("info");

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errStatus, setErrStatus] = useState(200);
  const [error, setError] = useState("");

  // ✅ Keep ONLY fetched updates here, UI+post logic moved to TaskUpdatesSection
  const [updates, setUpdates] = useState([]);


  const reqSeqRef = useRef(0);

  // ✅ IMPORTANT: tabs + tab content ONLY when viewType === "case"
  const isTaskView = viewType === "task";
  const isCaseView = viewType === "case";

  // keep old behavior for analysis button if you still need "from cases" support
  const showAnalysisButton = isCaseView || location?.state?.from === "cases";

  // ✅ Case tabs only
  const TAB_ITEMS = useMemo(() => {
    if (!isCaseView) return [];
    return [
      { key: "info", label: t("tabs.info") },
      { key: "details", label: t("tabs.details") },
      { key: "docs", label: t("tabs.docs") },
    ];
  }, [t, isCaseView]);

  // keep active tab valid (case only)
  useEffect(() => {
    if (!isCaseView) return;
    if (!TAB_ITEMS.some((x) => x.key === activeTab)) setActiveTab("details");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [TAB_ITEMS, isCaseView]);

const fetchOrder = useCallback(
  async (signal) => {
    const myReq = ++reqSeqRef.current;

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

    let aborted = false;

    try {
      const response = await axiosClient.get(getOrderDetailsPath(id, viewType), {
        signal,
      });

      const data = response.data;

      setOrderData(data?.data || null);

      if (data?.data?.updates && Array.isArray(data.data.updates)) {
        setUpdates(data.data.updates);
      } else {
        setUpdates([]);
      }

      setErrStatus(200);
    } catch (err) {
      if (err?.name === "AbortError" || err?.message === "canceled" || axiosClient.isCancel?.(err)) {
        aborted = true;
        return;
      }
      console.error("Failed to fetch order details", err);
      setOrderData(null);
      setError(err?.response?.data?.message || err?.message || t("fetchDetailsFailed"));
      setErrStatus(err?.response?.status || 500);
    } finally {
      if (!aborted && reqSeqRef.current === myReq) {
        setLoading(false);
      }
    }
  },
  [id, t, viewType],
);


  useEffect(() => {
    const controller = new AbortController();
    fetchOrder(controller.signal);
    return () => controller.abort();
  }, [fetchOrder]);

  const info = orderData?.info;
  const documents = orderData?.documents || [];

  console.log(documents,"documents")

  // ✅ case-only collections
  const appointments = orderData?.appointments || [];
  const payments = orderData?.payments || [];
  const approvals = orderData?.approvals || [];
  const hearings = orderData?.hearings || [];
  const timeline = orderData?.timeline || [];
  const requested_information = orderData?.requested_information || [];
  const calendarData = orderData?.calendar || [];
  const infoData = orderData?.info || [];
  const isCase = orderData?.info?.type === "case";

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
              <PageHeader title={info?.title || orderData?.task?.title} />
            )}

            {loading ? (
              <Skeleton variant="rect" height={26} width={85} radius={12} />
            ) : isCaseView ? (
              <div className={`${styles.chip} ${styles.postponed} ${info?.status}`}>
                {info?.status_label}
              </div>
            ) : null}
          </div>

          {loading ? (
            <Skeleton variant="rect" height={10} radius={16} />
          ) : info?.notification ? (
            <div className={styles.nextBanner}>
              <img src="/assets/icons/shape.svg" alt="shape icon" width={22} />
              <p>{info.notification}</p>
            </div>
          ) : null}

          {/* Task main card (task only) */}
          {isTaskView && (
            <div className="mt-3">
              {loading ? <TaskCard.Skeleton /> : orderData ? <TaskCard task={orderData?.task} /> : null}
            </div>
          )}

          {/* Case analysis button */}
          {showAnalysisButton && isCase ? (
            <div className="mt-3">
              <Link to={`${base}/analysis/${id}`} className={styles.analysisBtn}>
                تحليل القضية
              </Link>
            </div>
          ) : null}

          {/* <div className="mt-3">
            <Reminders orderData={orderData?.info} loading={loading} />
          </div> */}

          {/* ✅ Tabs: ONLY visible in viewType === "case" */}
          {isCaseView ? (
            <div className="mt-3">
              <Swiper
                modules={[FreeMode]}
                freeMode
                slidesPerView="auto"
                spaceBetween={8}
                dir="rtl"
                className={styles.tabs}
              >
                {TAB_ITEMS.map((tab) => (
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
                        type="button"
                      >
                        {tab.label}
                      </button>
                    )}
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : null}

          {/* Content */}
          <div className="mt-3 flex flex-col gap-3">
            {loading ? (
              <>
                <TaskCard.Skeleton />
                <TaskCard.Skeleton />
              </>
            ) : (
              <>
                {/* ✅ CASE TABS CONTENT: ONLY visible in viewType === "case" */}
                {isCaseView ? (
                  <>
                    {/* DETAILS */}
                    {activeTab === "details" && (
                      <>
                      <CalendarCard Cards={calendarData}/>
            
                        {!calendarData.length &&
                           (
                            <div className={stylesEmpty.empty}>
                              <div className={stylesEmpty.emptyContent}>
                                <p className={stylesEmpty.emptyTitle}>{t("emptyDetailsTitle")}</p>
                                <p className={stylesEmpty.emptySubtitle}>
                                  {t("emptyDetailsSubtitle")}
                                </p>
                              </div>
                            </div>
                          )}
                      </>
                    )}

                    {/* DOCS */}
                    {activeTab === "docs" && (
                      <div className="flex flex-col gap-3">
                        <DocumentsTap
                          documents={documents}
                          orderId={id}
                          onUploadSuccess={fetchOrder}
                        />
                      </div>
                    )}

                    {/* INVOICES */}
                    {activeTab === "invoices" && (
                      <div className="flex flex-col gap-3">
                        <PaymentsTap payments={payments} orderId={id} />
                      </div>
                    )}

                    {/* INFO */}
                    {activeTab === "info" && (
                      <div className="flex flex-col gap-3">
                        <RequestedInformationSection
                          requestedInformation={infoData}
                          orderId={id}
                          onSuccess={fetchOrder}
                        />
                      </div>
                    )}
                  </>
                ) : null}

                {/* ✅ TASK CONTENT (no tabs) */}
                {isTaskView ? (
<TaskUpdatesSection taskId={id} initialUpdates={updates} loading={loading} />
                ) : null}
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