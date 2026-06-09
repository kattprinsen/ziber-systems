// Mirror of WateringEvent in server/src/types.ts — keep in sync if the schema changes.
export interface WateringEvent {
  id: number
  userPlantId: number
  wateredAt: string
  source: 'manual' | 'discord'
  wateredBy: string | null
}

// Mirror of MyPlant in server/src/types.ts — keep in sync if the schema changes.
export interface MyPlant {
  id: number
  plantId: number
  roomId: number | null
  nickname: string | null
  addedAt: string
  lastWateredAt: string | null
  snoozedUntil: string | null
  commonName: string
  latinName: string
  wateringIntervalDays: number
  light: 'low' | 'indirect' | 'bright'
  description: string
}

export async function fetchMyPlants(): Promise<MyPlant[]> {
  const res = await fetch('/api/my-plants')
  if (!res.ok) throw new Error(`Failed to fetch collection: ${res.status}`)
  return res.json() as Promise<MyPlant[]>
}

export async function addMyPlant(plantId: number, roomId: number, nickname?: string): Promise<MyPlant> {
  const res = await fetch('/api/my-plants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plantId, roomId, nickname }),
  })
  if (!res.ok) throw new Error(`Failed to add plant: ${res.status}`)
  return res.json() as Promise<MyPlant>
}

export async function waterMyPlant(id: number): Promise<void> {
  const res = await fetch(`/api/my-plants/${id}/water`, { method: 'PATCH' })
  if (!res.ok) throw new Error(`Failed to mark as watered: ${res.status}`)
}

export async function fetchPlantHistory(id: number): Promise<WateringEvent[]> {
  const res = await fetch(`/api/my-plants/${id}/history`)
  if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`)
  return res.json() as Promise<WateringEvent[]>
}

export async function snoozeMyPlant(id: number): Promise<void> {
  const res = await fetch(`/api/my-plants/${id}/snooze`, { method: 'PATCH' })
  if (!res.ok) throw new Error(`Failed to snooze plant: ${res.status}`)
}

export async function removeMyPlant(id: number): Promise<void> {
  const res = await fetch(`/api/my-plants/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to remove plant: ${res.status}`)
}

export async function updateMyPlantNickname(id: number, nickname: string | null): Promise<void> {
  const res = await fetch(`/api/my-plants/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  })
  if (!res.ok) throw new Error(`Failed to update plant: ${res.status}`)
}

export async function assignRoom(id: number, roomId: number | null): Promise<void> {
  const res = await fetch(`/api/my-plants/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId }),
  })
  if (!res.ok) throw new Error(`Failed to assign room: ${res.status}`)
}
