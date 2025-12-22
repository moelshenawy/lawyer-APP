import React, { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import { AuthContext } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

const FADE_DURATION_MS = 700; // Match CSS animation duration

const SplashScreen = () => {
  const { loading } = useContext(AuthContext) || {};
  const [isVisible, setIsVisible] = useState(!!loading);
  const [isFading, setIsFading] = useState(false);
  const { t, i18n } = useTranslation("splash");

  useEffect(() => {
    let fadeTimer;
    if (loading) {
      setIsVisible(true);
      setIsFading(false);
    } else if (isVisible) {
      setIsFading(true);
      fadeTimer = setTimeout(() => {
        setIsVisible(false);
        setIsFading(false);
      }, FADE_DURATION_MS);
    }

    return () => {
      clearTimeout(fadeTimer);
    };
  }, [loading, isVisible]);

  if (!isVisible) return null;

  return (
    <div className={`${styles.splash} ${isFading ? styles.fadeOut : ""}`} dir={i18n.dir()}>
      <div className={styles.content}>
        <img
          src="/assets/imgs/logo.png"
          alt="Fawaz Al Dahish Office logo"
          className={styles.logo}
        />

        <div className={styles.textBlock}>
          <p className={styles.title}>{t("title")}</p>
          <p className={styles.subtitle}>{t("subtitle")}</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
