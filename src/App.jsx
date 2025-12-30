import React from "react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/context/AuthContext";
import { LocaleChangeProvider } from "@/context/LocaleChangeContext";
import AppRoutes from "@/routes/AppRoutes";
import "./App.scss";
import SplashScreen from "@/components/SplashScreen";

export default function App() {
  return (
    <AuthProvider>
      <LocaleChangeProvider>
        <Toaster position="top-center" />
        <SplashScreen />
        <RouterProvider router={AppRoutes} />
      </LocaleChangeProvider>
    </AuthProvider>
  );
}
