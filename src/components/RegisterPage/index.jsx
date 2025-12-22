import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaEnvelope, FaLock, FaUserAlt, FaRegBuilding } from "react-icons/fa";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { IoCallOutline } from "react-icons/io5";
import styles from "../LoginPage/index.module.scss";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

const REGISTER_URL = "https://fawaz-law-firm.apphub.my.id/api/client/register";

const RegisterPage = () => {
  const { t } = useTranslation("authRegister");
  const { lng } = useParams();
  const navigate = useNavigate();
  const base = `/${lng || "ar"}`;
  const isRTL = (lng || "ar") === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  const minPasswordLength = 8;
  const [form, setForm] = useState({
    type: "individual",
    name: "",
    email: "",
    phone: "",
    secondary_phone: "",
    tax_id: "",
    company_name: "",
    address: "",
    status: "active",
    notes: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    // Clear company-only validation errors when switching back to individual
    if (name === "type" && value === "individual") {
      setErrors((prev) => ({
        ...prev,
        tax_id: "",
        company_name: "",
        address: "",
        notes: "",
      }));
    }
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = t("nameRequired");
    if (!form.email.trim()) next.email = t("emailRequired");
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = t("emailInvalid");
    if (!form.phone.trim()) next.phone = t("phoneRequired");
    if (!form.password.trim()) next.password = t("passwordRequired");
    else if (form.password.length < minPasswordLength)
      next.password = t("passwordMin", { min: minPasswordLength });
    if (form.password_confirmation !== form.password)
      next.password_confirmation = t("passwordConfirmMismatch");
    if (form.type === "company" && !form.address.trim()) next.address = t("addressRequired");
    if (form.type === "company" && !form.company_name.trim())
      next.company_name = t("companyNameRequired");
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    const toastId = toast.loading(t("registerRequestLoading"));
    try {
      const payload = {
        type: form.type,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        secondary_phone: form.secondary_phone.trim() ? form.secondary_phone.trim() : null,
        status: form.status || "active",
        password: form.password,
        password_confirmation: form.password_confirmation,
      };

      if (form.type === "company") {
        payload.tax_id = form.tax_id.trim();
        payload.company_name = form.company_name.trim();
        payload.address = form.address.trim();
        payload.notes = form.notes.trim() ? form.notes.trim() : null;
      }

      const res = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const serverErrors = data?.errors || {};
        // Normalize server validation errors into UI
        const normalized = { ...errors };
        Object.entries(serverErrors).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length) normalized[key] = value[0];
        });
        setErrors((prev) => ({ ...prev, ...normalized }));

        const message =
          data?.message ||
          (Array.isArray(data?.errors) ? data.errors.join("، ") : t("registerFailed"));
        throw new Error(message);
      }
      toast.success(t("registerSuccess"), { id: toastId });
      setForm((prev) => ({
        ...prev,
        name: "",
        email: "",
        phone: "",
        secondary_phone: "",
        tax_id: "",
        company_name: "",
        address: "",
        notes: "",
        password: "",
        password_confirmation: "",
      }));
      navigate(`${base}/login`);
    } catch (err) {
      toast.error(err.message || t("genericError"), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (name, label, placeholder, Icon, props = {}) => (
    <div className={styles.input_container}>
      <div className={styles.label}>
        {Icon && <Icon className={styles.icon} />}
        <p>{label}</p>
      </div>
      <input
        {...props}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className={`input-field ${errors[name] ? "border-red-500" : ""}`}
        disabled={loading}
      />
      {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className={`${styles.loginWrapper} container flex flex-col items-center mt-10`} dir={dir}>
      <img src="/assets/imgs/logo.png" alt="logo" className="mb-6 w-24" />

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        {/* Type selector */}
        <div className={styles.input_container}>
          <div className={styles.label}>
            <FaUserAlt className={styles.icon} />
            <p>{t("accountType")}</p>
          </div>
          <div className="flex gap-3 mt-2">
            {[
              { value: "individual", label: t("accountTypeIndividual") },
              { value: "company", label: t("accountTypeCompany") },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center ${
                  form.type === opt.value ? "border-primary text-primary" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={opt.value}
                  checked={form.type === opt.value}
                  onChange={handleChange}
                  disabled={loading}
                  className="hidden"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {renderInput("name", t("fullName"), t("fullNamePlaceholder"), FaUserAlt)}
        {renderInput("email", t("email"), "email@example.com", FaEnvelope, {
          dir: "ltr",
          type: "email",
          autoComplete: "email",
        })}
        {renderInput("phone", t("phone"), "05xxxxxxxx", IoCallOutline, {
          dir: "ltr",
          type: "tel",
          autoComplete: "tel",
        })}

        {form.type === "company" && (
          <>
            {renderInput("tax_id", t("taxId"), "123456789", FaRegBuilding, { dir: "ltr" })}
            {renderInput("company_name", t("companyName"), t("companyName"), FaRegBuilding)}
            {renderInput("address", t("address"), t("addressPlaceholder"), FaRegBuilding)}
            {renderInput("notes", t("notes"), t("notesPlaceholder"), FaRegBuilding)}
          </>
        )}

        {/* Password */}
        <div className={styles.input_container}>
          <div className={styles.label}>
            <FaLock className={styles.icon} />
            <p>{t("password")}</p>
          </div>

          <div className={styles.hide_pass}>
            <input
              type={showPass ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="*******"
              className={`input-field ${errors.password ? "border-red-500" : ""}`}
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPass(!showPass)}
              disabled={loading}
            >
              {showPass ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </button>
          </div>

          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        {/* Password confirmation */}
        <div className={styles.input_container}>
          <div className={styles.label}>
            <FaLock className={styles.icon} />
            <p>{t("passwordConfirmation")}</p>
          </div>

          <div className={styles.hide_pass}>
            <input
              type={showPassConfirm ? "text" : "password"}
              name="password_confirmation"
              value={form.password_confirmation}
              onChange={handleChange}
              placeholder="*******"
              className={`input-field ${errors.password_confirmation ? "border-red-500" : ""}`}
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPassConfirm(!showPassConfirm)}
              disabled={loading}
            >
              {showPassConfirm ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </button>
          </div>

          {errors.password_confirmation && (
            <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-[#002f52] transition disabled:opacity-60"
        >
          {loading ? t("creatingAccount") : t("createAccount")}
        </button>

        <div className="text-center text-sm">
          <span>{t("alreadyHaveAccount")}</span>
          <Link to={`${base}/login`} className="text-blue-500">
            {t("login")}
          </Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
