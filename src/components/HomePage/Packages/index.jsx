import React, { useContext } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import styles from "./index.module.scss";
import { AuthContext } from "@/context/AuthContext";
import useChatStore from "@/store/useChatStore";
import { useTranslation } from "react-i18next";

const Packages = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { lng } = useParams();
  const { openChat } = useChatStore();
  const isSubscribed = Boolean(user?.is_subscribed);
  const base = `/${lng || "ar"}`;
  const { t } = useTranslation("home");
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";

  const handleTryNow = () => {
    const isMobile = window.matchMedia("(max-width: 460px)").matches;
    if (isMobile) {
      navigate(`/${lng || "ar"}/ai`);
      return;
    }
    openChat();
  };

  return (
    <section id="packages" className={`${styles.packages_section}  flex flex-col gap-6 `} dir={dir}>
      {isSubscribed && (
        <div
          className={`${styles.assistant_card} flex flex-col sm:flex-row items-center justify-between rounded-lg bg-white p-5 sm:p-8 gap-4`}
        >
          {/* Text */}
          <div className="text-start flex flex-col gap-2 flex-1 sm:flex-initial sm:max-w-[535px]">
            <h3 className="text-primary font-semibold text-base sm:text-lg">
              {t("assistantTitle")}
            </h3>

            <h5 className="text-[#0071BC] text-sm sm:text-base font-medium ">
              {t("assistantSubtitle")}
            </h5>
            <p className="text-[#666666] text-sm leading-relaxed mt-3 hidden sm:block ">
              {t("assistantDescLine1")}
              {t("assistantDescLine2")}{" "}
            </p>
            <button
              className="bg-primary text-white rounded-xl px-6 py-2 mt-2 w-fit hover:bg-[#123A64] transition-all cursor-pointer"
              onClick={handleTryNow}
            >
              {t("tryNow")}
            </button>
          </div>

          {/* Icon / Image */}
          <div className="flex-shrink-0 flex justify-center sm:justify-start w-fit sm:w-auto">
            <div className="bg-primary rounded-full flex items-center justify-center  sm:w-40 sm:h-40">
              <img src="/assets/icons/ai.svg" alt="assistant" className=" object-contain" />
            </div>
          </div>
        </div>
      )}

      {!isSubscribed && (
        <div
          className={`${styles.assistant_card}   flex flex-col mb-20 bg-blue-100 sm:flex-row items-center justify-between  rounded-xl  p-5 sm:p-8 gap-4 mt-5`}
        >
          {/* Text */}
          <div className="text-start flex flex-col gap-2 flex-1 sm:flex-initial sm:max-w-[535px]">
            <h3 className="text-primary font-semibold text-base sm:text-lg">
              {t("packagesHeroTitle")}
            </h3>
            <h5 className="text-[#0071BC] text-sm sm:text-base font-medium">
              {t("packagesHeroSubtitle")}
            </h5>
            <p className="text-[#666666] text-sm leading-relaxed mt-3">
              {t("packagesHeroDescLine1")}
              {t("packagesHeroDescLine2")}{" "}
            </p>
            <Link
              to={`${base}/packages`}
              className="bg-primary text-white rounded-xl px-6 py-2 mt-2 w-fit hover:bg-[#123A64] transition-all"
            >
              {t("subscribeNow")}
            </Link>
          </div>

          {/* Icon / Image */}
          {/* <div className="flex-shrink-0 flex justify-center sm:justify-start w-fit sm:w-auto">
            <img
              src="/assets/imgs/assistant.png"
              alt="briefcase"
              className="w-182 h-182 sm:w-28 sm:h-28 object-contain"
            />
          </div> */}

          <div className="flex-shrink-0 flex justify-center sm:justify-start w-fit sm:w-auto">
            <div className="  flex items-center justify-center  sm:w-40 sm:h-40">
              <img src="/assets/imgs/assistant.png" alt="assistant" className=" object-contain" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Packages;
