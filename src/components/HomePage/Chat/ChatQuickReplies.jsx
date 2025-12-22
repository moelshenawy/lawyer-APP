import React from "react";
import styles from "./mobile.module.scss"; // لو المسار مختلف بدّله
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function ChatQuickReplies({ quickReplies = [], onSend }) {
  return (
    <div className={styles.quick}>
      <Swiper spaceBetween={10} slidesPerView="auto">
        {quickReplies.map((q, i) => (
          <SwiperSlide key={i} className="!w-auto">
            <button className={styles.quickBtn} onClick={() => onSend(q)}>
              {q}
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
