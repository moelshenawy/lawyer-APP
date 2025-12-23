import React from "react";
import { HeadProvider, Meta, Title } from "react-head";
import { useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import CalendarIcon from "@/assets/icons/Calendar";
import LocationIcon from "@/assets/icons/Location";
import styles from "./CaseAnalysis.module.scss";

const clamp100 = (n) => Math.max(0, Math.min(100, Number(n) || 0));

const CaseAnalysis = () => {
  const { lng } = useParams();
  const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";

  // دي اللي المفروض ترجع من الـ API (مثال: 20)
  const weaknessRate = 20;

  // نقاط القوة = الباقي من 100
  const strengthRate = clamp100(100 - weaknessRate);

  // (اختياري) لو حابب تفضل بنفس أسماء النجاح/المخاطرة في الـ UI:
  const successRate = strengthRate;
  const riskRate = weaknessRate;

  const analysisTitle = "تحليل قضية تصالح";

  const strengths = ["مستندات قوية."];
  const weaknesses = ["عدم اتاحة الشهود"];
  const recommendations = ["تجهيز مستند إضافي", "التركيز على الشهود", "احتمال طلب خبير فني"];

  return (
    <>
      <HeadProvider>
        <Title>{analysisTitle}</Title>
        <Meta name="description" content="تحليل القضية" />
      </HeadProvider>

      <section className={styles.page} dir={dir}>
        <PageHeader title={analysisTitle} />

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

        {/* المخاطرة = الضعف */}
        <div className={styles.progressTrack} style={{ "--risk": `${riskRate}%` }}>
          <div className={styles.progressRisk} />
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>نقاط القوة</h2>
          {strengths.map((item) => (
            <div className={`${styles.pointCard} ${styles.pointSuccess}`} key={item}>
              {/* هنا بدل • */}
              <span className={styles.bullet}>{successRate}%</span>
              <span>{item}</span>
            </div>
          ))}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>نقاط الضعف</h2>
          {weaknesses.map((item) => (
            <div className={`${styles.pointCard} ${styles.pointRisk}`} key={item}>
              <span className={styles.bullet}>{riskRate}%</span>
              <span>{item}</span>
            </div>
          ))}
        </section>

        <section className={styles.section}>
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
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>توصيات للمحامي</h2>
          <div className={styles.recommendCard}>
            {recommendations.map((item) => (
              <div className={styles.recommendItem} key={item}>
                <span className={styles.bullet}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
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
        </section>

        {/* <button type="button" className={styles.fab} aria-label="التحليل">
          <img src="/assets/icons/justice-bold.svg" alt="" />
        </button> */}
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

// const CaseAnalysis = () => {
//   const { lng } = useParams();
//   const dir = (lng || "ar") === "ar" ? "rtl" : "ltr";

//   const successRate = 82;
//   const riskRate = Math.max(0, Math.min(100, 100 - successRate));
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

//         <div className={styles.progressTrack} style={{ "--risk": `${riskRate}%` }}>
//           <div className={styles.progressRisk} />
//         </div>

//         <section className={styles.section}>
//           <h2 className={styles.sectionTitle}>نقاط القوة</h2>
//           {strengths.map((item) => (
//             <div className={`${styles.pointCard} ${styles.pointSuccess}`} key={item}>
//               <span className={styles.bullet}>•</span>
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
