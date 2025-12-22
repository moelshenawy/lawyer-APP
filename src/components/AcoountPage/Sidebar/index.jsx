import React, { useContext, useState } from "react";
import styles from "./index.module.scss";
import Calendar from "@/assets/icons/Calendar";
import Orders from "@/assets/icons/Orders";
import UserIcon from "@/assets/icons/User";
// import { Link, Navigate, useParams } from "react-router-dom";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AuthContext } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { FiLogOut } from "react-icons/fi";
import { useTranslation } from "react-i18next";
const URL_OUT_BASE = import.meta.env.VITE_OUT_BASE_URL;

const Sidebar = ({ hideOnMobile = false, variant = "default" }) => {
  const { t } = useTranslation("sidebar");
  const { lng } = useParams();
  const navigate = useNavigate();
  const base = `/${lng || "ar"}`;
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";
  const { user } = useContext(AuthContext);
  const isProfileVariant = variant === "profile";
  const sidebarClassName = `${styles.sidebar} ${hideOnMobile ? styles.hideOnMobile : ""} ${
    isProfileVariant ? styles.profileSidebar : ""
  }`.trim();
  const avatarSrc = user?.avatar || user?.image || "/assets/imgs/client.png";
  const [loading, setLoading] = useState(false);

  const clearAuthTokens = () => {
    try {
      localStorage.removeItem("access_token");
    } catch {}
  };

  const handleLogout = async () => {
    setLoading(true);
    const toastId = toast.loading(t("logoutLoading"));
    try {
      clearAuthTokens();
      toast.success(t("logoutSuccess"), { id: toastId });
      navigate(`${base}/login`, { replace: true });
      window.location.reload();
    } catch (err) {
      toast.error(t("logoutError"), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className={sidebarClassName} dir={dir}>
      {isProfileVariant ? (
        <div className={styles.profileCard}>
          <div className={styles.profileCover} />
          <div className={styles.profileBody}>
            <div className={styles.profileAvatar}>
              <img src={avatarSrc} alt="User avatar" className={styles.profileImage} />
              <button type="button" className={styles.editButton} aria-label="Edit profile">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M12.9 3.4l3.7 3.7-8.5 8.5H4.4v-3.7l8.5-8.5Zm1.4-1.4 1.6-1.6a1 1 0 0 1 1.4 0l2.3 2.3a1 1 0 0 1 0 1.4l-1.6 1.6-3.7-3.7Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
            <h3 className={styles.profileName}>{user?.name || "..."}</h3>
            <div className={styles.profileEmail}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M22 8l-10 6L2 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <span dir="ltr">{user?.email || ""}</span>
            </div>
          </div>
          <div className={styles.profileActions}>
            <Link
              to={`${URL_OUT_BASE}${base}/invite-friend/${user.id}`}
              className={styles.qrLink}
              aria-label={t("inviteFriend")}
            >
              <img src="/assets/imgs/qr_code.png" width={36} alt="QR code" className={styles.qr} />
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.userCard}>
          <div className="logo_container">
            <div className="user flex items-center justify-between">
              <div className="flex items-center justify-between gap-2">
                {/* <img src="/assets/imgs/client.png" alt="User Avatar" className={styles.avatar} /> */}

                <div className={styles.chip}>
                  <svg
                    width={18}
                    height={18}
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M10.75 0C16.6871 0 21.5 4.81294 21.5 10.75C21.5 16.6871 16.6871 21.5 10.75 21.5C4.81294 21.5 0 16.6871 0 10.75C0 4.81294 4.81294 0 10.75 0ZM15.7891 15.2305C13.1216 12.3505 8.32283 12.4987 5.71191 15.2256L5.52441 15.4131C5.37923 15.5583 5.29964 15.7567 5.30469 15.9619C5.30985 16.1673 5.39938 16.3622 5.55176 16.5C6.9258 17.7425 8.74937 18.5 10.748 18.5C12.7467 18.5 14.5703 17.7424 15.9443 16.5C16.0967 16.3622 16.1862 16.1673 16.1914 15.9619C16.1965 15.7567 16.1169 15.5583 15.9717 15.4131L15.7891 15.2305ZM10.7393 5C8.94357 5.00023 7.48633 6.45421 7.48633 8.25C7.48633 10.0458 8.94357 11.4998 10.7393 11.5C12.5351 11.5 13.9932 10.0459 13.9932 8.25C13.9932 6.45407 12.5351 5 10.7393 5Z"
                      fill="white"
                    />
                  </svg>
                </div>
                <h3>{user?.name || "..."}</h3>
              </div>

              <Link to={`${URL_OUT_BASE}${base}/invite-friend/${user.id}`}>
                <img
                  src="/assets/imgs/qr_code.png"
                  width={40}
                  alt="User Qr Code"
                  className={styles.qr}
                />
              </Link>
            </div>
          </div>
          <div className={styles.userHeader}>
            <div className={styles.userInfo}>
              <div className="flex gap-2">
                <img src="/assets/icons/mail-white.svg" width={14} alt="" />
                <p className={styles.email}>{user?.email || ""}</p>
              </div>

              <div className="flex gap-2">
                <img src="/assets/icons/shopping-bag.svg" width={14} alt="" />
                <p className={styles.date}>{t("packageEndsAt")}</p>
              </div>

              <div className="flex gap-2">
                <img src="/assets/icons/call.svg" width={14} alt="" />
                <p className={styles.phone}>{user?.phone || ""}</p>
              </div>
              <div className="flex gap-2">
                <img
                  src="/assets/imgs/client.png"
                  alt="User Avatar"
                  className={`${styles.small} ${styles.avatar}`}
                />
                <p className={styles.lawyer}>{t("lawyerName")}</p>
              </div>
            </div>
          </div>

          {/* <div className={styles.appleWallet}>
            <img src="/assets/imgs/apple_wallet.jpg" alt="Apple Wallet" />
          </div> */}
        </div>
      )}

      {/* Menu */}
      <div className={`${styles.menu} ${isProfileVariant ? styles.menuProfile : ""}`}>
        <Link
          to={`${base}/account-settings`}
          className={`${styles.menuItem} ${isProfileVariant ? styles.menuItemProfile : ""}`}
        >
          <div className={`flex items-center gap-3 ${styles.menuContent}`}>
            <span className={styles.menuIcon}>
              <UserIcon size={20} />
            </span>
            <span className={styles.menuLabel}>{t("account")}</span>
          </div>
          <img
            src="/assets/icons/arrow-left.svg"
            alt="arrow"
            className={`${styles.arrowIcon} ${isProfileVariant ? styles.arrowHidden : ""}`}
          />
        </Link>

        <Link
          to={`${base}/consultation`}
          className={`${styles.menuItem} ${isProfileVariant ? styles.menuItemProfile : ""}`}
        >
          <div className={`flex items-center gap-3 ${styles.menuContent}`}>
            <span className={styles.menuIcon}>
              <img src="/assets/icons/justice-scale.svg" width={24} alt="icon" />
            </span>
            <span className={styles.menuLabel}>{t("consultations")}</span>
          </div>
          <img
            src="/assets/icons/arrow-left.svg"
            alt="arrow"
            className={`${styles.arrowIcon} ${isProfileVariant ? styles.arrowHidden : ""}`}
          />
        </Link>

        <Link
          to={`${base}/appointments`}
          className={`${styles.menuItem} ${isProfileVariant ? styles.menuItemProfile : ""}`}
        >
          <div className={`flex items-center gap-3 ${styles.menuContent}`}>
            <span className={styles.menuIcon}>
              <Calendar size={20} />
            </span>
            <span className={styles.menuLabel}>{t("appointments")}</span>
          </div>
          <img
            src="/assets/icons/arrow-left.svg"
            alt="arrow"
            className={`${styles.arrowIcon} ${isProfileVariant ? styles.arrowHidden : ""}`}
          />
        </Link>

        <Link
          to={`${base}/orders`}
          className={`${styles.menuItem} ${isProfileVariant ? styles.menuItemProfile : ""}`}
        >
          <div className={`flex items-center gap-3 ${styles.menuContent}`}>
            <span className={styles.menuIcon}>
              <Orders size={20} />
            </span>
            <span className={styles.menuLabel}>{t("orders")}</span>
          </div>
          <img
            src="/assets/icons/arrow-left.svg"
            alt="arrow"
            className={`${styles.arrowIcon} ${isProfileVariant ? styles.arrowHidden : ""}`}
          />
        </Link>

        <Link
          to={`${base}/packages`}
          className={`${styles.menuItem} ${isProfileVariant ? styles.menuItemProfile : ""}`}
        >
          <div className={`flex items-center gap-3 ${styles.menuContent}`}>
            <span className={styles.menuIcon}>
              <img src="/assets/icons/justice-scale.svg" width={24} alt="icon" />
            </span>
            <span className={styles.menuLabel}>{t("packages")}</span>
          </div>

          <img
            src="/assets/icons/arrow-left.svg"
            alt="arrow"
            className={`${styles.arrowIcon} ${isProfileVariant ? styles.arrowHidden : ""}`}
          />
        </Link>

        <Link
          to={`${base}/contact`}
          className={`${styles.menuItem} ${isProfileVariant ? styles.menuItemProfile : ""}`}
        >
          <div className={`flex items-center gap-3 ${styles.menuContent}`}>
            <span className={styles.menuIcon}>
              <img src="/assets/imgs/logo.png" width={24} alt="icon" />
            </span>
            <span className={styles.menuLabel}>{t("contact")}</span>
          </div>
          <img
            src="/assets/icons/arrow-left.svg"
            alt="arrow"
            className={`${styles.arrowIcon} ${isProfileVariant ? styles.arrowHidden : ""}`}
          />
        </Link>

        <Link
          to={`${URL_OUT_BASE}${base}/invite-friend/${user.id}`}
          className={`${styles.menuItem} ${isProfileVariant ? styles.menuItemProfile : ""}`}
        >
          <div className={`flex items-center gap-3 ${styles.menuContent}`}>
            <span className={styles.menuIcon}>
              <img src="/assets/icons/friends.svg" width={24} alt="icon" />
            </span>
            <span className={styles.menuLabel}>{t("inviteFriend")}</span>
          </div>
          <img
            src="/assets/icons/arrow-left.svg"
            alt="arrow"
            className={`${styles.arrowIcon} ${isProfileVariant ? styles.arrowHidden : ""}`}
          />
        </Link>

        <button
          type="button"
          className={`${styles.menuItem} ${styles.logoutBtn} ${
            isProfileVariant ? styles.menuItemProfile : ""
          }`}
          onClick={handleLogout}
          disabled={loading}
        >
          <div className={`flex items-center gap-3 ${styles.menuContent}`}>
            <span className={styles.menuIcon}>
              <FiLogOut size={20} />
            </span>
            <span className={styles.menuLabel}>{loading ? t("logoutLoading") : t("logout")}</span>
          </div>
          <img
            src="/assets/icons/arrow-left.svg"
            alt="arrow"
            className={`${styles.arrowIcon} ${isProfileVariant ? styles.arrowHidden : ""}`}
          />
        </button>
        {/* <Link to={`${base}/change-password`} className={styles.menuItem}>
          <div className="flex items-center gap-3">
            <img src="/assets/icons/lock.svg" width={24} alt="icon" />
            <span>تغيير كلمة السر</span>
          </div>
          <img src="/assets/icons/arrow-left.svg" alt="arrow" />
        </Link> */}

        {/* <div className={styles.menuItem}>
          <div className="flex items-center gap-3">
            <img src="/assets/icons/support.svg" width={24} alt="icon" />
            <span>المساعدة</span>
          </div>
          <img src="/assets/icons/arrow-left.svg" alt="arrow" />
        </div> */}
      </div>
    </aside>
  );
};

export default Sidebar;
