const pendingRequests = new Map();
let requestCounter = 0;

const REPLY_TIMEOUT = 35000;
const FALLBACK_BIOMETRIC_KEY = "hypered_biometric_token";

const BIOMETRIC_MESSAGE = {
  en: "Authenticate to load your saved token",
  ar: "سجل دخولك بالبصمة لسهولة التسجيل",
};

const getCurrentLanguage = () => {
  try {
    const docLang = typeof document !== "undefined" ? document.documentElement.lang : "";
    if (docLang === "ar" || docLang === "en") return docLang;

    if (
      typeof window !== "undefined" &&
      window.location &&
      typeof window.location.pathname === "string"
    ) {
      const [, maybeLng] = window.location.pathname.split("/");
      if (maybeLng === "ar" || maybeLng === "en") return maybeLng;
    }

    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("lang");
      if (stored === "ar" || stored === "en") return stored;
    }
  } catch {}

  return "ar";
};

const debugLog = (...args) => {
  if (typeof console !== "undefined") {
    console.log("[HyperedBridge]", ...args);
  }
};

const hasNativeChannel = () =>
  typeof window !== "undefined" &&
  window.HyperedChannel &&
  typeof window.HyperedChannel.postMessage === "function";

const maskToken = (value) => {
  if (!value) return value;
  const str = String(value);
  if (str.length <= 6) return "***";
  return `${str.slice(0, 3)}***${str.slice(-3)}`;
};

const loggablePayload = (action, payload) => {
  if (!payload) return payload;

  if (action === "loadBiometricToken" && typeof payload === "string") {
    return maskToken(payload);
  }

  if (typeof payload !== "object") return payload;

  if (action === "saveBiometricToken" && "token" in payload) {
    return { ...payload, token: maskToken(payload.token) };
  }

  return payload;
};

const handleResponse = (rawMessage) => {
  let message = rawMessage;

  try {
    message = typeof rawMessage === "string" ? JSON.parse(rawMessage) : rawMessage;
  } catch (err) {
    console.warn("Hypered: failed to parse native message", rawMessage);
    return;
  }

  const { requestId, success = true, error, payload, data } = message || {};

  if (!requestId || !pendingRequests.has(requestId)) {
    debugLog("no pending request for response", { requestId, message });
    return;
  }

  const { resolve, reject, timeoutId, action } = pendingRequests.get(requestId);

  clearTimeout(timeoutId);
  pendingRequests.delete(requestId);

  debugLog("response received", {
    requestId,
    action,
    success,
    error,
    payload: loggablePayload(action, payload ?? data),
  });

  if (success === false || error) {
    reject(error || "Hypered native error");
  } else {
    resolve(payload ?? data);
  }
};

const sendToNative = (action, payload = {}) => {
  return new Promise((resolve, reject) => {
    if (!hasNativeChannel()) {
      debugLog("native channel unavailable", { action });
      reject(new Error("HyperedChannel not available"));
      return;
    }

    const requestId = `hy_${Date.now()}_${requestCounter++}`;
    const shouldTimeout = action !== "saveBiometricToken" && action !== "loadBiometricToken";

    const timeoutId = shouldTimeout
      ? setTimeout(() => {
          pendingRequests.delete(requestId);
          debugLog("request timed out", { action, requestId });
          reject(new Error(`Hypered ${action} timed out`));
        }, REPLY_TIMEOUT)
      : null;

    pendingRequests.set(requestId, {
      resolve,
      reject,
      timeoutId,
      action,
    });

    debugLog("sending to native", {
      action,
      requestId,
      payload: loggablePayload(action, payload),
    });

    try {
      window.HyperedChannel.postMessage(
        JSON.stringify({
          requestId,
          action,
          payload,
        }),
      );
    } catch (err) {
      clearTimeout(timeoutId);
      pendingRequests.delete(requestId);
      debugLog("postMessage failed", { action, requestId, error: err });
      reject(err);
    }
  });
};

const safeSetBiometric = (token) => {
  try {
    localStorage.setItem(FALLBACK_BIOMETRIC_KEY, token);
  } catch (err) {
    console.warn("Hypered: failed to cache biometric token", err);
  }
};

const safeGetBiometric = () => {
  try {
    return localStorage.getItem(FALLBACK_BIOMETRIC_KEY) || "";
  } catch {
    return "";
  }
};

const Hypered = {
  isInApp() {
    if (!hasNativeChannel()) return Promise.resolve(false);

    return sendToNative("isInApp").catch(() => false);
  },

  toast(message) {
    const text = message == null ? "" : String(message);
    return sendToNative("toast", { message: text });
  },

  loginWithGoogle() {
    return sendToNative("loginWithGoogle");
  },

  saveBiometricToken(token) {
    if (!token) {
      return Promise.reject(new Error("Missing biometric token"));
    }

    const trimmedToken = String(token);

    if (!hasNativeChannel()) {
      safeSetBiometric(trimmedToken);
      return Promise.resolve();
    }

    return sendToNative("saveBiometricToken", {
      token: trimmedToken,
      message: BIOMETRIC_MESSAGE[getCurrentLanguage()] || BIOMETRIC_MESSAGE.ar,
    }).then((res) => {
      safeSetBiometric(trimmedToken);
      return res;
    });
  },

  loadBiometricToken() {
    if (!hasNativeChannel()) {
      return Promise.resolve(safeGetBiometric());
    }

    return sendToNative("loadBiometricToken", {
      message: BIOMETRIC_MESSAGE[getCurrentLanguage()] || BIOMETRIC_MESSAGE.ar,
    }).then((token) => {
      if (token) safeSetBiometric(token);
      return token;
    });
  },

  notify({ title, body }) {
    return sendToNative("notify", { title, body });
  },

  __onNativeMessage: handleResponse,
};

if (typeof window !== "undefined") {
  const existing = window.Hypered || {};
  window.Hypered = { ...existing, ...Hypered };
  window.Hypered.__onNativeMessage = handleResponse;
  window.HyperedBridge = { handleResponse };
}

export default Hypered;