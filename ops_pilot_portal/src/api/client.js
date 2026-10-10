import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise;

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url ?? "";
    const isAuthRequest = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh",
    ].some((path) => requestUrl.startsWith(path));

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthRequest ||
      !useAuthStore.getState().accessToken
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const currentToken = useAuthStore.getState().accessToken;
    const requestToken = originalRequest.headers?.Authorization?.replace(
      /^Bearer\s+/i,
      "",
    );

    try {
      let accessToken = currentToken;
      if (requestToken === currentToken || !requestToken) {
        refreshPromise ??= api
          .post("/auth/refresh")
          .then((response) => {
            const refreshedToken = response.data.access_token;
            if (!refreshedToken) {
              throw new Error(
                "Token refresh response did not include an access token.",
              );
            }
            useAuthStore.getState().setAccessToken(refreshedToken);
            return refreshedToken;
          })
          .finally(() => {
            refreshPromise = undefined;
          });
        accessToken = await refreshPromise;
      }

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      if ([401, 403].includes(refreshError.response?.status)) {
        useAuthStore.getState().logout();
      }
      return Promise.reject(refreshError);
    }
  },
);

export default api;
