import React, { useEffect, useState } from "react";
import { HeadProvider, Meta, Title } from "react-head";
import Skeleton from "@/components/Skeleton";
import { IoIosArrowForward } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./Notification.module.scss";
import { getNotifications } from "@/api/notifications";

const formatDateTime = (value) => {
  if (!value) return "";
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return value;
  }
};

const getRelativeTime = (value, t) => {
  if (!value) return "";
  const dateValue = new Date(value).getTime();
  if (Number.isNaN(dateValue)) return "";

  const now = Date.now();
  const diffSeconds = Math.floor((now - dateValue) / 1000);
  if (diffSeconds < 0) return t("relative.now");
  if (diffSeconds < 60) return t("relative.now");

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return t("relative.minutesAgo", { count: diffMinutes });

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return t("relative.hoursAgo", { count: diffHours });

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return t("relative.daysAgo", { count: diffDays });

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7) || 1;
    return t("relative.weeksAgo", { count: weeks });
  }

  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30) || 1;
    return t("relative.monthsAgo", { count: months });
  }

  const diffYears = Math.floor(diffDays / 365) || 1;
  return t("relative.yearsAgo", { count: diffYears });
};

const NotificationPage = () => {
  const { lng } = useParams();
  const navigate = useNavigate();
  const base = `/${lng || "ar"}`;
  const { t } = useTranslation("notifications");

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getNotifications(10);
        const received = res?.data?.data?.notifications || [];
        if (isMounted) {
          setNotifications(received);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err?.response?.data?.message || t("errorFallback"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const goBack = () => navigate(base);

  return (
    <section className={styles.page} dir="rtl">
      <HeadProvider>
        <Title>{t("seoTitle", "الإشعارات | المحامي")}</Title>
        <Meta name="description" content={t("seoDescription", "Notifications page")} />
      </HeadProvider>

      <div className={`${styles.shell} container`}>
        <div className={styles.headerRow}>
          <div className={styles.titleRow}>
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={goBack}
              aria-label={t("backAria")}
            >
              <IoIosArrowForward size={18} />
            </button>
            <h1>{t("title")}</h1>
          </div>
        </div>

        {/* {loading && <p className={styles.statusText}>{t("loading")}</p>} */}
        {error && !loading && <p className={styles.error}>{error}</p>}

        {!loading && !error && notifications.length === 0 && (
          <p className={styles.statusText}>{t("empty")}</p>
        )}

        {loading ? (
          <div className={styles.cardStack}>
            {Array.from({ length: 3 }).map((_, index) => (
              <article key={`skeleton-${index}`} className={styles.item}>
                <div className={styles.itemHead}>
                  <Skeleton
                    variant="chip"
                    width={70}
                    height={16}
                    className={styles.skeletonBadge}
                  />
                  <Skeleton width="40%" height={20} className={styles.skeletonTitle} />
                </div>
                <Skeleton variant="text" lines={2} lineHeight={16} gap={8} />
                <div className={styles.metaRow}>
                  <Skeleton width={110} height={12} />
                  <Skeleton width={120} height={12} className={styles.skeletonAction} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.cardStack}>
            {notifications.map((item) => {
              const severity = (item?.severity || "info").toLowerCase();
              const severityClass = styles[`severity_${severity}`] || "";
              const actionUrl = item?.action?.url;
              const relativeTimeText = getRelativeTime(item.datetime, t);
              const timestampTitle = formatDateTime(item.datetime);
              const content = (
                <article className={styles.item} aria-label={item.title}>
                  <div className={styles.itemHead}>
                    <span
                      className={`${styles.severityBadge} ${severityClass}`.trim()}
                      aria-label={severity}
                    />
                    <h3 className={styles.itemTitle}>{item.title}</h3>
                  </div>
                  <p className={styles.text}>{item.description}</p>
                  <div className={styles.metaRow}>
                    <span className={styles.datetime} title={timestampTitle}>
                      {relativeTimeText || timestampTitle}
                    </span>
                    {actionUrl ? (
                      <span className={styles.actionLink} role="link">
                        {t("openAction")}
                      </span>
                    ) : (
                      ""
                      // <span className={styles.noAction}>{t("noAction")}</span>
                    )}
                  </div>
                </article>
              );

              return (
                <div key={item.datetime + item.title} className={styles.itemWrapper}>
                  {actionUrl ? (
                    <a
                      href={actionUrl}
                      rel="noreferrer"
                      className={styles.itemLink}
                    >
                      {content}
                    </a>
                  ) : (
                    <div className={styles.itemLink}>{content}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default NotificationPage;
