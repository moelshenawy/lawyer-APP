import React, { useEffect, useRef, useState } from "react";
import { HeadProvider, Meta, Title } from "react-head";
import { useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import CalendarIcon from "@/assets/icons/Calendar";
import LocationIcon from "@/assets/icons/Location";
import axios from "axios";
import Skeleton from "@/components/Skeleton";
import styles from "./CaseAnalysis.module.scss";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL ||
    "https://fawaz-law-firm.apphub.my.id/api").replace(/\/$/, "");

const clamp100 = (n) => Math.max(0, Math.min(100, Number(n) || 0));

const getUserToken = () =>
  typeof window !== "undefined"
    ? window.localStorage.getItem("access_token")
    : null;

const isAxiosCanceled = (e) =>
  axios.isCancel?.(e) || e?.code === "ERR_CANCELED" || e?.name === "CanceledError";

import { useTranslation } from "react-i18next";

const CaseAnalysis = () => {
  const { t } = useTranslation("orders");
  const { lng, id } = useParams();
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";

  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);

  // ✅ ensures only the latest request can update state (fixes “no data while pending”)
  const requestSeq = useRef(0);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setAnalysis(null);
      return;
    }

    const controller = new AbortController();
    const seq = ++requestSeq.current; // this request id

    // make sure skeleton shows immediately on id change
    setLoading(true);

    const fetchAnalysis = async () => {
      try {
        const token = getUserToken();

        const res = await axios.get(`${API_BASE}/user/orders/${id}/case-analysis`, {
          signal: controller.signal,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            Accept: "application/json",
          },
        });

        // ignore if not the latest request anymore
        if (seq !== requestSeq.current) return;

        if (res.data?.success) {
          setAnalysis(res.data.data?.ai_analysis || null);
        } else {
          setAnalysis(null);
        }
      } catch (e) {
        if (seq !== requestSeq.current) return;
        if (!isAxiosCanceled(e)) {
          console.error("Case analysis error:", e);
          setAnalysis(null);
        }
      } finally {
        // ✅ only latest request can stop loading
        if (seq === requestSeq.current) {
          setLoading(false);
        }
      }
    };

    fetchAnalysis();
    return () => controller.abort();
  }, [id]);

  /* =========================
     Fallbacks (UI SAFE)
  ========================= */
  const successRate = clamp100(analysis?.success_percentage);
  const riskRate = clamp100(analysis?.risk_percentage);

  const strengths = analysis?.strength_points || [];
  const weaknesses = analysis?.weak_points || [];
  const recommendations = analysis?.lawyer_recommendations || [];

  // keep title as-is style-wise, just use api if present
  const analysisTitle = analysis?.case_title || "تحليل القضية";

  return (
    <>
      <HeadProvider>
        <Title>{analysisTitle}</Title>
        <Meta name="description" content={t("analysisSeoDescription", "تحليل القضية")} />
      </HeadProvider>

      <section className={styles.page} dir={dir}>
        <PageHeader title={analysisTitle} />

        {loading ? (
          // ✅ skeleton for ALL blocks (so UI never shows “no data” while pending)
          <div className="mt-4 flex flex-col gap-6">
            {/* rates row skeleton */}
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <Skeleton variant="text" width="40%" height={24} />
              <Skeleton variant="text" width="40%" height={24} />
            </div>

            {/* progress skeleton */}
            <Skeleton variant="rect" height={12} radius={6} />

            {/* strengths skeleton */}
            <div className="flex flex-col gap-4">
              <Skeleton variant="text" width="30%" height={28} />
              <div className="flex flex-col gap-3">
                <Skeleton variant="rect" height={80} radius={12} />
                <Skeleton variant="rect" height={80} radius={12} />
                <Skeleton variant="rect" height={80} radius={12} />
              </div>
            </div>

            {/* weaknesses skeleton */}
            <div className="flex flex-col gap-4">
              <Skeleton variant="text" width="30%" height={28} />
              <div className="flex flex-col gap-3">
                <Skeleton variant="rect" height={80} radius={12} />
                <Skeleton variant="rect" height={80} radius={12} />
                <Skeleton variant="rect" height={80} radius={12} />
              </div>
            </div>

            {/* similar-cases stats skeleton */}
            <div className="flex flex-col gap-4">
              <Skeleton variant="text" width="40%" height={28} />
              <Skeleton variant="rect" height={70} radius={12} />
            </div>

            {/* recommendations skeleton */}
            <div className="flex flex-col gap-4">
              <Skeleton variant="text" width="40%" height={28} />
              <Skeleton variant="rect" height={120} radius={12} />
            </div>

            {/* similar case card skeleton */}
            <div className="flex flex-col gap-4">
              <Skeleton variant="text" width="30%" height={28} />
              <Skeleton variant="rect" height={160} radius={12} />
            </div>
          </div>
        ) : (
          <>
            {/* نسب النجاح / المخاطرة */}
            <div className={styles.rateRow}>
              <div className={`${styles.rateItem} ${styles.rateItemReverse}`}>
                <span>نسبة نجاح</span>
                <span className={`${styles.dot} ${styles.dotSuccess}`} />
              </div>

              <div className={styles.rateItem}>
                <span className={`${styles.dot} ${styles.dotRisk}`} />
                <span>نسبة المخاطرة</span>
              </div>
            </div>

            {/* Progress */}
            <div className={styles.progressTrack} style={{ "--risk": `${riskRate}%` }}>
              <div className={styles.progressRisk} />
            </div>

            {/* نقاط القوة */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>نقاط القوة</h2>

              {strengths.map((item, idx) => (
                <div className={`${styles.pointCard} ${styles.pointSuccess}`} key={idx}>
                  <span className={styles.bullet}>{successRate}%</span>
                  <span>{item}</span>
                </div>
              ))}

              {/* show empty only after loading finished */}
              {strengths.length === 0 && (
                <div className="text-start text-sm text-gray-400 italic">
                  لا توجد نقاط قوة متوفرة
                </div>
              )}
            </section>

            {/* نقاط الضعف */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>نقاط الضعف</h2>

              {weaknesses.map((item, idx) => (
                <div className={`${styles.pointCard} ${styles.pointRisk}`} key={idx}>
                  <span className={styles.bullet}>{riskRate}%</span>
                  <span>{item}</span>
                </div>
              ))}

              {weaknesses.length === 0 && (
                <div className="text-start text-sm text-gray-400 italic">
                  لا توجد نقاط ضعف متوفرة
                </div>
              )}
            </section>

            {/* تحليل للقضايا المشابهة (Static UI) */}
            {/* <section className={styles.section}>
              <h2 className={styles.sectionTitle}>تحليل للقضايا المشابهة</h2>
              <div className={styles.statsCard}>
                <div className={styles.statsLabels}>
                  <span>عدد الجلسات المعتادة</span>
                  <span>متوسط مدة القضية</span>
                </div>
                <div className={styles.statsValues}>
                  <span>9 جلسات</span>
                  <span>7 شهور</span>
                </div>
              </div>
            </section> */}

            {/* توصيات */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>توصيات للمحامي</h2>
              <div className={styles.recommendCard}>
                {recommendations.map((item, idx) => (
                  <div className={styles.recommendItem} key={idx}>
                    <span className={styles.bullet}>•</span>
                    <span>{item}</span>
                  </div>
                ))}

                {recommendations.length === 0 && (
                  <div className="text-start text-sm text-gray-400 italic px-4">
                    لا توجد توصيات متوفرة
                  </div>
                )}
              </div>
            </section>

            {/* قضايا مشابهة (Static) */}
            {/* <section className={styles.section}>
              <h2 className={styles.sectionTitle}>قضايا مشابهة</h2>

              <div className={styles.caseCard}>
                <div className={styles.caseRow}>
                  <div className={styles.caseItem}>
                    <img src="/assets/icons/justice-scale.svg" alt="" />
                    <span>1446/12/345 هـ/م</span>
                  </div>

                  <div className={styles.caseItem}>
                    <LocationIcon size={16} />
                    <span>المحكمة الجزائية</span>
                  </div>
                </div>

                <div className={styles.caseRow}>
                  <div className={styles.caseItem}>
                    <img src="/assets/icons/case.svg" alt="" />
                    <span>قضية جنائية</span>
                  </div>

                  <div className={styles.caseItem}>
                    <CalendarIcon size={16} />
                    <span>10/04/2025</span>
                  </div>
                </div>

                <div className={`bg-primary ${styles.caseFooter}`}>تم صدور حكم ابتدائي</div>
              </div>
            </section> */}
          </>
        )}
      </section>
    </>
  );
};

export default CaseAnalysis;

// import React from "react";
// import { HeadProvider, Meta, Title } from "react-head";
// import { useParams } from "react-router-dom";
// import PageHeader from "@/components/common/PageHeader";
// import CalendarIcon from "@/assets/icons/Calendar";
// import LocationIcon from "@/assets/icons/Location";
// import styles from "./CaseAnalysis.module.scss";

// const clamp100 = (n) => Math.max(0, Math.min(100, Number(n) || 0));

// const CaseAnalysis = () => {
//   const { lng } = useParams();
//   const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";

//   // دي اللي المفروض ترجع من الـ API (مثال: 20)
//   const weaknessRate = 20;

//   // نقاط القوة = الباقي من 100
//   const strengthRate = clamp100(100 - weaknessRate);

//   // (اختياري) لو حابب تفضل بنفس أسماء النجاح/المخاطرة في الـ UI:
//   const successRate = strengthRate;
//   const riskRate = weaknessRate;

//   const analysisTitle = "تحليل قضية تصالح";

//   const strengths = ["مستندات قوية."];
//   const weaknesses = ["عدم اتاحة الشهود"];
//   const recommendations = ["تجهيز مستند إضافي", "التركيز على الشهود", "احتمال طلب خبير فني"];

//   return (
//     <>
//       <HeadProvider>
//         <Title>{analysisTitle}</Title>
//         <Meta name="description" content="تحليل القضية" />
//       </HeadProvider>

//       <section className={styles.page} dir={dir}>
//         <PageHeader title={analysisTitle} />

//         <div className={styles.rateRow}>
//           <div className={`${styles.rateItem} ${styles.rateItemReverse}`}>
//             <span>نسبة نجاح</span>
//             <span className={`${styles.dot} ${styles.dotSuccess}`} />
//           </div>
//           <div className={styles.rateItem}>
//             <span className={`${styles.dot} ${styles.dotRisk}`} />
//             <span>نسبة المخاطرة</span>
//           </div>
//         </div>

//         {/* المخاطرة = الضعف */}
//         <div className={styles.progressTrack} style={{ "--risk": `${riskRate}%` }}>
//           <div className={styles.progressRisk} />
//         </div>

//         <section className={styles.section}>
//           <h2 className={styles.sectionTitle}>نقاط القوة</h2>
//           {strengths.map((item) => (
//             <div className={`${styles.pointCard} ${styles.pointSuccess}`} key={item}>
//               {/* هنا بدل • */}
//               <span className={styles.bullet}>{successRate}%</span>
//               <span>{item}</span>
//             </div>
//           ))}
//         </section>

//         <section className={styles.section}>
//           <h2 className={styles.sectionTitle}>نقاط الضعف</h2>
//           {weaknesses.map((item) => (
//             <div className={`${styles.pointCard} ${styles.pointRisk}`} key={item}>
//               <span className={styles.bullet}>{riskRate}%</span>
//               <span>{item}</span>
//             </div>
//           ))}
//         </section>

//         <section className={styles.section}>
//           <h2 className={styles.sectionTitle}>تحليل للقضايا المشابهة</h2>
//           <div className={styles.statsCard}>
//             <div className={styles.statsLabels}>
//               <span>عدد الجلسات المعتادة</span>
//               <span>متوسط مدة القضية</span>
//             </div>
//             <div className={styles.statsValues}>
//               <span>9 جلسات</span>
//               <span>7 شهور</span>
//             </div>
//           </div>
//         </section>

//         <section className={styles.section}>
//           <h2 className={styles.sectionTitle}>توصيات للمحامي</h2>
//           <div className={styles.recommendCard}>
//             {recommendations.map((item) => (
//               <div className={styles.recommendItem} key={item}>
//                 <span className={styles.bullet}>•</span>
//                 <span>{item}</span>
//               </div>
//             ))}
//           </div>
//         </section>

//         <section className={styles.section}>
//           <h2 className={styles.sectionTitle}>قضايا مشابهة</h2>
//           <div className={styles.caseCard}>
//             <div className={styles.caseRow}>
//               <div className={styles.caseItem}>
//                 <img src="/assets/icons/justice-scale.svg" alt="" />
//                 <span>1446/12/345 هـ/م</span>
//               </div>
//               <div className={styles.caseItem}>
//                 <LocationIcon size={16} />
//                 <span>المحكمة الجزائية</span>
//               </div>
//             </div>
//             <div className={styles.caseRow}>
//               <div className={styles.caseItem}>
//                 <img src="/assets/icons/case.svg" alt="" />
//                 <span>قضية جنائية</span>
//               </div>
//               <div className={styles.caseItem}>
//                 <CalendarIcon size={16} />
//                 <span>10/04/2025</span>
//               </div>
//             </div>
//             <div className={`bg-primary ${styles.caseFooter}`}>تم صدور حكم ابتدائي</div>
//           </div>
//         </section>

//         {/* <button type="button" className={styles.fab} aria-label="التحليل">
//           <img src="/assets/icons/justice-bold.svg" alt="" />
//         </button> */}
//       </section>
//     </>
//   );
// };

// export default CaseAnalysis;