import { create } from "zustand";

type Toast = {
  id: number;
  message: string;
  kind: "success" | "error";
};

type ToastState = {
  toast: Toast | null;
  show: (message: string, kind?: Toast["kind"]) => void;
  dismiss: () => void;
};

let timeout: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (message, kind = "success") => {
    if (timeout) {
      clearTimeout(timeout);
    }
    const toast = { id: Date.now(), message, kind };
    set({ toast });
    timeout = setTimeout(() => set({ toast: null }), 3500);
  },
  dismiss: () => set({ toast: null }),
}));
