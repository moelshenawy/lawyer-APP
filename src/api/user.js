import axiosClient from "./axiosClient";

export const getUserProfile = () => axiosClient.get("/user/profile");
export const getAccount = () => axiosClient.get("/client/account");
export const updateUserProfile = (data) => axiosClient.post("/client/account/update-info", data);
export const getSubscriptionPlans = () => axiosClient.get("/client/info/subscription-plans");
export const unsubscribeAccount = () => axiosClient.post("/client/account/unsubscribe");
export const subscribeAccount = (subscriptionPlanId) =>
  axiosClient.post("/client/account/subscribe", {
    subscription_plan_id: subscriptionPlanId,
  });
export const deleteAccount = () => axiosClient.delete("/client/account");
