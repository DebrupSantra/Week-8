import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
};

let refreshRequest: Promise<string> | null = null;

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const request = error.config as RetriableRequestConfig | undefined;
    const isAuthEndpoint = /\/auth\/(login|register|refresh|logout)(\?|$)/.test(
      request?.url ?? "",
    );
    if (error.response?.status !== 401 || !request || request._authRetry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    request._authRetry = true;
    refreshRequest ??= useAuthStore.getState().refresh().finally(() => {
      refreshRequest = null;
    });

    try {
      const accessToken = await refreshRequest;
      request.headers.Authorization = `Bearer ${accessToken}`;
      return await apiClient.request(request);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
