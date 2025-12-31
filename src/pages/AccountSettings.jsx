import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { HeadProvider, Meta, Title } from "react-head";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import Sidebar from "@/components/AcoountPage/Sidebar";
import styles from "./AccountSettings.module.scss";
import { AuthContext } from "@/context/AuthContext";
import { deleteAccount, getAccount, updateUserProfile } from "@/api/user";
import UserIcon from "@/assets/icons/User";
import PhoneIcon from "@/assets/icons/Phone";
import CalendarIcon from "@/assets/icons/Calendar";
import ChangePasswordMain from "@/components/ChangePasswordPage/MainContent";
import StatusPopup from "@/components/common/StatusPopup";
import Hypered from "@/utils/hyperedBridge";
import PageHeader from "@/components/common/PageHeader";
import { useTranslation } from "react-i18next";

const AccountSettings = () => {
  const { t } = useTranslation("accountSettings");
  const { user, refreshAccount, logout } = useContext(AuthContext);
  const { lng } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const base = `/${lng || "ar"}`;
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";

  const activeSubscription =
    user?.active_subscription ||
    (Array.isArray(user?.subscriptions)
      ? user.subscriptions.find((sub) => sub?.status === "active")
      : null);

  const planName =
    activeSubscription?.subscription_plan?.title ||
    activeSubscription?.subscription_plan?.name ||
    activeSubscription?.plan?.title ||
    activeSubscription?.plan?.name ||
    activeSubscription?.name ||
    null;

  const planStatus = activeSubscription?.status || (user?.is_subscribed ? "active" : "inactive");
  const planStatusLabel =
    planStatus === "active"
      ? t("statusActive")
      : planStatus === "inactive"
        ? t("statusInactive")
        : planStatus === "pending"
          ? t("statusPending")
          : planStatus || t("dash");

  const planEndsAt = activeSubscription?.ends_at || activeSubscription?.end_date || null;
  const planStartsAt = activeSubscription?.starts_at || activeSubscription?.start_date || null;
  const planPrice =
    activeSubscription?.price ||
    activeSubscription?.plan?.price ||
    activeSubscription?.subscription_plan?.price ||
    null;
  const planAutoRenew = activeSubscription?.auto_renew;
  const planPriceLabel = planPrice ? `${planPrice} ${t("currencySar")}` : t("notAvailable");
  const planAutoRenewLabel = planAutoRenew ? t("autoRenewEnabled") : t("autoRenewDisabled");

  const formatDateTime = (value) => {
    if (!value) return t("notAvailable");
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    const datePart = dt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const timePart = dt
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .replace(/\s/g, "")
      .toLowerCase();
    return `${datePart} - ${timePart}`;
  };

  const planEndsAtFormatted = useMemo(() => formatDateTime(planEndsAt), [planEndsAt]);
  const planStartsAtFormatted = useMemo(() => formatDateTime(planStartsAt), [planStartsAt]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [isInApp, setIsInApp] = useState(false);
  const [biometricActivated, setBiometricActivated] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  }, [user]);

  useEffect(() => {
    if (user?.email) {
      setAccountEmail(user.email);
    }
  }, [user?.email]);

  useEffect(() => {
    let mounted = true;
    Hypered.isInApp()
      .then((val) => {
        if (!mounted) return;
        setIsInApp(Boolean(val));
      })
      .catch(() => {
        if (mounted) setIsInApp(false);
      });

    try {
      const activated = localStorage.getItem("biometric_activated") === "true";
      setBiometricActivated(activated);
    } catch {
      setBiometricActivated(false);
    }

    return () => {
      mounted = false;
    };
  }, []);

  const fetchLatestAccountEmail = useCallback(async () => {
    setAccountLoading(true);
    try {
      const res = await getAccount();
      const fetchedEmail =
        res?.data?.data?.client?.email || res?.data?.client?.email || res?.data?.email || "";
      if (fetchedEmail) {
        setAccountEmail(fetchedEmail);
        return fetchedEmail;
      }
    } catch (err) {
      console.error("Failed to fetch account", err);
    } finally {
      setAccountLoading(false);
    }
    return accountEmail || user?.email || "";
  }, [accountEmail, user?.email]);

  useEffect(() => {
    if (!location?.hash) return;
    const targetId = location.hash.replace("#", "");
    const target = document.getElementById(targetId);
    if (!target) return;

    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location?.hash]);

  const fieldErrors = useMemo(() => {
    const next = {};
    const nameValue = form.name.trim();
    const emailValue = form.email.trim();
    const phoneValue = (form.phone || "").trim();

    if (!nameValue) next.name = t("nameRequired");
    if (!emailValue) {
      next.email = t("emailRequired");
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailValue)) {
      next.email = t("emailInvalid");
    }

    if (phoneValue && !/^[+\d()\s-]{6,}$/.test(phoneValue)) {
      next.phone = t("phoneInvalid");
    }
    return next;
  }, [form]);

  const isDirty = useMemo(() => {
    const initialName = (user?.name || "").trim();
    const initialEmail = (user?.email || "").trim();
    const initialPhone = (user?.phone || "").trim();

    return (
      form.name.trim() !== initialName ||
      form.email.trim() !== initialEmail ||
      (form.phone || "").trim() !== initialPhone
    );
  }, [form.email, form.name, form.phone, user?.email, user?.name, user?.phone]);

  const normalizedAccountEmail = useMemo(
    () => (accountEmail || "").trim().toLowerCase(),
    [accountEmail],
  );
  const emailMatches = useMemo(() => {
    const normalizedInput = confirmEmail.trim().toLowerCase();
    if (!normalizedInput || !normalizedAccountEmail) return false;
    return normalizedInput === normalizedAccountEmail;
  }, [confirmEmail, normalizedAccountEmail]);

  useEffect(() => {
    if (!confirmEmail.trim()) {
      setConfirmError("");
      return;
    }

    if (normalizedAccountEmail && !emailMatches) {
      setConfirmError(t("confirmEmailMismatchCurrent"));
    } else {
      setConfirmError("");
    }
  }, [confirmEmail, emailMatches, normalizedAccountEmail]);

  const showError = (key) => touched[key] && fieldErrors[key];

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const openDeleteModal = async () => {
    setConfirmEmail("");
    setConfirmError("");
    try {
      const activated = localStorage.getItem("biometric_activated") === "true";
      setBiometricActivated(activated);
    } catch {
      setBiometricActivated(false);
    }
    setDeleteModalOpen(true);
    await fetchLatestAccountEmail();
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteModalOpen(false);
    setConfirmEmail("");
    setConfirmError("");
  };

  const ensureBiometricAuthenticated = async () => {
    if (!isInApp || !biometricActivated) return true;

    const token = await Hypered.loadBiometricToken();
    if (!token) {
      throw new Error(t("biometricCanceled"));
    }
    try {
      localStorage.setItem("access_token", token);
      sessionStorage.setItem("hypered_biometric_token", token);
    } catch (err) {
      console.warn("Failed to persist biometric token", err);
    }
    return true;
  };

  const handleDeleteAccount = async () => {
    if (!emailMatches) {
      setConfirmError(t("confirmEmailPrompt"));
      return;
    }

    setDeleteLoading(true);
    const toastId = toast.loading(t("deleteLoading"));
    try {
      const latestEmail = (await fetchLatestAccountEmail()) || normalizedAccountEmail;
      if (latestEmail && confirmEmail.trim().toLowerCase() !== latestEmail.trim().toLowerCase()) {
        setConfirmError(t("deleteEmailMismatch"));
        toast.error(t("deleteCheckEmail"), { id: toastId });
        setDeleteLoading(false);
        return;
      }

      if (isInApp) {
        await ensureBiometricAuthenticated();
      }

      await deleteAccount();
      toast.success(t("deleteSuccess"), { id: toastId });
      setDeleteModalOpen(false);
      try {
        await logout?.();
      } catch (err) {
        console.error("Logout after delete failed", err);
      }
      navigate(`${base}/login`, { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.join(". ") : "") ||
        err?.message ||
        t("deleteFailed");
      toast.error(message, { id: toastId });
      if (!confirmError) setConfirmError(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasErrors = Object.keys(fieldErrors).length > 0;
    if (hasErrors) {
      setTouched({ name: true, email: true, phone: true });
      return;
    }

    if (!isDirty) {
      toast(t("noChangesToSave"));
      return;
    }

    setLoading(true);
    const toastId = toast.loading(t("saveLoading"));
    try {
      const phoneValue = (form.phone || "").trim();
      await updateUserProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: phoneValue || null,
      });
      toast.success(t("saveSuccess"), { id: toastId });
      if (typeof refreshAccount === "function") {
        await refreshAccount();
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.join(". ") : "") ||
        err?.message ||
        t("saveFailed");
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HeadProvider>
        <Title>{t("seoTitle", "إعدادات الحساب | المحامي")}</Title>
        <Meta name="description" content={t("seoDescription", "Account settings page")} />
      </HeadProvider>
      <PageHeader title={t("pageHeader")} />

      <Sidebar variant="profile" />
    </>
  );
};

export default AccountSettings;
