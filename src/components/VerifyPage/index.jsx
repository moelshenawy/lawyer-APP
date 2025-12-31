import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import styles from "./index.module.scss";
import { IoChevronForwardOutline } from "react-icons/io5";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

const DIGITS = 4;
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id";
const VERIFY_URL = `${API_BASE}/user/2fa/verify`;
const LOGIN_URL = `${API_BASE}/user/login`;

const VerifyPage = () => {
  const { t } = useTranslation("verify");
  const { loginWithToken } = useContext(AuthContext);
  const { lng } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(Array(DIGITS).fill(""));
  const [pending, setPending] = useState(() => {
    try {
      const saved = sessionStorage.getItem("pending_login");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef([]);

  const isComplete = useMemo(() => code.every((c) => c.length === 1), [code]);

  const base = `/${lng || "ar"}`;
  const locale = lng || "ar";
  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (location.state?.pending) {
      setPending(location.state.pending);
      sessionStorage.setItem("pending_login", JSON.stringify(location.state.pending));
    }
  }, [location.state]);

  useEffect(() => {
    if (!pending) {
      navigate(`${base}/login`, { replace: true });
    }
  }, [pending, navigate, base]);

  const focusIndex = (idx) => {
    inputsRef.current[idx]?.focus();
  };

  const handleChange = (idx, e) => {
    const raw = e.target.value || "";
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      updateCode(idx, "");
      return;
    }

    // If user pastes or types multiple digits, distribute across inputs
    const chars = cleaned.split("");
    const next = [...code];
    let cursor = idx;
    chars.forEach((ch) => {
      if (cursor < DIGITS) {
        next[cursor] = ch;
        cursor += 1;
      }
    });
    setCode(next);
    if (cursor < DIGITS) {
      focusIndex(cursor);
    } else {
      inputsRef.current[DIGITS - 1]?.blur();
    }
  };

  const updateCode = (idx, value) => {
    const next = [...code];
    next[idx] = value;
    setCode(next);
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      updateCode(idx - 1, "");
      focusIndex(idx - 1);
      e.preventDefault();
    }
  };

  const handlePaste = (idx, e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    const chars = pasted.slice(0, DIGITS).split("");
    const next = [...code];
    let cursor = idx;
    chars.forEach((ch) => {
      if (cursor < DIGITS) {
        next[cursor] = ch;
        cursor += 1;
      }
    });
    setCode(next);
    if (cursor < DIGITS) {
      focusIndex(cursor);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pending) return;
    if (!isComplete) {
      toast.error(t("enterFullCode"));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        login: pending.login,
        code: code.join(""),
        device_name: pending.deviceName || "Web",
      };
      const res = await fetch(VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          data?.message ||
          (Array.isArray(data?.errors) ? data.errors.join("، ") : t("verifyCodeFailed"));
        throw new Error(message);
      }

      if (data?.token) {
        loginWithToken?.(data.token, data.client);
        sessionStorage.removeItem("pending_login");
        toast.success(t("loginSuccess"));
        navigate(base, { replace: true });
      } else {
        throw new Error(t("missingLoginToken"));
      }
    } catch (err) {
      toast.error(err.message || t("genericErrorTryAgain"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pending) return;
    if (!pending.password) {
      toast.error(t("resendMissingLoginData"));
      return;
    }
    setResending(true);
    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: pending.login,
          password: pending.password || "",
          channel: pending.channel || "email",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          data?.message ||
          (Array.isArray(data?.errors) ? data.errors.join("، ") : t("resendFailed"));
        throw new Error(message);
      }
      toast.success(t("resendSuccess"));
    } catch (err) {
      toast.error(err.message || t("resendError"));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.verifyWrapper} dir={dir}>
      <div className="container">
        <header className={styles.header}>
          <a
            href="/login"
            type="button"
            aria-label={t("back")}
            className={styles.backBtn}
            onClick={() => navigate(`${base}/login`)}
          >
            <IoChevronForwardOutline size={18} />
          </a>
        </header>

        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.logoWrap}>
            <img src="/assets/imgs/logo.png" alt="fawaz logo" className={styles.logo} />
          </div>

          <p className={styles.desc}>
            {t("descriptionPrefix")}
            {/* {pending?.login ? ` ${pending.login}` : "."} */}
          </p>

          <div className={styles.inputsRow} dir="ltr">
            {code.map((value, idx) => (
              <input
                key={idx}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={value}
                onChange={(e) => handleChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={(e) => handlePaste(idx, e)}
                ref={(el) => (inputsRef.current[idx] = el)}
                className={styles.digitInput}
                aria-label={t("codeDigitAria", { number: idx + 1 })}
                disabled={loading}
              />
            ))}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.outlineBtn}
              onClick={handleResend}
              disabled={resending || loading}
            >
              {t("resendLink")}
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={!isComplete || loading}>
              {t("confirmCode")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyPage;
