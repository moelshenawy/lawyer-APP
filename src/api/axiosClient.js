import axios from "axios";

const axiosClient = axios.create({
  // Ensure base URL includes /api to hit the correct path
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://fawaz-law-firm.apphub.my.id/api",
  headers: {
    "Content-Type": "application/json",
  },
});
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      const parts = (window.location.pathname || "").split("/").filter(Boolean);
      const lang = parts[0] || "ar";
      window.history.replaceState({}, "", `/${lang}/login`);
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
