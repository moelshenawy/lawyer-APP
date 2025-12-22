import React, { useEffect, useRef, useState } from "react";
import styles from "./index.module.scss";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Home from "@/assets/icons/Home";
import Orders from "@/assets/icons/Orders";
import User from "@/assets/icons/User";
import Calendar from "@/assets/icons/Calendar";
import Notification from "@/assets/icons/Notification";
import Language from "@/assets/icons/Language";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const { t } = useTranslation("navbar");
  const location = useLocation();
  const navigate = useNavigate();
  const { lng } = useParams();
  const base = `/${lng || "ar"}`;
  const notificationPath = `${base}/notification`;
  const isNotificationActive = location.pathname.endsWith("/notification");
  const [isDesktop, setIsDesktop] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const languageMenuRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY || 0;
      const lastY = lastScrollYRef.current;
      const direction = current > lastY ? "down" : current < lastY ? "up" : null;

      if (direction) {
        // Hide on scroll down, show on scroll up (same behavior for all viewports)
        setIsHidden(direction === "down");
      }
      lastScrollYRef.current = current;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDesktop]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setIsLanguageMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setIsLanguageMenuOpen(false);
    }
  }, [isDesktop]);

  const handleLanguageSelect = (next) => {
    const LANGUAGES = [
      { code: "ar", label: t("languageArabic") },
      { code: "en", label: t("languageEnglish") },
      { code: "eu", label: t("languageUrdu") },
    ];
    const supportedCodes = LANGUAGES.map((lang) => lang.code);
    const current = supportedCodes.includes(lng || "") ? lng : "ar";

    if (!supportedCodes.includes(next)) {
      return;
    }

    if (next === current) {
      setIsLanguageMenuOpen(false);
      return;
    }

    const segments = location.pathname.split("/").filter(Boolean);
    const nextPathSegments = [next, ...segments.slice(1)];
    const nextPath = `/${nextPathSegments.join("/")}${location.search || ""}${location.hash || ""}`;

    navigate(nextPath);
    setIsLanguageMenuOpen(false);
  };

  const LANGUAGES = [
    { code: "ar", label: t("languageArabic") },
    { code: "en", label: t("languageEnglish") },
    { code: "eu", label: t("languageUrdu") },
  ];

  const navItems = [
    {
      path: `${base}/ai`,
      label: t("navAi"),
      icon: (isActive) => <Home active={isActive} />,
    },
    {
      path: `${base}/appointments`,
      label: t("navAppointments"),
      icon: (isActive) => <Calendar active={isActive} />,
    },
    {
      path: `${base}`,
      label: t("navHome"),
      icon: (isActive) => <Home active={isActive} />,
    },
    {
      path: `${base}/orders`,
      label: t("navOrders"),
      icon: (isActive) => <Orders active={isActive} />,
    },
    {
      path: `${base}/account`,
      label: t("navAccount"),
      icon: (isActive) => <User active={isActive} />,
    },
  ];

  return (
    <nav className={`${styles.navbar} ${isDesktop && isHidden ? styles.hiddenDesktop : ""}`}>
      <div className={`${styles.sec_container} container flex justify-between items-center`}>
        {/* Desktop Logo */}

        {/* Mobile Navigation */}
        {/* <div className={` ${styles.mobileNav}`}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.mobileItem} ${isActive ? styles.active : ""}`}
              >
                <span className={styles.icon}>{item.icon(isActive)}</span>
                <span className={styles.label}>{item.label}</span>
              </Link>
            );
          })}
        </div> */}
        {/* Mobile Navigation */}
        <div className={`${styles.mobileNav} ${!isDesktop && isHidden ? styles.hiddenMobile : ""}`}>
          <div className="container flex justify-between items-center md:gap-[26px]">
            {(isDesktop ? navItems.filter((n) => !n.path.endsWith("/ai")) : navItems).map(
              (item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${styles.mobileItem} ${isActive ? styles.active : ""}`}
                  >
                    <span className={styles.icon}>{item.icon(isActive)}</span>
                    <span className={styles.label}>{item.label}</span>
                  </Link>
                );
              },
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
