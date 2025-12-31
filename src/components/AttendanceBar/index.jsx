import React, { useState } from "react";
import { toast } from "react-hot-toast";
import StatusPopup from "@/components/common/StatusPopup";
import { clockIn, clockOut } from "@/api/user";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { FiClock, FiCheckCircle, FiActivity } from "react-icons/fi";

const AttendanceBar = ({ attendance, refreshAccount, styles }) => {
  const { t } = useTranslation("home");

  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [attendanceType, setAttendanceType] = useState(null); // 'clockIn' | 'clockOut' | null
  const [attendanceData, setAttendanceData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);

  const isClockedIn = !!attendance?.check_in_at_iso;
  const isClockedOut = !!attendance?.check_out_at_iso;

  const handleAcceptClick = () => {
    setAttendanceType("clockIn");
    setShowConfirmPopup(true);
  };

  const handleRejectClick = () => {
    setAttendanceType("clockOut");
    setShowConfirmPopup(true);
  };

  const handleConfirmNo = () => {
    if (isProcessing) return;
    setShowConfirmPopup(false);
    setAttendanceType(null);
  };

  const handleSuccessClose = () => {
    setShowSuccessPopup(false);
    setAttendanceData(null);
    setAttendanceType(null);
  };

  const closeDetails = () => setShowDetailsPopup(false);

  const handleConfirmYes = async () => {
    setIsProcessing(true);
    setShowConfirmPopup(false);

    try {
      const response = attendanceType === "clockIn" ? await clockIn() : await clockOut();
      const { data } = response;

      if (data?.success) {
        setAttendanceData(data.data);
        setShowSuccessPopup(true);
        toast.success(data.message || t("attendance.toast.success", "تم التسجيل بنجاح"));
        await refreshAccount?.(); // keep same behavior
      } else {
        toast.error(t("attendance.toast.fail", "فشل في تسجيل الحضور"));
      }
    } catch (error) {
      const message =
        error?.response?.data?.message || t("attendance.toast.error", "حدث خطأ أثناء التسجيل");
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!attendance) return null;

  return (
    <>
      <section className={styles.attendanceArea} dir={i18n.dir()}>
        <div className={styles.attendanceBar}>
          <div className={styles.attendanceInfo}>
            <div
              className={`${styles.attendanceIcon} ${
                !isClockedIn ? styles.pending : !isClockedOut ? styles.active : styles.done
              }`}
            >
              {!isClockedIn && <FiClock />}
              {isClockedIn && !isClockedOut && <FiActivity />}
              {isClockedIn && isClockedOut && <FiCheckCircle />}
            </div>

            <div className={styles.attendanceText}>
              <h4 className={styles.attendanceStatus}>
                {!isClockedIn && t("attendance.status.pending", "حضور اليوم")}
                {isClockedIn && !isClockedOut && t("attendance.status.active", "أنت مسجل حضور")}
                {isClockedIn && isClockedOut && t("attendance.status.done", "اكتمل تسجيل اليوم")}
              </h4>

              <p className={styles.attendanceSub}>
                {!isClockedIn && t("attendance.sub.pending", "يرجى تسجيل حضورك عند الوصول")}
                {isClockedIn &&
                  !isClockedOut &&
                  t("attendance.sub.active", {
                    defaultValue: "منذ {{since}}",
                    since: attendance.check_in_at_since,
                  })}
                {isClockedIn &&
                  isClockedOut &&
                  t("attendance.sub.done", {
                    defaultValue: "إجمالي العمل: {{minutes}} دقيقة",
                    minutes: attendance.work_minutes,
                  })}
              </p>
            </div>
          </div>

          <div className={styles.attendanceActions}>
            {!isClockedIn && (
              <button
                className={`${styles.attendanceAction} ${styles.primary}`}
                onClick={handleAcceptClick}
                disabled={isProcessing}
              >
                {t("attendance.action.clockIn", "تسجيل الحضور")}
              </button>
            )}

            {isClockedIn && !isClockedOut && (
              <button
                className={`${styles.attendanceAction} ${styles.danger}`}
                onClick={handleRejectClick}
                disabled={isProcessing}
              >
                {t("attendance.action.clockOut", "تسجيل الانصراف")}
              </button>
            )}

            {isClockedIn && isClockedOut && (
              <button className={styles.attendanceAction} onClick={() => setShowDetailsPopup(true)}>
                {t("attendance.action.details", "التفاصيل")}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Confirmation Popup */}
      <StatusPopup
        isOpen={showConfirmPopup}
        status="confirm"
        title={
          attendanceType === "clockIn"
            ? t("attendance.popup.confirm.titleClockIn", "تسجيل الحضور")
            : t("attendance.popup.confirm.titleClockOut", "تسجيل الانصراف")
        }
        description={
          attendanceType === "clockIn"
            ? t("attendance.popup.confirm.descClockIn", "هل أنت متأكد أنك تريد تسجيل حضورك؟")
            : t("attendance.popup.confirm.descClockOut", "هل أنت متأكد أنك تريد تسجيل انصرافك؟")
        }
        primaryAction={{
          label: t("attendance.popup.confirm.yes", "نعم"),
          onClick: handleConfirmYes,
          disabled: isProcessing,
        }}
        secondaryAction={{
          label: t("attendance.popup.confirm.no", "لا"),
          onClick: handleConfirmNo,
          disabled: isProcessing,
        }}
        onClose={handleConfirmNo}
        disableClose={isProcessing}
      />

      {/* Success Popup for Clock Out */}
      <StatusPopup
        isOpen={showSuccessPopup && attendanceType === "clockOut"}
        status="success"
        title={t("attendance.popup.clockOut.title", "تم تسجيل الانصراف بنجاح")}
        bullets={
          attendanceData
            ? [
                t("attendance.popup.clockOut.bullets.workTime", {
                  defaultValue: "وقت العمل: {{minutes}} دقيقة",
                  minutes: Math.floor(attendanceData.work_minutes),
                }),
                t("attendance.popup.clockOut.bullets.method", {
                  defaultValue: "طريقة الانصراف: {{method}}",
                  method: attendanceData.check_out_method_label,
                }),
                t("attendance.popup.clockOut.bullets.time", {
                  defaultValue: "وقت الانصراف: {{time}}",
                  time: attendanceData.check_out_at,
                }),
                t("attendance.popup.clockOut.bullets.since", {
                  defaultValue: "منذ: {{since}}",
                  since: attendanceData.check_out_at_since,
                }),
              ]
            : []
        }
        primaryAction={{ label: t("attendance.popup.ok", "حسناً"), onClick: handleSuccessClose }}
        onClose={handleSuccessClose}
      />

      {/* Details Popup for Completed Attendance */}
      <StatusPopup
        isOpen={showDetailsPopup}
        status="success"
        title={t("attendance.popup.details.title", "تفاصيل الحضور")}
        bullets={
          attendance
            ? [
                t("attendance.popup.details.bullets.checkIn", {
                  defaultValue: "وقت الحضور: {{time}} ({{since}})",
                  time: attendance.check_in_at,
                  since: attendance.check_in_at_since,
                }),
                t("attendance.popup.details.bullets.checkOut", {
                  defaultValue: "وقت الانصراف: {{time}} ({{since}})",
                  time: attendance.check_out_at,
                  since: attendance.check_out_at_since,
                }),
                t("attendance.popup.details.bullets.total", {
                  defaultValue: "إجمالي العمل: {{minutes}} دقيقة",
                  minutes: attendance.work_minutes,
                }),
                t("attendance.popup.details.bullets.checkInMethod", {
                  defaultValue: "طريقة الحضور: {{method}}",
                  method: attendance.check_in_method_label || t("attendance.method.auto", "تلقائي"),
                }),
                t("attendance.popup.details.bullets.checkOutMethod", {
                  defaultValue: "طريقة الانصراف: {{method}}",
                  method: attendance.check_out_method_label || t("attendance.method.auto", "تلقائي"),
                }),
              ]
            : []
        }
        primaryAction={{ label: t("attendance.popup.close", "إغلاق"), onClick: closeDetails }}
        onClose={closeDetails}
      />

      {/* Success Popup for Clock In */}
      <StatusPopup
        isOpen={showSuccessPopup && attendanceType === "clockIn"}
        status="success"
        title={t("attendance.popup.clockIn.title", "تم تسجيل الحضور بنجاح")}
        description={attendanceData?.check_in_at || ""}
        primaryAction={{ label: t("attendance.popup.ok", "حسناً"), onClick: handleSuccessClose }}
        onClose={handleSuccessClose}
      />
    </>
  );
};

export default AttendanceBar;
