import React, { useState } from "react";
import styles from "./index.module.scss";
import axiosClient from "@/api/axiosClient";
import { toast } from "react-hot-toast";
import PageHeader from "@/components/common/PageHeader";
import { useTranslation } from "react-i18next";

const EyeIcon = ({ slashed = false }) => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_1163_40102)">
      <path
        d="M0.695312 8.33485C0.695312 8.33485 3.47309 2.7793 8.3342 2.7793C13.1953 2.7793 15.9731 8.33485 15.9731 8.33485C15.9731 8.33485 13.1953 13.8904 8.3342 13.8904C3.47309 13.8904 0.695312 8.33485 0.695312 8.33485Z"
        stroke="#666666"
        strokeWidth="1.38889"
      />
      <path
        d="M8.33334 10.4167C9.48393 10.4167 10.4167 9.48393 10.4167 8.33333C10.4167 7.18274 9.48393 6.25 8.33334 6.25C7.18275 6.25 6.25001 7.18274 6.25001 8.33333C6.25001 9.48393 7.18275 10.4167 8.33334 10.4167Z"
        stroke="#666666"
        strokeWidth="1.38889"
      />
      <path
        className={styles.slash}
        d="M1.3 1.3L15.3 15.3"
        stroke="#666666"
        strokeWidth="1.6"
        strokeLinecap="round"
        pathLength="1"
        style={{ strokeDasharray: 1, strokeDashoffset: slashed ? 0 : 1 }}
      />
    </g>
    <defs>
      <clipPath id="clip0_1163_40102">
        <rect width="16.6667" height="16.6667" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const ChangePasswordMain = () => {
  const { t } = useTranslation("changePassword");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.current_password.trim()) next.current_password = t("currentRequired");
    if (!form.new_password.trim()) next.new_password = t("newRequired");
    else if (form.new_password.length < 8) next.new_password = t("minLength");
    if (form.new_password_confirmation !== form.new_password)
      next.new_password_confirmation = t("confirmMismatch");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const toastId = toast.loading(t("updating"));
    try {
      const res = await axiosClient.post("/user/account/password", form);
      toast.success(res?.data?.message || t("success"), { id: toastId });
      setForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
    } catch (err) {
      const message = err?.response?.data?.message || t("failed");
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.main}>
      <PageHeader title={t("pageTitle")} />

      <form className={styles.formBox} onSubmit={handleSubmit}>
        <div className={styles.inlineRow}>

            <div className={styles.fieldGroup}>
          {/* Current Password */}
        <label className={styles.labelRow}>
          <span className="font-arabic">{t("currentPassword")}</span>
        </label>
        <div className={styles.inputWrap}>
          <input
            type={showPwd ? "text" : "password"}
            placeholder={t("currentPlaceholder")}
            className={`${styles.input} ${styles.inputHasIcon} ${
              errors.current_password ? styles.errorBorder : ""
            }`}
              autoComplete="current-password"
              value={form.current_password}
              onChange={(e) => setForm({ ...form, current_password: e.target.value })}
              disabled={loading}
            />
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setShowPwd((v) => !v)}
              aria-label="toggle password visibility"
            >
              <EyeIcon slashed={!showPwd} />
            </button>
          </div>
          {errors.current_password && <p className={styles.error}>{errors.current_password}</p>}
        </div>

        
          <div className={styles.fieldGroup}>
            {/* New Password */}
            <label className={styles.labelRow}>
              <span className="font-arabic">{t("newPassword")}</span>
            </label>
            <div className={styles.inputWrap}>
              <input
                type={showPwd2 ? "text" : "password"}
                placeholder={t("newPasswordPlaceholder")}
                className={`${styles.input} ${styles.inputHasIcon} ${
                  errors.new_password ? styles.errorBorder : ""
                }`}
                autoComplete="new-password"
                value={form.new_password}
                onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setShowPwd2((v) => !v)}
                aria-label="toggle new password visibility"
              >
                <EyeIcon slashed={!showPwd2} />
              </button>
            </div>
            {errors.new_password && <p className={styles.error}>{errors.new_password}</p>}
          </div>

          <div className={styles.fieldGroup}>
            {/* Confirm Password */}
            <label className={styles.labelRow}>
              <span className="font-arabic">{t("confirmNewPassword")}</span>
            </label>
            <div className={styles.inputWrap}>
              <input
                type={showPwd2 ? "text" : "password"}
                placeholder={t("confirmPlaceholder")}
                className={`${styles.input} ${styles.inputHasIcon} ${
                  errors.new_password_confirmation ? styles.errorBorder : ""
                }`}
                autoComplete="new-password"
                value={form.new_password_confirmation}
                onChange={(e) => setForm({ ...form, new_password_confirmation: e.target.value })}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setShowPwd2((v) => !v)}
                aria-label="toggle confirm password visibility"
              >
                <EyeIcon slashed={!showPwd2} />
              </button>
            </div>
          </div>
        </div>

      
        {errors.new_password_confirmation && (
          <p className={styles.error}>{errors.new_password_confirmation}</p>
        )}

        {/* Submit */}
        <button className={styles.submitBtn} type="submit" disabled={loading}>
          {loading ? t("saving") : t("save")}
        </button>
      </form>
    </section>
  );
};

export default ChangePasswordMain;
