import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import styles from "./index.module.scss";
import Calendar from "@/assets/icons/Calendar";
import { IoChevronForwardOutline, IoTimeOutline } from "react-icons/io5";
import { toast } from "react-hot-toast";
import { AuthContext } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id";
const CONSULT_URL = `${API_BASE}/user/consultations`;
const MAX_FILE_SIZE_MB = 5;
const DAY_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const formatDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseTimeToSeconds = (timeStr) => {
  if (typeof timeStr !== "string") return null;
  const [hours, minutes] = timeStr.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 3600 + minutes * 60;
};

const secondsToTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "00:00";
  const clamped = Math.max(0, Math.min(seconds, 23 * 3600 + 59 * 60));
  const hours = String(Math.floor(clamped / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((clamped % 3600) / 60)).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const computeDurationSeconds = (duration, unit) => {
  const numericDuration = Number(duration);
  const normalizedUnit = typeof unit === "string" ? unit.toLowerCase() : "minutes";
  if (!Number.isFinite(numericDuration) || numericDuration <= 0) return 1800;
  if (normalizedUnit.startsWith("hour")) return Math.round(numericDuration * 3600);
  return Math.round(numericDuration * 60);
};

const normalizeTimeValue = (timeStr, fallback) => {
  const seconds = parseTimeToSeconds(timeStr);
  if (seconds === null) {
    const fallbackSeconds = parseTimeToSeconds(fallback);
    return fallbackSeconds === null ? "00:00" : secondsToTime(fallbackSeconds);
  }
  return secondsToTime(seconds);
};

const buildAllowedDays = (fromDay, toDay) => {
  const start = DAY_INDEX[fromDay];
  const end = DAY_INDEX[toDay];
  if (start === undefined || end === undefined) return [];
  const days = [];
  let current = start;
  for (let i = 0; i < 7; i += 1) {
    days.push(current);
    if (current === end) break;
    current = (current + 1) % 7;
  }
  return days;
};

const MainContent = () => {
  const { lng } = useParams();
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";
  const { user } = useContext(AuthContext);
  const { t } = useTranslation("consultationForm");
  const [hasCase, setHasCase] = useState(0); // 1 = yes, 0 = no
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    date: "",
    time: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const availability = useMemo(() => {
    const cfg = user?.config || {};
    const defaults = {
      fromDay: "sunday",
      toDay: "thursday",
      fromTime: "09:00",
      toTime: "18:00",
      duration: 30,
      durationUnit: "minutes",
    };
    return {
      fromDay: (cfg.consultation_availability_from_day || defaults.fromDay).toLowerCase(),
      toDay: (cfg.consultation_availability_to_day || defaults.toDay).toLowerCase(),
      fromTime: normalizeTimeValue(cfg.consultation_availability_from_time, defaults.fromTime),
      toTime: normalizeTimeValue(cfg.consultation_availability_to_time, defaults.toTime),
      duration: cfg.consultation_duration ?? defaults.duration,
      durationUnit: (cfg.consultation_duration_unit || defaults.durationUnit).toLowerCase(),
    };
  }, [user]);

  const allowedWeekdays = useMemo(
    () => buildAllowedDays(availability.fromDay, availability.toDay),
    [availability],
  );

  const durationSeconds = useMemo(
    () => computeDurationSeconds(availability.duration, availability.durationUnit),
    [availability],
  );

  const timeWindow = useMemo(() => {
    const startSeconds = parseTimeToSeconds(availability.fromTime);
    const endSeconds = parseTimeToSeconds(availability.toTime);
    if (startSeconds === null || endSeconds === null || startSeconds > endSeconds) {
      return {
        min: availability.fromTime,
        max: availability.toTime,
        startSeconds: null,
        endSeconds: null,
        durationSeconds,
      };
    }

    const maxStartSeconds = Math.max(startSeconds, endSeconds - durationSeconds);
    return {
      min: secondsToTime(startSeconds),
      max: secondsToTime(maxStartSeconds),
      startSeconds,
      endSeconds,
      durationSeconds,
    };
  }, [availability, durationSeconds]);

  const isDateAllowed = useCallback(
    (value) => {
      if (!value) return false;
      if (!allowedWeekdays.length) return true;
      const parsed = new Date(`${value}T00:00:00Z`);
      if (Number.isNaN(parsed.getTime())) return false;
      return allowedWeekdays.includes(parsed.getUTCDay());
    },
    [allowedWeekdays],
  );

  const availableDates = useMemo(() => {
    const dates = [];
    const maxDays = 60;
    const start = new Date();
    for (let i = 0; i < maxDays; i += 1) {
      const candidate = new Date();
      candidate.setDate(start.getDate() + i);
      const formatted = formatDateInputValue(candidate);
      if (isDateAllowed(formatted)) {
        const label = candidate.toLocaleDateString("ar", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        dates.push({ value: formatted, label });
      }
    }
    return dates;
  }, [isDateAllowed]);

  const availableTimes = useMemo(() => {
    const { startSeconds, endSeconds } = timeWindow;
    if (startSeconds === null || endSeconds === null) return [];
    const slots = [];
    const latestStart = Math.max(startSeconds, endSeconds - durationSeconds);
    for (let sec = startSeconds; sec <= latestStart; sec += durationSeconds) {
      slots.push(secondsToTime(sec));
    }
    return slots;
  }, [durationSeconds, timeWindow]);

  useEffect(() => {
    if (!form.date && availableDates.length) {
      setForm((prev) => ({ ...prev, date: availableDates[0].value }));
    }
  }, [availableDates, form.date]);

  useEffect(() => {
    if (!form.date) return;
    if (!availableTimes.length) {
      setForm((prev) => ({ ...prev, time: "" }));
      return;
    }
    if (!form.time || !availableTimes.includes(form.time)) {
      setForm((prev) => ({ ...prev, time: availableTimes[0] }));
    }
  }, [availableTimes, form.date, form.time]);

  const scheduledAt = useMemo(() => {
    if (!form.date || !form.time) return "";
    const timeWithSeconds = form.time.length === 5 ? `${form.time}:00` : form.time;
    return `${form.date}T${timeWithSeconds}`;
  }, [form.date, form.time]);

  const handleFiles = (fileList) => {
    const arr = Array.from(fileList || []);
    const tooBig = arr.find((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (tooBig) {
      toast.error(t("fileTooLarge", { max: MAX_FILE_SIZE_MB }));
      return;
    }
    setFiles(arr);
  };

  const handleDateChange = (value) => {
    setErrors((prev) => ({ ...prev, date: undefined }));
    setForm((prev) => ({ ...prev, date: value, time: "" }));
  };

  const handleTimeChange = (value) => {
    setErrors((prev) => ({ ...prev, time: undefined }));
    setForm((prev) => ({ ...prev, time: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = t("fieldTitleRequired");
    if (!form.subject.trim()) next.subject = t("fieldSubjectRequired");
    if (!form.date) next.date = t("fieldDateRequired");
    if (!form.time) next.time = t("fieldTimeRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error(t("loginFirst"));
      return;
    }

    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("subject", form.subject.trim());
    fd.append("scheduled_at", scheduledAt);
    fd.append("previous_scheduled_at", scheduledAt);
    fd.append("has_case", String(hasCase));
    if (files.length) {
      fd.append("file", files[0]);
    }

    setLoading(true);
    const toastId = toast.loading(t("sendingRequest"));
    try {
      const res = await fetch(CONSULT_URL, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
        },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          data?.message || (Array.isArray(data?.errors) ? data.errors.join("، ") : t("sendError"));
        throw new Error(message);
      }
      toast.success(data?.message || t("sendSuccess"), { id: toastId });
      setForm({ title: "", subject: "", date: "", time: "" });
      setFiles([]);
      setHasCase(0);
    } catch (err) {
      toast.error(err.message || t("unexpectedError"), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.main} dir={dir}>
      <PageHeader title={t("title")} />

      <form className={styles.formBox} onSubmit={handleSubmit}>
        {/* Title */}
        <label className={styles.labelRow}>
          <img src="/assets/icons/justice-scale.svg" alt="title-icon" width={16} height={16} />
          <span className="font-arabic">{t("consultationTitle")}</span>
        </label>
        <input
          type="text"
          placeholder={t("consultationTitlePlaceholder")}
          className={styles.input}
          name="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          disabled={loading}
        />
        {errors.title && <p className={styles.error}>{errors.title}</p>}

        {/* Subject */}
        <label className={styles.labelRow}>
          <img src="/assets/icons/justice-border.svg" alt="subject-icon" width={16} height={16} />
          <span className="font-arabic">{t("consultationDescription")}</span>
        </label>
        <textarea
          placeholder={t("consultationDescriptionPlaceholder")}
          rows={4}
          className={`${styles.input} ${styles.textarea}`}
          name="subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          disabled={loading}
        />
        {errors.subject && <p className={styles.error}>{errors.subject}</p>}

        {/* Documents (optional) */}
        <label className={styles.labelRow}>
          <img src="/assets/icons/justice-scale.svg" alt="title-icon" width={16} height={16} />
          <span className="font-arabic">{t("documentsOptional")}</span>
        </label>

        <button
          type="button"
          className={`${styles.uploadRow} ${dragOver ? styles.dragOver : ""}`}
          onClick={() => fileInputRef?.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            const fl = e.dataTransfer?.files;
            if (fl && fl.length) handleFiles(fl);
          }}
          disabled={loading}
        >
          <span className="font-arabic">{t("uploadHint")}</span>
          <img src="/assets/icons/upload-icon.svg" alt="upload" width={18} height={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => handleFiles(e.target?.files)}
          className={styles.visuallyHidden}
          tabIndex={-1}
          disabled={loading}
        />
        {files.length > 0 && (
          <ul className={styles.fileList}>
            {files.map((f) => (
              <li key={f.name}>
                {f.name} {(f.size / (1024 * 1024)).toFixed(1)}MB
              </li>
            ))}
          </ul>
        )}

        {/* Date & Time */}
        <div className={styles.inlineRow}>
          <div className={styles.inlineField}>
            <label className={styles.inlineLabel}>
              <Calendar size={16} />
              <span className="font-arabic">{t("date")}</span>
            </label>
            <select
              className={styles.input}
              value={form.date}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={loading || !availableDates.length}
            >
              <option value="">
                {availableDates.length ? t("selectAvailableDate") : t("noAvailableDates")}
              </option>
              {availableDates.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.date && <p className={styles.error}>{errors.date}</p>}
          </div>
          <div className={styles.inlineField}>
            <label className={styles.inlineLabel}>
              <IoTimeOutline size={16} />
              <span className="font-arabic">{t("time")}</span>
            </label>
            <select
              className={styles.input}
              value={form.time}
              onChange={(e) => handleTimeChange(e.target.value)}
              disabled={loading || !form.date || !availableTimes.length}
            >
              <option value="">
                {availableTimes.length ? t("selectAvailableTime") : t("noAvailableTimes")}
              </option>
              {availableTimes.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            {errors.time && <p className={styles.error}>{errors.time}</p>}
          </div>
        </div>

        {/* Has Case? */}
        <label className={styles.labelRow}>
          <img src="/assets/icons/justice-scale.svg" alt="subject-icon" width={16} height={16} />
          <span className="font-arabic">{t("hasCaseFile")}</span>
        </label>

        <div className={styles.choiceRow}>
          <button
            type="button"
            className={`${styles.choice} ${hasCase === 1 ? styles.activeChoice : ""}`}
            onClick={() => setHasCase(1)}
            disabled={loading}
          >
            <span className="font-arabic">{t("yes")}</span>
            <span className={styles.radio} aria-hidden />
          </button>
          <button
            type="button"
            className={`${styles.choice} ${hasCase === 0 ? styles.activeChoice : ""}`}
            onClick={() => setHasCase(0)}
            disabled={loading}
          >
            <span className="font-arabic">{t("no")}</span>
            <span className={styles.radio} aria-hidden />
          </button>
        </div>

        {/* Submit */}
        <button className={styles.submitBtn} type="submit" disabled={loading}>
          {loading ? t("submitLoading") : t("submit")}
        </button>
      </form>
    </section>
  );
};

export default MainContent;
