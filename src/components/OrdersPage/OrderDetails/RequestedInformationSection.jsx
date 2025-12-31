import React from "react";
import styles from "./RequestedInformationSection.module.scss";
import { useTranslation } from "react-i18next";

/**
 * RequestedInformationSection now displays general information about the order/case.
 * Historically it was used for form submissions, but the data source has been changed 
 * to the general 'info' object.
 */
const RequestedInformationSection = ({ requestedInformation }) => {
  const { t } = useTranslation("orderDetails");

  // Handle case where it might be an array (for legacy support) or just the info object
  const data = Array.isArray(requestedInformation) 
    ? (requestedInformation.length > 0 ? requestedInformation[0] : null) 
    : requestedInformation;

  // Check if data is empty or null
  const hasData = data && typeof data === 'object' && Object.keys(data).length > 0;

  if (!hasData) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>{t("requestedInfo.emptyTitle") || "لا توجد معلومات متاحة حالياً"}</p>
      </div>
    );
  }

  // Predefined keys we handle separately or want in a specific order
  const priorityFields = [
    { key: "number", label: "رقم الطلب" },
    { key: "title", label: "العنوان" },
    { key: "case_type_name", label: "نوع الخدمة" },
    { key: "status_label", label: "الحالة", isStatus: true },
    { key: "court_name", label: "المحكمة" },
    { key: "case_reference_no", label: "رقم المرجع" },
    { key: "created_at", label: "تاريخ الإنشاء" },
    { key: "updated_at", label: "تاريخ التحديث" },
  ];

  // Logic to catch "anything else" that comes in the data
  // Only include primitives (strings/numbers) and skip already handled keys
  const excludeKeys = new Set([
     ...priorityFields.map(f => f.key), 
     'id', 'order_id', 'client', 'users', 'assigned_user', 'notification', 'name', 'type', 'status'
  ]);

  const dynamicFields = Object.entries(data)
    .filter(([key, value]) => {
      return !excludeKeys.has(key) && 
             (typeof value === 'string' || typeof value === 'number') && 
             value !== null && 
             value !== "";
    })
    .map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Prettify key
      value: value
    }));

  const allGeneralFields = [
    ...priorityFields.map(f => ({ ...f, value: data[f.key] })),
    ...dynamicFields
  ].filter(f => f.value !== undefined && f.value !== null && f.value !== "");

  return (
    <div className={styles.section}>
      {/* General Information Card */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{t("tabs.info")}</h3>
        <div className={styles.infoGrid}>
          {allGeneralFields.map((field, idx) => (
            <div key={idx} className={styles.infoItem}>
              <span className={styles.infoLabel}>{field.label}</span>
              <span className={`${styles.infoValue} ${field.isStatus ? styles.statusBadge : ""}`}>
                {field.value || "---"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Client Information Card */}
      {data.client && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>معلومات العميل</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>الاسم</span>
              <span className={styles.infoValue}>{data.client.name}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>رقم الهاتف</span>
              <span className={styles.infoValue}>{data.client.phone}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>البريد الإلكتروني</span>
              <span className={styles.infoValue}>{data.client.email}</span>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Staff Card */}
      {(data.assigned_user || (data.users && data.users.length > 0)) && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}> المسؤول</h3>
          {data.assigned_user ? (
            <div className={styles.userCard}>
              {data.assigned_user.avatar ? (
                <img
                  src={data.assigned_user.avatar}
                  alt={data.assigned_user.name}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatar} style={{ backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b', fontSize: '1.2rem' }}>
                  {data.assigned_user.name?.charAt(0)}
                </div>
              )}
              <div className={styles.userInfo}>
                <span className={styles.userName}>{data.assigned_user.name}</span>
                <span className={styles.userEmail}>{data.assigned_user.email}</span>
              </div>
            </div>
          ) : (
             data.users.map(u => (
                <div key={u.id} className={styles.userCard} style={{ marginBottom: '0.5rem' }}>
                    {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className={styles.avatar} />
                    ) : (
                        <div className={styles.avatar} style={{ backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b' }}>
                            {u.name?.charAt(0)}
                        </div>
                    )}
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{u.name}</span>
                        <span className={styles.userEmail}>{u.email}</span>
                    </div>
                </div>
             ))
          )}
        </div>
      )}
    </div>
  );
};

export default RequestedInformationSection;
