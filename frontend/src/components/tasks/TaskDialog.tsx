import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { z } from "zod";
import type { Task, TaskInput } from "../../types/api";
import { getErrorMessage } from "../../utils/errors";

const taskSchema = z.object({
  title: z.string().trim().min(1, "Enter a task title.").max(180, "Use 180 characters or fewer."),
  description: z.string().max(5000, "Use 5,000 characters or fewer."),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  dueDate: z.string(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

type Props = {
  task?: Task;
  onClose: () => void;
  onSave: (input: TaskInput) => Promise<void>;
};

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-900";

export function TaskDialog({ task, onClose, onSave }: Props) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "TODO",
      priority: task?.priority ?? "MEDIUM",
      dueDate: task?.dueDate ?? "",
    },
  });

  useEffect(() => {
    reset({
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "TODO",
      priority: task?.priority ?? "MEDIUM",
      dueDate: task?.dueDate ?? "",
    });
  }, [reset, task]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function submit(values: TaskFormValues) {
    setSaveError(null);
    try {
      await onSave({
        ...values,
        description: values.description.trim() || null,
        dueDate: values.dueDate || null,
      });
    } catch (error) {
      setSaveError(getErrorMessage(error, "Could not save this task."));
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-dialog-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="task-dialog-title" className="text-xl font-semibold">
              {task ? "Edit task" : "Create a task"}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add enough detail to make the next step clear.
            </p>
          </div>
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(submit)}>
          <label className="block text-sm font-medium">
            Title
            <input {...register("title")} className={fieldClass} autoFocus />
            {errors.title && <span className="mt-1 block text-xs text-rose-600">{errors.title.message}</span>}
          </label>
          <label className="block text-sm font-medium">
            Description
            <textarea {...register("description")} rows={4} className={fieldClass} />
            {errors.description && (
              <span className="mt-1 block text-xs text-rose-600">{errors.description.message}</span>
            )}
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium">
              Status
              <select {...register("status")} className={fieldClass}>
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Completed</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Priority
              <select {...register("priority")} className={fieldClass}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Due date
              <input {...register("dueDate")} type="date" className={fieldClass} />
            </label>
          </div>
          {saveError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" role="alert">
              {saveError}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : task ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
