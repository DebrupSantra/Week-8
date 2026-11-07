import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus, Search, Trash2 } from "lucide-react";
import { LoadingState } from "../components/common/LoadingState";
import { TaskCard } from "../components/tasks/TaskCard";
import { TaskDialog } from "../components/tasks/TaskDialog";
import {
  createTask,
  deleteTask,
  listAllTasks,
  updateTask,
  updateTaskStatus,
} from "../services/taskService";
import { useToastStore } from "../store/toastStore";
import type {
  Task,
  TaskInput,
  TaskPriority,
  TaskRealtimeEvent,
  TaskStatus,
} from "../types/api";
import { getErrorMessage } from "../utils/errors";

const columns: { status: TaskStatus; label: string; tone: string }[] = [
  { status: "TODO", label: "To do", tone: "bg-slate-400" },
  { status: "IN_PROGRESS", label: "In progress", tone: "bg-amber-500" },
  { status: "DONE", label: "Completed", tone: "bg-emerald-500" },
];

const priorityOptions: { value: TaskPriority | ""; label: string }[] = [
  { value: "", label: "All priorities" },
  { value: "HIGH", label: "High priority" },
  { value: "MEDIUM", label: "Medium priority" },
  { value: "LOW", label: "Low priority" },
];

function isTaskStatus(value: string): value is TaskStatus {
  return value === "TODO" || value === "IN_PROGRESS" || value === "DONE";
}

