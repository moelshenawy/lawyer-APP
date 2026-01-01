import React, { useMemo, useState } from "react";
import Hypered from "@/utils/hyperedBridge";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import styles from "./index.module.scss";

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

const persistBiometricToken = (token) => {
  if (typeof window === "undefined" || !token) return;
  localStorage.setItem("access_token", token);
  sessionStorage.setItem("hypered_biometric_token", token);
};

// const saveBiometric = (token) => {
//   if (!token) {
//     return null;
//   }

//   return Hypered.saveBiometricToken(token);
// };

const saveBiometric = (token) => {
  if (!token) return null;

  return Hypered.saveBiometricToken(token).then((res) => {
    return res || token;
  });
};

const BiometricPrompt = ({ onClose, onActivate }) => {
  const navigate = useNavigate();
  const { lng } = useParams();
  const basePath = useMemo(() => `/${lng || "ar"}`, [lng]);

  const [error, setError] = useState("");
  const [activated, setActivated] = useState(false);

  // --- NEW HELPERS ---
  const isBiometricActivated = () => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("biometric_activated") === "true";
  };

  const setBiometricActivated = (value) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("biometric_activated", value ? "true" : "false");
  };

  // If already activated → do NOT show the modal
  const alreadyActivated = isBiometricActivated();

  const handleActivate = () => {
    setError("");
    const token = getStoredToken();

    console.log("=== BIOMETRIC ACTIVATION START ===");
    console.log("Token exists:", !!token);
    console.log("Token length:", token?.length);
    console.log("HyperedChannel available:", !!window.HyperedChannel);
    console.log("postMessage available:", typeof window.HyperedChannel?.postMessage);

    if (!token) {
      console.log("ERROR: No token found");
      setError("لا يوجد رمز مستخدم لحفظه.");
      return;
    }

    // Check if HyperedChannel is available
    if (!window.HyperedChannel || typeof window.HyperedChannel.postMessage !== "function") {
      console.log("HyperedChannel not available, using fallback");
      // Fallback: just mark as activated without native biometric
      persistBiometricToken(token);
      setActivated(true);
      setBiometricActivated(true);
      sessionStorage.setItem("biometric_prompt_handled", "true");
      onActivate?.();
      toast.success("تم تفعيل البصمة (وضع التطوير)");

      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.replace(basePath);
        } else {
          navigate(basePath, { replace: true });
        }
      }, 2000);
      return;
    }

    console.log("Calling saveBiometric with token...");
    const savePromise = saveBiometric(token);
    if (!savePromise) {
      console.log("ERROR: saveBiometric returned null/undefined");
      setError("لا يوجد رمز مستخدم لحفظه.");
      return;
    }

    console.log("saveBiometric promise created, waiting for response...");
    savePromise
      .then((nativeToken) => {
        console.log("=== BIOMETRIC RESPONSE RECEIVED ===");
        console.log("Native token:", nativeToken);
        console.log("Native token type:", typeof nativeToken);
        console.log("Native token length:", nativeToken?.length);

        // If nativeToken is null, it could mean user cancelled or biometric failed
        if (!nativeToken) {
          console.log("ERROR: Native token is null/undefined");
          setError("تم إلغاء تفعيل البصمة أو فشل التفعيل. حاول مرة أخرى.");
          return;
        }

        // SUCCESS
        console.log("SUCCESS: Biometric activated");
        const resolvedToken = nativeToken;
        persistBiometricToken(resolvedToken);

        setActivated(true);
        setBiometricActivated(true);
        sessionStorage.setItem("biometric_prompt_handled", "true");

        onActivate?.();
        toast.success(`تم تفعيل البصمة`);

        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.replace(basePath);
          } else {
            navigate(basePath, { replace: true });
          }
        }, 2000);
      })
      .catch((err) => {
        console.log("=== BIOMETRIC CATCH BLOCK ===");
        console.error("Biometric activation error:", err);
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name,
          toString: err.toString(),
        });
        setError("تعذر تفعيل البصمة. حاول مرة أخرى.");
      });
  };

  if (activated) {
    return (
      <div className={styles.overlay} dir="rtl">
        <div className={styles.success}>
          <img src="/assets/icons/icon.gif" alt="biometric enabled" className={styles.successGif} />
          <p className={styles.successText}>تم تفعيل بصمتك بنجاح</p>
          {/* {lastToken ? <p className={styles.successToken}>Token: {lastToken}</p> : null} */}
        </div>
      </div>
    );
  }

  // --- IF biometric already activated => return only success overlay (optional) or null
  if (alreadyActivated) {
    return null; // hide modal forever after activation
  }

  return (
    <div className={styles.overlay} dir="rtl">
      <div className={styles.card}>
        <div className={styles.fingerprintBox}>
          <img src="/assets/icons/finger_print.png" alt="fingerprint" />
        </div>

        <h2 className={styles.title}>احمِ حسابك وادخل أسرع بتفعيل تسجيل الدخول بالبصمة</h2>
        <p className={styles.subtitle}>
          تفعيل البصمة يحافظ على أمان حسابك ويختصر وقت الدخول لك فقط على هذا الجهاز.
        </p>

        <ul className={styles.list}>
          <li>دخول أسرع بدون كتابة كلمة المرور في كل مرة</li>
          <li>حماية إضافية لأن البصمة تعمل على جهازك فقط</li>
          <li>يمكنك إيقافها لاحقًا من إعدادات جهازك</li>
        </ul>

        <div className={styles.actions}>
          <button type="button" className={styles.primaryBtn} onClick={handleActivate}>
            تفعيل البصمة
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={onClose}>
            إلغاء
          </button>
        </div>

        {error ? (
          <p style={{ color: "#ef4444", textAlign: "center", marginTop: "12px" }}>{error}</p>
        ) : null}
      </div>
    </div>
  );
};

export default BiometricPrompt;
