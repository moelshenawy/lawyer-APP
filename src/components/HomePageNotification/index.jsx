import React from "react";
import i18n from "@/i18n";

const HomePageNotification = ({ styles, lastNotifications = [], title = "اشعارات" }) => {
  return (
    <section className={styles.section} dir={i18n.dir()}>
      <h2 className={styles.sectionTitle}>{title}</h2>

      <div className={styles.notificationList}>
        {(lastNotifications || []).map((item, idx) => (
          <div className={styles.notificationCard} key={`${item?.title || "notif"}-${idx}`}>
            <div className={styles.notificationIcon}>
              <img src="/assets/imgs/logo.png" alt={"logoAlt"} className="mb-6 w-24" />
            </div>

            <div className={styles.notificationText}>
              <span className={styles.notificationTitle}>{item?.title}</span>
              <p className={styles.notificationMessage}>{item?.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HomePageNotification;
