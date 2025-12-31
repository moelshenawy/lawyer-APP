import React, { useCallback, useEffect, useState } from "react";
import User from "@/assets/icons/User";
import styles from "./index.module.scss";
import { useTranslation } from "react-i18next";
import axiosClient from "@/api/axiosClient";
import toast from "react-hot-toast";

/**
 * TaskUpdatesSection
 * - UI matches your current "التحديثات" block 1:1
 * - Keeps the same add comment logic & loading states
 * - Optional: can sync with parent data via `initialUpdates`
 */
const TaskUpdatesSection = ({ taskId, initialUpdates = [] }) => {
  const { t } = useTranslation("orderDetails");
  const [updates, setUpdates] = useState(Array.isArray(initialUpdates) ? initialUpdates : []);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // keep in sync when parent refetches and sends new updates
  useEffect(() => {
    setUpdates(Array.isArray(initialUpdates) ? initialUpdates : []);
  }, [initialUpdates]);

  const handleAddComment = useCallback(async () => {
    if (!taskId || !newComment.trim() || submittingComment) return;

    setSubmittingComment(true);

    try {
      const response = await axiosClient.post(`/user/tasks/${taskId}/updates`, {
        comment: newComment.trim(),
        attachment_path: null,
      });

      const data = response.data;

      if (data?.success && data?.data) {
        setUpdates((prev) => [...prev, data.data]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Failed to add update", err);
      toast.error(t("updates.failedToAddUpdate"));
    } finally {
      setSubmittingComment(false);
    }
  }, [taskId, newComment, submittingComment, t]);

  return (
    <div className="flex flex-col gap-3 mt-3">
      <div className={styles.commentsSection}>
        <h3 className="text-lg font-bold mb-4">{t("updates.title")}</h3>

        {/* Updates List */}
        <div className="space-y-4">
          {updates.map((update, index) => (
            <div key={update.id ?? index}>
              <div className="flex items-start gap-3">
                {update.user?.avatar_url ? (
                  <img
                    src={update.user.avatar_url}
                    alt={update.user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200">
                    <User size={20} />
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{update.user?.name}</p>
                    <span className="text-xs text-gray-500">{update.created_at_since}</span>
                  </div>

                  <p className="text-gray-700 mt-1">{update.comment}</p>

                  {update.attachment_url && (
                    <a
                      href={update.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 mt-1 inline-block"
                    >
                      {t("updates.viewAttachment")}
                    </a>
                  )}
                </div>
              </div>

              {index < updates.length - 1 && <hr className="my-4 border-gray-200" />}
            </div>
          ))}
        </div>

        {/* Add Comment Input */}
        <div className="flex items-center gap-3 mt-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200">
            <User size={20} />
          </div>

          <div className="flex-1 flex items-center gap-2 bg-white border border-[#E6E6E6] rounded-full px-4 py-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !submittingComment) handleAddComment();
              }}
              placeholder={t("updates.addUpdatePlaceholder")}
              disabled={submittingComment}
              className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-500"
            />
          </div>

          <button
            onClick={handleAddComment}
            disabled={submittingComment || !newComment.trim()}
            className="w-8 h-8 bg-[#EEF8FF] border border-[#0074CC] rounded-full flex items-center justify-center text-[#003E6F] disabled:opacity-50"
            type="button"
          >
            {submittingComment ? (
              <div className="w-4 h-4 border-2 border-[#003E6F] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskUpdatesSection;
