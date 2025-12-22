import { HeadProvider, Title, Meta } from "react-head";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Home.module.scss";
import User from "@/components/HomePage/User";

const notifications = [
  {
    title: "قضية تصالح",
    message: "تم رفع المستند المطلوب في قضية التصالح",
    icon: "chat",
  },
  {
    title: "المكتب",
    message: "تم اسناد قضية جديدة إليك",
    icon: "scale",
  },
];

const taskGroups = [
  {
    title: "مهام لم تبدأ بعد",
    link: "عرض المزيد",
    tasks: [
      {
        age: "منذ يومين",
        priority: "متوسطة",
        title: "نقل ملكية",
        description:
          "المطلوب هو استلام ملف نقل الملكية والتأكد من جميع تفاصيله القانونية. تشمل المهمة مراجعة المستندات المطلوبة، التأكد من صحة بيانات الأطراف...",
        date: "12 يناير 2026",
        time: "9:00 AM",
      },
      {
        age: "منذ يومين",
        priority: "متوسطة",
        title: "نقل ملكية",
        description:
          "المطلوب هو استلام ملف نقل الملكية والتأكد من جميع تفاصيله القانونية. تشمل المهمة مراجعة المستندات المطلوبة، التأكد من صحة بيانات الأطراف...",
        date: "12 يناير 2026",
        time: "9:00 AM",
      },
    ],
  },
  {
    title: "مهام قيد التنفيذ",
    link: "عرض المزيد",
    tasks: [
      {
        age: "منذ يومين",
        priority: "متوسطة",
        title: "نقل ملكية",
        description:
          "المطلوب هو استلام ملف نقل الملكية والتأكد من جميع تفاصيله القانونية. تشمل المهمة مراجعة المستندات المطلوبة، التأكد من صحة بيانات الأطراف...",
        date: "12 يناير 2026",
        time: "9:00 AM",
      },
    ],
  },
];

const BellIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 2c-3.2 0-5.8 2.6-5.8 5.8v2.8l-1.6 2.1c-.3.4 0 1 .5 1h13.8c.5 0 .8-.6.5-1l-1.6-2.1V7.8C17.8 4.6 15.2 2 12 2Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M9.6 18.2c.4 1.1 1.5 1.8 2.7 1.8s2.3-.7 2.7-1.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M5 4.5h14c1 0 1.8.8 1.8 1.8v8.1c0 1-.8 1.8-1.8 1.8H9.2l-3.5 3c-.5.4-1.2 0-1.2-.7v-2.3H5c-1 0-1.8-.8-1.8-1.8V6.3C3.2 5.3 4 4.5 5 4.5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="8.4" cy="10.8" r="1.1" fill="currentColor" />
    <circle cx="12" cy="10.8" r="1.1" fill="currentColor" />
    <circle cx="15.6" cy="10.8" r="1.1" fill="currentColor" />
  </svg>
);

const SparkleChatIcon = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true">
    <path
      d="M6 7.5h16c1.4 0 2.5 1.1 2.5 2.5v9.8c0 1.4-1.1 2.5-2.5 2.5H13l-4.4 3.6c-.7.6-1.6 0-1.6-.8v-2.8H6c-1.4 0-2.5-1.1-2.5-2.5V10c0-1.4 1.1-2.5 2.5-2.5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M22.5 6.5l1.2-2.4 1.2 2.4 2.4 1.2-2.4 1.2-1.2 2.4-1.2-2.4-2.4-1.2 2.4-1.2Z"
      fill="currentColor"
    />
  </svg>
);

const ScaleIcon = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true">
    <path
      d="M16 5v20M8 10h16M10.5 10l-4 7h8l-4-7ZM25.5 10l-4 7h8l-4-7Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FlagIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 2.5V13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M4.5 3h7l-1.6 2 1.6 2h-7V3Z" fill="currentColor" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <rect x="3" y="4.5" width="14" height="12" rx="2" fill="none" stroke="currentColor" />
    <path d="M3 7.5h14" stroke="currentColor" />
    <path d="M6.2 3v3M13.8 3v3" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" />
    <path d="M10 6.2v4.2l2.8 1.6" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

const Home = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const { lng } = useParams();
  const base = `/${lng || "ar"}`;

  useEffect(() => {
    if (!loading && !user) {
      navigate(`${base}/login`, { replace: true });
    }
  }, [loading, user, navigate, base]);

  if (loading || !user) return null;

  return (
    <>
      <HeadProvider>
        <Title>الرئيسية | المحامي</Title>
        <Meta name="description" content="Lawyer client home page." />
      </HeadProvider>

      <div className={styles.page}>
        <section className={styles.banner}>
          <p className={styles.bannerText}>تم رصد دخولك المكتب. هل تريد تسجيل حضورك؟</p>
          <div className={styles.bannerActions}>
            <button className={`${styles.bannerBtn} ${styles.reject}`} type="button">
              <span className={styles.iconBox}>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </button>
            <button className={`${styles.bannerBtn} ${styles.accept}`} type="button">
              <span className={styles.iconBox}>
                <img src="/assets/icons/checked.svg" alt={"checked"} className="mb-6 w-24" />
              </span>
            </button>
          </div>
        </section>

        <User />

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>اشعارات</h2>
          <div className={styles.notificationList}>
            {notifications.map((item) => (
              <div className={styles.notificationCard} key={item.title}>
                <div className={styles.notificationIcon}>
                  {item.icon === "chat" ? (
                    <img src="/assets/imgs/logo.png" alt={"logoAlt"} className="mb-6 w-24" />
                  ) : (
                    <img src="/assets/imgs/logo.png" alt={"logoAlt"} className="mb-6 w-24" />
                  )}
                </div>
                <div className={styles.notificationText}>
                  <span className={styles.notificationTitle}>{item.title}</span>
                  <p className={styles.notificationMessage}>{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>مهمات</h2>
          <div className={styles.taskGroups}>
            {taskGroups.map((group) => (
              <div className={styles.taskGroup} key={group.title}>
                <div className={styles.taskGroupHeader}>
                  <h3>{group.title}</h3>
                  <button className={styles.moreLink} type="button">
                    {group.link}
                  </button>
                </div>
                <div className={styles.taskList}>
                  {group.tasks.map((task, index) => (
                    <div className={styles.taskCard} key={`${task.title}-${index}`}>
                      <div className={styles.taskMeta}>
                        <span className={styles.taskBadge}>
                          {task.priority}
                          <FlagIcon />
                        </span>
                        <span className={styles.taskAge}>{task.age}</span>
                      </div>
                      <h4 className={styles.taskTitle}>{task.title}</h4>
                      <p className={styles.taskDescription}>{task.description}</p>
                      <div className={styles.taskFooter}>
                        <span className={styles.deadlineLabel}>موعد التسليم</span>
                        <div className={styles.deadlineInfo}>
                          <span className={styles.deadlineItem}>
                            <CalendarIcon />
                            {task.date}
                          </span>
                          <span className={styles.deadlineItem}>
                            <ClockIcon />
                            {task.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
