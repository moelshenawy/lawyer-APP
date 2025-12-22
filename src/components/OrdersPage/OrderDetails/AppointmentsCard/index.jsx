import React, { useContext, useEffect, useRef, useState } from "react";
import AppoimentsStyles from "@/components/AppoinmentsPage/Calendar/index.module.scss";
import CalendarIcon from "@/assets/icons/Calendar";
import { IoTimeOutline } from "react-icons/io5";
import StatusPopup from "@/components/common/StatusPopup";
import { toast } from "react-hot-toast";
import { AuthContext } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id/api"
).replace(/\/$/, "");

const getStoredUserToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("access_token");
};

const toDateInputValue = (v) => {
  if (!v) return "";
  const s = String(v).trim();

  const datePart = s.includes("T") ? s.split("T")[0] : s.includes(" ") ? s.split(" ")[0] : s;

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(datePart)) {
    const [dd, mm, yyyy] = datePart.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }

  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toTimeInputValue = (v) => {
  if (!v) return "";
  const s = String(v).trim();

  if (/^\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s.slice(0, 5);
  if (s.includes("T") && s.length >= 16) return s.slice(11, 16);

  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mi}`;
};

const safeParseYMD = (ymd) => {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return Number.isFinite(dt.getTime()) ? dt : null;
};

const addYearsRange = () => {
  const now = new Date();
  const min = new Date(now);
  min.setFullYear(min.getFullYear() - 1);
  min.setHours(0, 0, 0, 0);

  const max = new Date(now);
  max.setFullYear(max.getFullYear() + 1);
  max.setHours(23, 59, 59, 999);

  const minYMD = toDateInputValue(min.toISOString());
  const maxYMD = toDateInputValue(max.toISOString());
  return { minYMD, maxYMD };
};

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
    !fromDay ||
    !toDay ||
    !(fromDay in DAY_INDEX) ||
    !(toDay in DAY_INDEX)
  ) {
    return true;
  }

  const fromIdx = DAY_INDEX[fromDay];
  const toIdx = DAY_INDEX[toDay];

  if (fromIdx <= toIdx) return dayIdx >= fromIdx && dayIdx <= toIdx;
  return dayIdx >= fromIdx || dayIdx <= toIdx;
};

const clampToRange = (val, min, max) => {
  let v = val;
  if (min && v && v < min) v = min;
  if (max && v && v > max) v = max;
  return v;
};

const timeToMinutes = (hhmm) => {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [hh, mm] = hhmm.split(":").map((x) => parseInt(x, 10));
  return hh * 60 + mm;
};

const minutesToTime = (mins) => {
  if (!Number.isFinite(mins)) return "";
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
};

const AppointmentsCard = ({
  appointments,
  orderId,
  onConfirmSuccess,
  timeline,
  context = "order",
}) => {
  const { t } = useTranslation("appointmentsCard");
  const [popupState, setPopupState] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const autoCloseTimerRef = useRef(null);

  const { user } = useContext(AuthContext);
  const accountConfig = user?.config || null;

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
    };
  }, []);

  const formatDate = (value) => {
    if (!value) return "";
    const ymd = toDateInputValue(value);
    const dt = safeParseYMD(ymd);
    if (!dt) return value;
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(dt);
  };

  const getAvailability = (appointment) => {
    const { minYMD, maxYMD } = addYearsRange();

    const minDate =
      toDateInputValue(appointment?.availability_start_date || appointment?.availability_start) ||
      minYMD;
    const maxDate =
      toDateInputValue(appointment?.availability_end_date || appointment?.availability_end) ||
      maxYMD;

    const fromDay = accountConfig?.consultation_availability_from_day?.toLowerCase?.();
    const toDay = accountConfig?.consultation_availability_to_day?.toLowerCase?.();
    const fromTime = accountConfig?.consultation_availability_from_time || "";
    const toTime = accountConfig?.consultation_availability_to_time || "";
    const duration = Number(accountConfig?.consultation_duration || 0);
    const durationUnit = accountConfig?.consultation_duration_unit || "";

    return { minDate, maxDate, fromDay, toDay, fromTime, toTime, duration, durationUnit };
  };

  const computeAllowedDaysText = (fromDay, toDay) => {
    if (!fromDay || !toDay || !(fromDay in DAY_INDEX) || !(toDay in DAY_INDEX)) return "";
    if (fromDay === toDay) return t(`days.${fromDay}`);

    const fromIdx = DAY_INDEX[fromDay];
    const toIdx = DAY_INDEX[toDay];
    const days = [];
    for (let i = 0; i < 7; i++) {
      const idx = (fromIdx + i) % 7;
      const key = Object.keys(DAY_INDEX).find((k) => DAY_INDEX[k] === idx);
      if (key) days.push(t(`days.${key}`));
      if (idx === toIdx) break;
    }
    return days.join(" - ");
  };

  const handleOpenReschedulePopup = (app, e) => {
    e?.stopPropagation?.();
    setSelectedAppointment(app);

    const dateValue = app.client_appointment_at || app.starts_at || "";
    const defaultDate = toDateInputValue(dateValue) || "";
    const defaultTime = toTimeInputValue(dateValue) || "";

    const availability = getAvailability(app);
    const clampedDate = clampToRange(defaultDate, availability.minDate, availability.maxDate);
    setSelectedDate(clampedDate || availability.minDate);
    setSelectedTime(defaultTime || availability.fromTime || "");
    setPopupState("confirm");
  };

  const handleOpenCancelPopup = (app, e) => {
    e?.stopPropagation?.();
    setSelectedAppointment(app);
    setPopupState("cancelConfirm");
  };

  const handleClosePopup = () => {
    if (submitting) return;
    setPopupState(null);
    setSelectedAppointment(null);
    setSelectedDate("");
    setSelectedTime("");
  };

  const handleConfirm = async () => {
    if (!selectedAppointment) return;

    if (!orderId) {
      toast.error(t("orderIdMissing"));
      return;
    }

    const token = getStoredUserToken();
    if (!token) {
      toast.error(t("loginFirst"));
      return;
    }

    const availability = getAvailability(selectedAppointment);
    let nextDate = clampToRange(selectedDate, availability.minDate, availability.maxDate);

    const parsed = safeParseYMD(nextDate);
    if (parsed && availability.fromDay && availability.toDay) {
      const maxScan = 370;
      let scan = 0;
      while (scan < maxScan) {
        if (isDayInRange(parsed.getDay(), availability.fromDay, availability.toDay)) break;
        parsed.setDate(parsed.getDate() + 1);
        scan += 1;
      }
      const adjusted = toDateInputValue(parsed.toISOString());
      if (adjusted !== nextDate) {
        nextDate = adjusted;
        toast.error(t("selectedDateAdjusted"));
      }
    }

    let nextTime = selectedTime;
    const fromMinutes = timeToMinutes(availability.fromTime);
    const toMinutes = timeToMinutes(availability.toTime);
    const chosenMinutes = timeToMinutes(nextTime);
    if (chosenMinutes != null) {
      if (fromMinutes != null && chosenMinutes < fromMinutes) {
        nextTime = availability.fromTime;
        toast.error(t("selectedTimeAdjusted"));
      }
      if (toMinutes != null && chosenMinutes > toMinutes) {
        nextTime = availability.toTime;
        toast.error(t("selectedTimeAdjusted"));
      }
      if (availability.duration && availability.durationUnit === "minutes") {
        const step = availability.duration;
        const snapped = Math.round((timeToMinutes(nextTime) || 0) / step) * step;
        nextTime = minutesToTime(snapped);
      }
    }

    const confirmUrl = `${API_BASE}/client/orders/${orderId}/appointments/${selectedAppointment.id}/confirm`;
    const clientAppointmentAt = `${nextDate}T${nextTime}:00`;

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
          body: JSON.stringify({ client_appointment_at: clientAppointmentAt, context }),
        }).then(async (res) => {
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json?.message || t("confirmFailed"));
          return json;
        }),
        {
          loading: t("confirmLoading"),
          success: t("confirmSuccess"),
          error: (err) => err.message || t("confirmFailed"),
        },
      );

      setPopupState("success");
      if (typeof onConfirmSuccess === "function") onConfirmSuccess();
      autoCloseTimerRef.current = setTimeout(() => handleClosePopup(), 1500);
    } catch (err) {
      console.error("Appointment confirm error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointment) return;

    if (!orderId) {
      toast.error(t("orderIdMissing"));
      return;
    }

    const token = getStoredUserToken();
    if (!token) {
      toast.error(t("loginFirst"));
      return;
    }

    const cancelUrl = `${API_BASE}/client/orders/${orderId}/appointments/${selectedAppointment.id}/cancel`;

    setSubmitting(true);
    try {
      await toast.promise(
        fetch(cancelUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            userToken: token,
            UserToken: token,
          },
        }).then(async (res) => {
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json?.message || t("confirmFailed"));
          return json;
        }),
        {
          loading: t("confirmLoading"),
          success: t("confirmSuccess"),
          error: (err) => err.message || t("confirmFailed"),
        },
      );

      setPopupState("cancelSuccess");
      if (typeof onConfirmSuccess === "function") onConfirmSuccess();
      autoCloseTimerRef.current = setTimeout(() => handleClosePopup(), 1500);
    } catch (err) {
      console.error("Appointment cancel error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderPopup = () => {
    if (!popupState) return null;

    if (popupState === "confirm" && selectedAppointment) {
      const availability = getAvailability(selectedAppointment);
      const daysText = computeAllowedDaysText(availability.fromDay, availability.toDay);
      const minDate = availability.minDate || "";
      const maxDate = availability.maxDate || "";
      const minTime = availability.fromTime || "";
      const duration = availability.duration || 0;

      return (
        <StatusPopup
          isOpen
          status="confirm"
          title={t("confirmTitle")}
          description={t("confirmDescription")}
          onClose={handleClosePopup}
          disableClose={submitting}
          secondaryAction={{ label: t("cancel"), onClick: handleClosePopup, disabled: submitting }}
          primaryAction={{
            label: submitting ? t("sending") : t("send"),
            onClick: handleConfirm,
            disabled: submitting || !selectedDate || !selectedTime,
          }}
        >
          <div className="flex flex-col gap-4 w-full text-start">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-[#5F5F5F]">{t("appointmentDate")}</label>
              <input
                type="date"
                className={AppoimentsStyles.input}
                value={selectedDate}
                min={minDate}
                max={maxDate}
                onChange={(e) =>
                  setSelectedDate(clampToRange(e.target.value, minDate, maxDate) || minDate)
                }
              />
              {minDate && (
                <div className="text-[11px] text-[#9CA3AF] mt-1">
                  {t("availablePeriod", { value: formatDate(minDate) })}
                  {maxDate ? ` - ${formatDate(maxDate)}` : null}
                </div>
              )}
              {daysText && (
                <p className="text-[11px] text-[#9CA3AF] mt-1">
                  {t("availableDays", { value: daysText })}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-[#5F5F5F]">{t("appointmentTime")}</label>
              <input
                type="time"
                className={AppoimentsStyles.input}
                value={selectedTime}
                min={minTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
              {minTime && (
                <div className="text-[11px] text-[#9CA3AF] mt-1">
                  {t("availableTime", { value: minTime })}
                </div>
              )}
              {duration ? (
                <p className="text-[11px] text-[#9CA3AF] mt-1">{t("everyMinutes", { duration })}</p>
              ) : null}
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
          title={t("confirmedTitle")}
          description={t("confirmedDescription", {
            date: formatDate(selectedDate),
            time: selectedTime,
          })}
          onClose={handleClosePopup}
        />
      );
    }

    if (popupState === "cancelConfirm" && selectedAppointment) {
      const dateValue =
        selectedAppointment.client_appointment_at || selectedAppointment.starts_at || "";
      const datePart = formatDate(toDateInputValue(dateValue) || "");
      const timeValue = toTimeInputValue(dateValue) || "";
      const timePart = timeValue ? ` ${timeValue}` : "";
      return (
        <StatusPopup
          isOpen
          status="confirm"
          title={t("cancelConfirmTitle")}
          description={t("cancelConfirmDescription", { date: datePart, timePart })}
          onClose={handleClosePopup}
          secondaryAction={{ label: t("no"), onClick: handleClosePopup }}
          primaryAction={{ label: t("yesCancel"), onClick: handleConfirmCancel }}
        />
      );
    }

    if (popupState === "cancelSuccess") {
      return (
        <StatusPopup
          isOpen
          status="success"
          title={t("canceledTitle")}
          description={t("canceledDescription")}
          onClose={handleClosePopup}
        />
      );
    }

    return null;
  };

  if (timeline) {
    return (
      <>
        {appointments?.map((item) => (
          <div key={item.id} className={AppoimentsStyles.listCard}>
            <div className={AppoimentsStyles.listCardTop}>
              <div className="text-primary font-bold text-base">{item.title}</div>
              <div className="flex items-center gap-4 text-primary text-sm font-medium">
                <span className="flex items-center gap-1 text-[#5F5F5F]">
                  <CalendarIcon size={16} color={"#003f6f"} />
                  {item.occurred_at}
                </span>
              </div>
            </div>

            <div className="px-4 py-3">
              <div className="mb-3 font-medium text-sm text-primary">{item.details}</div>
              {item.location && (
                <span className="flex items-center gap-1 text-primary mt-3">
                  <img width={16} src="/assets/icons/location.svg" alt="location" />
                  {item.location}
                </span>
              )}
            </div>
          </div>
        ))}

        {renderPopup()}
      </>
    );
  }

  return (
    <>
      {appointments?.map((app) => {
        const date = app.client_appointment_at || app.starts_at;

        const statusLabel =
          {
            pending: t("status.pending"),
            confirmed: t("status.confirmed"),
            canceled: t("status.canceled"),
          }[app.status] || app.status_label;

        return (
          <div key={app.id} className={AppoimentsStyles.listCard}>
            <div className={AppoimentsStyles.listCardTop}>
              <div
                className={`text-primary font-bold text-base ${
                  app.status === "canceled" ? "text-red-500 font-bold" : ""
                }`}
              >
                {statusLabel}
              </div>

              {app.status !== "pending" ? (
                <div className="flex items-center gap-4 text-primary text-sm font-medium">
                  <span className="flex items-center gap-1 text-[#5F5F5F]">
                    <CalendarIcon size={16} color={"#003f6f"} />
                    {date}
                  </span>
                </div>
              ) : (
                <span className="flex items-center gap-1 text-[#5F5F5F]">
                  <IoTimeOutline size={16} />
                  {t("pendingDuePrefix")} {app.due_at || t("unknown")}
                </span>
              )}
            </div>

            <div className="px-4 py-3">
              <div className="mb-3 font-medium text-sm text-primary">
                {app.message}
                <br />
                <span className="flex items-center gap-1 text-primary mt-3">
                  <img width={16} src="/assets/icons/location.svg" alt="location" />
                  {app.location || t("unknown")}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                {String(app.status).toLowerCase() === "pending" && (
                  <button
                    type="button"
                    className={`${AppoimentsStyles.btn} ${AppoimentsStyles.btnPrimary}`}
                    onClick={(e) => handleOpenReschedulePopup(app, e)}
                  >
                    {t("reschedule")}
                  </button>
                )}

                {app.status !== "confirmed" && (
                  <button
                    type="button"
                    className={`${AppoimentsStyles.btn} ${AppoimentsStyles.btnOutline}`}
                    onClick={(e) => handleOpenCancelPopup(app, e)}
                  >
                    {t("cancelAppointment")}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {renderPopup()}
    </>
  );
};

export default AppointmentsCard;
