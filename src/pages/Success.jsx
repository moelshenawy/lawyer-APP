import React, { useMemo, useContext } from "react";
import { HeadProvider, Meta, Title } from "react-head";
import { useLocation, useParams, Link } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import { AuthContext } from "@/context/AuthContext";

const SuccessPage = () => {
  const { lng } = useParams();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const planId = params.get("plan_id");
  const { user } = useContext(AuthContext);
  const planTitle = user?.active_subscription?.plan?.title;

  return (
    <>
      <HeadProvider>
        <Title>مكتب فواز للمحاماة | تم الدفع </Title>

        <Meta name="description" content="تم تفعيل الباقة المختارة بنجاح." />
      </HeadProvider>

      <section className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="container max-w-xl bg-white border border-gray-200 rounded-2xl shadow p-6 text-center space-y-4">
          <div className="flex justify-center">
            <span className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#eaf7ef] text-[#1d7a46] border-8 border-[#eaf7ef]">
              <FiCheckCircle size={56} />
            </span>
          </div>
          <div className="text-3xl font-bold text-[#0D2B49]">تم تفعيل الباقة بنجاح</div>
          <p className="text-[#4D4D4D]">
            الباقة المختارة {planTitle ? `“${planTitle}”` : planId ? `#${planId}` : ""} مفعلة
            حالياً. يمكنك الاستمتاع بكل المزايا الآن.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to={`/${lng || "ar"}/packages`}
              className="px-4 py-2 rounded-lg bg-[#003f6f] text-white font-semibold"
            >
              العودة للباقات
            </Link>
            <Link
              to={`/${lng || "ar"}`}
              className="px-4 py-2 rounded-lg border border-[#003f6f] text-[#003f6f] font-semibold"
            >
              الرئيسية
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default SuccessPage;
