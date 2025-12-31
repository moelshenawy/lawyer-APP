import React, { useContext, useEffect } from "react";
import { HeadProvider, Title, Meta } from "react-head";
import MainContent from "@/components/AcoountPage/MainContent";
import { AuthContext } from "@/context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import StatusPopup from "@/components/common/StatusPopup";
import { useTranslation } from "react-i18next";

const Consultation = () => {
  const { t } = useTranslation("consultation");
  const { user, loading } = useContext(AuthContext);
  const { lng } = useParams();
  const navigate = useNavigate();
  const base = `/${lng || "ar"}`;
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (!loading && !user) {
      navigate(`${base}/login`, { replace: true });
    }
  }, [loading, user, navigate, base]);

  if (loading) return null;

  if (!user) return null;

  if (!user?.is_subscribed) {
    return (
      <StatusPopup
        isOpen
        status="error"
        title={t("notSubscribedTitle")}
        description={t("notSubscribedDescription")}
        primaryAction={{
          label: t("goToPackages"),
          onClick: () => navigate(`${base}/packages`, { replace: true }),
        }}
        secondaryAction={{
          label: t("backHome"),
          onClick: () => navigate(base, { replace: true }),
        }}
        dir={dir}
      />
    );
  }

  return (
    <>
      <HeadProvider>
        <Title>{t("seoTitle", "الاستشارات | المحامي")}</Title>
        <Meta name="description" content={t("seoDescription", "Consultation booking form")} />
      </HeadProvider>
      <div className="  ">
        <MainContent />
      </div>
    </>
  );
};

export default Consultation;
