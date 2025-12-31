import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import stylesEmpty from "@/components/OrdersPage/OrderDetails/RequestedInformationSection.module.scss";
import PageHeader from "@/components/common/PageHeader";

// Utility for formatted time + date
const formatDateTime = () => {
  const now = new Date();
  const time = now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("ar-EG", { day: "2-digit", month: "long" });
  return `${time} • ${date}`;
};

const ChatPerson = () => {
  const navigate = useNavigate();
  const { lng } = useParams();
  const { t } = useTranslation("chatMobile");

  const [messages, setMessages] = useState([
    {
      sender: "receiver",
      text: "مرحباً بك 😊",
      time: formatDateTime(),
    },
  ]);

  const [input, setInput] = useState("");
  const bodyRef = useRef(null);

  const quickReplies = ["كيف أبدأ؟", "أحتاج مساعدة", "حجز موعد", "متابعة المحادثة"];

  const handleSend = (msg) => {
    const text = msg || input.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { sender: "user", text, time: formatDateTime() },
    ]);

    setInput("");
  };

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`/${lng || "ar"}`, { replace: true });
    }
  };

  return (

    <>
      <PageHeader title={t("chat")} />
    
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className={stylesEmpty.empty}>
        <div className={stylesEmpty.emptyContent}>
          <p className={stylesEmpty.emptyTitle}>{t("notAvailable")}</p>
          <p className={stylesEmpty.emptySubtitle}>{t("notAvailableSub")}</p>
        </div>
      </div>
    </div>
    </>
    // <div className={`${styles.page}`} dir="rtl">

    //   {/* Top bar */}
    //   <div className={styles.topbar}>
    //     <div
    //       className={styles.rightGroup}
    //       onClick={handleBack}
    //       role="button"
    //       tabIndex={0}
    //     >
    //       <IoIosArrowForward size={24} />
    //       <img
    //         src="/assets/imgs/client.png"
    //         width={32}
    //         height={32}
    //         alt="user"
    //         className={styles.avatar}
    //       />
    //       فواز الداهش المحامي
    //     </div>
    //   </div>

    //   {/* Chat Body */}
    //   <div ref={bodyRef} className={`${styles.body} flex flex-col gap-4`}>
    //     {messages.map((msg, i) => (
    //       <div
    //         key={i}
    //         className={`flex ${
    //           msg.sender === "user"
    //             ? "justify-end"
    //             : "justify-start items-center gap-2"
    //         }`}
    //       >
    //         <div className={styles.messageWrapper}>
    //           <div
    //             className={`${styles.bubble} ${
    //               msg.sender === "user" ? styles.userBubble : styles.receiverBubble
    //             }`}
    //           >
    //             {msg.text}
    //           </div>

    //           {/* message time */}
    //           <div className={styles.time}>{msg.time}</div>
    //         </div>

    //         {msg.sender === "receiver" && (
    //           <img
    //             src="/assets/imgs/client.png"
    //             width={32}
    //             height={32}
    //             alt="user"
    //             className={styles.avatarSmall}
    //           />
    //         )}
    //       </div>
    //     ))}
    //   </div>

    //   {/* Quick replies */}
    //   <div className={styles.quick}>
    //     <Swiper spaceBetween={10} slidesPerView="auto">
    //       {quickReplies.map((q, i) => (
    //         <SwiperSlide key={i} className="!w-auto">
    //           <button className={styles.quickBtn} onClick={() => handleSend(q)}>
    //             {q}
    //           </button>
    //         </SwiperSlide>
    //       ))}
    //     </Swiper>
    //   </div>

    //   {/* Footer Input */}
    //   <div className={styles.footer}>
    //     <button className={styles.circleBtn}>
    //       <img src="/assets/icons/mice.svg" width={30} height={30} alt="mic" />
    //     </button>

    //     <input
    //       type="text"
    //       value={input}
    //       onChange={(e) => setInput(e.target.value)}
    //       placeholder="اكتب رسالتك..."
    //       onKeyDown={(e) => e.key === "Enter" && handleSend()}
    //     />

    //     <button className={styles.sendBtn} onClick={() => handleSend()}>
    //       إرسال
    //     </button>
    //   </div>
    // </div>
  );
};

export default ChatPerson;
