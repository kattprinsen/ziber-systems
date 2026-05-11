import { useState, useEffect, useCallback } from 'react'
import {
  fetchMyPlants,
  addMyPlant,
  waterMyPlant,
  removeMyPlant,
  type MyPlant,
} from '../api/my-plants'

interface UseMyPlantsResult {
  myPlants: MyPlant[]
  loading: boolean
  error: string | null
  add: (plantId: number, nickname?: string) => Promise<void>
  water: (id: number) => Promise<void>
  remove: (id: number) => Promise<void>
}

export function useMyPlants(): UseMyPlantsResult {
  const [myPlants, setMyPlants] = useState<MyPlant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchMyPlants()
      .then(setMyPlants)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const add = useCallback(
    async (plantId: number, nickname?: string) => {
      await addMyPlant(plantId, nickname)
      load()
    },
    [load],
  )

  const water = useCallback(
    async (id: number) => {
      await waterMyPlant(id)
      load()
    },
    [load],
  )

  const remove = useCallback(
    async (id: number) => {
      await removeMyPlant(id)
      load()
    },
    [load],
  )

  return { myPlants, loading, error, add, water, remove }
}
