import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const DEFAULT_BASE =
  (import.meta.env.VITE_AI_CHAT_BASE_URL ||
    "https://fawaz-law-firm.apphub.my.id/api/client/ai"
  ).replace(/\/$/, "");

const DEFAULT_WELCOME = {
  sender: "bot",
  text: "مرحباً، أنا مساعدك القانوني الذكي. جاهز لمساعدتك في أي استفسار.",
  voice_url: null,
};
const DEFAULT_NEW_CHAT = {
  sender: "bot",
  text: "تم بدء محادثة جديدة. كيف يمكنني مساعدتك اليوم؟",
  voice_url: null,
};

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const [, encoded] = reader.result.split(",");
        resolve(encoded || null);
      } else resolve(null);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const safeText = (v) => (typeof v === "string" ? v : v == null ? "" : String(v));

export default function useChatController({
  language = "ar",
  tokenKey = "access_token",
  baseUrl = DEFAULT_BASE,
  quickReplies = [],
  welcomeMessage = DEFAULT_WELCOME,
  newChatMessage = DEFAULT_NEW_CHAT,

  // optional navigation support
  navigate,
  buildNavPath, // (lng, service) => string
} = {}) {
  const token = useMemo(() => {
    try {
      return typeof window !== "undefined"
        ? window.localStorage.getItem(tokenKey)
        : null;
    } catch {
      return null;
    }
  }, [tokenKey]);

  const bodyRef = useRef(null);

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([welcomeMessage]);

  const [input, setInput] = useState("");

  const [loadingReply, setLoadingReply] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [showHistoryButton, setShowHistoryButton] = useState(false);
  const [hasLoadedMore, setHasLoadedMore] = useState(false);

  const [showStartButton, setShowStartButton] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);

  // scroll handling (keep position on prepend)
  const prependAdjustRef = useRef(null);

  const scrollToBottom = () => {
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    // if we just prepended history, keep scroll position stable
    if (prependAdjustRef.current) {
      const { prevScrollHeight, prevScrollTop } = prependAdjustRef.current;
      const newScrollHeight = el.scrollHeight;
      el.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
      prependAdjustRef.current = null;
      return;
    }

    // normal behavior: stick to bottom
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const normalizeMessages = (msgs) =>
    (msgs || []).map((m) => ({
      id: m.id,
      sender: m.role === "assistant" ? "bot" : "user",
      text: m.content_html || m.content || "",
      voice_url: m.voice_url || null,
    }));

  const checkCurrent = async () => {
    if (!token) {
      setShowStartButton(false);
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data?.success) return;

      const msgs = data?.data?.messages || [];
      setConversationId(data?.data?.conversation_id || null);

      const mapped = normalizeMessages(msgs);
      setMessages(mapped.length ? mapped : [welcomeMessage]);

      const assistantCount = msgs.filter((m) => m.role === "assistant").length;
      setShowHistoryButton(assistantCount >= 2);

      setShowStartButton(true);
    } catch (err) {
      console.log("Current error:", err);
    }
  };

  const loadHistory = async () => {
    if (!token || loadingHistory) return;

    try {
      setLoadingHistory(true);

      const el = bodyRef.current;
      if (el) {
        prependAdjustRef.current = {
          prevScrollHeight: el.scrollHeight,
          prevScrollTop: el.scrollTop,
        };
      }

      const res = await fetch(`${baseUrl}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data?.success) return;

      const historyMsgs = data?.data?.messages || [];
      const currentIds = new Set(messages.map((m) => m.id).filter(Boolean));
      const filtered = historyMsgs.filter((m) => !currentIds.has(m.id));
      const formatted = normalizeMessages(filtered);

      setMessages((prev) => [...formatted, ...prev]);

      setHasLoadedMore(true);
      setShowHistoryButton(false);
    } catch (err) {
      console.log("History error:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const startNewChat = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${baseUrl}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data?.success) return;

      setConversationId(data?.data?.conversation_id || null);

      setMessages([newChatMessage]);

      setShowHistoryButton(false);
      setHasLoadedMore(false);
      scrollToBottom();
    } catch (err) {
      console.log("Start error:", err);
    }
  };

  const applyNavigationAction = (action) => {
    if (!action || !navigate) return false;

    const slug = action?.slug;
    const type = action?.type;
    const service = action?.service;

    if (slug) {
      navigate(slug);
      return true;
    }

    if (type === "nav" && service) {
      const path = buildNavPath
        ? buildNavPath(language, service)
        : `/${language}/${service}`;
      navigate(path);
      return true;
    }

    return false;
  };

  const handleSend = async (msg = "", voiceFile = null) => {
    const text = safeText(msg || input).trim();

    if (loadingReply) return;
    if ((!text && !voiceFile) || !token) {
      if (!token) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "لا يوجد توكن دخول. سجّل دخولك ثم جرّب مرة أخرى." },
        ]);
      }
      return;
    }

    let voicePayload = null;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: voiceFile ? "" : text,
      voice_url: voiceFile ? URL.createObjectURL(voiceFile) : null,
    };

    if (!voiceFile) setInput("");

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
      const res = await fetch(`${baseUrl}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: voiceFile ? "" : text,
          voice_message: voicePayload,
          language,
          conversation_id: conversationId,
        }),
      });

      const data = await res.json();

      const reply = data?.data?.response?.reply || "لم يتم العثور على رد.";
      const replyVoiceUrl = data?.data?.response?.voice_url || null;

      const action = data?.data?.response?.action;
      if (applyNavigationAction(action)) return;

      setMessages((prev) => {
        const woTyping = prev.filter((m) => m.text !== "...");
        return [
          ...woTyping,
          { sender: "bot", text: safeText(reply), voice_url: replyVoiceUrl },
        ];
      });
    } catch (err) {
      console.log("Send error:", err);
      setMessages((prev) => {
        const woTyping = prev.filter((m) => m.text !== "...");
        return [
          ...woTyping,
          { sender: "bot", text: "حصل خطأ أثناء إرسال الرسالة. حاول مرة أخرى." },
        ];
      });
    } finally {
      setLoadingReply(false);
    }
  };

  const handleMicClick = () => setShowRecorder(true);

  useEffect(() => {
    checkCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // refs
    bodyRef,

    // state
    conversationId,
    messages,
    input,
    loadingReply,
    loadingHistory,
    showHistoryButton,
    hasLoadedMore,
    showStartButton,
    showRecorder,

    // config
    quickReplies,

    // setters
    setInput,
    setShowRecorder,

    // actions
    checkCurrent,
    loadHistory,
    startNewChat,
    handleSend,
    handleMicClick,
  };
}
