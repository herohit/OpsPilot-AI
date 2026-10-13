import api from "./client";
import { useAuthStore } from "../store/authStore";

const openStream = (url, accessToken, signal) =>
  fetch(url, {
    method: "GET",
    credentials: "include",
    signal,
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${accessToken}`,
    },
  });

export async function streamLogs(filters, { signal, onSnapshot, onLog }) {
  const url = new URL("/logs/stream", api.defaults.baseURL);
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  let accessToken = useAuthStore.getState().accessToken;
  let response = await openStream(url, accessToken, signal);
  if (response.status === 401 && accessToken) {
    let refreshed;
    try {
      refreshed = await api.post("/auth/refresh");
    } catch (refreshError) {
      refreshError.status = refreshError.response?.status;
      if ([401, 403].includes(refreshError.status)) {
        useAuthStore.getState().logout();
      }
      throw refreshError;
    }
    accessToken = refreshed.data.access_token;
    useAuthStore.getState().setAccessToken(accessToken);
    response = await openStream(url, accessToken, signal);
  }

  if (!response.ok) {
    const error = new Error(`Log stream request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  if (!response.body) throw new Error("Streaming response is unavailable.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventName = "message";
  let dataLines = [];

  const dispatchEvent = () => {
    if (!dataLines.length) return;
    const eventData = JSON.parse(dataLines.join("\n"));
    if (eventName === "snapshot") onSnapshot(eventData);
    else if (eventName === "log") onLog(eventData);
    eventName = "message";
    dataLines = [];
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      }
      dispatchEvent();
      boundary = buffer.indexOf("\n\n");
    }
  }
}