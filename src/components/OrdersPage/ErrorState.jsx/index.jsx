import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ErrorState = ({ message, onRetry }) => {
  const navigate = useNavigate();
  const { lng } = useParams();
  const { t } = useTranslation("orderDetails");

  const handleBack = () => {
    const lang = lng || "ar";
    navigate(`/${lang}/account`, { replace: false });
  };

  return (
    <section id="order-error" className="pb-24 w-full" dir={(lng || "ar") === "ar" ? "rtl" : "ltr"}>
      <div className=" mx-auto flex items-center justify-center min-h-[50vh] px-4">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] p-6 md:p-10 text-center flex flex-col items-center gap-4">
          {/* Icon */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#FFF3E6] flex items-center justify-center border-[6px] border-[#FFE0B8]">
            <span className="text-4xl md:text-5xl" aria-hidden="true">
              ⚠️
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl md:text-2xl font-extrabold text-[#0D2B49]">{t("errorTitle")}</h2>

          {/* Description */}
          <p className="text-sm md:text-base text-[#5F5F5F] leading-relaxed">
            {t("errorDescription")}
            <br className="hidden md:block" />
            {/* {message && (
              <span className="mt-1 block text-xs md:text-sm text-[#9CA3AF]">{message}</span>
            )} */}
          </p>

          {/* Actions */}
          <div className="mt-2 flex flex-col sm:flex-row gap-3 w-full justify-center">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-white text-sm md:text-base font-bold hover:bg-[#123A64] transition-colors"
              >
                {t("retry")}
              </button>
            )}

            <button
              type="button"
              onClick={handleBack}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#0D2B49] text-[#0D2B49] text-sm md:text-base font-bold bg-white hover:bg-[#F3F4F6] transition-colors"
            >
              {t("backToAccount")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ErrorState;
