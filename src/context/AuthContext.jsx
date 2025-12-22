import { createContext, useState, useEffect, useCallback } from "react";
import { login as loginApi, logout as logoutApi } from "@/api/auth";
import { getAccount } from "@/api/user";

const normalizeConfig = (config) => {
  if (!config || typeof config !== "object") return null;
  return config;
};

const normalizeClient = (client) => {
  if (!client || typeof client !== "object") return null;

  const activeSubscription =
    client.active_subscription ||
    (Array.isArray(client.subscriptions)
      ? client.subscriptions.find((sub) => sub?.status === "active")
      : null);

  const fallbackSubscribed =
    Boolean(activeSubscription) ||
    (Array.isArray(client.subscriptions)
      ? client.subscriptions.some((sub) => sub?.status === "active")
      : false);

  const isSubscribed = client.is_subscribed ?? client.isSubscribed ?? fallbackSubscribed;

  return {
    ...client,
    active_subscription: activeSubscription || client.active_subscription,
    is_subscribed: Boolean(isSubscribed),
  };
};

const extractAccountData = (res) => {
  const data = res?.data;

  const client = data?.data?.client || data?.client || data?.user || data?.data?.user || data;

  const config = data?.data?.config || data?.config || client?.config || null;

  return { client, config };
};

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem("user");
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      const normalized = normalizeClient(parsed);
      // ✅ تأكد إن config لو موجود يتخزن
      const cfg = normalizeConfig(parsed?.config);
      return normalized ? { ...normalized, config: cfg || normalized.config || null } : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  const fetchAccount = useCallback(async () => {
    try {
      setLoading(true);

      const res = await getAccount();
      const { client, config } = extractAccountData(res);

      const normalizedClient = normalizeClient(client);
      const normalizedConfig = normalizeConfig(config);

      if (normalizedClient) {
        const mergedUser = {
          ...normalizedClient,
          // ✅ هنا الإصلاح: ضيف config جوّا user
          config: normalizedConfig || normalizedClient.config || null,
        };

        setUser(mergedUser);
        localStorage.setItem("user", JSON.stringify(mergedUser));
      }
    } catch (err) {
      console.error("Failed to fetch account", err);
      // keep cached user if available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      localStorage.removeItem("user");
      setLoading(false);
      return;
    }

    fetchAccount();
  }, [fetchAccount]);

  const login = async (email, password) => {
    const res = await loginApi({ email, password });

    localStorage.setItem("access_token", res?.data?.token);

    // ✅ حتى لو login response مش فيه config… fetchAccount هيجيبها
    const client = res?.data?.user || res?.data?.client || res?.data;
    const normalizedClient = normalizeClient(client);

    if (normalizedClient) {
      const mergedUser = { ...normalizedClient, config: normalizedClient.config || null };
      setUser(mergedUser);
      localStorage.setItem("user", JSON.stringify(mergedUser));
    } else {
      setUser(null);
      localStorage.setItem("user", JSON.stringify({}));
    }

    fetchAccount();
  };

  const loginWithToken = (token, userData) => {
    if (token) localStorage.setItem("access_token", token);

    if (userData) {
      const normalizedClient = normalizeClient(userData);
      const cfg = normalizeConfig(userData?.config);

      if (normalizedClient) {
        const mergedUser = { ...normalizedClient, config: cfg || normalizedClient.config || null };
        setUser(mergedUser);
        localStorage.setItem("user", JSON.stringify(mergedUser));
      }
    }

    fetchAccount();
  };

  const logout = async () => {
    let logoutError;
    try {
      await logoutApi();
    } catch (err) {
      console.error("Failed to logout", err);
      logoutError = err;
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      localStorage.removeItem("hypered_biometric_token");
      sessionStorage.removeItem("biometric_prompt_handled");
      sessionStorage.removeItem("hypered_biometric_token");
      setUser(null);
    }
    if (logoutError) throw logoutError;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loginWithToken,
        loading,
        refreshAccount: fetchAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// import { createContext, useState, useEffect, useCallback } from "react";
// import { login as loginApi, logout as logoutApi } from "@/api/auth";
// import { getAccount } from "@/api/user";

// const normalizeClient = (client) => {
//   if (!client || typeof client !== "object") return null;

//   const activeSubscription =
//     client.active_subscription ||
//     (Array.isArray(client.subscriptions)
//       ? client.subscriptions.find((sub) => sub?.status === "active")
//       : null);

//   const fallbackSubscribed =
//     Boolean(activeSubscription) ||
//     (Array.isArray(client.subscriptions)
//       ? client.subscriptions.some((sub) => sub?.status === "active")
//       : false);

//   const isSubscribed = client.is_subscribed ?? client.isSubscribed ?? fallbackSubscribed;

//   return {
//     ...client,
//     active_subscription: activeSubscription || client.active_subscription,
//     is_subscribed: Boolean(isSubscribed),
//   };
// };

// export const AuthContext = createContext();

// export default function AuthProvider({ children }) {
//   const [user, setUser] = useState(() => {
//     try {
//       const cached = localStorage.getItem("user");
//       if (!cached) return null;
//       return normalizeClient(JSON.parse(cached));
//     } catch {
//       return null;
//     }
//   });
//   const [loading, setLoading] = useState(true);

//   const fetchAccount = useCallback(async () => {
//     try {
//       setLoading(true);
//       const res = await getAccount();
//       const client = res?.data?.data?.client || res?.data?.client || res?.data;
//       const normalizedClient = normalizeClient(client);
//       if (normalizedClient) {
//         setUser(normalizedClient);
//         localStorage.setItem("user", JSON.stringify(normalizedClient));
//       }
//     } catch (err) {
//       console.error("Failed to fetch account", err);
//       // keep cached user if available
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     const token = localStorage.getItem("access_token");
//     if (!token) {
//       setUser(null);
//       localStorage.removeItem("user");
//       setLoading(false);
//       return;
//     }

//     fetchAccount();
//   }, [fetchAccount]);

//   const login = async (email, password) => {
//     const res = await loginApi({ email, password });
//     localStorage.setItem("access_token", res.data.token);
//     const client = res?.data?.user || res?.data?.client || res?.data;
//     const normalizedClient = normalizeClient(client);
//     setUser(normalizedClient);
//     localStorage.setItem("user", JSON.stringify(normalizedClient || {}));
//     fetchAccount();
//   };

//   const loginWithToken = (token, userData) => {
//     if (token) {
//       localStorage.setItem("access_token", token);
//     }
//     if (userData) {
//       const normalizedClient = normalizeClient(userData);
//       setUser(normalizedClient);
//       localStorage.setItem("user", JSON.stringify(normalizedClient || {}));
//     }
//     fetchAccount();
//   };

//   const logout = async () => {
//     let logoutError;
//     try {
//       await logoutApi();
//     } catch (err) {
//       console.error("Failed to logout", err);
//       logoutError = err;
//     } finally {
//       localStorage.removeItem("access_token");
//       localStorage.removeItem("user");
//       localStorage.removeItem("hypered_biometric_token");
//       localStorage.removeItem("token");
//       sessionStorage.removeItem("biometric_prompt_handled");
//       sessionStorage.removeItem("hypered_biometric_token");
//       setUser(null);
//     }
//     if (logoutError) throw logoutError;
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout, loginWithToken, loading, refreshAccount: fetchAccount }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }
