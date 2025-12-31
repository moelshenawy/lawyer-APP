import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import styles from "@/pages/Home.module.scss";
import { PiPencilSimpleLineFill } from "react-icons/pi";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import Skeleton from "@/components/Skeleton";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id/api"
).replace(/\/$/, "");

const getStoredUserToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("access_token");
};

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

/**
 * Reusable TaskCard component
 * @param {Object} task - Task data object
 * @param {string} linkTo - Optional link path (if not provided, card won't be clickable)
 * @param {React.ReactNode} children - Optional additional content to render inside the card
 * @param {Object} linkState - Optional state to pass to the Link
 */
const TaskCard = ({ task, linkTo, children, linkState }) => {
  const { t } = useTranslation("orders");
  const location = useLocation();
  const { id: paramId } = useParams();
  const [showMenu, setShowMenu] = useState(false);
  const [updating, setUpdating] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!task) return null;

  // Detect if we are on the task details page
  const isTaskDetailPage = location.pathname.includes(`/task/${task.id || paramId}`);

  const handleUpdateStatus = async (newStatus) => {
    setShowMenu(false);
    if (updating) return;

    setUpdating(true);
    const token = getStoredUserToken();
    try {
      await axios.patch(
        `${API_BASE}/user/tasks/${task.id || paramId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success(t("statusUpdateSuccess"));
      // Note: We don't update local state here because the badge UI logic depends on task.priority or task.priority_label,
      // and the user specifically asked NOT to change the badge UI based on status update.
    } catch (error) {
      console.error("Status update error:", error);
      toast.error(t("statusUpdateError"));
    } finally {
      setUpdating(false);
    }
  };

  const cardContent = (
    <div className={styles.taskCard}>
      <div className={styles.taskMeta}>
        <span
          className={`${styles.taskBadge} ${
            task.priority === "urgent" ? styles.urgent : ""
          }`}
        >
          {task.priority_label || task.priority}
          <FlagIcon />
        </span>
        
        <div className={styles.editStatusWrapper} ref={menuRef}>
          <span className={styles.taskAge}>{task.updated_at_since || task.age}</span>
          {isTaskDetailPage && (
            <>
              <button
                type="button"
                className={styles.editStatusBtn}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                disabled={updating}
              >
                <PiPencilSimpleLineFill />
              </button>
              {showMenu && (
                <div className={styles.statusDropdown}>
                  <button
                    type="button"
                    className={styles.statusOption}
                    onClick={() => handleUpdateStatus("todo")}
                  >
                    {t("todoLabel")}
                  </button>
                  <button
                    type="button"
                    className={styles.statusOption}
                    onClick={() => handleUpdateStatus("in_progress")}
                  >
                    {t("inProgressLabel")}
                  </button>
                  <button
                    type="button"
                    className={styles.statusOption}
                    onClick={() => handleUpdateStatus("blocked")}
                  >
                    {t("blockedLabel")}
                  </button>
                  <button
                    type="button"
                    className={styles.statusOption}
                    onClick={() => handleUpdateStatus("done")}
                  >
                    {t("doneLabel")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <h4 className={styles.taskTitle}>{task.title}</h4>
      <p className={styles.taskDescription}>{task.description}</p>
      <div className={styles.taskFooter}>
        <span className={styles.deadlineLabel}>{t("deadlineLabel")}</span>
        <div className={styles.deadlineInfo}>
          <span className={styles.deadlineItem}>
            <CalendarIcon />
            {task.due_at || task.date}
          </span>
        </div>
      </div>
      {children}
    </div>
  );

  // If linkTo is provided, wrap in Link
  if (linkTo) {
    return (
      <Link
        to={linkTo}
        state={linkState}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        {cardContent}
      </Link>
    );
  }

  // Otherwise, just return the card
  return cardContent;
};

/**
 * Skeleton for TaskCard
 */
const TaskSkeleton = () => {
  return (
    <div className={styles.taskCard}>
      <div className={styles.taskMeta}>
        <div style={{ display: "flex", gap: "8px" }}>
          <Skeleton variant="chip" width={70} height={24} />
          <Skeleton variant="circle" size={16} />
        </div>
        <Skeleton variant="text" width={60} height={16} />
      </div>
      <div className="mt-2">
        <Skeleton variant="title" width="80%" height={20} />
      </div>
      <div className="mt-2 space-y-2">
        <Skeleton variant="text" width="100%" height={12} />
        <Skeleton variant="text" width="90%" height={12} />
      </div>
      <div className={styles.taskFooter}>
        <Skeleton variant="text" width={60} height={14} />
        <div className={styles.deadlineInfo}>
          <Skeleton variant="text" width={80} height={14} />
        </div>
      </div>
    </div>
  );
};

TaskCard.Skeleton = TaskSkeleton;

export default TaskCard;
