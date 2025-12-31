import React, { useMemo, useState, useEffect, useCallback, useContext } from "react";
import styles from "./index.module.scss";
import PageHeader from "@/components/common/PageHeader";
import {
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoChevronDownOutline,
} from "react-icons/io5";
import Skeleton from "@/components/Skeleton";
import { AuthContext } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import CalendarCard from "./CalendarCard";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id/api"
).replace(/\/$/, "");

const CALENDAR_URL = `${API_BASE}/user/calendar`;

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


  const sortedAllEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const da = getEventDate(a);
      const db = getEventDate(b);
      if (!da || !db) return 0;
      return da - db;
    });
  }, [events]);

  const selectedEvents = useMemo(() => {
    if (!selectedKey) return [];
    return sortedAllEvents.filter((item) => getEventDateKey(item) === selectedKey);
  }, [sortedAllEvents, selectedKey]);

  const cardsToShow = useMemo(() => {
  return selected ? selectedEvents : sortedAllEvents;
}, [selected, selectedEvents, sortedAllEvents]);

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
) : selected && cardsToShow.length === 0 ? (
  <div className="text-sm text-[#6B7280]">{t("noAppointmentsThisDay")}</div>
) : !selected && cardsToShow.length === 0 ? (
  <div className="text-sm text-[#6B7280]">{t("noEventsInRange")}</div>
) : (
  <div className="flex flex-col gap-4">
    <CalendarCard
      config={accountConfig}
      Cards={cardsToShow}
      onRescheduleSuccess={refreshDefaultRange}
    />
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
      <CalendarCard
        config={accountConfig}
        Cards={sortedAllEvents}
        onRescheduleSuccess={refreshDefaultRange}
      />
    )}
  </div>
)}

    </section>
  );
};

export default Calendar;
