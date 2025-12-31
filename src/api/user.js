import axiosClient from "./axiosClient";

export const getUserProfile = () => axiosClient.get("/user/profile");
export const getAccount = () => axiosClient.get("/user/account");
export const updateUserProfile = (data) => axiosClient.post("/user/account/update-info", data);

export const getTasks = () => axiosClient.get("/user/tasks");

export const clockIn = () => axiosClient.post("/user/attendance/clock-in");
export const clockOut = () => axiosClient.post("/user/attendance/clock-out");
export const getAttendanceToday = () => axiosClient.get("/user/attendance/today");

export const deleteAccount = () => axiosClient.delete("/user/account");