function TaskColumn({
  status,
  label,
  tone,
  tasks,
  onEdit,
  onDelete,
}: {
  status: TaskStatus;
  label: string;
  tone: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      aria-label={`${label} tasks`}
      className={`min-h-72 rounded-2xl border p-3 transition sm:p-4 ${
        isOver
          ? "border-indigo-300 bg-indigo-50/60 dark:border-indigo-700 dark:bg-indigo-950/20"
          : "border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/50"
      }`}
    >
      <header className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${tone}`} />
          <h2 className="text-sm font-semibold">{label}</h2>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {tasks.length}
        </span>
      </header>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
        ))}
        {tasks.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Drop a task here or add a new one.
          </p>
        )}
      </div>
    </section>
  );
}

export function TaskBoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [sortBy, setSortBy] = useState<"createdAt" | "dueDate">("createdAt");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deleteCandidate, setDeleteCandidate] = useState<Task | null>(null);
  const deferredSearch = useDeferredValue(search.trim());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const showToast = useToastStore((state) => state.show);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    listAllTasks({
      search: deferredSearch || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      sortBy,
      direction: sortBy === "dueDate" ? "ASC" : "DESC",
    })
      .then((result) => {
        if (active) setTasks(result);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(getErrorMessage(error, "Could not load tasks."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [deferredSearch, statusFilter, priorityFilter, sortBy]);

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    const query = deferredSearch.toLowerCase();
    const matchesSearch = !query
      || task.title.toLowerCase().includes(query)
      || task.description?.toLowerCase().includes(query);
    return matchesStatus && matchesPriority && matchesSearch;
  }), [deferredSearch, priorityFilter, statusFilter, tasks]);

  const groupedTasks = useMemo<Record<TaskStatus, Task[]>>(() => ({
    TODO: visibleTasks.filter((task) => task.status === "TODO"),
    IN_PROGRESS: visibleTasks.filter((task) => task.status === "IN_PROGRESS"),
    DONE: visibleTasks.filter((task) => task.status === "DONE"),
  }), [visibleTasks]);

  useEffect(() => {
    function handleRealtimeEvent(event: Event) {
      const { detail } = event as CustomEvent<TaskRealtimeEvent>;
      if (!detail) return;
      if (detail.type === "TASK_DELETED") {
        setTasks((current) => current.filter((task) => task.id !== detail.taskId));
        return;
      }
      const receivedTask = detail.task;
      if (receivedTask) {
        setTasks((current) => {
          const exists = current.some((task) => task.id === detail.taskId);
          return exists
            ? current.map((task) => task.id === detail.taskId ? receivedTask : task)
            : [receivedTask, ...current];
        });
      }
    }

    window.addEventListener("taskflow:task-event", handleRealtimeEvent);
    return () => window.removeEventListener("taskflow:task-event", handleRealtimeEvent);
  }, []);

  async function handleSave(input: TaskInput) {
    try {
      if (editingTask) {
        const updated = await updateTask(editingTask.id, input);
        setTasks((current) => current.map((task) => task.id === updated.id ? updated : task));
        showToast("Task updated.");
      } else {
        const created = await createTask(input);
        setTasks((current) => [created, ...current]);
        showToast("Task created.");
      }
      setDialogOpen(false);
      setEditingTask(undefined);
    } catch (error) {
      showToast(getErrorMessage(error, "Could not save this task."), "error");
      throw error;
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (!event.over) return;
    const status = String(event.over.id);
    if (!isTaskStatus(status)) return;
    const task = tasks.find((item) => item.id === String(event.active.id));
    if (!task || task.status === status) return;

    const nextStatus = status;
    setTasks((current) => current.map((item) =>
      item.id === task.id ? { ...item, status: nextStatus } : item,
    ));
    try {
      const updated = await updateTaskStatus(task.id, nextStatus);
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item));
      showToast(`Moved to ${columns.find((column) => column.status === nextStatus)?.label}.`);
    } catch (error) {
      setTasks((current) => current.map((item) =>
        item.id === task.id && item.status === nextStatus
          ? { ...item, status: task.status }
          : item,
      ));
      showToast(getErrorMessage(error, "Could not update task status."), "error");
    }
  }

  async function handleDelete() {
    if (!deleteCandidate) return;
    try {
      await deleteTask(deleteCandidate.id);
      setTasks((current) => current.filter((task) => task.id !== deleteCandidate.id));
      showToast("Task deleted.");
      setDeleteCandidate(null);
    } catch (error) {
      showToast(getErrorMessage(error, "Could not delete this task."), "error");
    }
  }

  function openCreateDialog() {
    setEditingTask(undefined);
    setDialogOpen(true);
  }

  function openEditDialog(task: Task) {
    setEditingTask(task);
    setDialogOpen(true);
  }

  return (
    <div className="mx-auto max-w-[1320px]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">YOUR WORKSPACE</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Task board</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Organize work, set priorities, and keep things moving.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          onClick={openCreateDialog}
        >
          <Plus size={17} /> New task
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search tasks</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
        <label className="sr-only" htmlFor="status-filter">Filter by status</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as TaskStatus | "")}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">All statuses</option>
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="DONE">Completed</option>
        </select>
        <label className="sr-only" htmlFor="priority-filter">Filter by priority</label>
        <select
          id="priority-filter"
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value as TaskPriority | "")}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="sort-by">Sort tasks</label>
        <select
          id="sort-by"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as "createdAt" | "dueDate")}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="createdAt">Newest first</option>
          <option value="dueDate">Due date</option>
        </select>
      </div>

      {loadError && (
        <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300" role="alert">
          {loadError}
        </p>
      )}
      {loading ? (
        <LoadingState label="Loading tasks" />
      ) : (
        <DndContext sensors={sensors} onDragEnd={(event) => void handleDragEnd(event)}>
          <div className="mt-6 grid items-start gap-4 xl:grid-cols-3">
            {columns.map((column) => (
              <TaskColumn
                key={column.status}
                {...column}
                tasks={groupedTasks[column.status]}
                onEdit={openEditDialog}
                onDelete={setDeleteCandidate}
              />
            ))}
          </div>
        </DndContext>
      )}

      {tasks.length === 0 && !loading && !loadError && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <h2 className="font-semibold">No tasks match these filters</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try a different search or create a task.</p>
          <button className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400" onClick={openCreateDialog}>
            Create a task
          </button>
        </div>
      )}

      {dialogOpen && <TaskDialog task={editingTask} onClose={() => setDialogOpen(false)} onSave={handleSave} />}
      {deleteCandidate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              <Trash2 size={20} />
            </div>
            <h2 id="delete-title" className="mt-4 text-lg font-semibold">Delete this task?</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              “{deleteCandidate.title}” and its comments will be permanently removed.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteCandidate(null)} className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={() => void handleDelete()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                Delete task
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
