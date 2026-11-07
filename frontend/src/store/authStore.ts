import axios from "axios";
import { create } from "zustand";
import type { AuthResponse, User } from "../types/api";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthState = {
  accessToken: string | null;
  user: User | null;
  status: AuthStatus;
  initializationError: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  refresh: () => Promise<string>;
  logout: () => Promise<void>;
  setSession: (session: AuthResponse) => void;
  clearSession: () => void;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
const authClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

function applySession(session: AuthResponse) {
  useAuthStore.getState().setSession(session);
}

async function requestSessionRefresh(): Promise<AuthResponse> {
  const response = await authClient.post<{ data: AuthResponse }>("/auth/refresh");
  return response.data.data;
}

let initializationRequest: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: "loading",
  initializationError: null,
  setSession: (session) =>
    set({
      accessToken: session.accessToken,
      user: session.user,
      status: "authenticated",
      initializationError: null,
    }),
  clearSession: () =>
    set({ accessToken: null, user: null, status: "anonymous", initializationError: null }),
  initialize: () => {
    if (initializationRequest) {
      return initializationRequest;
    }
    initializationRequest = requestSessionRefresh()
      .then(applySession)
      .catch((error: unknown) => {
        if (useAuthStore.getState().status === "authenticated") {
          return;
        }
        const isExpiredSession =
          axios.isAxiosError(error) && error.response?.status === 401;
        const initializationError = isExpiredSession
          ? null
          : "Could not reach the application server. Check your connection and try again.";
        set({
          accessToken: null,
          user: null,
          status: "anonymous",
          initializationError,
        });
      })
      .finally(() => {
        initializationRequest = null;
      });
    return initializationRequest;
  },
  login: async (email, password) => {
    const response = await authClient.post<{ data: AuthResponse }>("/auth/login", {
      email,
      password,
    });
    applySession(response.data.data);
  },
  register: async (fullName, email, password) => {
    const response = await authClient.post<{ data: AuthResponse }>("/auth/register", {
      fullName,
      email,
      password,
    });
    applySession(response.data.data);
  },
  refresh: async () => {
    try {
      const session = await requestSessionRefresh();
      applySession(session);
      return session.accessToken;
    } catch (error) {
      set({ accessToken: null, user: null, status: "anonymous", initializationError: null });
      throw error;
    }
  },
  logout: async () => {
    try {
      await authClient.post("/auth/logout");
    } finally {
      set({ accessToken: null, user: null, status: "anonymous", initializationError: null });
    }
  },
}));
