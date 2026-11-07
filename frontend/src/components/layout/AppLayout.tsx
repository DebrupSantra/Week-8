import { useCallback, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  CheckSquare2,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { useToastStore } from "../../store/toastStore";
import { getErrorMessage } from "../../utils/errors";
import { useTaskRealtime } from "../../hooks/useTaskRealtime";
import type { TaskRealtimeEvent } from "../../types/api";

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/board", label: "My tasks", icon: CheckSquare2 },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const showToast = useToastStore((state) => state.show);
  const navigate = useNavigate();

  const handleRealtimeEvent = useCallback((event: TaskRealtimeEvent) => {
    window.dispatchEvent(new CustomEvent("taskflow:task-event", { detail: event }));
    if (event.changedBy !== user?.email) {
      showToast("A task was updated in your workspace.");
    }
  }, [showToast, user?.email]);

  useTaskRealtime(handleRealtimeEvent);

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      showToast(getErrorMessage(error, "Could not end the server session."), "error");
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <CheckSquare2 size={20} />
            </div>
            <span className="font-semibold tracking-tight">Taskflow</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="max-w-48 truncate text-xs text-slate-500 dark:text-slate-400">
                {user?.email}
              </p>
            </div>
            <button
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => void handleLogout()}
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside
          className={`${
            menuOpen ? "block" : "hidden"
          } fixed inset-x-0 top-16 z-20 border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:bg-transparent lg:p-5 dark:lg:bg-transparent`}
        >
          <nav aria-label="Main navigation" className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 hidden rounded-2xl bg-indigo-600 p-4 text-white lg:block">
            <p className="text-sm font-semibold">Make progress visible</p>
            <p className="mt-1 text-xs leading-5 text-indigo-100">
              Keep work moving with clear priorities and due dates.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
