export function LoadingState({ label = "Loading your workspace" }: { label?: string }) {
  return (
    <div className="grid min-h-48 animate-pulse gap-4 py-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="min-h-44 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mt-6 h-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="mt-3 h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="mt-2 h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}
