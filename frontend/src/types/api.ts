export type ApiEnvelope<T> = {
  data: T;
};

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignedUserId: string;
};

export type TaskInput = Pick<Task, "title" | "description" | "status" | "priority" | "dueDate">;

export type PageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  last: boolean;
};

export type TaskSummary = {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
  recentTasks: Task[];
};

export type TaskFilters = {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  sortBy?: "createdAt" | "updatedAt" | "dueDate" | "title";
  direction?: "ASC" | "DESC";
  size?: number;
};

export type Comment = {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: User;
};

export type TaskRealtimeEvent = {
  type:
    | "TASK_CREATED"
    | "TASK_UPDATED"
    | "TASK_STATUS_CHANGED"
    | "TASK_DELETED"
    | "COMMENT_ADDED";
  taskId: string;
  task: Task | null;
  comment: Comment | null;
  changedBy: string;
  occurredAt: string;
};
