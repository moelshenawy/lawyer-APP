import React, { useRef, useState } from "react";
import styles from "../index.module.scss";
import { IoEyeOutline } from "react-icons/io5";
import { toast } from "react-hot-toast";
import stylesEmpty from "../RequestedInformationSection.module.scss";
import { useTranslation } from "react-i18next";
import StatusPopup from "@/components/common/StatusPopup";
import FilePreview from "@/components/common/FilePreview";

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
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

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


  return (
    <>
      {documents.length ? (
        documents.map((doc) => (
          <div onClick={() => setPreviewUrl(doc.file_url)} key={doc.id} className={styles.docRow}>
            <div>
              <div className="text-[#5F5F5F] font-bold min-w-0 text-[#5F5F5F] font-bold truncate max-w-[220px]">
                {doc.title}
              </div>
              <div className="text-sm text-[#5F5F5F] opacity-80">
                {t("documents.dateLabel")} {doc.uploaded_at}
              </div>
            </div>
            <div className="btns flex gap-3">
              <button
                className="flex items-center gap-1 text-[#5F5F5F]"
                href={doc.file_url}
                target="_blank"
                rel="noreferrer"
              >
                <IoEyeOutline size={18} />
                {t("documents.view")}
              </button>
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

      {/* <div
        className={styles.docRow2}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragging ? "2px dashed #3B82F6" : "none",
          backgroundColor: isDragging ? "#EFF6FF" : "transparent",
          transition: "all 0.2s ease",
        }}
      >
        <div className="flex flex-col w-[100%]">
          <div className="text-[#5F5F5F] font-bold">{t("documents.uploadHint")}</div>
          {isDragging && <div className="text-blue-500 text-sm mt-2">اسحب الملف هنا لرفعه</div>}
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
      </div> */}

      <StatusPopup
        isOpen={!!previewUrl}
        status="confirm"
        title={false}
        contentOnly={true}
        onClose={() => setPreviewUrl(null)}
        primaryAction={{
          label: t("close"),
          onClick: () => setPreviewUrl(null),
        }}
      >
        <FilePreview url={previewUrl} />
      </StatusPopup>
    </>
  );
};

export default DocumentsTap;
