import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import MainLayout from "@/layouts/MainLayout";
import Home from "@/pages/Home";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Orders from "@/pages/Orders";
import OrderDetails from "@/pages/OrderDetails";
import Accounts from "@/pages/Accounts";
import Ai from "@/pages/Ai";
import Chat from "@/pages/Chat";
import Appointments from "@/pages/Appointments";
import Consultation from "@/pages/Consultation";
import LanguageWrapper from "@/routes/LanguageWrapper";
import Packages from "@/pages/Packages";
import ChangePassword from "@/pages/ChangePassword";
import Contact from "@/pages/Contact";
import Verify from "@/pages/auth/Verify";
import Service from "@/pages/Service";
import AccountSettings from "@/pages/AccountSettings";
import ProtectedRoute from "@/routes/ProtectedRoute";
import Payment from "@/pages/Payment";
import Success from "@/pages/Success";
import NotificationPage from "@/pages/Notification";
import HyperedTest from "@/pages/HyperedTest";
import NotFound from "@/pages/NotFound";
import AccountSettingsPage from "@/pages/AccountSettingsPage";

const AppRoutes = createBrowserRouter([
  // Redirect bare root to default language
  { path: "/", element: <Navigate to="/ar" replace /> },
  {
    path: "/:lng",
    element: <LanguageWrapper />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "login", element: <Login /> },
          { path: "forgot-password", element: <ForgotPassword /> },
          { path: "register", element: <Register /> },
          { path: "verify", element: <Verify /> },
          { path: "hypered-test", element: <HyperedTest /> },
          { path: "*", element: <NotFound /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <MainLayout />,
            children: [
              { index: true, element: <Home /> },
              { path: "tasks", element: <Orders /> },
              { path: "/:lng/task/:id", element: <OrderDetails /> },
              { path: "appointments", element: <Appointments /> },
              { path: "consultation", element: <Consultation /> },
              { path: "account-settings", element: <AccountSettingsPage /> },
              { path: "account", element: <AccountSettings /> },
              { path: "ai", element: <Ai /> },
              { path: "chat", element: <Chat /> },
              { path: "packages", element: <Packages /> },
              // { path: "change-password", element: <ChangePassword /> },
              { path: "contact", element: <Contact /> },
              { path: "service", element: <Service /> },
              { path: "payment", element: <Payment /> },
              { path: "success", element: <Success /> },
              { path: "notification", element: <NotificationPage /> },
              { path: "*", element: <NotFound /> },
            ],
          },
        ],
      },
    ],
  },
]);

export default AppRoutes;
