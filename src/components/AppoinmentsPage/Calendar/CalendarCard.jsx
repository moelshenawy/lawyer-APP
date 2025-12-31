
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StatusPopup from "@/components/common/StatusPopup";
import AppoimentsStyles from "@/components/AppoinmentsPage/Calendar/index.module.scss";
import { useTranslation } from "react-i18next";

const CalendarCard = ({ Cards, consultations }) => {
  const { t } = useTranslation("appointments");
  const navigate = useNavigate();
  const { lng } = useParams();
  const [popupData, setPopupData] = useState({ isOpen: false, data: null });

  const items = Cards || consultations || [];

  const getSource = (c) => (c?.source || "").toLowerCase();
  const getCaseId = (c) => c?.service_engagement_id ?? null;

  const go = (path, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    navigate(`/${lng || "ar"}${path}`);
  };

  const handleCardClick = (c, e) => {
    const source = getSource(c);

    if ((source === "task" || source === "tasks") && c?.id) {
      return go(`/task/${c.id}`, e);
    }

    if (source === "consultation" || source === "consultations") {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      setPopupData({ isOpen: true, data: c });
      return;
    }

    const caseId = getCaseId(c);
    if (caseId) {
      return go(`/case/${caseId}`, e);
    }

    e?.preventDefault?.();
    e?.stopPropagation?.();
  };

  const selectedMeta = popupData.data?.meta || {};

  return (
    <>
      {items.map((c) => {
        return (
          <div
            key={c.id}
            className={AppoimentsStyles.listCard}
            onClick={() => handleCardClick(c)}
            style={{ cursor: "pointer" }}
          >
            <div className={AppoimentsStyles.listCardTop}>
              <div className={`text-primary font-bold text-base`}>
                {c.title}
              </div>

              <div className="flex items-center gap-4 text-primary text-sm font-medium">
                <span className="flex items-center gap-1 text-[#5F5F5F]">
                  {c.status_label}
                </span>
              </div>
            </div>

            <div className="px-4 py-3">
              <div className="mb-3 font-medium text-sm text-primary">
                {c.description}
                <br />
              </div>
            </div>

            <div className={AppoimentsStyles.infoBar}>{c.starts_at}</div>
          </div>
        );
      })}

      <StatusPopup
        isOpen={popupData.isOpen}
        onClose={() => setPopupData({ isOpen: false, data: null })}
        title={selectedMeta.status_label || t("eventTypeConsultation")}
        status={selectedMeta.status === "approved" ? "success" : "pending"}
        description={popupData.data?.description}
        bullets={[
          selectedMeta.client_name && `${t("clientName")}: ${selectedMeta.client_name}`,
          selectedMeta.client_email && `${t("clientEmail")}: ${selectedMeta.client_email}`,
          selectedMeta.client_phone && `${t("clientPhone")}: ${selectedMeta.client_phone}`,
          selectedMeta.client_id && `${t("clientId")}: ${selectedMeta.client_id}`,
          selectedMeta.has_case !== undefined && `${t("hasCase")}: ${selectedMeta.has_case ? t("yes") : t("no")}`,
        ].filter(Boolean)}
        primaryAction={
          selectedMeta.meet_link
            ? {
                label: t("meetingLink"),
                onClick: () => window.open(selectedMeta.meet_link, "_blank"),
              }
            : null
        }
      />
    </>
  );
};

export default CalendarCard;