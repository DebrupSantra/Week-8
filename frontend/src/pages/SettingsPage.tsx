import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../store/themeStore";

export function SettingsPage() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">PREFERENCES</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Make your workspace feel right for you.</p>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              {theme === "light" ? <Sun size={19} /> : <Moon size={19} />}
            </span>
            <div>
              <h2 className="font-semibold">Appearance</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Choose a light or dark workspace theme.
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={theme === "dark"}
            aria-label="Dark theme"
            onClick={toggleTheme}
            className={`relative h-7 w-12 rounded-full transition ${theme === "dark" ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${theme === "dark" ? "left-6" : "left-1"}`} />
          </button>
        </div>
        <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Your preference is saved in this browser.
        </p>
      </section>
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold">Session security</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Access tokens are held in memory. Refresh sessions are stored in secure, HttpOnly cookies and are rotated when renewed.
        </p>
      </section>
    </div>
  );
}
