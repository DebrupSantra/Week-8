import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CalendarDays, MessageSquareText, Send } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { LoadingState } from "../components/common/LoadingState";
import { getTask, getTaskComments, createTaskComment } from "../services/taskService";
import { useToastStore } from "../store/toastStore";
import type { Comment, Task } from "../types/api";
import type { TaskRealtimeEvent } from "../types/api";
import { formatDate, getErrorMessage } from "../utils/errors";

const priorityClasses = {
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  HIGH: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

export function TaskDetailsPage() {
  const { taskId } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const showToast = useToastStore((state) => state.show);

  useEffect(() => {
    if (!taskId) return;
    let active = true;
    setLoading(true);
    Promise.all([getTask(taskId), getTaskComments(taskId)])
      .then(([taskResult, commentResult]) => {
        if (active) {
          setTask(taskResult);
          setComments(commentResult);
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(getErrorMessage(reason, "Could not load this task."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [taskId]);

  useEffect(() => {
    function handleRealtimeEvent(event: Event) {
      const { detail } = event as CustomEvent<TaskRealtimeEvent>;
      if (!detail || detail.taskId !== taskId) return;
      if (detail.task) setTask(detail.task);
      const receivedComment = detail.comment;
      if (detail.type === "COMMENT_ADDED" && receivedComment) {
        setComments((existing) => existing.some((item) => item.id === receivedComment.id)
          ? existing
          : [...existing, receivedComment]);
      }
    }

    window.addEventListener("taskflow:task-event", handleRealtimeEvent);
    return () => window.removeEventListener("taskflow:task-event", handleRealtimeEvent);
  }, [taskId]);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskId || !content.trim()) return;
    setSubmitting(true);
    try {
      const comment = await createTaskComment(taskId, content.trim());
      setComments((existing) => [...existing, comment]);
      setContent("");
      showToast("Comment added.");
    } catch (reason) {
      showToast(getErrorMessage(reason, "Could not add your comment."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState label="Loading task details" />;
  if (error || !task) {
    return (
      <div>
        <Link to="/board" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
          <ArrowLeft size={16} /> Back to board
        </Link>
        <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300" role="alert">
          {error ?? "Task not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/board" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
        <ArrowLeft size={16} /> Back to board
      </Link>
      <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityClasses[task.priority]}`}>
            {task.priority.toLowerCase()} priority
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {task.status.replace("_", " ").toLowerCase()}
          </span>
        </div>
        <h1 className="mt-4 break-words text-3xl font-semibold tracking-tight">{task.title}</h1>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
          {task.description || "No description provided."}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-5 border-t border-slate-100 pt-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span className="flex items-center gap-2"><CalendarDays size={16} /> Due {formatDate(task.dueDate)}</span>
          <span className="flex items-center gap-2"><MessageSquareText size={16} /> {comments.length} comments</span>
          <span>Updated {new Date(task.updatedAt).toLocaleString()}</span>
        </div>
      </article>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <MessageSquareText size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-semibold">Discussion</h2>
        </div>
        {comments.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            No comments yet. Start the conversation.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold">{comment.authorName}</span>
                  <time className="shrink-0 text-xs text-slate-500 dark:text-slate-400" dateTime={comment.createdAt}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {comment.content}
                </p>
              </li>
            ))}
          </ul>
        )}
        <form className="mt-5 flex items-end gap-3" onSubmit={(event) => void submitComment(event)}>
          <label className="min-w-0 flex-1 text-sm font-medium">
            <span className="sr-only">Write a comment</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={3000}
              rows={2}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
              placeholder="Add to the discussion..."
            />
          </label>
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={15} /> <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </section>
    </div>
  );
}
