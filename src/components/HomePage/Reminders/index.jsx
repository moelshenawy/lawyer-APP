import React from "react";
import styles from "./index.module.scss";
import Calendar from "@/assets/icons/Calendar";
import Skeleton from "@/components/Skeleton";

const Reminders = ({ orderData, loading }) => {
  if (!loading && !orderData) return null;

  return (
    <section
      id="reminder"
      className={`${styles.reminder_card}   rounded-lg  mt-4 flex flex-col gap-3`}
    >
      {loading ? (
        <>
          <Skeleton variant="rect" height={140} radius={16} />
          <Skeleton variant="rect" height={140} radius={16} />
        </>
      ) : (
        <>
          {/* Header */}
          {/* <div className="flex justify-between items-center">
        <h2 className="font-bold text-[#0D2B49] text-sm sm:text-base">تذكيرات</h2>
      </div> */}

          <div className={` ${styles.sec_container}`}>
            {/* Footer */}
            <div className={`${styles.footer} flex justify-between items-center  `}>
              {orderData?.assigned_user !== null && (
                <div className="flex items-center gap-2">
                  <img
                    src={orderData?.assigned_user?.avatar}
                    alt="lawyer"
                    className="w-10 h-10 rounded-full object-contain border border-[#CCCCCC]"
                  />
                  <p className="text-primary text-[16]"> {orderData?.assigned_user?.name}</p>
                </div>
              )}

              {/* <div className="flex items-center gap-3">
                <Comment size={21} />
                <Phone size={21} />
              </div> */}
            </div>
            {/* Details */}
            <div className={`${styles.details} grid grid-cols-2 gap-2  text-xs sm:text-sm`}>
              {/* Date */}
              <div className="flex items-center gap-1">
                {/* <Calendar size={13} /> */}
                <img width={13} src="/assets/icons/justice-bold.svg" alt="Justice icon" />
                <span>{orderData?.number}</span>
              </div>

              {/* Time */}

              {
                // orderData.stauts
                <div className="flex items-center gap-1">
                  <img width={13} src="/assets/icons/case.svg" alt="Justice icon" />
                  <span>{orderData?.case_type_name}</span>
                </div>
              }

              <div className="flex items-center gap-1">
                {/* <img src="/assets/icons/location.svg" alt="svg icon" /> */}
                <Calendar size={14} active={true} />

                <span>{orderData?.created_at}</span>
              </div>

              {/* {orderData} */}
              {orderData?.type === "case" && (
                <div className="flex items-center gap-1">
                  <img src="/assets/icons/location.svg" alt="svg icon" />
                  <span>{orderData?.court_name}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default Reminders;
