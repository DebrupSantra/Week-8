import { create } from "zustand";

export type Theme = "light" | "dark";

type ThemeState = {
  theme: Theme;
  toggleTheme: () => void;
};

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

const savedTheme = localStorage.getItem("task-manager-theme");
const initialTheme: Theme = savedTheme === "dark" ? "dark" : "light";
applyTheme(initialTheme);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("task-manager-theme", theme);
      applyTheme(theme);
      return { theme };
    }),
}));
