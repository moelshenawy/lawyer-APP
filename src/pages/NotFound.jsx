import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HeadProvider, Title, Meta } from "react-head";

export default function NotFound() {
  const { lng } = useParams();
  const location = useLocation();
  const { t } = useTranslation("notFound");
  const language = lng || "ar";
  const base = `/${language}`;

  return (
    <>
      <HeadProvider>
        <Title>{t("seoTitle", "صفحة غير موجودة | المحامي")}</Title>
        <Meta name="description" content={t("seoDescription", "Page not found.")} />
      </HeadProvider>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-gray-500">404</p>
              <h1 className="mt-2 text-2xl font-bold text-[#0D2B49] sm:text-3xl">{t("title")}</h1>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                {t("description")}
              </p>
            </div>

            {/* <div className="hidden sm:block rounded-xl bg-[#0D2B49] px-3 py-2 text-white">
            <span className="text-sm font-semibold">Lawyer</span>
          </div> */}
          </div>

          <div className="mt-6 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <span className="font-semibold text-gray-700">{t("requestedLabel")}</span>{" "}
            <span className="break-all">{location.pathname}</span>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to={base}
              className="inline-flex items-center justify-center rounded-2xl bg-[#0D2B49] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#10365e]"
            >
              {t("homeButton")}
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-[#0D2B49] transition-colors hover:bg-gray-50"
            >
              {t("backButton")}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
