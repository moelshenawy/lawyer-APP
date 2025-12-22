import React, { useContext } from "react";
import styles from "./index.module.scss";
import { AuthContext } from "@/context/AuthContext";
import { Link, useLocation, useParams } from "react-router-dom";
import Notification from "@/assets/icons/Notification";
import { useTranslation } from "react-i18next";

const User = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const { lng } = useParams();
  const base = `/${lng || "ar"}`;
  const notificationPath = `${base}/notification`;
  const isNotificationActive = location.pathname.endsWith("/notification");
  const firstName = user?.first_name || user?.firstName || user?.name || "";
  const { t } = useTranslation("home");

  return (
    <section id="user" className={`${styles.user} mt-6 mb-4`}>
      <div className="container">
        <div className={`flex justify-between ${styles.sec_container}`}>
          <div className={`flex items-center gap-3 ${styles.user_info}`}>
            <div className={styles.img_container}>
              <img src="/assets/imgs/logo.png" width={22} alt="user image" />
            </div>

            <div className={styles.text_container}>
              <div className={styles.welcome}>
                <p>{t("welcomeBack")}</p>
              </div>

              <div className={styles.username}>
                <p>{firstName} /محامى</p>
              </div>
            </div>
          </div>

          <div className={`flex gap-3 ${styles.sys_icons}`}>
            <Link to={notificationPath} className={styles.notifButton} aria-label="Notification">
              <Notification size={20} active={isNotificationActive} />
              {!isNotificationActive && <span className={styles.dot} />}
            </Link>

            <Link to={`${base}/chat`} className={styles.notifButton} aria-label="chat">
              <img src="/assets/icons/message.svg" alt="message" width={20} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default User;
