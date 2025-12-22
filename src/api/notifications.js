import axiosClient from "./axiosClient";

export const getNotifications = (count = 10) =>
  axiosClient.get("/client/account/notifications", {
    params: { count },
  });
