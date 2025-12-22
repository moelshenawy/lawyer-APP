import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import homeAr from "@/locales/ar/home.json";
import homeEn from "@/locales/en/home.json";
import navbarAr from "@/locales/ar/navbar.json";
import navbarEn from "@/locales/en/navbar.json";
import footerAr from "@/locales/ar/footer.json";
import footerEn from "@/locales/en/footer.json";
import serviceAr from "@/locales/ar/service.json";
import serviceEn from "@/locales/en/service.json";
import appointmentsAr from "@/locales/ar/appointments.json";
import appointmentsEn from "@/locales/en/appointments.json";
import sidebarAr from "@/locales/ar/sidebar.json";
import sidebarEn from "@/locales/en/sidebar.json";
import verifyAr from "@/locales/ar/verify.json";
import verifyEn from "@/locales/en/verify.json";
import ordersAr from "@/locales/ar/orders.json";
import ordersEn from "@/locales/en/orders.json";
import appointmentsCardAr from "@/locales/ar/appointmentsCard.json";
import appointmentsCardEn from "@/locales/en/appointmentsCard.json";
import orderDetailsAr from "@/locales/ar/orderDetails.json";
import orderDetailsEn from "@/locales/en/orderDetails.json";
import consultationAr from "@/locales/ar/consultation.json";
import consultationEn from "@/locales/en/consultation.json";
import consultationFormAr from "@/locales/ar/consultationForm.json";
import consultationFormEn from "@/locales/en/consultationForm.json";
import packagesAr from "@/locales/ar/packages.json";
import packagesEn from "@/locales/en/packages.json";
import paymentAr from "@/locales/ar/payment.json";
import paymentEn from "@/locales/en/payment.json";
import accountSettingsAr from "@/locales/ar/accountSettings.json";
import accountSettingsEn from "@/locales/en/accountSettings.json";
import changePasswordAr from "@/locales/ar/changePassword.json";
import changePasswordEn from "@/locales/en/changePassword.json";
import authLoginAr from "@/locales/ar/authLogin.json";
import authLoginEn from "@/locales/en/authLogin.json";
import authRegisterAr from "@/locales/ar/authRegister.json";
import authRegisterEn from "@/locales/en/authRegister.json";
import authForgotPasswordAr from "@/locales/ar/authForgotPassword.json";
import authForgotPasswordEn from "@/locales/en/authForgotPassword.json";
import contactAr from "@/locales/ar/contact.json";
import contactEn from "@/locales/en/contact.json";
import notFoundAr from "@/locales/ar/notFound.json";
import notFoundEn from "@/locales/en/notFound.json";
import splashAr from "@/locales/ar/splash.json";
import splashEn from "@/locales/en/splash.json";
import chatMobileAr from "@/locales/ar/chatMobile.json";
import chatMobileEn from "@/locales/en/chatMobile.json";
import notificationsAr from "@/locales/ar/notifications.json";
import notificationsEn from "@/locales/en/notifications.json";

i18n.use(initReactI18next).init({
  resources: {
    ar: {
      home: homeAr,
      navbar: navbarAr,
      footer: footerAr,
      service: serviceAr,
      appointments: appointmentsAr,
      sidebar: sidebarAr,
      verify: verifyAr,
      orders: ordersAr,
      appointmentsCard: appointmentsCardAr,
      orderDetails: orderDetailsAr,
      consultation: consultationAr,
      consultationForm: consultationFormAr,
      packages: packagesAr,
      payment: paymentAr,
      accountSettings: accountSettingsAr,
      changePassword: changePasswordAr,
      authLogin: authLoginAr,
      authRegister: authRegisterAr,
      authForgotPassword: authForgotPasswordAr,
      contact: contactAr,
      notFound: notFoundAr,
      splash: splashAr,
      chatMobile: chatMobileAr,
      notifications: notificationsAr,
    },
    en: {
      home: homeEn,
      navbar: navbarEn,
      footer: footerEn,
      service: serviceEn,
      appointments: appointmentsEn,
      sidebar: sidebarEn,
      verify: verifyEn,
      orders: ordersEn,
      appointmentsCard: appointmentsCardEn,
      orderDetails: orderDetailsEn,
      consultation: consultationEn,
      consultationForm: consultationFormEn,
      packages: packagesEn,
      payment: paymentEn,
      accountSettings: accountSettingsEn,
      changePassword: changePasswordEn,
      authLogin: authLoginEn,
      authRegister: authRegisterEn,
      authForgotPassword: authForgotPasswordEn,
      contact: contactEn,
      notFound: notFoundEn,
      splash: splashEn,
      chatMobile: chatMobileEn,
      notifications: notificationsEn,
    },
  },
  fallbackLng: "ar",
  interpolation: { escapeValue: false },
});

export default i18n;
