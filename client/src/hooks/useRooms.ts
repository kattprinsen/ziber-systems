import { useState, useEffect, useCallback } from 'react'
import { fetchRooms, createRoom, renameRoom, deleteRoom, type Room } from '../api/rooms'

interface UseRoomsResult {
  rooms: Room[]
  loading: boolean
  create: (name: string) => Promise<void>
  rename: (id: number, name: string) => Promise<void>
  remove: (id: number) => Promise<void>
  reload: () => void
}

export function useRooms(): UseRoomsResult {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetchRooms()
      .then(setRooms)
      .catch((err: unknown) => console.error('[rooms]', err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    async (name: string) => {
      await createRoom(name)
      load()
    },
    [load],
  )

  const rename = useCallback(
    async (id: number, name: string) => {
      await renameRoom(id, name)
      load()
    },
    [load],
  )

  const remove = useCallback(
    async (id: number) => {
      await deleteRoom(id)
      load()
    },
    [load],
  )

  return { rooms, loading, create, rename, remove, reload: load }
}
