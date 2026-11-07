import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useToastStore } from "../../store/toastStore";

export function ToastViewport() {
  const toast = useToastStore((state) => state.toast);
  const dismiss = useToastStore((state) => state.dismiss);

  if (!toast) {
    return null;
  }

  const isError = toast.kind === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm text-white shadow-lg ${
        isError ? "bg-rose-700" : "bg-slate-900"
      }`}
      role={isError ? "alert" : "status"}
    >
      <Icon aria-hidden="true" size={18} />
      <span className="flex-1">{toast.message}</span>
      <button className="rounded p-1 hover:bg-white/10" onClick={dismiss} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
