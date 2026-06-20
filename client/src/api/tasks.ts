// Mirror of Task / TaskHistoryEntry in server/src/types.ts — keep in sync if schema changes.
export interface Task {
  id: number
  name: string
  command: string
  description: string | null
  intervalDays: number | null
  dayOfWeek: number | null // 0=Sun … 6=Sat; mutually exclusive with intervalDays
  snoozedUntil: string | null
  createdAt: string
}

export interface TaskHistoryEntry {
  id: number
  completedAt: string
  source: 'discord' | 'web'
  displayName: string
}

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks')
  if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`)
  return res.json() as Promise<Task[]>
}

export async function fetchTaskHistory(taskId: number): Promise<TaskHistoryEntry[]> {
  const res = await fetch(`/api/tasks/${taskId}/history`)
  if (!res.ok) throw new Error(`Failed to fetch task history: ${res.status}`)
  return res.json() as Promise<TaskHistoryEntry[]>
}

export async function createTask(data: {
  name: string
  command: string
  description?: string
  intervalDays?: number | null
  dayOfWeek?: number | null
}): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to create task: ${res.status}`)
  return res.json() as Promise<Task>
}

export async function updateTask(
  id: number,
  data: Partial<{ name: string; command: string; description: string | null; intervalDays: number | null; dayOfWeek: number | null }>,
): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to update task: ${res.status}`)
  return res.json() as Promise<Task>
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete task: ${res.status}`)
}
