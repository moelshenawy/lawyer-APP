import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { HeadProvider, Meta, Title } from "react-head";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
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

const AccountSettingsPage = () => {
  const { t } = useTranslation("accountSettings");
  const { user, refreshAccount, logout } = useContext(AuthContext);
  const { lng } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const base = `/${lng || "ar"}`;
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";

  // ✅ Same shape as <User /> component: user.account
  // Keep fallback to user to not break if shape changes.
  const account = useMemo(() => user?.account ?? user ?? {}, [user]);

  const accountName = account?.name || t("defaultClientName");
  const accountEmailValue = account?.email || "";
  const accountPhoneValue = account?.phone || "";
  const isActive = Boolean(account?.is_active);
  const lastLoginLabel = account?.last_login_at || "";
  const lastLoginSince = account?.last_login_at_since || "";

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

  // ✅ Fill form from account (NOT user root fields)
  useEffect(() => {
    setForm({
      name: account?.name || "",
      email: account?.email || "",
      phone: account?.phone || "",
    });
  }, [account?.name, account?.email, account?.phone]);

  useEffect(() => {
    if (account?.email) setAccountEmail(account.email);
  }, [account?.email]);

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

  // ✅ getAccount response now includes data.account.email
  const fetchLatestAccountEmail = useCallback(async () => {
    setAccountLoading(true);
    try {
      const res = await getAccount();
      const fetchedEmail =
        res?.data?.data?.account?.email ||
        res?.data?.account?.email ||
        res?.data?.data?.email ||
        res?.data?.email ||
        "";
      if (fetchedEmail) {
        setAccountEmail(fetchedEmail);
        return fetchedEmail;
      }
    } catch (err) {
      console.error("Failed to fetch account", err);
    } finally {
      setAccountLoading(false);
    }
    return accountEmail || accountEmailValue || "";
  }, [accountEmail, accountEmailValue]);

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
  }, [form, t]);

  const isDirty = useMemo(() => {
    const initialName = (account?.name || "").trim();
    const initialEmail = (account?.email || "").trim();
    const initialPhone = (account?.phone || "").trim();

    return (
      form.name.trim() !== initialName ||
      form.email.trim() !== initialEmail ||
      (form.phone || "").trim() !== initialPhone
    );
  }, [form.email, form.name, form.phone, account?.email, account?.name, account?.phone]);

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
  }, [confirmEmail, emailMatches, normalizedAccountEmail, t]);

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

      <div
        className={`relative flex flex-col md:flex-row items-start w-full  pb-[140px]  ${styles.page}`}
        dir={dir}
      >
        <section className={styles.content} id="settings">
          <div className={styles.hero}>
            <div className={styles.heroHead}>
              <div className={styles.badge}>{t("profileBadge")}</div>
              <h1 className={styles.heroTitle}>{t("heroTitle")}</h1>
              <p className={styles.heroText}>{t("heroSubtitle")}</p>
            </div>

            <div className={styles.heroMeta}>
              <div className={styles.chip}>
                <UserIcon size={16} />
                <span>{accountName}</span>
              </div>

              <div className={styles.chip}>
                <PhoneIcon size={16} />
                <span>{accountPhoneValue || t("phoneNotAdded")}</span>
              </div>

              <div className={styles.chip}>
                <CalendarIcon size={16} />
                <span>
                  {t("accountStatusPrefix")} {isActive ? t("statusActive") : t("statusInactive")}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <p className={styles.infoLabel}>{t("labelEmail")}</p>
              <p className={styles.infoValue}>{form.email || t("addEmail")}</p>
            </div>

            <div className={styles.infoCard}>
              <p className={styles.infoLabel}>{t("labelPhone")}</p>
              <p className={styles.infoValue}>{form.phone || t("addPhone")}</p>
            </div>

            <div className={styles.infoCard}>
              <p className={styles.infoLabel}>{t("labelStatus")}</p>
              <p className={styles.infoValue}>
                {isActive ? t("statusActive") : t("statusInactive")}
                {lastLoginSince ? ` • ${lastLoginSince}` : ""}
              </p>
              {lastLoginLabel ? <p className={styles.sectionText}>{lastLoginLabel}</p> : null}
            </div>
          </div>

          <form className={styles.formCard} onSubmit={handleSubmit}>
            <div className={styles.formHead}>
              <div>
                <p className={styles.eyebrow}>{t("personalDataEyebrow")}</p>
                <h2 className={styles.sectionTitle}>{t("personalDataTitle")}</h2>
                <p className={styles.sectionText}>{t("personalDataHint")}</p>
              </div>
              <div className={styles.statusPill}>
                <span className={styles.statusDot} />
                {t("secureConnection")}
              </div>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.label}>{t("fullName")}</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange("name")}
                  className={styles.input}
                  placeholder={t("fullNamePlaceholder")}
                  disabled={loading}
                />
                {showError("name") && <span className={styles.error}>{fieldErrors.name}</span>}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>{t("labelPhone")}</span>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  className={styles.input}
                  placeholder={t("phonePlaceholder")}
                  disabled={loading}
                  inputMode="tel"
                />
                {showError("phone") && <span className={styles.error}>{fieldErrors.phone}</span>}
              </label>

              {/* <label className={styles.field}>
                <span className={styles.label}>{t("labelEmail")}</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  className={styles.input}
                  placeholder="name@email.com"
                  disabled={loading}
                />
                {showError("email") && <span className={styles.error}>{fieldErrors.email}</span>}
              </label> */}
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.saveBtn} disabled={loading || !isDirty}>
                {loading ? t("saving") : t("saveChanges")}
              </button>
            </div>
          </form>

          <ChangePasswordMain />

          <div className={styles.extraCard}>
            <div className={styles.formHead}>
              <div>
                <p className={styles.eyebrow}>{t("extraSettingsEyebrow")}</p>
                <h2 className={styles.sectionTitle}>{t("extraSettingsTitle")}</h2>
                <p className={styles.sectionText}>{t("extraSettingsHint")}</p>
              </div>
            </div>

            <div className={styles.extraGrid}>
              <div className={styles.extraItem}>
                <div>
                  <p className={styles.infoLabel}>{t("language")}</p>
                  <p className={styles.infoValue}>{t("chooseLanguage")}</p>
                </div>
                <div className={styles.languageRow}>
                  <Link to={`/ar/account`} className={styles.secondaryBtn}>
                    {t("arabic")}
                  </Link>
                  <Link to={`/en/account`} className={styles.secondaryBtn}>
                    English
                  </Link>
                  <Link to={`/eu/account`} className={styles.secondaryBtn}>
                    اوردو
                  </Link>
                </div>
              </div>

              {/* <div className={styles.extraItem}>
                <div>
                  <p className={styles.infoLabel}>{t("deleteAccount")}</p>
                  <p className={styles.sectionText}>{t("deleteAccountWarning")}</p>
                </div>
                <button type="button" className={styles.dangerBtn} onClick={openDeleteModal}>
                  {t("requestDeleteAccount")}
                </button>
              </div> */}
            </div>
          </div>
        </section>
      </div>

      <StatusPopup
        isOpen={deleteModalOpen}
        status="confirm"
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription")}
        dir={dir}
        onClose={closeDeleteModal}
        disableClose={deleteLoading}
        primaryAction={{
          label: deleteLoading ? t("deleteLoading") : t("deleteConfirmAction"),
          onClick: handleDeleteAccount,
          disabled: deleteLoading || accountLoading || !emailMatches,
        }}
        secondaryAction={{
          label: t("cancel"),
          onClick: closeDeleteModal,
          disabled: deleteLoading,
        }}
      >
        <div className={styles.modalField}>
          <label className={styles.modalLabel} htmlFor="delete-email">
            {t("deleteConfirmEmailLabel")}
          </label>
          <input
            id="delete-email"
            type="email"
            dir="ltr"
            className={styles.input}
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={accountEmail || accountEmailValue || "name@email.com"}
            disabled={deleteLoading || accountLoading}
            autoComplete="email"
          />
          {accountLoading && <p className={styles.modalHint}>{t("checkingAccountEmail")}</p>}
          {confirmError && <p className={styles.error}>{confirmError}</p>}
          {isInApp && biometricActivated && (
            <p className={styles.modalHint}>{t("biometricRequiredHint")}</p>
          )}
        </div>
      </StatusPopup>
    </>
  );
};

export default AccountSettingsPage;