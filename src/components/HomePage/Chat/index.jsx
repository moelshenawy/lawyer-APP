import React, { useMemo } from "react";
import styles from "./index.module.scss";
import { IoClose } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import useChatStore from "@/store/useChatStore";

import AudioPlayer from "@/components/audio/AudioPlayer"; 

import VoiceRecorderBar from "./VoiceRecorderBar";
import useChatController from "@/hooks/useChatController";
import ChatWindow from "./ChatWindow";

const getLangFromPath = (pathname) => {
  const seg = (pathname || "").split("/").filter(Boolean)[0];
  return seg === "en" || seg === "ar" ? seg : "ar";
};

const ChatBot = () => {
  const { isOpen, toggleChat, closeChat } = useChatStore();
  const location = useLocation();
  const navigate = useNavigate();

  const lng = useMemo(() => getLangFromPath(location.pathname), [location.pathname]);
  const { t, i18n } = useTranslation("chatMobile");

  const quickReplies = useMemo(
    () => t("quickRepliesDesktop", { returnObjects: true }) || [],
    [t],
  );

  const chat = useChatController({
    language: lng,
    navigate,
    buildNavPath: (language, service) => `/${language}/${service}`,
    quickReplies,
    welcomeMessage: { sender: "bot", text: t("botIntro") },
    newChatMessage: { sender: "bot", text: t("newChatIntro") },
  });

  return (
    <div className={styles.chatbotContainer}>
      {/* Floating Button */}
      <button
        className={`${styles.chatbotToggle} ${isOpen ? styles.open : ""} bg-primary text-white flex items-center justify-center`}
        onClick={toggleChat}
      >
        {isOpen ? <IoClose size={26} /> : <img src="/assets/imgs/ai.png" alt="AI" width={50} height={50} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatBox}>
          <div className={styles.windowInner} dir={i18n.dir()}>
            <ChatWindow
              chat={chat}
              AudioPlayer={AudioPlayer}
              VoiceRecorderBar={VoiceRecorderBar}
              onLeftClick={closeChat}
              title={t("aiName")}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;