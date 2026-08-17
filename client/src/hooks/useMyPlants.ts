import { useState, useEffect, useCallback } from 'react'
import {
  fetchMyPlants,
  addMyPlant,
  waterMyPlant,
  snoozeMyPlant,
  removeMyPlant,
  restoreMyPlant,
  updateMyPlantNickname,
  assignRoom,
  type MyPlant,
} from '../api/my-plants'
import { createPlant, updatePlant, type CreatePlantInput } from '../api/plants'

interface UseMyPlantsResult {
  myPlants: MyPlant[]
  loading: boolean
  error: string | null
  add: (plantId: number, roomId: number, nickname?: string) => Promise<void>
  addCustom: (input: CreatePlantInput, roomId: number, nickname?: string) => Promise<void>
  update: (userPlantId: number, plantId: number, plantData: Partial<CreatePlantInput>, nickname: string | null) => Promise<void>
  setRoom: (id: number, roomId: number | null) => Promise<void>
  water: (id: number) => Promise<void>
  snooze: (id: number) => Promise<void>
  remove: (id: number) => Promise<void>
  restore: (id: number) => Promise<void>
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
    async (plantId: number, roomId: number, nickname?: string) => {
      await addMyPlant(plantId, roomId, nickname)
      load()
    },
    [load],
  )

  const addCustom = useCallback(
    async (input: CreatePlantInput, roomId: number, nickname?: string) => {
      const plant = await createPlant(input)
      await addMyPlant(plant.id, roomId, nickname)
      load()
    },
    [load],
  )

  const update = useCallback(
    async (
      userPlantId: number,
      plantId: number,
      plantData: Partial<CreatePlantInput>,
      nickname: string | null,
    ) => {
      await Promise.all([
        updatePlant(plantId, plantData),
        updateMyPlantNickname(userPlantId, nickname),
      ])
      load()
    },
    [load],
  )

  const setRoom = useCallback(
    async (id: number, roomId: number | null) => {
      await assignRoom(id, roomId)
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

  const snooze = useCallback(
    async (id: number) => {
      await snoozeMyPlant(id)
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

  const restore = useCallback(
    async (id: number) => {
      await restoreMyPlant(id)
      load()
    },
    [load],
  )

  return { myPlants, loading, error, add, addCustom, update, setRoom, water, snooze, remove, restore }
}
