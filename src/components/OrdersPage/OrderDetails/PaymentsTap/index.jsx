import React, { useState } from "react";
import styles from "../index.module.scss";
import { IoReceiptOutline } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import stylesEmpty from "../RequestedInformationSection.module.scss";
import { useTranslation } from "react-i18next";

const PaymentsTap = ({ payments }) => {
  const [openInvoices, setOpenInvoices] = useState({});
  const navigate = useNavigate();
  const { lng } = useParams();
  const { t } = useTranslation("orderDetails");

  const toggleInvoice = (index) => {
    setOpenInvoices((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handlePayNow = (payment, e) => {
    e.stopPropagation(); // عشان ما يفتحش/يقفل الكارت بالغلط

    const invoiceId = payment.invoice_id || payment.invoiceId || payment.id;

    if (!invoiceId) {
      toast.error(t("payments.invoiceIdMissing"));
      return;
    }

    const lang = lng || "ar";

    navigate(`/${lang}/payment?context=order&invoice_id=${encodeURIComponent(invoiceId)}`, {
      state: {
        payment, // 👈 نبعت الفاتورة كلها للـ PaymentPage
      },
    });
  };

  if (!payments.length) {
    return (
      <div className={stylesEmpty.empty}>
        <div className={stylesEmpty.emptyContent}>
          <p className={stylesEmpty.emptyTitle}>{t("payments.emptyTitle")}</p>
          <p className={stylesEmpty.emptySubtitle}>{t("payments.emptySubtitle")}</p>
        </div>
      </div>
    );
  }
  return (
    <>
      {payments.map((payment, index) => {
        const isSent = payment.status === "sent";
        return (
          <div
            key={payment.id}
            className={`${styles.invoiceCard} ${openInvoices[index] ? styles.invoiceCardOpen : ""}`}
            onClick={() => toggleInvoice(index)}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[#5F5F5F]">
                <img
                  src="/assets/icons/arrow_down.svg"
                  alt="arrow icon"
                  className={styles.invoiceArrow}
                />
                <IoReceiptOutline size={18} />
              </div>
              <div className="flex flex-col">
                <div className="text-[#5F5F5F] font-bold">{payment.invoice_no}</div>
                <div className={styles.invoiceAmount}>
                  {payment.amount} {payment.currency}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`${styles.invoiceStatus} ${
                    styles[
                      `status${payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}`
                    ]
                  }`}
                >
                  {payment.status_label}
                </div>
              </div>
            </div>

            <div
              className={`${styles.invoiceDetailsWrapper} ${
                openInvoices[index] ? styles.invoiceDetailsOpen : ""
              }`}
            >
              <div className={`${styles.invoiceDetails} ${isSent && styles.sent}`}>
                <div className={styles.invoiceDetailRow}>
                  {t("payments.invoiceNumber")} {payment.invoice_no}
                </div>
                <div className={styles.invoiceDetailRow}>
                  {t("payments.invoiceAmount")} {payment.amount} {payment.currency}
                </div>
                {/* <div className={styles.invoiceDetailRow}>تاريخ الإصدار: {payment.issue_date}</div> */}
                <div className={styles.invoiceDetailRow}>
                  {t("payments.dueDate")} {payment.due_date}
                </div>
                {payment.notes ? (
                  <div className={styles.invoiceDetailRow}>
                    {t("payments.notes")} {payment.notes}
                  </div>
                ) : null}

                {/* زر إدفع الآن لو الفاتورة لسه Pending */}
                {isSent && (
                  <div className="w-[100%] flex">
                    <button
                      type="button"
                      className="ms-auto bg-primary text-white rounded-xl px-6 py-2 mt-3 w-fit hover:bg-[#123A64] transition-all cursor-pointer self-start"
                      onClick={(e) => handlePayNow(payment, e)}
                    >
                      {t("payments.payNow")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default PaymentsTap;
