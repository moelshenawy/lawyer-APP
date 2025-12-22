import React, { useMemo, useState, useEffect, useCallback, useContext } from "react";
import styles from "./index.module.scss";
import PageHeader from "@/components/common/PageHeader";
import {
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoChevronDownOutline,
  IoTimeOutline,
} from "react-icons/io5";
import CalendarIcon from "@/assets/icons/Calendar";
import Location from "@/assets/icons/Location";
import Comment from "@/assets/icons/Comment";
import Skeleton from "@/components/Skeleton";
import AppointmentsCard from "@/components/OrdersPage/OrderDetails/AppointmentsCard";
import HearingCard from "@/components/OrdersPage/OrderDetails/HearingCard";
import ConsultationsCard from "./ConsultationsCard";
import { AuthContext } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id/api"
).replace(/\/$/, "");

const CALENDAR_URL = `${API_BASE}/client/calendar`;

const getStoredUserToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("access_token");
};

const getEventDate = (item) => {
  if (item.starts_at_iso) {
    const d = new Date(item.starts_at_iso);
    if (Number.isFinite(d.getTime())) return d;
  }
  if (item.starts_at) {
    const d = new Date(item.starts_at);
    if (Number.isFinite(d.getTime())) return d;
  }
  return null;
};

const getEventDateKey = (item) => {
  if (item.starts_at_iso && item.starts_at_iso.length >= 10) {
    return item.starts_at_iso.slice(0, 10); // YYYY-MM-DD
  }
  const d = getEventDate(item);
  if (!d) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const Calendar = () => {
  const { t } = useTranslation("appointments");
  const { lng } = useParams();
  const { user } = useContext(AuthContext);
  const accountConfig = user?.config || null;
  const locale = lng || "ar";
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [activeTab, setActiveTab] = useState("calendar");
  const [today] = useState(() => new Date());

  const minSearchDate = useMemo(() => {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today]);

  const maxSearchDate = useMemo(() => {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() + 1);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [today]);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(null);

  const [openMonth, setOpenMonth] = useState(false);
  const [openYear, setOpenYear] = useState(false);

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState("");

  const monthsAr = t("months", { returnObjects: true });
  const weekdaysAr = t("weekdays", { returnObjects: true });

  const years = useMemo(() => {
    const base = today.getFullYear();
    const out = [];
    for (let y = base - 1; y <= base + 1; y++) out.push(y);
    return out;
  }, [today]);

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

  const prevMonth = () => {
    let m = viewMonth - 1;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y = viewYear - 1;
    }
    if (y < years[0]) return;
    setViewMonth(m);
    setViewYear(y);
  };

  const nextMonth = () => {
    let m = viewMonth + 1;
    let y = viewYear;
    if (m > 11) {
      m = 0;
      y = viewYear + 1;
    }
    if (y > years[years.length - 1]) return;
    setViewMonth(m);
    setViewYear(y);
  };

  const grid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const leading = (6 - firstDay + 7) % 7;
    const dim = daysInMonth(viewYear, viewMonth);
    const dimPrev = daysInMonth(viewYear, (viewMonth + 11) % 12);
    const cells = [];

    for (let i = leading - 1; i >= 0; i--) {
      cells.push({ day: dimPrev - i, offset: -1 });
    }
    for (let d = 1; d <= dim; d++) cells.push({ day: d, offset: 0 });
    const trailing = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= trailing; d++) cells.push({ day: d, offset: 1 });
    return cells;
  }, [viewYear, viewMonth]);

  const isSameDate = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const formatISO = (date, endOfDay = false) => {
    if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return "";
    const d = new Date(date);
    if (endOfDay) {
      d.setHours(23, 59, 59, 0);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
  };

  const clampRange = useCallback(
    (start, end) => {
      let s = new Date(start);
      let e = new Date(end);
      if (s < minSearchDate) s = new Date(minSearchDate);
      if (e > maxSearchDate) e = new Date(maxSearchDate);
      if (e < s) e = new Date(s);
      return { start: s, end: e };
    },
    [minSearchDate, maxSearchDate],
  );

  const fetchEvents = useCallback(
    async (fromDate, toDate) => {
      setLoadingEvents(true);
      setError("");

      const { start, end } = clampRange(fromDate, toDate);

      const params = new URLSearchParams({
        from: formatISO(start, false),
        to: formatISO(end, true),
      });

      const headers = {
        "Content-Type": "application/json",
      };
      const token = getStoredUserToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        headers.userToken = token;
        headers.UserToken = token;
      }

      try {
        const res = await fetch(`${CALENDAR_URL}?${params.toString()}`, {
          method: "GET",
          headers,
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json?.message || t("fetchCalendarFailed"));
        }

        setEvents(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        console.error("Calendar fetch error:", err);
        setEvents([]);
        setError(err?.message || t("fetchCalendarFailed"));
      } finally {
        setLoadingEvents(false);
      }
    },
    [clampRange],
  );

  useEffect(() => {
    fetchEvents(minSearchDate, maxSearchDate);
  }, [fetchEvents, minSearchDate, maxSearchDate]);

  const refreshDefaultRange = useCallback(() => {
    fetchEvents(minSearchDate, maxSearchDate);
  }, [fetchEvents, minSearchDate, maxSearchDate]);

  const daysWithEvents = useMemo(() => {
    const set = new Set();
    events.forEach((item) => {
      const key = getEventDateKey(item);
      if (!key) return;
      set.add(key);
    });
    return set;
  }, [events]);

  const selectedKey = useMemo(() => {
    if (!selected) return null;
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, "0");
    const dd = String(selected.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, [selected]);

  const onSelectCell = (cell) => {
    let y = viewYear;
    let m = viewMonth + cell.offset;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    if (y < years[0] || y > years[years.length - 1]) return;
    const picked = new Date(y, m, cell.day);
    setSelected(picked);
    setViewMonth(m);
    setViewYear(y);
  };

  const formatFullDate = (date) => {
    if (!date || !Number.isFinite(date.getTime?.() ?? NaN)) return "";
    try {
      return new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch {
      const d = date;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${dd}/${mm}/${yyyy}`;
    }
  };

  const splitDateTime = (item) => {
    // ✅ نعتمد على starts_at_iso أولاً
    const raw = item.starts_at_iso || item.starts_at;
    if (!raw) return { dateLabel: "—", timeLabel: "" };

    const d = new Date(raw);
    if (!Number.isFinite(d.getTime())) {
      return { dateLabel: item.starts_at || "—", timeLabel: "" };
    }

    let dateLabel;
    let timeLabel;
    try {
      dateLabel = new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(d);
      timeLabel = new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    } catch {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      dateLabel = `${dd}/${mm}/${yyyy}`;
      timeLabel = `${hh}:${mi}`;
    }

    return { dateLabel, timeLabel };
  };

  const typeLabel = (source) => {
    switch (source) {
      case "hearing":
        return t("eventTypeCourtSession");
      case "appointment":
        return t("eventTypeAppointment");
      case "consultation":
        return t("eventTypeConsultation");
      case "timeline":
        return t("eventTypeCaseUpdate");
      default:
        return t("eventTypeAppointment");
    }
  };

  const sortedAllEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const da = getEventDate(a);
      const db = getEventDate(b);
      if (!da || !db) return 0;
      return da - db;
    });
  }, [events]);

  const appointments = useMemo(
    () => sortedAllEvents.filter((e) => e.source === "appointment"),
    [sortedAllEvents],
  );

  const consultations = useMemo(
    () => sortedAllEvents.filter((e) => e.source === "consultation"),
    [sortedAllEvents],
  );

  const hearings = useMemo(
    () => sortedAllEvents.filter((e) => e.source === "hearing"),
    [sortedAllEvents],
  );
  const timeline = useMemo(
    () => sortedAllEvents.filter((e) => e.source === "timeline"),
    [sortedAllEvents],
  );
  const otherEvents = useMemo(
    () =>
      sortedAllEvents.filter(
        (e) => !["appointment", "consultation", "hearing", "timeline"].includes(e.source),
      ),
    [sortedAllEvents],
  );

  const selectedEvents = useMemo(() => {
    if (!selectedKey) return [];
    return sortedAllEvents.filter((item) => getEventDateKey(item) === selectedKey);
  }, [sortedAllEvents, selectedKey]);

  const selectedAppointments = useMemo(
    () => selectedEvents.filter((e) => e.source === "appointment"),
    [selectedEvents],
  );

  const selectedConsultations = useMemo(
    () => selectedEvents.filter((e) => e.source === "consultation"),
    [selectedEvents],
  );

  const selectedHearings = useMemo(
    () => selectedEvents.filter((e) => e.source === "hearing"),
    [selectedEvents],
  );
  const selectedTimeline = useMemo(
    () => selectedEvents.filter((e) => e.source === "timeline"),
    [selectedEvents],
  );
  const selectedOtherEvents = useMemo(
    () =>
      selectedEvents.filter(
        (e) => !["appointment", "consultation", "hearing", "timeline"].includes(e.source),
      ),
    [selectedEvents],
  );

  //  mapping → AppointmentsCard
  const mapCalendarAppointments = (items) =>
    items.map((item) => ({
      id: item.id,
      status: item.status,
      status_label: item.status_label,
      client_appointment_at: item.starts_at,
      message: item.description,
      location: item.location,
      source: item.source,
      actions: item.actions,
      due_at: item.due_at,
    }));

  //  mapping → HearingCard
  const mapCalendarHearings = (items) =>
    items.map((item) => {
      const d = getEventDate(item);
      let sessionDate = item.starts_at || "";
      let start_time = "";

      if (d && Number.isFinite(d.getTime())) {
        sessionDate = new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(d);

        start_time = new Intl.DateTimeFormat("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(d);
      }

      return {
        id: item.id,
        judge_name: item.title || t("judgeDefaultName"),
        session_date: sessionDate || item.starts_at || "",
        start_time,
        status_label: item.status_label,
        location: item.location,
        outcome: item.description,
      };
    });

  //  mapping → AppointmentsCard (timeline mode)
  const mapCalendarTimeline = (items) =>
    items.map((item) => {
      const d = getEventDate(item);
      let occurred_at = item.starts_at || "";
      if (d && Number.isFinite(d.getTime())) {
        occurred_at = new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(d);
      }
      return {
        id: item.id,
        title: item.title,
        occurred_at,
        details: item.description,
        location: item.location || "",
      };
    });

  const renderEventCard = (item, keyPrefix = "card") => {
    const { dateLabel, timeLabel } = splitDateTime(item);
    const statusLabel = item.status_label || "";
    const label = typeLabel(item.source);
    const location = item.location || null;
    const description = item.description || null;

    return (
      <div key={`${keyPrefix}-${item.source}-${item.id}`} className={styles.listCard}>
        <div className={styles.listCardTop}>
          <div className="flex flex-col gap-1">
            <div className="text-primary font-bold text-base">{item.title || label}</div>
            <div className="text-xs text-[#6B7280]">{label}</div>
          </div>

          <div className="flex flex-col items-end gap-1 text-primary text-sm font-medium">
            <span className="flex items-center gap-1 text-[#5F5F5F]">
              <CalendarIcon size={16} color={"#003f6f"} /> {dateLabel}
            </span>

            {timeLabel && (
              <span className="flex items-center gap-1 text-[#5F5F5F]">
                <IoTimeOutline size={16} /> {timeLabel}
              </span>
            )}
            {statusLabel && (
              <span className={`${styles.chip} ${styles[item.status] || ""}`}>{statusLabel}</span>
            )}
          </div>
        </div>

        <div className="px-4 py-3">
          {description && <p className="mb-2 font-medium text-sm text-primary">{description}</p>}

          {location && (
            <div className="flex items-center gap-1 text-primary text-sm mt-1">
              <Location size={16} />
              {location}
            </div>
          )}
        </div>

        {item.source === "hearing" && (
          <div className={styles.cardFooterBar}>
            <div className="flex items-center gap-3">
              <Comment size={20} />
            </div>
          </div>
        )}
      </div>
    );
  };

  const selectedHeaderLabel = selected ? formatFullDate(selected) : t("allAppointmentsInRange");

  return (
    <section id="appointments-calendar" dir={dir} className={`pb-24 ${styles.appointments}`}>
      <PageHeader title={t("pageTitle")} />

      {/* Tabs */}
      <div className="mt-1">
        <div className={`flex items-center gap-2 ${styles.tabs}`}>
          <button
            className={`${styles.tab} ${activeTab === "list" ? styles.active : styles.inactive}`}
            onClick={() => setActiveTab("list")}
          >
            {t("tabMyAppointments")}
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "calendar" ? styles.active : styles.inactive
            }`}
            onClick={() => setActiveTab("calendar")}
          >
            {t("tabCalendar")}
          </button>
        </div>
      </div>

      {activeTab === "calendar" && (
        <>
          <div className="mt-3">
            <div className={styles.calendarCard}>
              <div className={`${styles.calendarHeader} flex items-center justify-between mb-2`}>
                <div
                  className={`flex items-center gap-2 text-primary   ${dir === "ltr" && "flex-row-reverse"}`}
                >
                  <button aria-label="next month" className={styles.navBtn} onClick={nextMonth}>
                    <IoChevronForwardOutline size={18} />
                  </button>
                  <button aria-label="prev month" className={styles.navBtn} onClick={prevMonth}>
                    <IoChevronBackOutline size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-primary">
                  <div className="relative">
                    <button
                      className={styles.selectBtn}
                      onClick={() => {
                        setOpenYear(false);
                        setOpenMonth((v) => !v);
                      }}
                    >
                      {monthsAr[viewMonth]} <IoChevronDownOutline size={14} />
                    </button>
                    {openMonth && (
                      <div className={styles.dropdown}>
                        {monthsAr.map((mName, i) => (
                          <button
                            key={mName}
                            className={`${styles.dropdownItem} ${
                              i === viewMonth ? styles.current : ""
                            }`}
                            onClick={() => {
                              setViewMonth(i);
                              setOpenMonth(false);
                            }}
                          >
                            {mName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      className={styles.selectBtn}
                      onClick={() => {
                        setOpenMonth(false);
                        setOpenYear((v) => !v);
                      }}
                    >
                      {viewYear} <IoChevronDownOutline size={14} />
                    </button>
                    {openYear && (
                      <div className={styles.dropdown}>
                        {years.map((y) => (
                          <button
                            key={y}
                            className={`${styles.dropdownItem} ${
                              y === viewYear ? styles.current : ""
                            }`}
                            onClick={() => {
                              setViewYear(y);
                              setOpenYear(false);
                            }}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Weekdays */}
              <div className={styles.weekdays}>
                {weekdaysAr.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>

              {/* Dates grid */}
              <div className={styles.grid}>
                {grid.map((cell, idx) => {
                  const cellDate = new Date(
                    cell.offset === -1 && viewMonth === 0
                      ? viewYear - 1
                      : cell.offset === 1 && viewMonth === 11
                        ? viewYear + 1
                        : viewYear,
                    (viewMonth + cell.offset + 12) % 12,
                    cell.day,
                  );

                  const isToday = isSameDate(cellDate, today);

                  const yyyy = cellDate.getFullYear();
                  const mm = String(cellDate.getMonth() + 1).padStart(2, "0");
                  const dd = String(cellDate.getDate()).padStart(2, "0");
                  const cellKey = `${yyyy}-${mm}-${dd}`;

                  const hasEvent = daysWithEvents.has(cellKey);
                  const isSelectedCell = selectedKey && cellKey === selectedKey;

                  const cls = [
                    styles.cell,
                    cell.offset !== 0 ? styles.muted : "",
                    isToday && !isSelectedCell ? styles.today : "",
                    hasEvent ? styles.selected : "",
                    isSelectedCell ? styles.selected : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      type="button"
                      key={idx}
                      className={cls}
                      onClick={() => onSelectCell(cell)}
                    >
                      {loadingEvents ? <Skeleton type="circle" height={20} width={20} /> : cell.day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-[#000E1A] text-lg font-bold mb-2">{selectedHeaderLabel}</h3>

            {loadingEvents ? (
              <>
                <Skeleton variant="rect" height={120} radius={16} />
                <br />
                <Skeleton variant="rect" height={120} radius={16} />
                <br />
                <Skeleton variant="rect" height={120} radius={16} />
                <br />
                <Skeleton variant="rect" height={120} radius={16} />
              </>
            ) : error ? (
              <div className="text-sm text-red-500">{error}</div>
            ) : !selected ? (
              // ✅ ديفولت: عرض كل الكروت لسنة قبل وسنة بعد
              sortedAllEvents.length === 0 ? (
                <div className="text-sm text-[#6B7280]">{t("noEventsInRange")}</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {appointments.length > 0 && (
                    <AppointmentsCard
                      appointments={mapCalendarAppointments(appointments)}
                      orderId={null}
                      onConfirmSuccess={refreshDefaultRange}
                      timeline={false}
                      context="calendar"
                    />
                  )}

                  {consultations.length > 0 && (
                    <ConsultationsCard
                      config={accountConfig}
                      consultations={consultations}
                      onRescheduleSuccess={refreshDefaultRange}
                    />
                  )}

                  {hearings.length > 0 && <HearingCard hearings={mapCalendarHearings(hearings)} />}

                  {timeline.length > 0 && (
                    <AppointmentsCard
                      appointments={mapCalendarTimeline(timeline)}
                      orderId={null}
                      timeline={true}
                      context="calendar"
                    />
                  )}

                  {otherEvents.map((item) => renderEventCard(item, "default-other"))}
                </div>
              )
            ) : selectedEvents.length === 0 ? (
              <div className="text-sm text-[#6B7280]">{t("noAppointmentsThisDay")}</div>
            ) : (
              <div className="flex flex-col gap-4">
                {selectedAppointments.length > 0 && (
                  <AppointmentsCard
                    appointments={mapCalendarAppointments(selectedAppointments)}
                    orderId={null}
                    onConfirmSuccess={refreshDefaultRange}
                    timeline={false}
                    context="calendar"
                  />
                )}

                {selectedHearings.length > 0 && (
                  <HearingCard hearings={mapCalendarHearings(selectedHearings)} />
                )}
                {selectedConsultations.length > 0 && (
                  <ConsultationsCard
                    config={accountConfig}
                    consultations={selectedConsultations}
                    onRescheduleSuccess={refreshDefaultRange}
                  />
                )}

                {selectedTimeline.length > 0 && (
                  <AppointmentsCard
                    appointments={mapCalendarTimeline(selectedTimeline)}
                    orderId={null}
                    timeline={true}
                    context="calendar"
                  />
                )}

                {selectedOtherEvents.map((item) => renderEventCard(item, "day-other"))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "list" && (
        <div className="mt-3 flex flex-col gap-4">
          {loadingEvents ? (
            <>
              <Skeleton variant="rect" height={120} radius={16} />
              <Skeleton variant="rect" height={120} radius={16} />
            </>
          ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : sortedAllEvents.length === 0 ? (
            <div className="text-sm text-[#6B7280]">{t("noEventsInRange")}</div>
          ) : (
            <>
              {appointments.length > 0 && (
                <AppointmentsCard
                  appointments={mapCalendarAppointments(appointments)}
                  orderId={null}
                  onConfirmSuccess={refreshDefaultRange}
                  timeline={false}
                  context="calendar"
                />
              )}

              {consultations.length > 0 && (
                <ConsultationsCard
                  config={accountConfig}
                  consultations={consultations}
                  onRescheduleSuccess={refreshDefaultRange}
                />
              )}

              {hearings.length > 0 && <HearingCard hearings={mapCalendarHearings(hearings)} />}

              {timeline.length > 0 && (
                <AppointmentsCard
                  appointments={mapCalendarTimeline(timeline)}
                  orderId={null}
                  timeline={true}
                  context="calendar"
                />
              )}

              {otherEvents.map((item) => renderEventCard(item, "list-other"))}
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default Calendar;
