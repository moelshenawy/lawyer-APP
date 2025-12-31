import { HeadProvider, Title, Meta } from "react-head";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import styles from "./Home.module.scss";
import User from "@/components/HomePage/User";
import TasksCard from "@/components/TasksCard";
import StatusPopup from "@/components/common/StatusPopup";
import { clockIn, clockOut } from "@/api/user";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";

const notifications = [
  {
    title: "قضية تصالح",
    message: "تم رفع المستند المطلوب في قضية التصالح",
    icon: "chat",
  },
  {
    title: "المكتب",
    message: "تم اسناد قضية جديدة إليك",
    icon: "scale",
  },
];

const Home = () => {
  const { user, loading, refreshAccount } = useContext(AuthContext);
  const navigate = useNavigate();
  const { lng } = useParams();
  const base = `/${lng || "ar"}`;

  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [attendanceType, setAttendanceType] = useState(null); // 'clockIn' or 'clockOut'
  const [attendanceData, setAttendanceData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const attendance = user?.attendance_today;
  const isClockedIn = !!attendance?.check_in_at_iso;
  const isClockedOut = !!attendance?.check_out_at_iso;

  useEffect(() => {
    if (!loading && !user) {
      navigate(`${base}/login`, { replace: true });
    }
  }, [loading, user, navigate, base]);

  const handleAcceptClick = () => {
    setAttendanceType("clockIn");
    setShowConfirmPopup(true);
  };

  const handleRejectClick = () => {
    setAttendanceType("clockOut");
    setShowConfirmPopup(true);
  };

  const handleConfirmYes = async () => {
    setIsProcessing(true);
    setShowConfirmPopup(false);

    try {
      const response = attendanceType === "clockIn" 
        ? await clockIn() 
        : await clockOut();

      const { data } = response;

      if (data?.success) {
        setAttendanceData(data.data);
        setShowSuccessPopup(true);
        toast.success(data.message || "تم التسجيل بنجاح");
        await refreshAccount(); // Update user data with latest attendance
      } else {
        toast.error("فشل في تسجيل الحضور");
      }
    } catch (error) {
      const message = error?.response?.data?.message || "حدث خطأ أثناء التسجيل";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmNo = () => {
    setShowConfirmPopup(false);
    setAttendanceType(null);
  };

  const handleSuccessClose = () => {
    setShowSuccessPopup(false);
    setAttendanceData(null);
    setAttendanceType(null);
  };

  const { t } = useTranslation("home");

  if (loading || !user) return null;

  return (
    <>
      <HeadProvider>
        <Title>{t("seoTitle", "الرئيسية | المحامي")}</Title>
        <Meta name="description" content={t("seoDescription", "Lawyer client home page.")} />
      </HeadProvider>

      <div className={styles.page}>
{attendance && (
  <section className={styles.banner} dir={i18n.dir()}>
    <div className={styles.attendanceHeader}>
      <div className={styles.attendanceChip}>
        {!isClockedIn && !isClockedOut && <span className={styles.chipPending}>غير مسجل</span>}
        {isClockedIn && !isClockedOut && <span className={styles.chipIn}>مسجل حضور</span>}
        {isClockedIn && isClockedOut && <span className={styles.chipDone}>اكتمل</span>}
      </div>

      {isProcessing && (
        <div className={styles.processingHint} aria-live="polite">
          جاري التسجيل...
        </div>
      )}
    </div>

    {/* Case 1: Not Clocked In yet */}
    {!attendance.check_in_at_iso && (
      <>
        <p className={styles.bannerText}>
          تم رصد دخولك المكتب. هل تريد تسجيل حضورك؟
          <span className={styles.bannerSubText}>سيتم تسجيل الوقت الحالي تلقائيًا.</span>
        </p>

        <div className={styles.bannerActions}>
          <button
            className={`${styles.bannerBtn} ${styles.fingerprintBtn} ${styles.actionBtn}`}
            type="button"
            onClick={handleAcceptClick}
            disabled={isProcessing}
            aria-label="تسجيل الحضور"
          >
            <img src="/assets/icons/finger_print.svg" alt="fingerprint" />
            <span className={styles.actionLabel}>تسجيل الحضور</span>
          </button>
        </div>
      </>
    )}

    {/* Case 2: Clocked In, but not Clocked Out */}
    {attendance.check_in_at_iso && !attendance.check_out_at_iso && (
      <>
        <p className={styles.bannerText}>
          أنت مسجل حضور منذ {attendance.check_in_at_since}.
          <span className={styles.bannerSubText}>
            وقت الحضور: <strong>{attendance.check_in_at}</strong>
          </span>
        </p>

        <div className={styles.bannerActions}>
          <button
            className={`${styles.bannerBtn} ${styles.logoutBtn} ${styles.actionBtn}`}
            type="button"
            onClick={handleRejectClick}
            disabled={isProcessing}
            aria-label="تسجيل الانصراف"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className={styles.actionLabel}>تسجيل الانصراف</span>
          </button>
        </div>
      </>
    )}

    {/* Case 3: Clocked Out */}
    {attendance.check_in_at_iso && attendance.check_out_at_iso && (
      <div className={styles.attendanceDetails}>
        <p className={styles.bannerText}>ملخص الحضور اليوم:</p>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>وقت الحضور</span>
            <span className={styles.summaryValue}>
              {attendance.check_in_at} <small>({attendance.check_in_at_since})</small>
            </span>
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>وقت الانصراف</span>
            <span className={styles.summaryValue}>
              {attendance.check_out_at} <small>({attendance.check_out_at_since})</small>
            </span>
          </div>

          <div className={styles.summaryItemWide}>
            <span className={styles.summaryLabel}>إجمالي العمل</span>
            <span className={styles.summaryValue}>
              {(attendance.work_minutes)}
            </span>
          </div>
        </div>
      </div>
    )}
  </section>
)}


        <User />

        <section className={styles.section} dir={"rtl"}>
          <h2 className={styles.sectionTitle}>اشعارات</h2>
          <div className={styles.notificationList}>
            {notifications.map((item) => (
              <div className={styles.notificationCard} key={item.title}>
                <div className={styles.notificationIcon}>
                  {item.icon === "chat" ? (
                    <img src="/assets/imgs/logo.png" alt={"logoAlt"} className="mb-6 w-24" />
                  ) : (
                    <img src="/assets/imgs/logo.png" alt={"logoAlt"} className="mb-6 w-24" />
                  )}
                </div>
                <div className={styles.notificationText}>
                  <span className={styles.notificationTitle}>{item.title}</span>
                  <p className={styles.notificationMessage}>{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <TasksCard />
      </div>

      {/* Confirmation Popup */}
      <StatusPopup
        isOpen={showConfirmPopup}
        status="confirm"
        title={attendanceType === "clockIn" ? "تسجيل الحضور" : "تسجيل الانصراف"}
        description={
          attendanceType === "clockIn" 
            ? "هل أنت متأكد أنك تريد تسجيل حضورك؟" 
            : "هل أنت متأكد أنك تريد تسجيل انصرافك؟"
        }
        primaryAction={{
          label: "نعم",
          onClick: handleConfirmYes,
          disabled: isProcessing
        }}
        secondaryAction={{
          label: "لا",
          onClick: handleConfirmNo,
          disabled: isProcessing
        }}
        onClose={handleConfirmNo}
        disableClose={isProcessing}
      />

      {/* Success Popup for Clock Out */}
      <StatusPopup
        isOpen={showSuccessPopup && attendanceType === "clockOut"}
        status="success"
        title="تم تسجيل الانصراف بنجاح"
        bullets={attendanceData ? [
          `وقت العمل: ${Math.floor(attendanceData.work_minutes)} دقيقة`,
          `طريقة الانصراف: ${attendanceData.check_out_method_label}`,
          `وقت الانصراف: ${attendanceData.check_out_at}`,
          `منذ: ${attendanceData.check_out_at_since}`
        ] : []}
        primaryAction={{
          label: "حسناً",
          onClick: handleSuccessClose
        }}
        onClose={handleSuccessClose}
      />

      {/* Success Popup for Clock In */}
      <StatusPopup
        isOpen={showSuccessPopup && attendanceType === "clockIn"}
        status="success"
        title="تم تسجيل الحضور بنجاح"
        description={attendanceData?.check_in_at || ""}
        primaryAction={{
          label: "حسناً",
          onClick: handleSuccessClose
        }}
        onClose={handleSuccessClose}
      />
    </>
  );
};

export default Home;
