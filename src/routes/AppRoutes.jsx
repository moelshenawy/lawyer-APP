import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import MainLayout from "@/layouts/MainLayout";
import Home from "@/pages/Home";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Login from "@/pages/auth/Login";
import Tasks from "@/pages/Tasks";
import Cases from "@/pages/Cases";
import TaskDetails from "@/pages/TaskDetails";
import CaseDetails from "@/pages/CaseDetails";
import CaseAnalysis from "@/pages/CaseAnalysis";
import Ai from "@/pages/Ai";
import Chat from "@/pages/Chat";
import Appointments from "@/pages/Appointments";
import Consultation from "@/pages/Consultation";
import LanguageWrapper from "@/routes/LanguageWrapper";
import Contact from "@/pages/Contact";
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
              { path: "tasks", element: <Tasks /> },
              { path: "cases", element: <Cases /> },
              { path: "task/:id", element: <TaskDetails /> },
              { path: "case/:id", element: <CaseDetails /> },
              { path: "analysis/:id", element: <CaseAnalysis /> },
              { path: "appointments", element: <Appointments /> },
              { path: "consultation", element: <Consultation /> },
              { path: "account-settings", element: <AccountSettingsPage /> },
              { path: "account", element: <AccountSettings /> },
              { path: "ai", element: <Ai /> },
              { path: "chat", element: <Chat /> },
              // { path: "change-password", element: <ChangePassword /> },
              { path: "contact", element: <Contact /> },
              // { path: "service", element: <Service /> },
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
