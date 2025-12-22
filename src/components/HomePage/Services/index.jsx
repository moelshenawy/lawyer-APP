import React, { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import styles from "./index.module.scss";
import axiosClient from "@/api/axiosClient";
import Skeleton from "@/components/Skeleton";
import StatusPopup from "@/components/common/StatusPopup";
import { useTranslation } from "react-i18next";

const fallbackIcons = [
  "/assets/icons/services/1.svg",
  "/assets/icons/services/2.svg",
  "/assets/icons/services/3.svg",
];

const Services = () => {
  const { lng } = useParams();
  const navigate = useNavigate();
  const base = `/${lng || "ar"}`;
  const { t } = useTranslation("home");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";

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

  const items = useMemo(() => (services && services.length ? services : []), [services]);

  const handleCardClick = (service) => {
    setSelectedService(service);
    setPopupOpen(true);
  };

  const closePopup = () => {
    setPopupOpen(false);
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
        const errorMsg = response?.data?.message || t("errorCreateOrderLater");
        toast.error(errorMsg);
        return;
      }

      const orderId = payloadData.id;
      const invoice = payloadData.invoice || null;
      const lang = lng || "ar";
      const returnUrl = `${window.location.origin}/${lang}/orders/${orderId}`;
      const paymentBase =
        import.meta.env.VITE_PAYMENT_BASE_URL || "https://fawaz-law-firm.apphub.my.id";

      if (!invoice) {
        navigate(`/${lang}/orders/${orderId}`);
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
        return_url: returnUrl,
      });

      navigate(`/${lang}/payment?${params.toString()}`, {
        state: {
          payment: mappedPayment,
          service: payloadData.service || selectedService,
          orderId,
          returnUrl,
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

  return (
    <section id="services" className={`${styles.services_section}  mt-4`} dir={dir}>
      <div className={styles.header}>
        <h3 className={`${styles.section_title} text-start text-[#0D2B49] font-semibold`}>
          {t("servicesTitle")}
        </h3>
        <button
          type="button"
          className={styles.show_all}
          onClick={() => navigate(`${base}/service`)}
        >
          {t("showAll")}
        </button>
      </div>

      <Swiper
        modules={[FreeMode]}
        freeMode
        spaceBetween={10}
        slidesPerView={1.3}
        breakpoints={{
          1: { slidesPerView: 2.1, spaceBetween: 16 },
          640: { slidesPerView: 3, spaceBetween: 16 },
          820: { slidesPerView: 4, spaceBetween: 16 },
          1024: { slidesPerView: 5, spaceBetween: 18 },
          1200: { slidesPerView: 6, spaceBetween: 20 },
        }}
        className={styles.services_swiper}
      >
        {loading &&
          Array.from({ length: 6 }).map((_, idx) => (
            <SwiperSlide key={`sk-${idx}`} className={styles.slide}>
              <div className={`${styles.service_card} flex flex-col items-center justify-center`}>
                <Skeleton.Circle size={44} className={styles.skeleton_circle} />
                <Skeleton.Rect width={70} height={12} className={styles.skeleton_label} />
              </div>
            </SwiperSlide>
          ))}

        {!loading &&
          items.map((service, idx) => {
            const icon =
              service.icon_url && service.icon_url.trim().length
                ? service.icon_url
                : fallbackIcons[idx % fallbackIcons.length];
            return (
              <SwiperSlide key={service.id || `${service.title}-${idx}`} className={styles.slide}>
                <div
                  className={`${styles.service_card} flex flex-col items-center justify-center`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCardClick(service)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(service);
                    }
                  }}
                >
                  <img src={icon} alt={service.title} className={styles.service_icon} />
                  <p className={styles.service_title}>{service.title}</p>
                </div>
              </SwiperSlide>
            );
          })}
      </Swiper>

      <StatusPopup
        isOpen={popupOpen}
        status="confirm"
        title={t("subscribeConfirmTitle", {
          serviceTitle: selectedService?.title || t("thisService"),
        })}
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
  );
};

export default Services;
