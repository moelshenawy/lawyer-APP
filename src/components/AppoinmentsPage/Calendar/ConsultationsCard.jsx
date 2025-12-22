import React, { useState } from "react";
// import styles from "../../OrdersPage/OrderDetails/index.module.scss";
import StatusPopup from "@/components/common/StatusPopup";
import { toast } from "react-hot-toast";
import AppoimentsStyles from "@/components/AppoinmentsPage/Calendar/index.module.scss";
import { IoTimeOutline } from "react-icons/io5";
import CalendarIcon from "@/assets/icons/Calendar";
import { useTranslation } from "react-i18next";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id/api"
).replace(/\/$/, "");

const getStoredUserToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("access_token");
};

// helper: mapping day name → JS getDay() index
const DAY_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const isDayInRange = (dayIdx, fromDay, toDay) => {
  if (
    typeof dayIdx !== "number" ||
    fromDay == null ||
    toDay == null ||
    !(fromDay in DAY_INDEX) ||
    !(toDay in DAY_INDEX)
  ) {
    return true; // لو config ناقص، نسيب الـ backend يتحقق
  }

  const fromIdx = DAY_INDEX[fromDay];
  const toIdx = DAY_INDEX[toDay];

  if (fromIdx <= toIdx) {
    // مثال: الأحد → الخميس
    return dayIdx >= fromIdx && dayIdx <= toIdx;
  }

  // رينج ملفوف (مثال: الخميس → الاثنين)
  return dayIdx >= fromIdx || dayIdx <= toIdx;
};

