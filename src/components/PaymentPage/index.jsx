import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import PageHeader from "@/components/common/PageHeader";
import styles from "./index.module.scss";
import { useTranslation } from "react-i18next";

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

const PaymentPage = () => {
  const { t } = useTranslation("payment");
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { lng } = useParams();
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";

  const navState = location.state || {};
  const contextFromParams = searchParams.get("context") === "package" ? "package" : "order";
  const [mode, setMode] = useState(contextFromParams);
  const [method, setMethod] = useState("tamara");

  const paymentFromState = navState?.payment || null;

  useEffect(() => {
    setMode(contextFromParams);
  }, [contextFromParams]);

  const orderDetails = useMemo(() => {
    if (paymentFromState) {
      return {
        id: paymentFromState.invoice_no || `#${paymentFromState.id}`,
        status: paymentFromState.status_label || paymentFromState.status || t("pendingPayment"),
        amount: Number(paymentFromState.amount) || 0,
        currency: paymentFromState.currency || t("currencySar"),
        issueDate: formatDate(paymentFromState.issue_date),
        dueDate: formatDate(paymentFromState.due_date),
        notes: paymentFromState.notes || "",
      };
    }

    // 🔁 Fallback قديم لو مفيش payment في الـ state
    return {
      id: "#12345",
      status: t("pendingPayment"),
      amount: 250,
      currency: t("currencySar"),
      issueDate: "10/10/2025",
      dueDate: "19/10/2025",
      notes: "",
    };
  }, [paymentFromState, t]);

  const planFromState = navState?.plan || {};
  const planTitleParam = searchParams.get("plan_title");
  const planPriceParam = searchParams.get("plan_price");
  const planIdParam = searchParams.get("plan_id");
  const planPriceValue = planPriceParam ? Number(planPriceParam) : null;

  const packageDetails = useMemo(
    () => ({
      id: planFromState?.id || planIdParam,
      name: planFromState?.title || planTitleParam || t("fallbackPackageName"),
      tier: planFromState?.tier || t("fallbackPackageTier"),
      duration: planFromState?.duration || t("fallbackPackageDuration"),
      renewal: planFromState?.renewal || t("fallbackPackageRenewal"),
      price: Number.isFinite(planPriceValue) ? planPriceValue : planFromState?.price || 250,
      cadence: planFromState?.cadence || t("fallbackPackageCadence"),
      features:
        planFromState?.attributes?.map((a) => a?.value || a) ||
        t("fallbackPackageFeatures", { returnObjects: true }),
    }),
    [planFromState, planIdParam, planPriceValue, planTitleParam, t],
  );

  const invoiceId =
    searchParams.get("invoice_id") ||
    navState?.invoiceId ||
    navState?.invoice_id ||
    navState?.invoice;

  const returnUrlParam = searchParams.get("return_url");
  const orderReturnUrl =
    navState?.orderId && `${window.location.origin}/${lng || "ar"}/orders/${navState.orderId}`;
  const computedReturnUrl =
    orderReturnUrl ||
    returnUrlParam ||
    navState?.returnUrl ||
    `${window.location.origin}/${lng || "ar"}/success${
      packageDetails?.id ? `?plan_id=${packageDetails.id}` : ""
    }`;

  const paymentBase =
    navState?.paymentBase ||
    import.meta.env.VITE_PAYMENT_BASE_URL ||
    "https://fawaz-law-firm.apphub.my.id";

  const handlePay = () => {
    if (!invoiceId) {
      toast.error(t("invoiceDataMissing"));
      return;
    }
    const paymentUrl = `${paymentBase}/payments/invoice/${invoiceId}?return_url=${encodeURIComponent(
      computedReturnUrl,
    )}${method ? `&method=${encodeURIComponent(method)}` : ""}`;
    window.location.href = paymentUrl;
  };

  const paymentMethods = useMemo(
    () => [
      {
        id: "tamara",
        label: t("methodTamara"),
        hint: t("methodTamaraHint"),
        logo: "/assets/icons/tamara.svg",
        alt: "Tamara",
      },
      {
        id: "tabby",
        label: t("methodTabby"),
        hint: t("methodTabbyHint"),
        logo: "/assets/icons/tabby.svg",
        alt: "Tabby",
      },
    ],
    [t],
  );

  const summary = useMemo(() => {
    if (mode === "package") {
      // 🎁 وضع الباقة – نفس الشغل القديم بالظبط
      return {
        title: t("summaryPackageTitle"),
        fields: [
          { label: t("fieldPackageName"), value: packageDetails.name },
          { label: t("fieldPackageType"), value: packageDetails.tier },
          { label: t("fieldSubscriptionDuration"), value: packageDetails.duration },
          { label: t("fieldRenewal"), value: packageDetails.renewal },
        ],
        tag: t("tagSelectedPackage"),
        amount: packageDetails.price,
        currency: t("currencySar"),
        cadence: packageDetails.cadence,
        features: packageDetails.features,
      };
    }

    // 💳 وضع الفاتورة (طلب)
    const fields = [
      { label: t("fieldInvoiceNumber"), value: orderDetails.id },
      { label: t("fieldIssueDate"), value: orderDetails.issueDate },
      { label: t("fieldDueDate"), value: orderDetails.dueDate },
      orderDetails.notes ? { label: t("fieldNotes"), value: orderDetails.notes } : null,
    ].filter(Boolean);

    return {
      title: t("summaryInvoiceTitle"),
      fields,
      tag: orderDetails.status,
      amount: orderDetails.amount,
      currency: orderDetails.currency || t("currencySar"),
      cadence: null,
      features: null,
    };
  }, [mode, packageDetails, orderDetails, t]);

  return (
    <section id="payment" className={`pb-24 ${styles.payment}`} dir={dir}>
      <div className="container">
        <div className={styles.shell}>
          <PageHeader title={t("pageTitle")} />

          <div className={styles.sectionTitle}>{summary.title}</div>

          <div className={styles.summaryCard}>
            <div className={styles.grid}>
              {summary.fields.map((field) => (
                <div key={field.label} className={styles.field}>
                  <span className={styles.fieldLabel}>{field.label}:</span>
                  <span className={styles.fieldValue}>{field.value}</span>
                </div>
              ))}
            </div>

            {summary.features && (
              <div className={styles.features}>
                {summary.features.map((item) => (
                  <div key={item} className={styles.featureItem}>
                    <span className={styles.bullet} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.statusChip}>{summary.tag}</div>
          </div>

          <div className={styles.amountRow}>
            <span className={styles.amountLabel}>{t("amountDue")}</span>
            <div className={styles.amountValue}>
              <span className={styles.amountNumber}>{summary.amount}</span>
              <span className={styles.currency}>{summary.currency || t("currencySar")}</span>
              {summary.cadence && <span className={styles.cadence}>/ {summary.cadence}</span>}
            </div>
          </div>

          <div className={styles.sectionTitle}>{t("paymentMethodTitle")}</div>

          <div className={styles.methodsCard}>
            {paymentMethods.map((option) => (
              <button
                key={option.id}
                type="button"
                className={styles.methodRow}
                onClick={() => setMethod(option.id)}
              >
                <div className={`${styles.radio} ${method === option.id ? styles.selected : ""}`}>
                  <span className={styles.radioDot} />
                </div>
                <div className={styles.methodCopy}>
                  <div className={styles.methodLabel}>{option.label}</div>
                  <div className={styles.methodHint}>{option.hint}</div>
                </div>
                <img src={option.logo} alt={option.alt} className={styles.methodLogo} />
              </button>
            ))}
          </div>

          <button type="button" className={styles.primaryBtn} onClick={handlePay}>
            {t("pay")}
          </button>
        </div>
      </div>
    </section>
  );
};

export default PaymentPage;
