import { apiClient } from "./api";
import type {
  ApiEnvelope,
  Comment,
  PageResponse,
  Task,
  TaskFilters,
  TaskInput,
  TaskStatus,
  TaskSummary,
} from "../types/api";

export async function listTasks(
  filters: TaskFilters = {},
  page = 0,
): Promise<PageResponse<Task>> {
  const response = await apiClient.get<ApiEnvelope<PageResponse<Task>>>("/tasks", {
    params: { ...filters, page, size: filters.size ?? 100 },
  });
  return response.data.data;
}

export async function listAllTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const firstPage = await listTasks(filters);
  if (firstPage.totalPages <= 1) {
    return firstPage.items;
  }
  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      listTasks(filters, index + 1),
    ),
  );
  return [...firstPage.items, ...remainingPages.flatMap((page) => page.items)];
}

export async function getTask(id: string): Promise<Task> {
  const response = await apiClient.get<ApiEnvelope<Task>>(`/tasks/${id}`);
  return response.data.data;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const response = await apiClient.post<ApiEnvelope<Task>>("/tasks", input);
  return response.data.data;
}

export async function updateTask(id: string, input: TaskInput): Promise<Task> {
  const response = await apiClient.put<ApiEnvelope<Task>>(`/tasks/${id}`, input);
  return response.data.data;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const response = await apiClient.patch<ApiEnvelope<Task>>(`/tasks/${id}/status`, { status });
  return response.data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}

export async function getTaskComments(id: string): Promise<Comment[]> {
  const response = await apiClient.get<ApiEnvelope<Comment[]>>(`/tasks/${id}/comments`);
  return response.data.data;
}

export async function createTaskComment(id: string, content: string): Promise<Comment> {
  const response = await apiClient.post<ApiEnvelope<Comment>>(`/tasks/${id}/comments`, {
    content,
  });
  return response.data.data;
}

export async function getTaskSummary(): Promise<TaskSummary> {
  const response = await apiClient.get<ApiEnvelope<TaskSummary>>("/tasks/summary");
  return response.data.data;
}
