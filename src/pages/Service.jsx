import React, { useEffect, useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { LuArrowDownUp } from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import styles from "./Service.module.scss";
import axiosClient from "@/api/axiosClient";
import Skeleton from "@/components/Skeleton";
import StatusPopup from "@/components/common/StatusPopup";
import PageHeader from "@/components/common/PageHeader";
import { HeadProvider, Title, Meta } from "react-head";

const fallbackIcons = [
  "/assets/icons/services/1.svg",
  "/assets/icons/services/2.svg",
  "/assets/icons/services/3.svg",
];

const ServicePage = () => {
  const navigate = useNavigate();
  const { lng = "ar" } = useParams();
  const { t } = useTranslation("service");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("az");
  const [selectedService, setSelectedService] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const sortOptions = [
    { value: "az", label: t("sortAz") },
    { value: "za", label: t("sortZa") },
  ];

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get("/client/info/services");
        const list = res?.data?.data?.services || res?.data?.services || [];
        setServices(Array.isArray(list) ? list : []);
      } catch {
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const filtered = useMemo(() => {
    const base = Array.isArray(services) ? services : [];
    const q = query.trim().toLowerCase();
    const next = q ? base.filter((item) => item?.title?.toLowerCase().includes(q)) : [...base];
    next.sort((a, b) => {
      const aTitle = a?.title || "";
      const bTitle = b?.title || "";
      return sort === "za" ? bTitle.localeCompare(aTitle) : aTitle.localeCompare(bTitle);
    });
    return next;
  }, [services, query, sort]);

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedService(null);
  };

  const handleConfirm = async () => {
    if (confirmLoading) return;
    if (!selectedService?.id) {
      toast.error(t("errorSelectService"));
      return;
    }

    setConfirmLoading(true);

    try {
      const payload = {
        service_id: selectedService.id,
        notes: selectedService?.notes || "",
      };
      const response = await axiosClient.post("/client/orders", payload);
      const success = response?.data?.success;
      const payloadData = response?.data?.data;

      if (!success || !payloadData?.id) {
        const message = response?.data?.message || t("errorCreateOrderLater");
        toast.error(message);
        return;
      }

      const orderId = payloadData.id;
      const invoice = payloadData.invoice || null;
      const lang = lng || "ar";
      const orderReturnUrl = `${window.location.origin}/${lang}/orders/${orderId}`;
      const paymentBase =
        import.meta.env.VITE_PAYMENT_BASE_URL || "https://fawaz-law-firm.apphub.my.id";

      if (!invoice) {
        navigate(`/${lang}/task/${orderId}`);
        closePopup();
        return;
      }

      const mappedPayment = {
        id: invoice.id,
        invoice_no: invoice.number || invoice.invoice_no || "",
        amount: invoice.total_amount ?? invoice.amount ?? 0,
        currency: invoice.currency || t("currencySar"),
        status: invoice.status,
        status_label: invoice.status_label,
        due_date: invoice.due_date,
        issue_date: invoice.issue_date || null,
        notes: invoice.notes || "",
      };

      const params = new URLSearchParams({
        context: "order",
        invoice_id: String(invoice.id),
        return_url: orderReturnUrl,
      });

      navigate(`/${lang}/payment?${params.toString()}`, {
        state: {
          payment: mappedPayment,
          service: payloadData.service || selectedService,
          orderId,
          returnUrl: orderReturnUrl,
          paymentBase,
        },
      });
      closePopup();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        t("errorCreateOrderTryAgain");
      toast.error(message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const popupTitle = t("subscribeConfirmTitle", {
    serviceTitle: selectedService?.title || t("thisService"),
  });
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";

  return (
    <>
      <HeadProvider>
        <Title>{t("seoTitle", "المحامي | الخدمات القانونية")}</Title>
        <Meta name="description" content={t("seoDescription", "Legal services page")} />
      </HeadProvider>
      <section className={`${styles.services_page} `} dir={dir}>
        <PageHeader title={t("title")} />

        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{t("eyebrow")}</p>
            <h1 className={styles.title}>{t("title")}</h1>
            <p className={styles.subtitle}>{t("subtitle")}</p>
          </div>

          <div className={styles.controls}>
            <div className={styles.search}>
              <FiSearch size={16} />
              <input
                type="search"
                placeholder={t("searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className={styles.sort}>
              <LuArrowDownUp size={16} />
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          {loading &&
            Array.from({ length: 8 }).map((_, idx) => (
              <div key={`sk-${idx}`} className={styles.card}>
                <Skeleton.Circle size={52} className={styles.skCircle} />
                <Skeleton.Title width="80%" height={8} className={styles.skTitle} />

                <Skeleton.Title width="80%" height={8} className={styles.skTitle} />
                <Skeleton.Title width="80%" height={8} className={styles.skTitle} />
              </div>
            ))}

          {!loading &&
            filtered.map((service, idx) => {
              const icon =
                service?.icon_url && service.icon_url.trim().length
                  ? service.icon_url
                  : fallbackIcons[idx % fallbackIcons.length];
              return (
                <div
                  key={service.id || `${service.title}-${idx}`}
                  role="button"
                  tabIndex={0}
                  className={styles.card}
                  onClick={() => handleServiceClick(service)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleServiceClick(service);
                    }
                  }}
                >
                  <img src={icon} alt={service.title} className={styles.icon} />
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{service.title}</h3>
                    {service.description && (
                      <p className={styles.cardSubtitle}>{service.description}</p>
                    )}
                  </div>
                </div>
              );
            })}

          {!loading && !filtered.length && (
            <div className={styles.empty}>
              <p>{t("empty")}</p>
            </div>
          )}
        </div>
        <StatusPopup
          isOpen={isPopupOpen}
          status="confirm"
          title={popupTitle}
          onClose={closePopup}
          primaryAction={{
            label: confirmLoading ? t("loading") : t("yes"),
            onClick: handleConfirm,
            disabled: confirmLoading,
          }}
          secondaryAction={{
            label: t("no"),
            onClick: closePopup,
            disabled: confirmLoading,
          }}
        />
      </section>
    </>
  );
};

export default ServicePage;
