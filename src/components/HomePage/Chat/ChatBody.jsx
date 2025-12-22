import React from "react";
import styles from "./mobile.module.scss"; 
import { GrUploadOption } from "react-icons/gr";
import { useTranslation } from "react-i18next";

const Spinner = () => (
  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
);

export default function ChatBody({
  bodyRef,
  messages,

  showHistoryButton,
  hasLoadedMore,
  loadingHistory,
  onLoadHistory,

  AudioPlayer, // component
}) {
  const { t } = useTranslation("chatMobile");

  return (
    <div ref={bodyRef} className={`${styles.body} flex flex-col gap-3`}>
      {showHistoryButton && !hasLoadedMore && (
        <button
          disabled={loadingHistory}
          onClick={onLoadHistory}
          className="flex flex-col items-center justify-center gap-1 text-center w-full my-3"
        >
          {!loadingHistory ? (
            <>
              <GrUploadOption size={22} className="text-gray-600" />
              <span className="text-gray-600 text-sm">{t("historyButton")}</span>
            </>
          ) : (
            <>
              <Spinner />
              <span className="text-gray-500 text-sm">{t("historyLoading")}</span>
            </>
          )}
        </button>
      )}

      {messages.map((msg, i) => (
        <div
          key={msg.id || i}
          className={`flex ${
            msg.sender === "user"
              ? "justify-end"
              : "justify-start items-center gap-2"
          }`}
        >
          {msg.sender === "bot" && msg.text !== "..." && (
            <div className="border border-[#0074cc] bg-[#eef8ff] rounded-full p-1">
              <img
                src="/assets/icons/ai-2.svg"
                alt="bot"
                className={styles.botIcon}
              />
            </div>
          )}

          {msg.text !== "..." && (
            <div
              className={`px-4 py-2 rounded-3xl max-w-[80%] text-sm ${
                msg.sender === "user" ? styles.userBubble : styles.botBubble
              }`}
            >
              <span dangerouslySetInnerHTML={{ __html: msg.text || "" }} />

              {msg.voice_url && AudioPlayer && (
                <div className="mt-2">
                  <AudioPlayer src={msg.voice_url} />
                </div>
              )}
            </div>
          )}

          {msg.sender === "bot" && msg.text === "..." && (
            <div className="flex items-center gap-1">
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
