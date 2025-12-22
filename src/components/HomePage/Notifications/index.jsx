import React from "react";
import styles from "./index.module.scss";
import { useTranslation } from "react-i18next";
const Notifications = () => {
  const { t } = useTranslation("home");
  return (
    <>
      <section
        id="notifications"
        className={`${styles.notifications_card} bg-main rounded-lg container mt-4 flex flex-col gap-3 mobile`}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-[#0D2B49] text-sm sm:text-base">
            {t("notificationsTitle")}
          </h2>
        </div>
        <div className={styles.sec_container}>
          <div className={styles.text_container}>
            <div className={styles.title}>
              <p>{t("notificationRequiredDoc")}</p>
            </div>

            <div className={styles.desc}>
              <p>{t("notificationGeneralPoa")}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className={`${styles.buttons}`}>
            <button className="bg-primary text-main font-semibold  rounded-2xl hover:bg-[#f5a844] hover:text-white transition-all">
              {t("notificationUploadDoc")}
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Notifications;
