import React from "react";
import styles from "./index.module.scss";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";

const PageHeader = ({ title = "" }) => {
  const navigate = useNavigate();
  const { lng } = useParams();
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";
  const Icon = dir === "rtl" ? IoChevronForwardOutline : IoChevronBackOutline;

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <header className={` ${styles.header}`} onClick={handleBack} dir={dir}>
      <h1 className=" flex items-center gap-1">
        <button type="button" className={styles.arrowBtn} aria-label="رجوع">
          <Icon size={18} className="text-[#0D2B49]" />
        </button>
        <span>{title}</span>
      </h1>
    </header>
  );
};

export default PageHeader;
