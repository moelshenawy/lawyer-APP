import React from "react";
import styles from "./index.module.scss";
import { IoChevronForwardOutline, IoMailOutline, IoCallOutline } from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";
import { LuMapPin } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import PageHeader from "../common/PageHeader";

const ContactPage = () => {
  const { t } = useTranslation("contact");
  const { lng } = useParams();
  const isRTL = (lng || "ar") === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  // Default map centered on Riyadh, Saudi Arabia
  const mapQuery = "24.7136,46.6753";
  const mapUrl = `https://maps.google.com/maps?q=${mapQuery}&hl=${lng || "ar"}&z=13&output=embed`;

  const contact = {
    phone: "+966920013767",
    email: "info@fawazlaw.sa",
    locations: [
      { city: t("cityRiyadh"), address: t("addressRiyadh") },
      { city: t("cityJeddah"), address: t("addressJeddah") },
    ],
  };

  return (
    <section className={styles.contact} dir={dir}>
      <div className={styles.card}>
        <PageHeader title={t("title")} />

        <div className={styles.grid}>
          <div className={styles.info}>
            <div className={styles.leadRows}>
              <div className={styles.infoRow}>
                <span className={styles.text}>{contact.phone}</span>
                <span className={`${styles.iconBadge} ${styles.whatsappBadge}`} aria-hidden="true">
                  <FaWhatsapp size={15} />
                </span>
              </div>

              <div className={`${styles.infoRow} ${styles.emailRow}`}>
                <span className={styles.text}>{contact.email}</span>
                <IoMailOutline className={styles.inlineIcon} size={18} />
              </div>
            </div>

            <div className={styles.locations}>
              {contact.locations.map((loc) => (
                <div className={styles.locationItem} key={loc.city}>
                  <div className={styles.locationHeader}>
                    <LuMapPin size={18} className={styles.locationIcon} />
                    <span className={styles.city}>{loc.city}</span>
                  </div>
                  <p className={styles.address}>{loc.address}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.mapCard}>
            <iframe
              src={mapUrl}
              title={t("mapTitle")}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className={styles.mapFrame}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.whatsappButton}>
              <span className={styles.buttonIcon}>
                <FaWhatsapp size={16} />
              </span>
              <span>{t("whatsapp")}</span>
            </button>

            <button type="button" className={styles.callButton}>
              <span className={styles.buttonIconOutline}>
                <IoCallOutline size={16} />
              </span>
              <span>{t("call")}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
