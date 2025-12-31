import React from "react";
import { FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";
import styles from "./index.module.scss";
import i18n from "@/i18n";

const statusConfig = {
  success: { icon: <FiCheckCircle />, tone: styles.success },
  confirm: { icon: <FiClock />, tone: styles.pending },
  error: { icon: <FiXCircle />, tone: styles.cancelled },
  cancelled: { icon: <FiXCircle />, tone: styles.cancelled },
  pending: { icon: <FiClock />, tone: styles.pending },
};

const StatusPopup = ({
  isOpen,
  status = "pending",
  title,
  description,
  description2,
  bullets = [],
  children,
  primaryAction,
  secondaryAction,
  contentOnly = false,
  onClose,
  disableClose = false,
}) => {
  if (!isOpen) return null;

  const variant = statusConfig[status] || statusConfig.pending;
  const hasSecondary = Boolean(secondaryAction);

  return (
    <div className={styles.overlay} onClick={disableClose ? undefined : onClose}>
      <div
        className={`${styles.popup} ${contentOnly ? styles.popupContentOnly : ""}`}
        dir={i18n.dir()}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {!contentOnly && (
          <div className={styles.header}>
            <span className={`${styles.statusIcon} ${variant.tone}`}>{variant.icon}</span>
          </div>
        )}

        <div className={styles.textBlock}>
          <h3 className={styles.title}>{title}</h3>
          {description && <p className={styles.description}>{description}</p>}
          {description2 && <p className={styles.description}>{description2}</p>}
          {bullets.length > 0 && (
            <ul className={styles.bulletList}>
              {bullets.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
          {children && <div className={styles.custom}>{children}</div>}
        </div>

        <div className={`${styles.actions} ${hasSecondary ? styles.row : styles.stacked}`}>
          {secondaryAction && (
            <button
              type="button"
              className={`${styles.button} ${styles.secondary}`}
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
            >
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <button
              type="button"
              className={`${styles.button} ${styles.primary}`}
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
            >
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusPopup;
 