import { useState, useEffect, useCallback } from 'react'
import { fetchTasks, createTask, updateTask, deleteTask, type Task } from '../api/tasks'

interface UseTasksResult {
  tasks: Task[]
  loading: boolean
  create: (data: { name: string; command: string; description?: string; intervalDays?: number | null; dayOfWeek?: number | null }) => Promise<void>
  update: (id: number, data: Partial<{ name: string; command: string; description: string | null; intervalDays: number | null; dayOfWeek: number | null }>) => Promise<void>
  remove: (id: number) => Promise<void>
  reload: () => void
}

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetchTasks()
      .then(setTasks)
      .catch((err: unknown) => console.error('[tasks]', err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    async (data: Parameters<typeof createTask>[0]) => {
      await createTask(data)
      load()
    },
    [load],
  )

  const update = useCallback(
    async (id: number, data: Parameters<typeof updateTask>[1]) => {
      await updateTask(id, data)
      load()
    },
    [load],
  )

  const remove = useCallback(
    async (id: number) => {
      await deleteTask(id)
      load()
    },
    [load],
  )

  return { tasks, loading, create, update, remove, reload: load }
}
