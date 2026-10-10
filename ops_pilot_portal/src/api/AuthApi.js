import api from "./client";

export const refreshAccessToken = async () => {
  const response = await api.post("/auth/refresh");

  return response.data.access_token;
};

export const getCurrentUser = async () => {
  const response = await api.get("/users/me");

  return response.data;
};

export const updateCurrentUser = async (userData) => {
  const response = await api.patch("/users/me", userData);

  return response.data;
};
