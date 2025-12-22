import React from "react";
import styles from "./mobile.module.scss"; 
import { IoIosArrowForward } from "react-icons/io";
import { RiChatNewLine } from "react-icons/ri";

export default function ChatHeader({
  title = "مساعدك الذكي",
  onLeftClick,
  onStartNewChat,
  showStartButton,
  leftIcon = <IoIosArrowForward size={24} />,
}) {
  return (
    <div className={styles.topbar}>
      <div className={styles.leftGroup}>
        <span onClick={onLeftClick} style={{ cursor: "pointer" }}>
          {leftIcon}
        </span>

        <div className={styles.icon}>
          <div className="border border-[#0074cc] bg-[#eef8ff] rounded-full p-1">
            <img
              src="/assets/icons/ai-2.svg"
              alt="bot"
              className={styles.botIcon}
            />
          </div>
        </div>

        <span>{title}</span>
      </div>

      {showStartButton && (
        <button onClick={onStartNewChat} className="text-primary text-sm underline mr-3">
          <RiChatNewLine size={26} />
        </button>
      )}
    </div>
  );
}
