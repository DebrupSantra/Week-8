import { Link } from "react-router-dom";
import { CalendarDays, GripVertical, MessageSquareText, Pencil, Trash2 } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import type { Task } from "../../types/api";
import { formatDate } from "../../utils/errors";

type Props = {
  task: Task;
  commentCount?: number;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

const priorityClasses = {
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  HIGH: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

export function TaskCard({ task, commentCount, onEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });
  const dueDate = task.dueDate ? new Date(`${task.dueDate}T00:00:00`) : null;
  const isOverdue = dueDate !== null && dueDate < new Date(new Date().toDateString()) && task.status !== "DONE";

  return (
    <article
      ref={setNodeRef}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition dark:border-slate-800 dark:bg-slate-900 ${
        isDragging ? "z-10 opacity-60 shadow-lg" : "hover:border-indigo-200 hover:shadow-md dark:hover:border-indigo-900"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityClasses[task.priority]}`}>
          {task.priority.toLowerCase()}
        </span>
        <div className="flex items-center">
          <button
            className="cursor-grab rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={`Drag ${task.title} to change status`}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={17} />
          </button>
          <button
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={`Edit ${task.title}`}
            onClick={() => onEdit(task)}
          >
            <Pencil size={15} />
          </button>
          <button
            className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
            aria-label={`Delete ${task.title}`}
            onClick={() => onDelete(task)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <Link
        to={`/tasks/${task.id}`}
        className="mt-2 block font-semibold text-slate-900 hover:text-indigo-700 dark:text-slate-100 dark:hover:text-indigo-300"
      >
        {task.title}
      </Link>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
          {task.description}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-2 text-xs">
        <span className={`flex items-center gap-1.5 ${isOverdue ? "font-medium text-rose-600" : "text-slate-500 dark:text-slate-400"}`}>
          <CalendarDays size={14} />
          {formatDate(task.dueDate)}
        </span>
        {typeof commentCount === "number" && (
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <MessageSquareText size={14} />
            {commentCount}
          </span>
        )}
      </div>
    </article>
  );
}
