export interface MyPlant {
  id: number
  plantId: number
  nickname: string | null
  addedAt: string
  lastWateredAt: string | null
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

export async function addMyPlant(plantId: number, nickname?: string): Promise<MyPlant> {
  const res = await fetch('/api/my-plants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plantId, nickname }),
  })
  if (!res.ok) throw new Error(`Failed to add plant: ${res.status}`)
  return res.json() as Promise<MyPlant>
}

export async function waterMyPlant(id: number): Promise<void> {
  const res = await fetch(`/api/my-plants/${id}/water`, { method: 'PATCH' })
  if (!res.ok) throw new Error(`Failed to mark as watered: ${res.status}`)
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
