import React, { useContext, useEffect, useMemo, useState } from "react";
import styles from "./index.module.scss";
import PageHeader from "@/components/common/PageHeader";
import StatusPopup from "@/components/common/StatusPopup";
import { getSubscriptionPlans, subscribeAccount, unsubscribeAccount } from "@/api/user";
import { AuthContext } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import Skeleton from "@/components/Skeleton";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const fallbackPlans = [];

const PackagesPage = () => {
  const { t } = useTranslation("packages");
  const { user, refreshAccount } = useContext(AuthContext);
  const { lng } = useParams();
  const navigate = useNavigate();
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popupState, setPopupState] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [cancelCode, setCancelCode] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const res = await getSubscriptionPlans();
        const list = res?.data?.data?.plans || res?.data?.plans || [];
        setPlans(list);
      } catch (err) {
        toast.error(t("loadFailed"));
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [t]);

  const handleClosePopup = () => {
    setPopupState(null);
    setSelectedPlan(null);
    setCancelCode("");
  };

  const handleOpenSubscribePopup = (pkg) => {
    if (activeSub) {
      setSelectedPlan(pkg);
      setPopupState("alreadySubscribed");
      return;
    }
    setSelectedPlan(pkg);
    setPopupState("subscribeConfirm");
  };

  const handleConfirmSubscribe = async () => {
    if (subscribeLoading) return;
    if (!selectedPlan?.id) {
      toast.error(t("selectPlan"));
      return;
    }

    setSubscribeLoading(true);

    try {
      const res = await subscribeAccount(selectedPlan.id);
      const message = res?.data?.message || t("subscribedSuccess");
      toast.success(message);
      const sub = res?.data?.data?.subscription || null;
      const invoiceId =
        res?.data?.data?.invoice?.id ||
        res?.data?.data?.invoice_id ||
        res?.data?.invoice_id ||
        res?.data?.invoice?.id;
      if (!invoiceId) {
        toast.error(t("noInvoiceId"));
        setSubscribeLoading(false);
        return;
      }
      if (sub) setActiveSub(sub);
      const lang = lng || "ar";
      const returnUrl = `${window.location.origin}/${lang}/success?plan_id=${selectedPlan.id}`;
      const paymentBase =
        import.meta.env.VITE_PAYMENT_BASE_URL || "https://fawaz-law-firm.apphub.my.id";
      // toast.success("سيتم تحويلك لبوابة الدفع الآن");

      const params = new URLSearchParams({
        context: "package",
        invoice_id: String(invoiceId),
        plan_id: String(selectedPlan.id),
        plan_title: selectedPlan.title || "",
        plan_price: selectedPlan.price != null ? String(selectedPlan.price) : "",
        return_url: returnUrl,
      });

      navigate(`/${lang}/payment?${params.toString()}`, {
        replace: false,
        state: {
          plan: selectedPlan,
          invoiceId,
          returnUrl,
          paymentBase,
        },
      });
      handleClosePopup();
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("subscribeFailed");
      toast.error(apiMsg);
    } finally {
      setSubscribeLoading(false);
    }
  };

  const activeSubscription = useMemo(() => {
    if (user?.active_subscription) return user.active_subscription;
    if (Array.isArray(user?.subscriptions)) {
      return user.subscriptions.find((s) => s.status === "active");
    }
    return null;
  }, [user]);

  useEffect(() => {
    setActiveSub(activeSubscription || null);
  }, [activeSubscription]);

  const displayPlans = useMemo(() => {
    if (plans && plans.length) {
      const promoted = plans.filter((p) => p.is_promoted);
      const rest = plans.filter((p) => !p.is_promoted);
      return [...promoted, ...rest];
    }
    return fallbackPlans;
  }, [plans]);

  const handleCancelSubscription = async () => {
    if (cancelCode.trim() !== "1234") {
      toast.error(t("cancelCodeRequired"));
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error(t("loginFirst"));
      return;
    }

    setCancelLoading(true);
    try {
      const res = await unsubscribeAccount();
      const message = res?.data?.message || t("unsubscribedSuccess");
      toast.success(message);
      const sub = res?.data?.data?.subscription || null;
      setActiveSub(sub && sub.status === "active" ? sub : null);
      if (refreshAccount) {
        await refreshAccount();
      }
      setPopupState("cancelSuccess");
      setCancelCode("");
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("unsubscribeFailed");
      toast.error(apiMsg);
    } finally {
      setCancelLoading(false);
    }
  };

  const renderPopup = () => {
    switch (popupState) {
      case "subscribeConfirm":
        return (
          <StatusPopup
            isOpen
            status="confirm"
            title={t("subscribeConfirmTitle", {
              planTitle: selectedPlan?.title || t("thisPlan"),
            })}
            description={t("subscribeConfirmDescription")}
            onClose={handleClosePopup}
            disableClose={subscribeLoading}
            secondaryAction={{
              label: t("subscribeNo"),
              onClick: handleClosePopup,
              disabled: subscribeLoading,
            }}
            primaryAction={{
              label: subscribeLoading ? t("subscribing") : t("subscribeYes"),
              onClick: handleConfirmSubscribe,
              disabled: subscribeLoading,
            }}
          />
        );
      case "subscribeSuccess":
        return (
          <StatusPopup
            isOpen
            status="success"
            title={t("subscribedTitle")}
            description={t("subscribedDescription", {
              planTitle: selectedPlan?.title || t("thisPlan"),
            })}
            onClose={handleClosePopup}
            primaryAction={{
              label: t("close"),
              onClick: handleClosePopup,
            }}
          />
        );
      case "alreadySubscribed": {
        const activeTitle = activeSub?.plan.title || t("currentPlan");
        return (
          <StatusPopup
            isOpen
            status="pending"
            title={t("alreadySubscribedTitle")}
            description={t("alreadySubscribedDescription", { planTitle: activeTitle })}
            onClose={handleClosePopup}
            primaryAction={{
              label: t("cancelCurrentSubscription"),
              onClick: () => setPopupState("cancelConfirm"),
            }}
            secondaryAction={{
              label: t("close"),
              onClick: handleClosePopup,
            }}
          />
        );
      }
      case "cancelConfirm":
        return (
          <StatusPopup
            isOpen
            status="confirm"
            title={t("cancelSubscriptionConfirmTitle")}
            description={t("cancelSubscriptionConfirmDescription")}
            onClose={handleClosePopup}
            disableClose={cancelLoading}
            secondaryAction={{
              label: t("back"),
              onClick: handleClosePopup,
              disabled: cancelLoading,
            }}
            primaryAction={{
              label: cancelLoading ? t("canceling") : t("cancelSubscription"),
              onClick: handleCancelSubscription,
              disabled: cancelLoading,
            }}
            bullets={[t("cancelSubscriptionHint1"), t("cancelSubscriptionHint2")]}
          >
            <div className={styles.cancelRowPopup}>
              <input
                dir="ltr"
                inputMode="numeric"
                pattern="[0-9]*"
                className={styles.cancelInput}
                placeholder="1234"
                value={cancelCode}
                onChange={(e) => setCancelCode(e.target.value)}
                disabled={cancelLoading}
              />
            </div>
          </StatusPopup>
        );
      case "cancelSuccess":
        return (
          <StatusPopup
            isOpen
            status="success"
            title={t("unsubscribedTitle")}
            description={t("unsubscribedDescription")}
            onClose={handleClosePopup}
            primaryAction={{
              label: t("ok"),
              onClick: handleClosePopup,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <section
      id="packages-page"
      className={`pb-24 ${styles.packagesSection} my-0 md:my-[158px]`}
      dir={dir}
    >
      <div className="mobile">
        <PageHeader title={t("pageTitle")} />
      </div>

      <div className="container mt-2 flex flex-col gap-4">
        {/* Active package */}
        {loading ? (
          <div className={`${styles.packageCard} p-4`}>
            <div className={`${styles.box} flex items-start gap-3`}>
              <div className="flex-1 md:text-center">
                <Skeleton.Title width="100%" className="mb-2" />
                <Skeleton.Text lines={3} lineHeight={10} />
                <Skeleton.Button width="100%" className="mt-3" />
              </div>
              <div className={`${styles.priceCol}`}>
                <Skeleton.Rect width={56} height={22} />
              </div>
            </div>
          </div>
        ) : (
          activeSub && (
            <div className={`${styles.packageCard} ${styles.active} p-4`}>
              <div className={`${styles.box} flex items-start gap-3`}>
                <div className="flex-1 md:text-center">
                  <div className="text-[#000E1A] font-normal text-sm md:text-base">
                  <div className=" text-center">
                    <h2
                      className="font-extrabold text-primary  text-3xl
"
                    >
                      {t("currentPlanBadge")}
                    </h2>
                  </div>
                    <div
                      key={activeSub.id}
                      className={`${styles.packageCard} ${styles.active}  p-4`}
                    >
                      <div className={`${styles.box} flex items-start gap-3`}>
                        {/* Content */}

                        <div className="flex-1 md:text-center">
                          <div className={`${styles.priceCol}`}>
                            <span className="font-normal text-base text-[#000000] md:text-3xl ">
                              {activeSub.price}
                            </span>

                            <span className="text-base">
                              <img src="/assets/imgs/currancy.png" alt=" currancy" width={16} />
                            </span>
                          </div>
                          <div className="text-[#000E1A] font-normal text-sm md:text-base">
                            {activeSub.plan?.title}
                          </div>
                          <ul
                            className={`${styles.bullets}  text-[#2a2a2a] text-sm mt-2 leading-6`}
                          >
                            {(activeSub.plan?.attributes || []).map((b, i) => (
                              <li className="font-normal   text-[#5F5F5F] text-xs" key={i}>
                                {b.value || b}
                              </li>
                            ))}
                          </ul>

                          <button
                            type="button"
                            className={`${styles.current} mt-3 w-full`}
                            onClick={() => setPopupState("cancelConfirm")}
                          >
                            {t("cancelBadge")}
                          </button>
                        </div>

                        {/* Price column (left visually) */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
        <div className="mobile">
          <hr />
        </div>
        {/* Promo Card */}
        {/* <div className="mobile">
          <div className={`${styles.promoCard} p-4 flex items-center justify-between gap-4`}>
            <div className={styles.bg}>
              <img src="/assets/imgs/wave_shape.png" alt="wave bg" />
            </div>
            <div className="flex flex-col gap-2 text-start">
              <h3 className="text-white text-base font-bold">احتفالاً باليوم الوطني</h3>
              <p className="text-[#E8F1F8] text-sm">
                نقدم لك عرضاً مميزاً على الباقات لفترة محدودة
              </p>
              <button className={`${styles.subscribeBtn} w-fit mt-1`}>اشترك الآن</button>
            </div>

            <div className="flex-shrink-0">
              <div className={`${styles.promoImgWrap} `}>
                <img
                  src="/assets/imgs/lawyer.png"
                  alt="promo"
                  className="w-full h-full object-cover -scale-[-1]"
                />
              </div>
            </div>
          </div>
        </div> */}

        <div className="desktop text-center">
          <h2
            className="font-extrabold text-primary  text-3xl
"
          >
            {t("heroTitle")}
          </h2>
          <p className="text-[#000000]  text-xl font-normal mt-3 mb-5">
            {t("heroSubtitle")}
          </p>
        </div>

        {/* Packages List */}
        <div className={`${styles.boxes_container} flex flex-col gap-3 md:gap-2`}>
          {loading &&
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={`sk-${idx}`} className={`${styles.packageCard} p-4`}>
                <div className={`${styles.box} flex items-start gap-3`}>
                  <div className="flex-1 md:text-center" style={{ width: "100%" }}>
                    <Skeleton.Title width="100%" className="mb-2" />
                    <Skeleton.Text lines={3} lineHeight={10} />
                    <Skeleton.Button width="100%" className="mt-3" />
                  </div>
                  <div className={`${styles.priceCol}`}>
                    <Skeleton.Rect width={56} height={22} />
                  </div>
                </div>
              </div>
            ))}
          {!loading &&
            displayPlans.map((pkg) => {
              const isPromoted = pkg.is_promoted;
              return (
                <div
                  key={pkg.id}
                  className={`${styles.packageCard} ${isPromoted ? styles.promoted : ""} p-4`}
                >
                  <div className={`${styles.box} flex items-start gap-3`}>
                    {/* Content */}
                    <div className="flex-1 md:text-center w-full">
                      <div
                        className={`${styles.titleRow} ${isPromoted ? styles.promotedTitle : ""}`}
                      >
                        <span className=" font-normal text-sm md:text-base">{pkg.title}</span>
                      </div>
                      <ul className={`${styles.bullets}  text-[#2a2a2a] text-sm mt-2 leading-6`}>
                        {(pkg.attributes || []).map((b, i) => (
                          <li className="font-normal   text-[#5F5F5F] text-xs" key={i}>
                            {b.value || b}
                          </li>
                        ))}
                      </ul>

                      {isPromoted ? (
                        <button
                          className={`${styles.subscribeBtn} w-fit mt-1`}
                          onClick={() => handleOpenSubscribePopup(pkg)}
                        >
                          {t("subscribeNow")}
                        </button>
                      ) : (
                        <div className={styles.actionRow}>
                          <button
                            className={`${styles.main} ${isPromoted ? styles.promotedBtn : ""} mt-3 w-full`}
                            onClick={() => handleOpenSubscribePopup(pkg)}
                          >
                            {t("subscribeNow")}
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Price column (left visually) */}
                    <div className={`${styles.priceCol} ${isPromoted ? styles.promotedPrice : ""}`}>
                      <span className="font-normal text-base text-[#000000] md:text-3xl ">
                        {pkg.price}
                      </span>
                      <span className="text-base">
                        <img src="/assets/imgs/currancy.png" alt=" currancy" width={16} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {renderPopup()}
    </section>
  );
};

export default PackagesPage;
