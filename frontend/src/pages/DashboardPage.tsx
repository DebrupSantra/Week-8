import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, CircleDashed, Clock3, ListTodo } from "lucide-react";
import { Link } from "react-router-dom";
import { LoadingState } from "../components/common/LoadingState";
import { getTaskSummary } from "../services/taskService";
import type { TaskSummary } from "../types/api";
import type { TaskRealtimeEvent } from "../types/api";
import { getErrorMessage } from "../utils/errors";

export function DashboardPage() {
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(() => {
    setError(null);
    return getTaskSummary()
      .then(setSummary)
      .catch((reason: unknown) => {
        setError(getErrorMessage(reason, "Could not load your dashboard."));
      });
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    function handleRealtimeEvent(event: Event) {
      const { detail } = event as CustomEvent<TaskRealtimeEvent>;
      if (detail) void loadSummary();
    }
    window.addEventListener("taskflow:task-event", handleRealtimeEvent);
    return () => window.removeEventListener("taskflow:task-event", handleRealtimeEvent);
  }, [loadSummary]);

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300" role="alert">
        {error}
      </div>
    );
  }
  if (!summary) {
    return <LoadingState />;
  }

  const stats = [
    { label: "Total tasks", value: summary.total, icon: ListTodo, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-300" },
    { label: "Completed", value: summary.completed, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300" },
    { label: "In progress / to do", value: summary.pending, icon: CircleDashed, color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300" },
    { label: "Overdue", value: summary.overdue, icon: Clock3, color: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">OVERVIEW</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Good to see you</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Here is how your work is moving today.
          </p>
        </div>
        <Link
          to="/board"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Open task board <ArrowRight size={16} />
        </Link>
      </div>

      <section aria-label="Task statistics" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
              <span className={`rounded-xl p-2 ${color}`}><Icon size={18} /></span>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
          </article>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Completion progress</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                A snapshot of everything on your board.
              </p>
            </div>
            <span className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
              {Math.round(summary.completionRate)}%
            </span>
          </div>
          <div
            className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            role="progressbar"
            aria-label="Task completion"
            aria-valuenow={Math.round(summary.completionRate)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${Math.min(100, summary.completionRate)}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {summary.completed} of {summary.total} tasks completed
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Recent activity</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Recently updated tasks</p>
            </div>
            <Link to="/board" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
              View all
            </Link>
          </div>
          {summary.recentTasks.length === 0 ? (
            <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              No activity yet. Create your first task to get started.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {summary.recentTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 py-3">
                  <Link to={`/tasks/${task.id}`} className="truncate text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400">
                    {task.title}
                  </Link>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {task.status.replace("_", " ").toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
