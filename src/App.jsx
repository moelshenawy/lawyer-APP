import React from "react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/context/AuthContext";
import AppRoutes from "@/routes/AppRoutes";
import "./App.scss";
import SplashScreen from "@/components/SplashScreen";

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" />
      <SplashScreen />
      <RouterProvider router={AppRoutes} />
    </AuthProvider>
  );
}