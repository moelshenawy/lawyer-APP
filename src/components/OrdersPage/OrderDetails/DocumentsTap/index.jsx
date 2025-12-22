import React, { useRef, useState } from "react";
import styles from "../index.module.scss";
import { IoEyeOutline } from "react-icons/io5";
import { toast } from "react-hot-toast";
import stylesEmpty from "../RequestedInformationSection.module.scss";
import { useTranslation } from "react-i18next";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id/api"
).replace(/\/$/, "");

const getStoredUserToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("access_token");
};

const DocumentsTap = ({ documents, orderId, onUploadSuccess }) => {
  const { t } = useTranslation("orderDetails");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    if (!orderId) {
      toast.error(t("documents.orderIdMissing"));
      return;
    }
    if (isUploading) return;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // علشان يقدر يختار نفس الملف تاني لو حب

    if (!file || !orderId) return;

    const url = `${API_BASE}/client/orders/${orderId}/documents`;
    const token = getStoredUserToken();
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    const toastId = toast.loading(t("documents.uploadLoading"));

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          ...(token
            ? { Authorization: `Bearer ${token}`, userToken: token, UserToken: token }
            : {}),
          // متحطش Content-Type مع FormData
        },
        body: formData,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = json?.message || json?.error || t("documents.uploadFailed");
        toast.error(msg, { id: toastId });
      } else {
        toast.success(t("documents.uploadSuccess"), { id: toastId });

        // 👈 نعمل refetch للـ order من الـ parent
        if (typeof onUploadSuccess === "function") {
          onUploadSuccess();
        }
      }
    } catch (err) {
      toast.error(t("documents.uploadServerFailed"), { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // if (!documents.length) {
  //   return (
  //     <div className={stylesEmpty.empty}>
  //       <div className={stylesEmpty.emptyContent}>
  //         <p className={stylesEmpty.emptyTitle}>لا توجد فواتير حالياً</p>
  //         <p className={stylesEmpty.emptySubtitle}>جميع الفواتير المدفوعة و المستحقة </p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <>
      {documents.length ? (
        documents.map((doc) => (
          <div key={doc.id} className={styles.docRow}>
            <div>
              <div className="text-[#5F5F5F] font-bold min-w-0 text-[#5F5F5F] font-bold truncate max-w-[220px]">
                {doc.title}
              </div>
              <div className="text-sm text-[#5F5F5F] opacity-80">
                {t("documents.dateLabel")} {doc.uploaded_at}
              </div>
            </div>
            <div className="btns flex gap-3">
              <a
                className="flex items-center gap-1 text-[#5F5F5F]"
                href={doc.file_url}
                target="_blank"
                rel="noreferrer"
              >
                <IoEyeOutline size={18} />
                {t("documents.view")}
              </a>
            </div>
          </div>
        ))
      ) : (
        <div className={stylesEmpty.empty}>
          <div className={stylesEmpty.emptyContent}>
            <p className={stylesEmpty.emptyTitle}>{t("documents.emptyTitle")}</p>
            <p className={stylesEmpty.emptySubtitle}>{t("documents.emptySubtitle")}</p>
          </div>
        </div>
      )}

      <div className={styles.docRow2}>
        <div className="flex flex-col w-[100%]">
          <div className="text-[#5F5F5F] font-bold">{t("documents.uploadHint")}</div>
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={isUploading}
            className={`bg-primary text-white rounded-xl px-6 py-2 mt-2 w-fit hover:bg-[#123A64] transition-all self-end ${
              isUploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {isUploading ? t("documents.uploading") : t("documents.uploadButton")}
          </button>

          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
        </div>
      </div>
    </>
  );
};

export default DocumentsTap;
