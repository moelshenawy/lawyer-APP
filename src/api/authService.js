import axiosClient from "./axiosClient";

const PASSWORD_RESET_BASE = "/user/password/reset";

const buildErrorMessage = (error) => {
  const resp = error?.response?.data;
  if (resp?.message) return resp.message;
  if (resp?.errors && typeof resp.errors === "object") {
    const firstKey = Object.keys(resp.errors)[0];
    const firstVal = firstKey ? resp.errors[firstKey] : null;
    if (Array.isArray(firstVal) && firstVal[0]) return firstVal[0];
    if (typeof firstVal === "string" && firstVal) return firstVal;
  }
  if (Array.isArray(resp?.errors)) return resp.errors.join(" ");
  return error?.message || "Something went wrong";
};

const wrapRequest = async (fn) => {
  try {
    const response = await fn();
    return response;
  } catch (error) {
    throw new Error(buildErrorMessage(error));
  }
};

export const requestPasswordReset = (login, channel = "email") =>
  wrapRequest(() =>
    axiosClient.post(`${PASSWORD_RESET_BASE}/request`, {
      login,
      channel,
    }),
  );

export const resetPassword = (login, code, password, password_confirmation) =>
  wrapRequest(() =>
    axiosClient.post(`${PASSWORD_RESET_BASE}/confirm`, {
      login,
      code,
      password,
      password_confirmation,
    }),
  );
