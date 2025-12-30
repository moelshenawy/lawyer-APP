import React, { useEffect, useRef } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import i18n from "@/locales/i18n";
import { useLocaleChange } from "@/context/LocaleChangeContext";

const supported = ["en", "ar", "erdo"];

export default function LanguageWrapper() {
  const { lng } = useParams();
  const navigate = useNavigate();
  const { triggerRefetchAll } = useLocaleChange();
  const previousLngRef = useRef(lng);

  useEffect(() => {
    const next = supported.includes(lng || "")
      ? lng
      : i18n.resolvedLanguage || i18n.language || "ar";
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

    // Trigger API refetch if locale actually changed
    if (previousLngRef.current && previousLngRef.current !== lng) {
      triggerRefetchAll();
    }
    previousLngRef.current = lng;
  }, [lng, navigate, triggerRefetchAll]);

  return <Outlet />;
}
