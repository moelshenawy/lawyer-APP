import React, { useEffect } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import i18n from "@/locales/i18n";

const supported = ["en", "ar", "erdo"];

export default function LanguageWrapper() {
  const { lng } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const next = supported.includes(lng || "") ? lng : i18n.resolvedLanguage || i18n.language || "ar";
    if (lng && !supported.includes(lng)) {
      // If an unsupported lang was in the URL, normalize to fallback
      navigate(`/ar`, { replace: true });
      return;
    }
    i18n.changeLanguage(next);
    // Sync HTML attributes for a11y and direction
    document.documentElement.lang = next;
    document.documentElement.dir = i18n.dir(next);
    // Cache for next time
    try {
      localStorage.setItem("lang", next);
    } catch {}
  }, [lng, navigate]);

  return <Outlet />;
}

