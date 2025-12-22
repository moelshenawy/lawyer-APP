import React, { useState } from "react";
import styles from "../index.module.scss";
import StatusPopup from "@/components/common/StatusPopup";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id/api"
).replace(/\/$/, "");

const getStoredUserToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("access_token");
};

const ApprovalsTap = ({ approvals, orderId, onApproveSuccess }) => {
  const { t } = useTranslation("orderDetails");
  const [popupState, setPopupState] = useState(null); // "approve" | null
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [signedFile, setSignedFile] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [decision, setDecision] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpenPopup = (approval) => {
    setSelectedApproval(approval);
    setSignedFile(null);
    setDecisionNotes("");
    setDecision("");
    setPopupState("approve");
  };

  const handleClosePopup = () => {
    if (submitting) return;
    setPopupState(null);
    setSelectedApproval(null);
    setSignedFile(null);
    setDecisionNotes("");
    setDecision("");
  };

  const handleSubmit = async () => {
    if (!orderId || !selectedApproval) return;

    if (!decision) {
      toast.error(t("approvals.selectDecision"));
      return;
    }

    const token = getStoredUserToken();
    if (!token) {
      toast.error(t("approvals.loginFirst"));
      return;
    }

    const approveUrl = `${API_BASE}/client/orders/${orderId}/approvals/${selectedApproval.id}/approve`;

    const formData = new FormData();
    if (signedFile) {
      formData.append("signed_file", signedFile);
    }
    formData.append("decision", decision);
    if (decisionNotes) formData.append("decision_notes", decisionNotes);

    setSubmitting(true);

    try {
      await toast.promise(
        fetch(approveUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            userToken: token,
            UserToken: token,
          },
          body: formData,
        }).then(async (res) => {
          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(json?.message || t("approvals.submitFailed"));
          }
          return json;
        }),
        {
          loading: t("approvals.submitLoading"),
          success: t("approvals.submitSuccess"),
          error: (err) => err.message || t("approvals.submitFailed"),
        },
      );

      handleClosePopup();
      if (typeof onApproveSuccess === "function") {
        onApproveSuccess();
      }
    } catch (err) {
      console.error("Approve error", err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderPopup = () => {
    if (popupState !== "approve" || !selectedApproval) return null;

    return (
      <StatusPopup
        isOpen
        status="confirm"
        title={t("approvals.popupTitle")}
        description={t("approvals.popupDescription")}
        onClose={handleClosePopup}
        disableClose={submitting}
        secondaryAction={{
          label: t("approvals.cancel"),
          onClick: handleClosePopup,
          disabled: submitting,
        }}
        primaryAction={{
          label: submitting ? t("approvals.submitSubmitting") : t("approvals.submit"),
          onClick: handleSubmit,
          disabled: submitting || !decision,
        }}
      >
        <div className="flex flex-col gap-3 w-full text-start">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#5F5F5F]">{t("approvals.signedFileLabel")}</label>
            <input
              type="file"
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setSignedFile(file || null);
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#5F5F5F]">{t("approvals.decisionLabel")}</label>
            <select
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm bg-white"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              <option value="">{t("approvals.decisionPlaceholder")}</option>
              <option value="approved">{t("approvals.decisionApproved")}</option>
              <option value="changes_requested">{t("approvals.decisionChangesRequested")}</option>
              <option value="rejected">{t("approvals.decisionRejected")}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#5F5F5F]">{t("approvals.notesLabel")}</label>
            <textarea
              rows={3}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm"
              placeholder={t("approvals.notesPlaceholder")}
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
            />
          </div>
        </div>
      </StatusPopup>
    );
  };

  const mapDecisionLabel = (value) => {
    switch (value) {
      case "approved":
        return t("approvals.decisionApproved");
      case "changes_requested":
        return t("approvals.decisionChangesRequested");
      case "rejected":
        return t("approvals.decisionRejected");
      case "pending":
      default:
        return t("approvals.decisionPlaceholder");
    }
  };

  if (!approvals || approvals.length === 0) {
    return renderPopup();
  }

  return (
    <>
      {approvals.map((appr) => (
        <div key={appr.id} className={styles.sessionCard}>
          <div className={styles.text_container}>
            <div className="text-[#5F5F5F] font-bold">
              {appr.subject_text || t("approvals.defaultSubject")}
            </div>

            {appr.message && <div className="mt-1 text-sm text-[#5F5F5F]">{appr.message}</div>}

            <div className="mt-3 grid gap-2 text-xs text-[#5F5F5F] sm:grid-cols-2">
              <div>
                <span className="font-semibold">{t("approvals.requestDate")} </span>
                {appr.created_at ? appr.created_at : "—"}
              </div>
              <div>
                <span className="font-semibold">{t("approvals.lastUpdated")} </span>
                {appr.updated_at ? appr.updated_at : "—"}
              </div>
              <div>
                <span className="font-semibold">{t("approvals.deadline")} </span>
                {appr.approval_deadline ? appr.approval_deadline : "—"}
              </div>
            </div>

            <div className="mt-2 text-xs text-[#5F5F5F]">
              <span className="font-semibold">{t("approvals.status")} </span>
              {mapDecisionLabel(appr.decision)}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {appr.file_url && (
                <a
                  href={appr.file_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-primary border rounded-xl px-4 py-2 text-sm hover:bg-[#123A64] hover:text-white transition-all cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t("approvals.viewFile")}
                </a>
              )}

              {appr.decision === "pending" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenPopup(appr);
                  }}
                  className="bg-primary text-white rounded-xl px-4 py-2 text-sm hover:bg-[#123A64] transition-all cursor-pointer"
                >
                  {t("approvals.takeAction")}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {renderPopup()}
    </>
  );
};

export default ApprovalsTap;
