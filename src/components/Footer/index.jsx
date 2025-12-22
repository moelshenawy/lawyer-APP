import React from "react";
import styles from "./index.module.scss";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

const Footer = () => {
  const { t } = useTranslation("footer");
  const { lng } = useParams();
  const base = `/${lng || "ar"}`;

  const URL_OUT_BASE = import.meta.env.VITE_OUT_BASE_URL;

  return (
    <footer className={`${styles.footer} bg-blue-100 container desktop py-3`}>
      <div className=" flex flex-col sm:flex-row items-center justify-between text-[#5F5F5F] text-xs sm:text-sm font-medium gap-2 sm:gap-0 text-center sm:text-start">
        {/* Right text */}
        <p className="text-[black]">{t("copyright")} </p>

        {/* Left links */}
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <a href={`${base}/contact`} className="hover:underline">
            {t("contactUs")}
          </a>
          <a href={`${URL_OUT_BASE}${base}/b/rights`} className="hover:underline">
            {t("rights")}
          </a>
          <a href={`${URL_OUT_BASE}${base}/b/terms`} className="hover:underline">
            {t("terms")}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
