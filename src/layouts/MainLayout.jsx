import React, { useContext, useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ChatBot from "@/components/HomePage/Chat";
import { Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import BiometricPrompt from "@/components/BiometricPrompt";
import Hypered from "@/utils/hyperedBridge";

export default function MainLayout() {
  const location = useLocation();
  const { user, loading } = useContext(AuthContext);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [isInApp, setIsInApp] = useState(false);
  const [isAppChecked, setIsAppChecked] = useState(false);

  // Pages where Navbar/Footer/ChatBot should be hidden
  const hideOn = ["/ai", "/chat"];
  const shouldHideNavbar = hideOn.some((seg) => location.pathname.endsWith(seg));
  const shouldHideFooter = hideOn.some((seg) => location.pathname.endsWith(seg));
  const shouldHideChatBot = shouldHideNavbar; // نفس الشرط

  useEffect(() => {
    Hypered.isInApp()
      .then((val) => setIsInApp(Boolean(val)))
      .catch(() => setIsInApp(false))
      .finally(() => setIsAppChecked(true));
  }, []);

  useEffect(() => {
    const handled =
      typeof window !== "undefined" ? sessionStorage.getItem("biometric_prompt_handled") : null;

    if (!loading && isAppChecked && isInApp && user && !handled) {
      setShowBiometricPrompt(true);
    }

    if (!user || !isInApp) {
      setShowBiometricPrompt(false);
    }
  }, [isAppChecked, isInApp, loading, user]);

  const handleBiometricDismiss = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("biometric_prompt_handled", "true");
    }
    setShowBiometricPrompt(false);
  };

  const handleBiometricActivated = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("biometric_prompt_handled", "true");
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col  overflow-hidden ">
        {/* Navbar */}
        {!shouldHideNavbar && <Navbar />}

        {/* Page Content */}
        <main className="container">
          <Outlet />
        </main>

        {/* ChatBot only if user is subscribed + not in ai/chat */}
        {/* {user?.is_subscribed && !shouldHideChatBot && <ChatBot />} */}

        {/* Footer */}
        {/* {!shouldHideFooter && <Footer />} */}
      </div>

      {showBiometricPrompt && (
        <BiometricPrompt onClose={handleBiometricDismiss} onActivate={handleBiometricActivated} />
      )}
    </>
  );
}
