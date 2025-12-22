import React, { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import Hypered from "@/utils/hyperedBridge";
import { AuthContext } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

// ✅ NEW
import { GoogleLogin } from "@react-oauth/google";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id";
const LOGIN_URL = `${API_BASE}/client/login`;

// ✅ NEW
const GOOGLE_AUTH_URL = `${API_BASE}/client/auth/google`;

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
  const [googleLoading, setGoogleLoading] = useState(false);
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
        login: form.login.trim(),
        password: form.password,
        channel: "email",
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

      toast.success(t("codeSentToEmail"), { id: toastId });
      const pending = {
        login: payload.login,
        password: payload.password,
        channel: payload.channel,
        deviceName: navigator.userAgent || "Web",
      };
      sessionStorage.setItem("pending_login", JSON.stringify(pending));
      const basePath = `/${lng || "ar"}`;
      navigate(`${basePath}/verify`, { state: { pending } });
    } catch (err) {
      console.log(err.message, "login error");
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Google handler
  // const handleGoogleCredential = async (credential) => {
  //   if (!credential || googleLoading || loading) return;

  //   setGoogleLoading(true);
  //   const toastId = toast.loading(
  //     t("googleLoginLoading", { defaultValue: "Logging in with Google..." }),
  //   );

  //   try {
  //     const payload = {
  //       credential,
  //       device_name: navigator.userAgent || "Web",
  //     };

  //     const res = await fetch(GOOGLE_AUTH_URL, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(payload),
  //     });

  //     const data = await res.json().catch(() => ({}));

  //     if (!res.ok) {
  //       const message =
  //         data?.message ||
  //         (Array.isArray(data?.errors) ? data.errors.join("، ") : "Google login failed");
  //       throw new Error(message);
  //     }

  //     const token = data?.token;
  //     if (!token) throw new Error("No token returned from server.");

  //     persistAccessToken(token);
  //     loginWithToken?.(token);

  //     toast.success(
  //       data?.message || t("googleLoginSuccess", { defaultValue: "Signed in successfully." }),
  //       { id: toastId },
  //     );

  //     navigate(base, { replace: true });
  //   } catch (err) {
  //     toast.error(err?.message || "Google login failed", { id: toastId });
  //   } finally {
  //     setGoogleLoading(false);
  //   }
  //   return token;
  // };

  const loginWithBackend = async (idToken, options = {}) => {
    if (!idToken) {
      throw new Error("Missing Google credential");
    }

    const resolvedDevice = options.deviceName || navigator.userAgent || "Web";

    if (import.meta.env.DEV) {
      console.log("GOOGLE_AUTH_URL", GOOGLE_AUTH_URL);
    }

    const res = await fetch(GOOGLE_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credential: idToken,
        device_name: resolvedDevice,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (import.meta.env.DEV) {
        console.log("Google auth failed", res.status, data);
      }
      const message =
        data?.message ||
        (Array.isArray(data?.errors) ? data.errors.join("OO ") : "Google login failed");
      throw new Error(message);
    }

    const token = data?.token;
    if (!token) {
      throw new Error("No token returned from server.");
    }

    persistAccessToken(token);
    loginWithToken?.(token);

    return data;
  };

  const handleGoogleCredential = async (credential) => {
    if (!credential || googleLoading || loading) return;

    setGoogleLoading(true);
    const toastId = toast.loading(
      t("googleLoginLoading", { defaultValue: "Logging in with Google..." }),
    );

    try {
      const data = await loginWithBackend(credential);

      toast.success(
        data?.message || t("googleLoginSuccess", { defaultValue: "Signed in successfully." }),
        { id: toastId },
      );

      navigate(base, { replace: true });
    } catch (err) {
      toast.error(err?.message || "Google login failed", { id: toastId });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleNativeGoogleLogin = async () => {
    if (nativeLoginPending || googleLoading || loading) return;

    const toastId = toast.loading(
      t("googleLoginLoading", { defaultValue: "Logging in with Google..." }),
    );
    setNativeLoginPending(true);

    try {
      const response = await Hypered.loginWithGoogle();
      const payload = response?.data ?? response?.userData ?? response;
      const idToken = payload?.idToken ?? payload?.id_token;

      if (!idToken) {
        if (import.meta.env.DEV) {
          console.error("Native Google response:", response);
        }
        throw new Error("Native Google login did not return an ID token");
      }

      const data = await loginWithBackend(idToken, {
        deviceName: navigator.userAgent || "Web",
      });

      toast.success(
        data?.message || t("googleLoginSuccess", { defaultValue: "Signed in successfully." }),
        { id: toastId },
      );

      navigate(base, { replace: true });
    } catch (err) {
      toast.error(err?.message || "Google login failed", { id: toastId });
    } finally {
      setNativeLoginPending(false);
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

        <div className="text-start text-sm text-blue-500">
          <a href="#" onClick={handleForgotClick}>
            {t("forgotPassword")}
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-[#002f52] transition disabled:opacity-60"
        >
          {loading ? t("loggingIn") : t("login")}
        </button>

        <div className="text-center text-sm">
          <span>{t("noAccount")}</span>
          <Link to={`${base}/register`} className="text-blue-500">
            {t("createAccount")}
          </Link>
        </div>

        <div className="text-center text-gray-400">{t("or")}</div>

        {/* Social icons */}
        <div className="flex justify-center gap-4 text-2xl text-gray-700">
          {/* <img src="/assets/icons/x.svg" alt="x" className="w-8 h-8 opacity-80" />
          <img src="/assets/icons/apple.svg" alt="apple" className="w-8 h-8 opacity-80" />
          <img src="/assets/icons/linkedin.svg" alt="linkedin" className="w-8 h-8 opacity-80" /> */}

          {/* ✅ Google icon (same UI) + invisible GoogleLogin overlay */}
          {!isNativeApp && (
            <div
              className={`relative w-8 h-8 opacity-80 ${
                loading || googleLoading ? "pointer-events-none opacity-60" : ""
              }`}
              title="Google"
            >
              {" "}
              <>
                <img src="/assets/icons/google.svg" alt="google" className="w-8 h-8" />
                <div className="absolute inset-0 opacity-0">
                  <GoogleLogin
                    onSuccess={(credRes) => handleGoogleCredential(credRes?.credential)}
                    onError={() =>
                      toast.error(t("googleLoginFailed", { defaultValue: "Google login failed" }))
                    }
                    // optional tweaks (safe)
                    useOneTap={false}
                  />
                </div>
              </>
            </div>
          )}

          {isNativeApp && (
            <button
              type="button"
              onClick={handleNativeGoogleLogin}
              disabled={nativeLoginPending || googleLoading || loading}
              className="text-sm text-blue-600 underline underline-offset-2 transition disabled:opacity-60 focus:outline-none"
            >
              <img src="/assets/icons/google.svg" alt="google" className="w-8 h-8" />
            </button>
          )}
        </div>

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
