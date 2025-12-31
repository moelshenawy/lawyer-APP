import axiosClient from "./axiosClient";

export const getNotifications = (count = 10) =>
  axiosClient.get("/user/account/notifications", {
    params: { count },
  });
