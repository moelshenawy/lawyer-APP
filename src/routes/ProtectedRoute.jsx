import React, { useContext } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";

const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  const { lng } = useParams();
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const lang = lng || "ar";

  if (loading) {
    return null;
  }

  if (!token || !user) {
    return <Navigate to={`/${lang}/login`} replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
