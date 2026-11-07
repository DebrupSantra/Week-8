import { CalendarDays, Mail, UserRound } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">ACCOUNT</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your profile</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Details associated with your account.</p>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            {user?.fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.fullName}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Taskflow member</p>
          </div>
        </div>
        <dl className="mt-8 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2 dark:border-slate-800">
          <div>
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <UserRound size={15} /> Full name
            </dt>
            <dd className="mt-2 text-sm font-medium">{user?.fullName}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Mail size={15} /> Email address
            </dt>
            <dd className="mt-2 text-sm font-medium">{user?.email}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <CalendarDays size={15} /> Joined
            </dt>
            <dd className="mt-2 text-sm font-medium">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          Profile information is managed securely by your account. Passwords are never displayed.
        </p>
      </section>
    </div>
  );
}
