import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import loginStyles from "@/components/LoginPage/index.module.scss";
import verifyStyles from "@/components/VerifyPage/index.module.scss";
import { requestPasswordReset, resetPassword } from "@/api/authService";
import { useTranslation } from "react-i18next";

const DIGITS = 4;
const OTP_COOLDOWN = 120;

const buildEmailError = (t, value) => {
  if (!value.trim()) return t("emailRequired");
  if (!/\S+@\S+\.\S+/.test(value.trim())) return t("emailInvalid");
  return "";
};

const ForgotPasswordPage = () => {
  const { t } = useTranslation("authForgotPassword");
  const { lng } = useParams();
  const navigate = useNavigate();
  const base = `/${lng || "ar"}`;
  const isRTL = (lng || "ar") === "ar";
  const dir = isRTL ? "rtl" : "ltr";

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [otp, setOtp] = useState(Array(DIGITS).fill(""));
  const [otpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifiedOtpValue, setVerifiedOtpValue] = useState("");
  const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" });
  const [resetErrors, setResetErrors] = useState({});
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const inputsRef = useRef([]);
  const resetPasswordRef = useRef(null);

  const isOtpComplete = useMemo(() => otp.every((digit) => digit.length === 1), [otp]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  useEffect(() => {
    if (step === "reset") {
      resetPasswordRef.current?.focus();
    }
  }, [step]);

  const focusInput = (idx) => {
    inputsRef.current[idx]?.focus();
  };

  const handleOtpChange = (idx, e) => {
    const raw = e.target.value || "";
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      setOtp((prev) => {
        const next = [...prev];
        next[idx] = "";
        return next;
      });
      return;
    }
    const next = [...otp];
    let cursor = idx;
    cleaned.split("").forEach((char) => {
      if (cursor < DIGITS) {
        next[cursor] = char;
        cursor += 1;
      }
    });
    setOtp(next);
    if (cursor < DIGITS) {
      focusInput(cursor);
    } else {
      inputsRef.current[DIGITS - 1]?.blur();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      setOtp((prev) => {
        const next = [...prev];
        next[idx - 1] = "";
        return next;
      });
      focusInput(idx - 1);
      e.preventDefault();
    }
  };

  const handleOtpPaste = (idx, e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    const next = [...otp];
    let cursor = idx;
    pasted
      .slice(0, DIGITS)
      .split("")
      .forEach((char) => {
        if (cursor < DIGITS) {
          next[cursor] = char;
          cursor += 1;
        }
      });
    setOtp(next);
    if (cursor < DIGITS) {
      focusInput(cursor);
    }
  };

  const startCooldown = () => {
    setResendCooldown(OTP_COOLDOWN);
  };

  const goToEmailStep = () => {
    setStep("email");
    setOtp(Array(DIGITS).fill(""));
    setVerifiedOtpValue("");
    setResendCooldown(0);
    setResetForm({ password: "", confirmPassword: "" });
    setResetErrors({});
    setResetLoading(false);
  };

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim();
    const validationError = buildEmailError(t, trimmedEmail);
    if (validationError) {
      setEmailError(validationError);
      return;
    }
    setEmailError("");
    setSending(true);
    try {
      await requestPasswordReset(trimmedEmail, "email");
      setSubmittedEmail(trimmedEmail);
      setStep("otp");
      setOtp(Array(DIGITS).fill(""));
      startCooldown();
      toast.success(t("otpSent"));
    } catch (error) {
      toast.error(error.message || t("otpSendFailed"));
    } finally {
      setSending(false);
    }
  };

  const handleResendOtp = async () => {
    if (!submittedEmail) {
      toast.error(t("emailFirst"));
      return;
    }
    setResendLoading(true);
    try {
      await requestPasswordReset(submittedEmail, "email");
      startCooldown();
      toast.success(t("otpResent"));
    } catch (error) {
      toast.error(error.message || t("otpResendFailed"));
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!submittedEmail) {
      goToEmailStep();
      return;
    }
    if (!isOtpComplete) {
      toast.error(t("otpComplete"));
      return;
    }
    const code = otp.join("");
    setVerifiedOtpValue(code);
    setStep("reset");
  };

  const handleResetChange = (e) => {
    setResetForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setResetErrors((prev) => ({
      ...prev,
      [e.target.name]: "",
    }));
  };

  const validateResetForm = () => {
    const nextErrors = {};
    if (!resetForm.password.trim()) {
      nextErrors.password = t("newPasswordRequired");
    } else if (resetForm.password.length < 8) {
      nextErrors.password = t("newPasswordMin");
    }
    if (!resetForm.confirmPassword.trim()) {
      nextErrors.confirmPassword = t("confirmPasswordRequired");
    } else if (resetForm.password !== resetForm.confirmPassword) {
      nextErrors.confirmPassword = t("passwordMismatch");
    }
    setResetErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!submittedEmail || !verifiedOtpValue) {
      goToEmailStep();
      return;
    }
    if (!validateResetForm()) return;
    setResetLoading(true);
    try {
      const res = await resetPassword(
        submittedEmail,
        verifiedOtpValue,
        resetForm.password,
        resetForm.confirmPassword,
      );
      toast.success(res?.data?.message || t("resetSuccess"));
      navigate(`${base}/login`, { replace: true });
    } catch (error) {
      toast.error(error.message || t("resetFailed"));
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === "email") {
      handleSendOtp();
    } else if (step === "otp") {
      handleVerifyOtp();
    } else {
      handleResetPassword();
    }
  };

  return (
    <div
      className={`${loginStyles.loginWrapper} container flex flex-col items-center justify-center mt-10`}
      dir={dir}
    >
      <img src="/assets/imgs/logo.png" alt={t("logoAlt")} className="mb-6 w-24" />
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-[#0d2b49]">{t("title")}</h2>
          <p className="text-sm text-gray-500">
            {step === "email" && t("emailStepDescription")}
            {step === "otp" &&
              t("otpStepDescription", {
                digits: DIGITS,
                email: submittedEmail || t("yourEmail"),
              })}
            {step === "reset" && t("resetStepDescription")}
          </p>
        </div>

        {step === "email" && (
          <div className={loginStyles.input_container}>
            <div className={loginStyles.label}>
              <img
                src="/assets/icons/mail.svg"
                className={loginStyles.icon}
                alt={t("emailIconAlt")}
              />
              <p>{t("emailLabel")}</p>
            </div>
            <input
              type="text"
              dir="ltr"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              placeholder="Example@mail.com"
              className={`input-field ${emailError ? "border-red-500" : ""}`}
              autoComplete="email"
              disabled={sending}
            />
            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <button type="button" className="text-blue-500 underline" onClick={goToEmailStep}>
                {t("backToEmail")}
              </button>
              <p className="text-xs text-gray-400">{t("step2of3")}</p>
            </div>

            <div dir="ltr" className={verifyStyles.inputsRow}>
              {otp.map((value, idx) => (
                <input
                  key={idx}
                  value={value}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  onChange={(e) => handleOtpChange(idx, e)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={(e) => handleOtpPaste(idx, e)}
                  ref={(el) => {
                    inputsRef.current[idx] = el;
                  }}
                  className={verifyStyles.digitInput}
                  disabled={otpLoading}
                  aria-label={t("otpDigitAriaLabel", { index: idx + 1 })}
                />
              ))}
            </div>

            <div className={verifyStyles.actions}>
              <button
                style={{ padding: "9px" }}
                type="button"
                className={verifyStyles.outlineBtn}
                onClick={handleResendOtp}
                disabled={resendLoading || resendCooldown > 0}
              >
                {t("resendCode")}
                {resendCooldown ? ` (${resendCooldown}${t("secondsSuffix")})` : ""}
              </button>

              <button
                type="submit"
                className={verifyStyles.primaryBtn}
                disabled={!isOtpComplete || otpLoading}
              >
                {otpLoading ? t("verifying") : t("confirmCode")}
              </button>
            </div>
          </div>
        )}

        {step === "reset" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span className="text-xs text-gray-400">{t("step3of3")}</span>
              <span className="font-semibold text-gray-700">{t("createNewPassword")}</span>
            </div>

            <div className={loginStyles.input_container}>
              <div className={loginStyles.label}>
                <img
                  src="/assets/icons/lock.svg"
                  className={loginStyles.icon}
                  alt={t("newPasswordIconAlt")}
                />
                <p>{t("newPasswordLabel")}</p>
              </div>
              <div className={loginStyles.hide_pass}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={resetForm.password}
                  onChange={handleResetChange}
                  placeholder="********"
                  className={`input-field ${resetErrors.password ? "border-red-500" : ""}`}
                  autoComplete="new-password"
                  disabled={resetLoading}
                  ref={resetPasswordRef}
                />
                <button
                  type="button"
                  className={loginStyles.eyeBtn}
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={resetLoading}
                >
                  {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </button>
              </div>
              {resetErrors.password && (
                <p className="text-red-500 text-sm mt-1">{resetErrors.password}</p>
              )}
            </div>

            <div className={loginStyles.input_container}>
              <div className={loginStyles.label}>
                <img
                  src="/assets/icons/lock.svg"
                  className={loginStyles.icon}
                  alt={t("confirmPasswordIconAlt")}
                />
                <p>{t("confirmPasswordLabel")}</p>
              </div>
              <div className={loginStyles.hide_pass}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={resetForm.confirmPassword}
                  onChange={handleResetChange}
                  placeholder="********"
                  className={`input-field ${resetErrors.confirmPassword ? "border-red-500" : ""}`}
                  autoComplete="new-password"
                  disabled={resetLoading}
                />
                <button
                  type="button"
                  className={loginStyles.eyeBtn}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={resetLoading}
                >
                  {showConfirmPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </button>
              </div>
              {resetErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{resetErrors.confirmPassword}</p>
              )}
            </div>
          </div>
        )}

        {step !== "otp" && (
          <button
            type="submit"
            disabled={sending || (step === "reset" && resetLoading)}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-[#002f52] transition disabled:opacity-60"
          >
            {step === "email" && (sending ? t("sendingCode") : t("sendCode"))}
            {step === "reset" && (resetLoading ? t("resetting") : t("resetPassword"))}
          </button>
        )}
      </form>
    </div>
  );
};

export default ForgotPasswordPage;

// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { toast } from "react-hot-toast";
// import { useNavigate, useParams } from "react-router-dom";
// import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
// import loginStyles from "@/components/LoginPage/index.module.scss";
// import verifyStyles from "@/components/VerifyPage/index.module.scss";
// import { requestPasswordReset, resetPassword, verifyResetOtp } from "@/api/authService";

// const DIGITS = 4;
// const OTP_COOLDOWN = 60;

// const buildEmailError = (value) => {
//   if (!value.trim()) return "Please enter your email address.";
//   if (!/\S+@\S+\.\S+/.test(value.trim())) return "Enter a valid email address.";
//   return "";
// };

// const ForgotPasswordPage = () => {
//   const { lng } = useParams();
//   const navigate = useNavigate();
//   const base = `/${lng || "ar"}`;

//   const [step, setStep] = useState("reset");
//   const [email, setEmail] = useState("");
//   const [emailError, setEmailError] = useState("");
//   const [submittedEmail, setSubmittedEmail] = useState("");
//   const [sending, setSending] = useState(false);
//   const [otp, setOtp] = useState(Array(DIGITS).fill(""));
//   const [otpLoading, setOtpLoading] = useState(false);
//   const [resendLoading, setResendLoading] = useState(false);
//   const [resendCooldown, setResendCooldown] = useState(0);
//   const [verifiedOtpValue, setVerifiedOtpValue] = useState("");
//   const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" });
//   const [resetErrors, setResetErrors] = useState({});
//   const [resetLoading, setResetLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const inputsRef = useRef([]);
//   const resetPasswordRef = useRef(null);

//   const isOtpComplete = useMemo(() => otp.every((digit) => digit.length === 1), [otp]);

//   useEffect(() => {
//     let timer;
//     if (resendCooldown > 0) {
//       timer = setInterval(() => {
//         setResendCooldown((prev) => Math.max(prev - 1, 0));
//       }, 1000);
//     }
//     return () => {
//       if (timer) clearInterval(timer);
//     };
//   }, [resendCooldown]);

//   useEffect(() => {
//     if (step === "reset") {
//       resetPasswordRef.current?.focus();
//     }
//   }, [step]);

//   const focusInput = (idx) => {
//     inputsRef.current[idx]?.focus();
//   };

//   const handleOtpChange = (idx, e) => {
//     const raw = e.target.value || "";
//     const cleaned = raw.replace(/\D/g, "");
//     if (!cleaned) {
//       setOtp((prev) => {
//         const next = [...prev];
//         next[idx] = "";
//         return next;
//       });
//       return;
//     }
//     const next = [...otp];
//     let cursor = idx;
//     cleaned.split("").forEach((char) => {
//       if (cursor < DIGITS) {
//         next[cursor] = char;
//         cursor += 1;
//       }
//     });
//     setOtp(next);
//     if (cursor < DIGITS) {
//       focusInput(cursor);
//     } else {
//       inputsRef.current[DIGITS - 1]?.blur();
//     }
//   };

//   const handleOtpKeyDown = (idx, e) => {
//     if (e.key === "Backspace" && !otp[idx] && idx > 0) {
//       setOtp((prev) => {
//         const next = [...prev];
//         next[idx - 1] = "";
//         return next;
//       });
//       focusInput(idx - 1);
//       e.preventDefault();
//     }
//   };

//   const handleOtpPaste = (idx, e) => {
//     e.preventDefault();
//     const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
//     if (!pasted) return;
//     const next = [...otp];
//     let cursor = idx;
//     pasted.slice(0, DIGITS).split("").forEach((char) => {
//       if (cursor < DIGITS) {
//         next[cursor] = char;
//         cursor += 1;
//       }
//     });
//     setOtp(next);
//     if (cursor < DIGITS) {
//       focusInput(cursor);
//     }
//   };

//   const startCooldown = () => {
//     setResendCooldown(OTP_COOLDOWN);
//   };

//   const goToEmailStep = () => {
//     setStep("email");
//     setOtp(Array(DIGITS).fill(""));
//     setVerifiedOtpValue("");
//     setResendCooldown(0);
//     setResetForm({ password: "", confirmPassword: "" });
//     setResetErrors({});
//     setResetLoading(false);
//   };

//   const handleSendOtp = async () => {
//     const trimmedEmail = email.trim();
//     const validationError = buildEmailError(trimmedEmail);
//     if (validationError) {
//       setEmailError(validationError);
//       return;
//     }
//     setEmailError("");
//     setSending(true);
//     try {
//       await requestPasswordReset(trimmedEmail);
//       setSubmittedEmail(trimmedEmail);
//       setStep("otp");
//       setOtp(Array(DIGITS).fill(""));
//       startCooldown();
//       toast.success("OTP sent to your email.");
//     } catch (error) {
//       toast.error(error.message || "Failed to send OTP.");
//     } finally {
//       setSending(false);
//     }
//   };

//   const handleResendOtp = async () => {
//     if (!submittedEmail) {
//       toast.error("Please enter your email first.");
//       return;
//     }
//     setResendLoading(true);
//     try {
//       await requestPasswordReset(submittedEmail);
//       startCooldown();
//       toast.success("OTP resent.");
//     } catch (error) {
//       toast.error(error.message || "Unable to resend OTP.");
//     } finally {
//       setResendLoading(false);
//     }
//   };

//   const handleVerifyOtp = async () => {
//     if (!submittedEmail) {
//       goToEmailStep();
//       return;
//     }
//     if (!isOtpComplete) {
//       toast.error("Enter the complete OTP code.");
//       return;
//     }
//     const code = otp.join("");
//     setOtpLoading(true);
//     try {
//       await verifyResetOtp(submittedEmail, code);
//       setVerifiedOtpValue(code);
//       setStep("reset");
//       toast.success("OTP verified.");
//     } catch (error) {
//       toast.error(error.message || "OTP verification failed.");
//     } finally {
//       setOtpLoading(false);
//     }
//   };

//   const handleResetChange = (e) => {
//     setResetForm((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//     setResetErrors((prev) => ({
//       ...prev,
//       [e.target.name]: "",
//     }));
//   };

//   const validateResetForm = () => {
//     const nextErrors = {};
//     if (!resetForm.password.trim()) {
//       nextErrors.password = "Please enter a new password.";
//     } else if (resetForm.password.length < 8) {
//       nextErrors.password = "Password must be at least 8 characters.";
//     }
//     if (!resetForm.confirmPassword.trim()) {
//       nextErrors.confirmPassword = "Please confirm your password.";
//     } else if (resetForm.password !== resetForm.confirmPassword) {
//       nextErrors.confirmPassword = "Passwords do not match.";
//     }
//     setResetErrors(nextErrors);
//     return Object.keys(nextErrors).length === 0;
//   };

//   const handleResetPassword = async () => {
//     if (!submittedEmail || !verifiedOtpValue) {
//       goToEmailStep();
//       return;
//     }
//     if (!validateResetForm()) return;
//     setResetLoading(true);
//     try {
//       await resetPassword(submittedEmail, verifiedOtpValue, resetForm.password);
//       toast.success("Password reset successfully. Please log in.");
//       navigate(`${base}/login`, { replace: true });
//     } catch (error) {
//       toast.error(error.message || "Unable to reset password.");
//     } finally {
//       setResetLoading(false);
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (step === "email") {
//       handleSendOtp();
//     } else if (step === "otp") {
//       handleVerifyOtp();
//     } else {
//       handleResetPassword();
//     }
//   };

//   return (
//     <div className={`${loginStyles.loginWrapper} container flex flex-col items-center justify-center mt-10`}>
//       <img src="/assets/imgs/logo.png" alt="logo" className="mb-6 w-24" />
//       <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
//         <div className="space-y-1">
//           <h2 className="text-2xl font-semibold text-[#0d2b49]">Forgot Password</h2>
//           <p className="text-sm text-gray-500">
//             {step === "email" && "Enter the email associated with your account to receive a verification code."}
//             {step === "otp" && `Enter the ${DIGITS}-digit code sent to ${submittedEmail || "your email"}.`}
//             {step === "reset" && "Choose a strong new password and confirm it below."}
//           </p>
//         </div>

//         {step === "email" && (
//           <div className={loginStyles.input_container}>
//             <div className={loginStyles.label}>
//               <img src="/assets/icons/mail.svg" className={loginStyles.icon} alt="email icon" />
//               <p>البريد الإليكتروني</p>
//             </div>
//             <input
//               type="text"
//               dir="ltr"
//               name="email"
//               value={email}
//               onChange={(e) => {
//                 setEmail(e.target.value);
//                 if (emailError) setEmailError("");
//               }}
//               placeholder="Example@mail.com"
//               className={`input-field ${emailError ? "border-red-500" : ""}`}
//               autoComplete="email"
//               disabled={sending}
//             />
//             {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
//           </div>
//         )}

//         {step === "otp" && (
//           <div className="space-y-4">
//             <div className="flex justify-between items-center text-sm text-gray-500">
//               <button type="button" className="text-blue-500 underline" onClick={goToEmailStep}>
//                 Back to email
//               </button>
//               <p className="text-xs text-gray-400">Step 2 of 3</p>
//             </div>
//             <div dir="ltr" className={verifyStyles.inputsRow}>
//               {otp.map((value, idx) => (
//                 <input
//                   key={idx}
//                   value={value}
//                   type="text"
//                   inputMode="numeric"
//                   pattern="[0-9]*"
//                   maxLength={1}
//                   onChange={(e) => handleOtpChange(idx, e)}
//                   onKeyDown={(e) => handleOtpKeyDown(idx, e)}
//                   onPaste={(e) => handleOtpPaste(idx, e)}
//                   ref={(el) => {
//                     inputsRef.current[idx] = el;
//                   }}
//                   className={verifyStyles.digitInput}
//                   disabled={otpLoading}
//                   aria-label={`Digit ${idx + 1}`}
//                 />
//               ))}
//             </div>
//             <div className={verifyStyles.actions}>
//               <button
//                 type="button"
//                 className={verifyStyles.outlineBtn}
//                 onClick={handleResendOtp}
//                 disabled={resendLoading || resendCooldown > 0}
//               >
//                 Resend OTP{resendCooldown ? ` (${resendCooldown}s)` : ""}
//               </button>
//               <button
//                 type="submit"
//                 className={verifyStyles.primaryBtn}
//                 disabled={!isOtpComplete || otpLoading}
//               >
//                 {otpLoading ? "Verifying..." : "Verify OTP"}
//               </button>
//             </div>
//           </div>
//         )}

//         {step === "reset" && (
//           <div className="space-y-4">
//             <div className="flex justify-between items-center text-sm text-gray-500">
//               <span className="text-xs text-gray-400">Step 3 of 3</span>
//               <span className="font-semibold text-gray-700">انشئ كلمة سر جديدة</span>
//             </div>
//             <div className={loginStyles.input_container}>
//               <div className={loginStyles.label}>
//                 <img src="/assets/icons/lock.svg" className={loginStyles.icon} alt="password icon" />
//                 <p>كلمة السر الجديدة</p>
//               </div>
//               <div className={loginStyles.hide_pass}>
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   value={resetForm.password}
//                   onChange={handleResetChange}
//                   placeholder="********"
//                   className={`input-field ${resetErrors.password ? "border-red-500" : ""}`}
//                   autoComplete="new-password"
//                   disabled={resetLoading}
//                   ref={resetPasswordRef}
//                 />
//                 <button
//                   type="button"
//                   className={loginStyles.eyeBtn}
//                   onClick={() => setShowPassword((prev) => !prev)}
//                   disabled={resetLoading}
//                 >
//                   {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
//                 </button>
//               </div>
//               {resetErrors.password && <p className="text-red-500 text-sm mt-1">{resetErrors.password}</p>}
//             </div>
//             <div className={loginStyles.input_container}>
//               <div className={loginStyles.label}>
//                 <img src="/assets/icons/lock.svg" className={loginStyles.icon} alt="confirm password icon" />
//                 <p>تأكيد كلمة السر</p>
//               </div>
//               <div className={loginStyles.hide_pass}>
//                 <input
//                   type={showConfirmPassword ? "text" : "password"}
//                   name="confirmPassword"
//                   value={resetForm.confirmPassword}
//                   onChange={handleResetChange}
//                   placeholder="********"
//                   className={`input-field ${resetErrors.confirmPassword ? "border-red-500" : ""}`}
//                   autoComplete="new-password"
//                   disabled={resetLoading}
//                 />
//                 <button
//                   type="button"
//                   className={loginStyles.eyeBtn}
//                   onClick={() => setShowConfirmPassword((prev) => !prev)}
//                   disabled={resetLoading}
//                 >
//                   {showConfirmPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
//                 </button>
//               </div>
//               {resetErrors.confirmPassword && (
//                 <p className="text-red-500 text-sm mt-1">{resetErrors.confirmPassword}</p>
//               )}
//             </div>
//           </div>
//         )}

//         {step !== "otp" && (
//           <button
//             type="submit"
//             disabled={
//               sending ||
//               (step === "reset" && resetLoading)
//             }
//             className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-[#002f52] transition disabled:opacity-60"
//           >
//             {step === "email" && (sending ? "Sending OTP..." : "Send OTP")}
//             {step === "reset" && (resetLoading ? "Resetting..." : "Reset Password")}
//           </button>
//         )}
//       </form>
//     </div>
//   );
// };

// export default ForgotPasswordPage;
