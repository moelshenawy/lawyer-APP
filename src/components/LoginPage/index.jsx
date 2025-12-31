import React, { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import Hypered from "@/utils/hyperedBridge";
import { AuthContext } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id";
const LOGIN_URL = `${API_BASE}/user/login`;

const LoginPage = () => {
  const { t } = useTranslation("authLogin");
  const { lng } = useParams();
  const navigate = useNavigate();
  const base = `/${lng || "ar"}`;
  const isRTL = (lng || "ar") === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  const { loginWithToken } = useContext(AuthContext);

  const [form, setForm] = useState({ login: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ NEW
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [nativeLoginPending, setNativeLoginPending] = useState(false);

  const [errors, setErrors] = useState({});
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasBiometricToken, setHasBiometricToken] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(
      localStorage.getItem("hypered_biometric_token") ||
      sessionStorage.getItem("hypered_biometric_token"),
    );
  });
  const [biometricLoading, setBiometricLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const isBiometricActivated = () => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("biometric_activated") === "true";
  };

  useEffect(() => {
    let mounted = true;

    Hypered.isInApp()
      .then((val) => {
        if (!mounted) return;
        const inApp = Boolean(val);
        setIsNativeApp(inApp);

        const activated = isBiometricActivated();

        setBiometricAvailable(inApp && activated);
      })
      .catch(() => {
        if (mounted) {
          setBiometricAvailable(false);
          setIsNativeApp(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const persistBiometricToken = (token) => {
    if (!token) return;
    localStorage.setItem("access_token", token);
    sessionStorage.setItem("hypered_biometric_token", token);
    setHasBiometricToken(true);
  };

  // ✅ NEW: reuse storage style + login
  const persistAccessToken = (token) => {
    if (!token) return;
    localStorage.setItem("access_token", token);
  };

  const handleBiometricLogin = () => {
    Hypered.loadBiometricToken()
      .then((token) => {
        if (!token) {
          toast.error("No token received");
          return;
        }

        persistBiometricToken(token);
        loginWithToken?.(token);
        toast.success(t("biometricLoginSuccess"));
        navigate(base, { replace: true });
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.login.trim()) newErrors.login = t("loginRequired");
    else if (!/\S+@\S+\.\S+/.test(form.login) && !/^\+?\d{9,15}$/.test(form.login))
      newErrors.login = t("loginInvalid");
    if (!form.password.trim()) newErrors.password = t("passwordRequired");
    else if (form.password.length < 8) newErrors.password = t("passwordMin");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const toastId = toast.loading(t("loginRequestLoading"));
    try {
      const payload = {
        email: form.login.trim(),
        password: form.password,
      };
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          data?.message ||
          (Array.isArray(data?.errors) ? data.errors.join("، ") : t("loginFailed"));

        throw new Error(message);
      }
      const token = data?.data?.token;

      // ✅ IF TOKEN EXISTS → LOGIN SUCCESS
      if (token) {
        localStorage.setItem("access_token", token);
        loginWithToken?.(token);

        toast.success(
          data?.message || t("loginSuccess", { defaultValue: "Logged in successfully" }),
          { id: toastId },
        );

        navigate(base, { replace: true });
        return;
      }

      // ❗ Otherwise → fallback to 2FA
      toast.success(t("codeSentToEmail"), { id: toastId });

      const pending = {
        login: payload.email,
        password: payload.password,
        deviceName: navigator.userAgent || "Web",
      };

      sessionStorage.setItem("pending_login", JSON.stringify(pending));
      navigate(`${base}/verify`, { state: { pending } });
    } catch (err) {
      console.log(err.message, "login error");
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotClick = (e) => {
    e.preventDefault();
    navigate(`${base}/forgot-password`);
  };

  return (
    <div
      className={`${styles.loginWrapper} container flex flex-col items-center justify-center mt-10`}
      dir={dir}
    >
      <img src="/assets/imgs/logo.png" alt="logo" className="mb-6 w-24" />

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        {/* Email / Phone */}
        <div className={styles.input_container}>
          <div className={styles.label}>
            <img src="/assets/icons/mail.svg" className={styles.icon} alt="email icon" />
            <p>{t("loginLabel")}</p>
          </div>
          <input
            type="text"
            dir="ltr"
            name="login"
            value={form.login}
            onChange={handleChange}
            placeholder="Example@mail.com"
            className={`input-field ${errors.login ? "border-red-500" : ""}`}
            autoComplete="username"
            disabled={loading}
          />
          {errors.login && <p className="text-red-500 text-sm mt-1">{errors.login}</p>}
        </div>

        {/* Password */}
        <div className={styles.input_container}>
          <div className={styles.label}>
            <img src="/assets/icons/lock.svg" className={styles.icon} alt="password icon" />
            <p>{t("passwordLabel")}</p>
          </div>

          <div className={styles.hide_pass}>
            <input
              type={showPass ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="********"
              className={`input-field ${errors.password ? "border-red-500" : ""}`}
              autoComplete="current-password"
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

   

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-[#002f52] transition disabled:opacity-60"
        >
          {loading ? t("loggingIn") : t("login")}
        </button>

        {/* Biometric */}
        {biometricAvailable ? (
          <button
            type="button"
            onClick={handleBiometricLogin}
            disabled={biometricLoading}
            className="flex justify-center mt-6 w-full"
          >
            <img
              src="/assets/icons/finger_print.png"
              alt="fingerprint login"
              className={`w-9 h-9 opacity-80 ${biometricLoading ? "animate-pulse" : ""}`}
            />
          </button>
        ) : null}
      </form>
    </div>
  );
};

export default LoginPage;
