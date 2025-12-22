import React from "react";
import styles from "../index.module.scss";
import Calendar from "@/assets/icons/Calendar";
import Location from "@/assets/icons/Location";

const HearingCard = ({ hearings }) => {
  return (
    <>
      {hearings.map((hear) => (
        <div key={hear.id} className={styles.sessionCard}>
          <div className={`${styles.text_container}`}>
            <div className="text-[#5F5F5F] font-bold">{hear?.judge_name || "-"}</div>
            <div className={styles.rowGrid}>
              <div className="text-[#5F5F5F] flex items-center gap-2 justify-content-center">
                <Calendar size={14} />
                {hear?.session_date || "—"}
              </div>
              <div className="text-[#5F5F5F] flex align-items-center gap-2">
                <img alt="timer" src="/assets/icons/timer.svg" width={14} />
                {` `}
                {hear.start_time}
              </div>
              <div className="text-[#5F5F5F]">الحالة: {hear?.status_label || "—"}</div>
              <div className="text-[#5F5F5F] flex items-center gap-2 justify-content-center">
                <Location size={14} />
                {hear.location}
              </div>
            </div>
          </div>

          {hear?.outcome && <div className={styles.infoBar}>{hear?.outcome}</div>}
        </div>
      ))}
    </>
  );
};

export default HearingCard;
