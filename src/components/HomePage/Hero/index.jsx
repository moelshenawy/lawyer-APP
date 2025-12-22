import React, { useContext } from "react";
import styles from "./index.module.scss";
import { AuthContext } from "@/context/AuthContext";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Hero = () => {
  const { lng } = useParams();
  const base = `/${lng || "ar"}`;
  const { t } = useTranslation("home");

  const { user } = useContext(AuthContext);
  const displayName = user?.name || t("defaultName");

  return (
    <section id="hero" className={` ${styles.hero}`}>
      <div
        className={`relative overflow-hidden rounded-lg bg-[#0D2B49] text-white md:w-screen md:ml-[calc(50%-50vw)] md:mr-[calc(50%-50vw)] ${styles.hero_wrapper}`}
      >
        <div className="absolute inset-0">
          <img
            src="/assets/imgs/hero_bg.png"
            alt="hero background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>

        <div className="relative z-10 container mx-auto">
          <div
            className={`${styles.text_container} flex flex-col items-start gap-4 text-start sm:gap-5`}
          >
            {/* Title */}
            <div className="flex items-center justify-center gap-2">
              <img
                src="/assets/icons/Icon.svg"
                alt="icon"
                className={`${styles.icon} w-5 h-5 sm:w-6 sm:h-6`}
              />
              <h3 className="font-arabic text-lg sm:text-xl font-semibold">
                {t("heroGreetingPrefix")} <span className="">{displayName}</span>
              </h3>
            </div>

            {/* Subtitle */}
            <p className={`${styles.desc} text-sm sm:text-base text-gold leading-relaxed`}>
              {t("officePrefix")} <span className="">{t("officeName")}</span> {t("officeSuffix")}
              <br />
              <span className="text-main font-semibold">{t("tagline")}</span>
            </p>

            {/* Buttons */}
            <div className={`flex items-center justify-center gap-3 mt-2 ${styles.buttons}`}>
              <button
                to={"/consultation"}
                className="bg-white text-[#0D2B49] font-semibold  rounded-2xl hover:bg-[#f5a844] hover:text-white transition-all"
              >
                <Link to={`${base}/consultation`}>{t("ctaBookConsultation")}</Link>
              </button>

              <button className="flex items-center gap-2 border border-white text-white  rounded-2xl hover:bg-white hover:text-[#0D2B49] transition-all">
                <Link to={`${base}/packages`}>{t("ctaRegisterMembership")}</Link>
              </button>
            </div>
          </div>
        </div>
        {/* 
        <div className="absolute bottom-2 left-2  mobile">
          <img
            src="/assets/imgs/whatsapp-icon.png"
            alt="hero background"
            width={24}
            className=" object-cover "
          />
        </div> */}
      </div>
    </section>
  );
};

export default Hero;
