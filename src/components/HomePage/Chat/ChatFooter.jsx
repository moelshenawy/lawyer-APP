import React from "react";
import styles from "./mobile.module.scss";
import { useTranslation } from "react-i18next";

export default function ChatFooter({
  input,
  setInput,
  onSend,
  onMicClick,

  showRecorder,
  setShowRecorder,

  VoiceRecorderBar, // component
}) {
  const { t } = useTranslation("chatMobile");

  return (
    <div className={styles.footer}>
      {showRecorder ? (
        <VoiceRecorderBar
          onSend={(blob) => {
            onSend("", blob);
            setShowRecorder(false);
          }}
          onCancel={() => setShowRecorder(false)}
        />
      ) : (
        <>
          <button type="button" className={styles.circleBtn} onClick={onMicClick}>
            <img src="/assets/icons/mice.svg" width={36} height={36} alt="mice" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("inputPlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
          />

          <button className={styles.sendBtn} onClick={() => onSend()}>
            {t("sendButton")}
          </button>
        </>
      )}
    </div>
  );
}
