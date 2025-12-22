import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import styles from "./RequestedInformationSection.module.scss";
import { useTranslation } from "react-i18next";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id/api"
).replace(/\/$/, "");

const REQUESTED_INFORMATION_URL = (orderId, submissionId) =>
  `${API_BASE}/client/orders/${orderId}/requested-information/${submissionId}`;

const getStoredUserToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("access_token");
};

const normalizeType = (type) => (type || "text").toLowerCase();

const getSubmissionId = (submission) =>
  submission?.id ?? submission?.uuid ?? submission?.submission_id;

const getFieldKey = (field) => field?.name ?? field?.uuid ?? field?.key ?? field?.id ?? "";

const isValueMissing = (value, type) => {
  if (type === "checkbox" || type === "yes-no") {
    return value === undefined || value === null;
  }

  if (type === "file") {
    if (!value) return true;
    if (value instanceof FileList || Array.isArray(value)) {
      return value.length === 0;
    }
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  return value === undefined || value === null || value === "";
};

const buildFieldPayload = (field, value) => {
  const fieldKey = getFieldKey(field);
  const fieldType = normalizeType(field?.type);
  let payloadValue;

  if (fieldType === "checkbox" || fieldType === "yes-no") {
    payloadValue = Boolean(value);
  } else if (fieldType === "number") {
    if (value === "" || value === undefined || value === null) {
      payloadValue = "";
    } else {
      const parsed = Number(value);
      payloadValue = Number.isNaN(parsed) ? value : parsed;
    }
  } else if (fieldType === "file") {
    payloadValue = [];
  } else {
    payloadValue = value ?? "";
  }

  return {
    key: `data[${fieldKey}]`,
    value: payloadValue,
    description: "",
    type: fieldType,
    uuid: fieldKey,
    enabled: true,
  };
};

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const RequestedInformationSection = ({ requestedInformation = [], orderId, onSuccess }) => {
  const { t } = useTranslation("orderDetails");
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState({});
  const warnedTypesRef = useRef(new Set());

  const handleFieldChange = (submissionId, fieldKey, value) => {
    setFormValues((prev) => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] || {}),
        [fieldKey]: value,
      },
    }));
    setErrors((prev) => {
      const clone = { ...prev };
      const errorKey = `${submissionId}-${fieldKey}`;
      if (clone[errorKey]) {
        delete clone[errorKey];
      }
      return clone;
    });
  };

  const handleFileRemove = (submissionId, fieldKey, indexToRemove) => {
    const files = formValues[submissionId]?.[fieldKey] || [];
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    handleFieldChange(submissionId, fieldKey, updatedFiles);
  };

  const normalizeFieldOptions = (options) => {
    if (!options) return [];
    if (Array.isArray(options)) {
      return options.map((option) => {
        if (typeof option === "object" && option !== null) {
          const rawValue = option?.value ?? option?.key ?? option?.id ?? option?.name ?? option;
          return {
            value: rawValue,
            label: option?.label ?? option?.name ?? String(rawValue),
          };
        }
        return {
          value: option,
          label: String(option),
        };
      });
    }
    if (typeof options === "object") {
      return Object.entries(options).map(([key, value]) => ({
        value: key,
        label: value,
      }));
    }
    return [];
  };

  const handleSubmit = async (submission) => {
    const submissionId = getSubmissionId(submission);
    if (!submissionId || submitting[submissionId] || !orderId) return;

    const fields = submission?.form_fields || [];
    if (!fields.length) return;

    const hasMissingRequiredOptions = fields.some((field) => {
      const fieldType = normalizeType(field?.type);
      if (fieldType !== "multiple_choice" || !field?.is_required) return false;
      const options = normalizeFieldOptions(field?.options);
      return options.length === 0;
    });

    if (hasMissingRequiredOptions) {
      toast.error("Required multiple-choice field is missing options.");
      return;
    }

    const nextErrors = {};
    fields.forEach((field) => {
      const fieldKey = getFieldKey(field);
      if (!fieldKey) return;
      const fieldType = normalizeType(field?.type);
      const currentValue = formValues[submissionId]?.[fieldKey];
      if (field?.is_required && isValueMissing(currentValue, fieldType)) {
        nextErrors[`${submissionId}-${fieldKey}`] = true;
      }
    });

    if (Object.keys(nextErrors).length) {
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      toast.error("Please fill all required fields before submitting.");
      return;
    }

    setSubmitting((prev) => ({ ...prev, [submissionId]: true }));
    const toastId = toast.loading("Sending requested information...");

    const payloadItems = fields
      .map((field) => {
        const fieldKey = getFieldKey(field);
        if (!fieldKey) return null;
        return buildFieldPayload(field, formValues[submissionId]?.[fieldKey]);
      })
      .filter(Boolean);

    const hasSelectedFiles = fields.some((field) => {
      const fieldType = normalizeType(field?.type);
      if (fieldType !== "file") return false;
      const fieldKey = getFieldKey(field);
      if (!fieldKey) return false;
      const value = formValues[submissionId]?.[fieldKey];
      return Array.isArray(value) && value.length > 0;
    });

    const headers = {};
    const token = getStoredUserToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers.userToken = token;
      headers.UserToken = token;
    }

    let body;
    if (hasSelectedFiles) {
      const formData = new FormData();
      formData.append("payload", JSON.stringify(payloadItems));
      fields.forEach((field) => {
        if (normalizeType(field?.type) !== "file") return;
        const fieldKey = getFieldKey(field);
        if (!fieldKey) return;
        const files = formValues[submissionId]?.[fieldKey];
        if (!Array.isArray(files) || !files.length) return;
        files.forEach((file) => {
          formData.append(`data[${fieldKey}]`, file);
        });
      });
      body = formData;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(payloadItems);
    }

    try {
      const response = await fetch(REQUESTED_INFORMATION_URL(orderId, submissionId), {
        method: "POST",
        headers,
        body,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message || "Failed to send information.");
      }

      toast.success(result?.message || "Information submitted successfully.", {
        id: toastId,
      });

      onSuccess?.();
      setFormValues((prev) => ({ ...prev, [submissionId]: {} }));
      setErrors((prev) => {
        const clone = { ...prev };
        Object.keys(clone).forEach((key) => {
          if (key.startsWith(`${submissionId}-`)) {
            delete clone[key];
          }
        });
        return clone;
      });
    } catch (error) {
      const message = error?.message || "Unable to submit requested information.";
      toast.error(message, { id: toastId });
    } finally {
      setSubmitting((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  const fieldRenderers = {
    // text: ({ inputId, value, onChange }) => (
    //   <input
    //     id={inputId}
    //     type="text"
    //     className={styles.input}
    //     value={value ?? ""}
    //     onChange={(event) => onChange(event.target.value)}
    //   />
    // ),
    // textarea: ({ inputId, value, onChange }) => (
    //   <textarea
    //     id={inputId}
    //     className={`${styles.input} ${styles.textarea}`}
    //     value={value ?? ""}
    //     onChange={(event) => onChange(event.target.value)}
    //   />
    // ),
    // number: ({ inputId, value, onChange }) => (
    //   <input
    //     id={inputId}
    //     type="number"
    //     className={styles.input}
    //     value={value ?? ""}
    //     onChange={(event) => onChange(event.target.value)}
    //   />
    // ),
    // date: ({ inputId, value, onChange }) => (
    //   <input
    //     id={inputId}
    //     type="date"
    //     className={styles.input}
    //     value={value ?? ""}
    //     onChange={(event) => onChange(event.target.value)}
    //   />
    // ),
    // datetime: ({ inputId, value, onChange }) => (
    //   <input
    //     id={inputId}
    //     type="datetime-local"
    //     className={styles.input}
    //     value={value ?? ""}
    //     onChange={(event) => onChange(event.target.value)}
    //   />
    // ),
    checkbox: ({ inputId, value, onChange }) => (
      <div className={styles.checkboxWrapper}>
        <input
          id={inputId}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
      </div>
    ),

    text: ({ field, inputId, value, onChange }) => (
      <input
        id={inputId}
        type="text"
        className={styles.input}
        value={value ?? ""}
        placeholder={field?.hint || ""}
        onChange={(event) => onChange(event.target.value)}
      />
    ),

    textarea: ({ field, inputId, value, onChange }) => (
      <textarea
        id={inputId}
        className={`${styles.input} ${styles.textarea}`}
        value={value ?? ""}
        placeholder={field?.hint || ""}
        onChange={(event) => onChange(event.target.value)}
      />
    ),

    number: ({ field, inputId, value, onChange }) => (
      <input
        id={inputId}
        type="number"
        className={styles.input}
        value={value ?? ""}
        placeholder={field?.hint || ""}
        onChange={(event) => onChange(event.target.value)}
      />
    ),

    date: ({ field, inputId, value, onChange }) => (
      <input
        id={inputId}
        type="date"
        className={styles.input}
        value={value ?? ""}
        placeholder={field?.hint || ""}
        onChange={(event) => onChange(event.target.value)}
      />
    ),

    datetime: ({ field, inputId, value, onChange }) => (
      <input
        id={inputId}
        type="datetime-local"
        className={styles.input}
        value={value ?? ""}
        placeholder={field?.hint || ""}
        onChange={(event) => onChange(event.target.value)}
      />
    ),

    _fallback: ({ field, inputId, value, onChange, type }) => (
      <input
        id={inputId}
        type="text"
        className={styles.input}
        value={value ?? ""}
        placeholder={field?.hint || ""}
        onChange={(event) => onChange(event.target.value)}
      />
    ),

    "yes-no": ({ inputId, value, onChange }) => (
      <div className={styles.radioGroup}>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name={inputId}
            value="yes"
            checked={value === true}
            onChange={() => onChange(true)}
          />
          <span>Yes</span>
        </label>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name={inputId}
            value="no"
            checked={value === false}
            onChange={() => onChange(false)}
          />
          <span>No</span>
        </label>
      </div>
    ),
    multiple_choice: ({ options = [], inputId, value, onChange }) => {
      if (!options.length) return null;
      return (
        <div className={styles.radioGroup}>
          {options.map((option) => {
            const optionValue =
              option?.value === undefined || option?.value === null ? "" : option.value;
            const optionLabel = option?.label ?? String(optionValue);
            const isChecked = String(value ?? "") === String(optionValue ?? "");
            return (
              <label key={`${inputId}-${optionValue}`} className={styles.radioLabel}>
                <input
                  type="radio"
                  name={inputId}
                  value={String(optionValue ?? "")}
                  checked={isChecked}
                  onChange={() => onChange(optionValue)}
                />
                <span>{optionLabel}</span>
              </label>
            );
          })}
        </div>
      );
    },
    file: ({
      field,
      inputId,
      value,
      onChange,
      submissionId,
      fieldKey,
      handleFileRemove: removeFile,
    }) => {
      const selectedFiles = Array.isArray(value) ? value : [];
      const isMultiple = Boolean(field?.multiple || field?.allow_multiple || field?.is_multiple);

      return (
        <>
          <input
            id={inputId}
            type="file"
            className={styles.input}
            onChange={(event) => onChange(Array.from(event.target.files || []))}
            multiple={isMultiple}
          />
          {selectedFiles.length > 0 && (
            <ul className={styles.fileList}>
              {selectedFiles.map((file, index) => (
                <li key={`${file.name}-${index}`} className={styles.fileItem}>
                  <span>{file.name}</span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeFile(submissionId, fieldKey, index)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      );
    },
    _fallback: ({ inputId, value, onChange, type }) => {
      if (!warnedTypesRef.current.has(type)) {
        console.warn(
          "RequestedInformationSection: Unsupported field type detected, falling back to text input:",
          type,
        );
        warnedTypesRef.current.add(type);
      }
      return (
        <input
          id={inputId}
          type="text"
          className={styles.input}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    },
  };

  const renderFieldInput = (field, submissionId) => {
    const fieldKey = getFieldKey(field);
    if (!fieldKey) return null;
    const normalizedType = normalizeType(field?.type);
    const inputId = `${submissionId}-${fieldKey}`;
    const currentValue = formValues[submissionId]?.[fieldKey];
    const options = normalizeFieldOptions(field?.options);

    const renderer = fieldRenderers[normalizedType] || fieldRenderers._fallback;
    return renderer({
      field,
      submissionId,
      fieldKey,
      inputId,
      value: currentValue,
      options,
      onChange: (nextValue) => handleFieldChange(submissionId, fieldKey, nextValue),
      handleFileRemove,
      type: normalizedType,
    });
  };

  if (!requestedInformation?.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyContent}>
          <p className={styles.emptyTitle}>{t("requestedInfo.emptyTitle")}</p>
          <p className={styles.emptySubtitle}>{t("requestedInfo.emptySubtitle")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      {requestedInformation.map((submission) => {
        const submissionId = getSubmissionId(submission);
        const fields = submission?.form_fields || [];
        const isSubmitting = Boolean(submitting[submissionId]);
        if (!submissionId) return null;

        const hasMissingRequiredOptions = fields.some((field) => {
          const fieldType = normalizeType(field?.type);
          if (fieldType !== "multiple_choice" || !field?.is_required) return false;
          const options = normalizeFieldOptions(field?.options);
          return options.length === 0;
        });

        return (
          <div key={submissionId} className={styles.card}>
            <div className={styles.cardHeader}>
              {submission?.message && <p className={styles.message}>{submission.message}</p>}
              <div className={styles.cardMeta}>
                {submission?.created_at && (
                  <span>Created: {formatDate(submission.created_at) || submission.created_at}</span>
                )}
                {submission?.due_at && (
                  <span>Due: {formatDate(submission.due_at) || submission.due_at}</span>
                )}
              </div>
            </div>
            {fields.length > 0 && (
              <div className={styles.fields}>
                {fields.map((field) => {
                  const fieldKey = getFieldKey(field);
                  if (!fieldKey) return null;
                  const fieldType = normalizeType(field?.type);
                  const errorKey = `${submissionId}-${fieldKey}`;
                  const options = normalizeFieldOptions(field?.options);
                  const showMissingOptions =
                    fieldType === "multiple_choice" && options.length === 0;

                  return (
                    <div key={fieldKey} className={styles.field}>
                      <label className={styles.label} htmlFor={`${submissionId}-${fieldKey}`}>
                        <span>{field?.label || "Field"}</span>
                        {field?.is_required && <span className={styles.required}>*</span>}
                      </label>
                      {/* {field?.hint && <span className={styles.helper}>{field.hint}</span>} */}
                      {showMissingOptions && (
                        <span className={styles.missingOptions}>No options provided.</span>
                      )}
                      {renderFieldInput(field, submissionId)}
                      {errors[errorKey] && (
                        <span className={styles.error}>This field is required.</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className={styles.actions}>
              <button
                type="button"
                // className={styles.button}
                className={
                  "bg-primary text-white rounded-xl px-6 py-2 mt-2 w-fit hover:bg-[#123A64] transition-all self-end cursor-pointer"
                }
                onClick={() => handleSubmit(submission)}
                disabled={isSubmitting || hasMissingRequiredOptions || !fields.length}
              >
                {isSubmitting ? t("requestedInfo.sending") : t("requestedInfo.send")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RequestedInformationSection;