const ConsultationsCard = ({ consultations, onRescheduleSuccess, config }) => {
  const { t } = useTranslation("appointments");
  const [popupState, setPopupState] = useState(null); // "reschedule" | "success" | null
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClosePopup = () => {
    if (submitting) return;
    setPopupState(null);
    setSelectedConsultation(null);
    setSelectedDate("");
    setSelectedTime("");
  };

  const handleSubmit = async () => {
    if (!selectedConsultation) return;

    if (!selectedDate || !selectedTime) {
      toast.error(t("pickDateAndTime"));
      return;
    }

    const token = getStoredUserToken();
    if (!token) {
      toast.error(t("loginFirst"));
      return;
    }

    // ✅ Validation باستخدام config من /account
    if (config) {
      const fromDay = config.consultation_availability_from_day?.toLowerCase();
      const toDay = config.consultation_availability_to_day?.toLowerCase();
      const fromTime = config.consultation_availability_from_time;
      const toTime = config.consultation_availability_to_time;
      const duration = config.consultation_duration;
      const durationUnit = config.consultation_duration_unit;

      // validate day of week
      const d = new Date(selectedDate);
      if (!Number.isFinite(d.getTime())) {
        toast.error(t("invalidDate"));
        return;
      }
      const dayIdx = d.getDay();
      if (!isDayInRange(dayIdx, fromDay, toDay)) {
        toast.error(t("dayOutOfRange"));
        return;
      }

      // validate time window
      if (fromTime && selectedTime < fromTime) {
        toast.error(t("timeBeforeAvailable"));
        return;
      }
      if (toTime && selectedTime > toTime) {
        toast.error(t("timeAfterAvailable"));
        return;
      }

      // validate duration step (مثلاً كل 30 دقيقة)
      if (duration && durationUnit === "minutes") {
        const [hh, mm] = selectedTime.split(":").map((v) => parseInt(v || "0", 10));
        const totalMinutes = hh * 60 + mm;
        if (totalMinutes % duration !== 0) {
          toast.error(t("timeMustBeEveryMinutes", { duration }));
          return;
        }
      }
    }

    const appointmentId = selectedConsultation.id;
    const clientAppointmentAt = `${selectedDate}T${selectedTime}:00`;

    // لو الـ API رجع reschedule_url نستخدمه، وإلا نستخدم endpoint اللي حددته
    const confirmUrl =
      selectedConsultation.actions?.reschedule_url ||
      `${API_BASE}/client/calendar/appointments/${appointmentId}/confirm`;

    setSubmitting(true);

    try {
      await toast.promise(
        fetch(confirmUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            userToken: token,
            UserToken: token,
          },
          body: JSON.stringify({ client_appointment_at: clientAppointmentAt }),
        }).then(async (res) => {
          const json = await res.json().catch(() => ({}));

          if (!res.ok) {
            const fieldError =
              json?.errors?.client_appointment_at?.[0] || json?.message || t("rescheduleFailed");
            throw new Error(fieldError);
          }

          return json;
        }),
        {
          loading: t("rescheduleLoading"),
          success: t("rescheduleSuccess"),
          error: (err) => err.message || t("rescheduleFailed"),
        },
      );

      setPopupState("success");

      if (typeof onRescheduleSuccess === "function") {
        onRescheduleSuccess();
      }
    } catch (err) {
      console.error("Consultation reschedule error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const clampDateByDayRange = (value) => {
    if (!value || !config) return value;

    const fromDay = config.consultation_availability_from_day?.toLowerCase();
    const toDay = config.consultation_availability_to_day?.toLowerCase();

    if (!fromDay || !toDay) return value;

    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return value;

    const dayIdx = d.getDay();

    // لو اليوم مسموح → تمام
    if (isDayInRange(dayIdx, fromDay, toDay)) {
      return value;
    }

    // ❗ اليوم غير مسموح → نرجّعه لأقرب يوم مسموح
    let temp = new Date(d);
    for (let i = 0; i < 7; i++) {
      temp.setDate(temp.getDate() + 1);
      if (isDayInRange(temp.getDay(), fromDay, toDay)) {
        return temp.toISOString().slice(0, 10);
      }
    }

    return value;
  };

  const renderPopup = () => {
    if (!popupState || !selectedConsultation) return null;

    // UI مشابه تماماً لـ AppointmentsCard (date + time فقط)

    const minTime = config?.consultation_availability_from_time || "";
    const maxTime = config?.consultation_availability_to_time || "";

    const isTimeInRange = (value) => {
      if (!value) return false;
      if (!minTime && !maxTime) return true;

      if (minTime && maxTime && minTime <= maxTime) {
        return value >= minTime && value <= maxTime;
      }

      if (minTime && maxTime && minTime > maxTime) {
        return value >= minTime || value <= maxTime;
      }

      if (minTime && !maxTime) return value >= minTime;
      if (!minTime && maxTime) return value <= maxTime;

      return true;
    };

    const clampTime = (value) => {
      if (!value) return value;
      let v = value;

      if (!minTime && !maxTime) return v;
      if (isTimeInRange(v)) return v;

      if (minTime && maxTime && minTime <= maxTime) {
        if (v < minTime) v = minTime;
        if (v > maxTime) v = maxTime;
        return v;
      }

      if (minTime && maxTime && minTime > maxTime) {
        return minTime;
      }

      if (minTime && !maxTime && v < minTime) return minTime;
      if (!minTime && maxTime && v > maxTime) return maxTime;

      return v;
    };

    if (popupState === "reschedule") {
      return (
        <StatusPopup
          isOpen
          status="confirm"
          title={t("rescheduleTitle")}
          description={t("rescheduleDescription")}
          onClose={handleClosePopup}
          disableClose={submitting}
          secondaryAction={{
            label: t("cancel"),
            onClick: handleClosePopup,
            disabled: submitting,
          }}
          primaryAction={{
            label: submitting ? t("sending") : t("send"),
            onClick: handleSubmit,
            disabled: submitting || !selectedDate || !selectedTime,
          }}
        >
          <div className="flex flex-col gap-3 w-full">
            {/* تاريخ الاستشارة */}
            <div className="flex flex-col gap-1 text-start w-full">
              <label className="text-sm text-[#5F5F5F]">{t("consultationDate")}</label>
              <input
                type="date"
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm"
                value={selectedDate}
                onChange={(e) => {
                  const value = e.target.value;
                  const clamped = clampDateByDayRange(value);
                  setSelectedDate(clamped);
                }}
              />

              {config?.consultation_availability_from_day && (
                <p className="text-[11px] text-[#9CA3AF] mt-1">
                  {t("availableConsultationDays")} {config.consultation_availability_from_day}
                  {" - "}
                  {config.consultation_availability_to_day}
                </p>
              )}
            </div>

            {/* وقت الاستشارة */}
            <div className="flex flex-col gap-1 text-start w-full">
              <label className="text-sm text-[#5F5F5F]">{t("consultationTime")}</label>
              <input
                type="time"
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm"
                value={selectedTime}
                min={minTime || undefined}
                max={maxTime || undefined}
                onChange={(e) => {
                  const value = e.target.value;
                  const clamped = clampTime(value);
                  setSelectedTime(clamped);
                }}
              />
              {(minTime || maxTime) && (
                <p className="text-[11px] text-[#9CA3AF] mt-1">
                  {t("availableTime", { minTime })}
                  {minTime && maxTime ? " - " : ""}
                  {maxTime}
                </p>
              )}
            </div>
          </div>
        </StatusPopup>
      );
    }

    if (popupState === "success") {
      return (
        <StatusPopup
          isOpen
          status="success"
          title={t("consultationConfirmedTitle")}
          description={t("consultationConfirmedDescription")}
          onClose={handleClosePopup}
        />
      );
    }

    return null;
  };

  const handleOpenReschedulePopup = (appointment) => {
    if (!appointment || appointment.status !== "pending") return;

    setSelectedAppointment(appointment);

    const defaultDate = appointment.client_appointment_at
      ? appointment.client_appointment_at.slice(0, 10)
      : appointment.availability_start_date;

    let defaultTime = "";
    if (appointment.daily_time_start) {
      defaultTime = appointment.daily_time_start.slice(0, 5);
    } else if (
      appointment.client_appointment_at &&
      appointment.client_appointment_at.length >= 16
    ) {
      // من ISO مثل 2025-12-12T10:22:00
      defaultTime = appointment.client_appointment_at.slice(11, 16);
    }

    setSelectedDate(defaultDate || "");
    setSelectedTime(defaultTime || "");
    setPopupState("reschedule");
  };
  if (!consultations || consultations.length === 0) {
    return renderPopup();
  }

  return (
    <>
      {consultations.map((c) => {
        const canReschedule = c.actions?.can_reschedule;
        const dateLabel = c.starts_at || "—";
        // const endLabel = c.ends_at || "—";
        // const statusLabel = c.status_label || "—";

        return (
          <div key={c.id} className={AppoimentsStyles.listCard}>
            <div className={AppoimentsStyles.listCardTop}>
              <div
                className={`text-primary font-bold text-base ${
                  c.status === "canceled" && "text-red-500 font-bold"
                }`}
              >
                {}
                {t("consultation")}
              </div>

              <div className="flex items-center gap-4 text-primary text-sm font-medium">
                <span className="flex items-center gap-1 text-[#5F5F5F]">
                  <CalendarIcon size={16} color={"#003f6f"} />
                  {dateLabel}
                </span>
              </div>
            </div>

            <div className="px-4 py-3">
              <div className="mb-3 font-medium text-sm text-primary">
                {c.description}
                <br />
              </div>

              <div className="mt-3 flex items-center gap-3">
                {canReschedule && (
                  <button
                    className={`${AppoimentsStyles.btn} ${AppoimentsStyles.btnPrimary}`}
                    onClick={() => handleOpenReschedulePopup(app)}
                  >
                    {t("setAppointment")}
                  </button>
                )}

                {c.meet_link && (
                  <a
                    target="_blank"
                    href={c.meet_link}
                    className={`${AppoimentsStyles.btn} text-center underline cursor-pointer ${AppoimentsStyles.btnOutline}`}
                    // onClick={() => handleOpenCancelPopup(app)}
                  >
                    {t("meetingLink")}
                  </a>
                )}
              </div>
            </div>

            <div className={AppoimentsStyles.infoBar}>{c.status_label}</div>
          </div>
          //   <div key={c.id} className={styles.sessionCard} id={styles.const_cards}>
          //     {/* الهيدر بخلفية مختلفة (مثلاً أحمر فاتح) للاستشارة فقط */}
          //     <div
          //       className={styles.text_container}
          //       style={{ backgroundColor: "#FEE2E2" }} // 🔴 استشارة فقط
          //     >
          //       <div className="text-[#5F5F5F] font-bold">{c.title || "استشارة"}</div>

          //       <div className="mt-1 text-xs text-[#6B7280]">الحالة: {statusLabel}</div>

          //       {c.description && <div className="mt-2 text-sm text-[#5F5F5F]">{c.description}</div>}

          //       <div className="mt-3 grid gap-2 text-xs text-[#5F5F5F] sm:grid-cols-2">
          //         <div>
          //           <span className="font-semibold">تاريخ الاستشارة: </span>
          //           {dateLabel}
          //         </div>
          //         <div>
          //           <span className="font-semibold">آخر تحديث: </span>
          //           {endLabel}
          //         </div>
          //         {c.location && (
          //           <div>
          //             <span className="font-semibold">الموقع: </span>
          //             {c.location}
          //           </div>
          //         )}
          //       </div>

          //       <div className="mt-3 flex flex-wrap items-center gap-3">
          //         {canReschedule && (
          //           <button
          //             type="button"
          //             onClick={(e) => {
          //               e.stopPropagation();
          //               handleOpenPopup(c);
          //             }}
          //             className="bg-primary text-white rounded-xl px-4 py-2 text-sm hover:bg-[#123A64] transition-all cursor-pointer"
          //           >
          //             إعادة جدولة
          //           </button>
          //         )}
          //       </div>
          //     </div>
          //   </div>
        );
      })}

      {renderPopup()}
    </>
  );
};

export default ConsultationsCard;
