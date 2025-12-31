import React, { useEffect, useRef, useState } from "react";
import styles from "./mobile.module.scss";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { IoIosArrowForward } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";
import { RiChatNewLine } from "react-icons/ri";
import { GrUploadOption } from "react-icons/gr";
import AudioPlayer from "../../audio/AudioPlayer";
import VoiceRecorderBar from "./VoiceRecorderBar";
import { useTranslation } from "react-i18next";


const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id/api"
).replace(/\/$/, "");

  const BASE = `${API_BASE}/user/ai`;

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const [, encoded] = reader.result.split(",");
        resolve(encoded || null);
      } else {
        resolve(null);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const MobileChatPage = () => {
  const navigate = useNavigate();
  const { lng } = useParams();
  const { t, i18n } = useTranslation("chatMobile");

  const token = localStorage.getItem("access_token");

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([{ sender: "bot", text: t("botIntro") }]);
  const [input, setInput] = useState("");
  const [loadingReply, setLoadingReply] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryButton, setShowHistoryButton] = useState(false);
  const [hasLoadedMore, setHasLoadedMore] = useState(false);
  const [showStartButton, setShowStartButton] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);

  const bodyRef = useRef(null);

  const quickReplies = t("quickReplies", { returnObjects: true }) || [];

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    checkCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkCurrent = async () => {
    try {
      const res = await fetch(`${BASE}/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data.success) return;

      const msgs = data.data?.messages || [];

      setConversationId(data.data.conversation_id);
      setMessages(
        msgs.length
          ? msgs.map((m) => ({
              id: m.id,
              sender: m.role === "assistant" ? "bot" : "user",
              text: m.content_html || m.content,
              voice_url: m.voice_url || null,
            }))
          : [
              {
                id: Date.now(),
                sender: "bot",
                text: t("botIntro"),
                voice_url: null,
              },
            ],
      );

      const assistantCount = msgs.filter((m) => m.role === "assistant").length;
      setShowHistoryButton(assistantCount >= 2);

      setShowStartButton(true);
    } catch (err) {
      console.log("Current error:", err);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);

      const res = await fetch(`${BASE}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data.success) return;

      const historyMsgs = data.data?.messages || [];

      const currentIds = new Set(messages.map((m) => m.id).filter(Boolean));

      const filtered = historyMsgs.filter((m) => !currentIds.has(m.id));

      const formatted = filtered.map((m) => ({
        id: m.id,
        sender: m.role === "assistant" ? "bot" : "user",
        text: m.content_html || m.content,
        voice_url: m.voice_url || null,
      }));

      setMessages((prev) => [...formatted, ...prev]);

      setHasLoadedMore(true);
      setShowHistoryButton(false);
    } catch (err) {
      console.log("History error:", err);
    }

    setLoadingHistory(false);
  };

  const startNewChat = async () => {
    try {
      const res = await fetch(`${BASE}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data.success) return;

      setConversationId(data.data.conversation_id);

      setMessages([{ sender: "bot", text: t("newChatIntro") }]);

      setShowHistoryButton(false);
      setHasLoadedMore(false);
    } catch (err) {
      console.log("Start error:", err);
    }
  };

  const handleSend = async (msg = "", voiceFile = null) => {
    const text = (msg || input).trim();
    if ((!text && !voiceFile) || loadingReply) return;

    let voicePayload = null;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: voiceFile ? "" : text,
      voice_url: voiceFile ? URL.createObjectURL(voiceFile) : null,
    };

    if (!voiceFile) {
      setInput("");
    }

    setLoadingReply(true);
    setMessages((prev) => [...prev, userMessage, { sender: "bot", text: "..." }]);

    if (voiceFile) {

      try {
        const encoded = await blobToBase64(voiceFile);
        if (encoded) {
          voicePayload = {
            audio_base64: encoded,
            mime_type: (voiceFile.type || "audio/webm").split(";")[0],
          };
        }
      } catch (error) {
        console.error("Voice encoding failed", error);
      }
    }

    try {
      const res = await fetch(`${BASE}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: voiceFile ? "" : text,
          voice_message: voicePayload,
          language: lng || "ar",
          conversation_id: conversationId,
        }),
      });

      const data = await res.json();
      const reply = data?.data?.response?.reply || t("replyFallback");
      const replyVoiceUrl = data?.data?.response?.voice_url || null;

      const action = data?.data?.response?.action;
      const slug = action?.slug;
      const type = action?.type;
      const service = action?.service;

      if (slug) {
        navigate(slug);
        return;
      }

      if (type === "nav" && service) {
        navigate(`/${lng || "ar"}/${service}`);
        return;
      }

      setMessages((prev) => {
        const woTyping = prev.filter((m) => m.text !== "...");
        return [
          ...woTyping,
          {
            sender: "bot",
            text: reply,
            voice_url: replyVoiceUrl,
          },
        ];
      });
    } catch (err) {
      setMessages((prev) => {
        const woTyping = prev.filter((m) => m.text !== "...");
        console.log("Error Comes Up:", err);
        return [...woTyping, { sender: "bot", text: err, voice_message_url: null }];
      });
    }

    setLoadingReply(false);
  };

  const handleMicClick = () => {
    setShowRecorder(true);
  };

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(`/${lng || "ar"}`, { replace: true });
  };

  const Spinner = () => (
    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
  );

  return (
    <div className={styles.page} dir={i18n.dir()}>
      {/* TOP BAR */}
      <div className={styles.topbar}>
        <div className={styles.leftGroup}>
          <IoIosArrowForward size={24} onClick={handleBack} />

          <div className={styles.icon}>
            <div className="border border-[#0074cc] bg-[#eef8ff] rounded-full p-1">
              <img src="/assets/icons/ai-2.svg" alt="bot" className={styles.botIcon} />
            </div>
          </div>

          <span>{t("aiName")}</span>
        </div>

        {showStartButton && (
          <button onClick={startNewChat} className="text-primary text-sm underline mr-3">
            <RiChatNewLine size={26} />
          </button>
        )}
      </div>

      {/* CHAT BODY */}
      <div ref={bodyRef} className={`${styles.body} flex flex-col gap-3`}>
        {showHistoryButton && !hasLoadedMore && (
          <button
            disabled={loadingHistory}
            onClick={loadHistory}
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

        {/* MESSAGES */}
        {messages.map((msg, i) => (
          <div
            key={msg.id || i}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start items-center gap-2"
            }`}
          >
            {msg.sender === "bot" && msg.text !== "..." && (
              <div className="border border-[#0074cc] bg-[#eef8ff] rounded-full p-1">
                <img src="/assets/icons/ai-2.svg" alt="bot" className={styles.botIcon} />
              </div>
            )}

            {msg.text !== "..." && (
              <div
                className={`px-4 py-2 rounded-3xl max-w-[80%] text-sm ${
                  msg.sender === "user" ? styles.userBubble : styles.botBubble
                }`}
              >
                <span dangerouslySetInnerHTML={{ __html: msg.text }} />
                {msg.voice_url && (
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

      {/* QUICK REPLIES */}
      {/* <div className={styles.quick}>
        <Swiper spaceBetween={10} slidesPerView="auto">
          {quickReplies.map((q, i) => (
            <SwiperSlide key={i} className="!w-auto">
              <button className={styles.quickBtn} onClick={() => handleSend(q)}>
                {q}
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </div> */}

      {/* FOOTER */}
      <div className={styles.footer}>
        {showRecorder ? (
          <VoiceRecorderBar
            onSend={(blob) => {
              handleSend("", blob);
              setShowRecorder(false);
            }}
            onCancel={() => setShowRecorder(false)}
          />
        ) : (
          <>
            <button type="button" className={styles.circleBtn} onClick={handleMicClick}>
              <img src="/assets/icons/mice.svg" width={36} height={36} alt="mice" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("inputPlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />

            <button className={styles.sendBtn} onClick={() => handleSend()}>
              {t("sendButton")}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileChatPage;
