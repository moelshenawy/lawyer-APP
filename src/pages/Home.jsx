import { HeadProvider, Title, Meta } from "react-head";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Home.module.scss";
import User from "@/components/HomePage/User";
import TasksCard from "@/components/TasksCard";
import { useTranslation } from "react-i18next";
import AttendanceBar from "@/components/AttendanceBar";
import HomePageNotification from "@/components/HomePageNotification";

const Home = () => {
  const { user, loading, refreshAccount, lastNotifications, attendanceToday } = useContext(AuthContext);
  const navigate = useNavigate();
  const { lng } = useParams();
  const base = `/${lng || "ar"}`;
  const { t } = useTranslation("home");

  useEffect(() => {
    if (!loading && !user) {
      navigate(`${base}/login`, { replace: true });
    }
  }, [loading, user, navigate, base]);

  if (loading || !user) return null;

  return (
    <>
      <HeadProvider>
        <Title>{t("seoTitle", "الرئيسية | المحامي")}</Title>
        <Meta name="description" content={t("seoDescription", "Lawyer client home page.")} />
      </HeadProvider>

      <div className={styles.page}>
        <AttendanceBar
          attendance={attendanceToday}
          refreshAccount={refreshAccount}
          styles={styles}
        />

        <User />

        <HomePageNotification
          styles={styles}
          lastNotifications={lastNotifications}
          title={t("notifications.title")}
        />

        <TasksCard />
      </div>
    </>
  );
};

export default Home;
