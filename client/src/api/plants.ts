export interface Plant {
  id: number
  commonName: string
  latinName: string
  wateringIntervalDays: number
  light: 'low' | 'indirect' | 'bright'
  description: string
}

export async function searchPlants(query: string): Promise<Plant[]> {
  const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''
  const res = await fetch(`/api/plants${params}`)
  if (!res.ok) throw new Error(`Failed to search plants: ${res.status}`)
  return res.json() as Promise<Plant[]>
}

export async function fetchPlant(id: number): Promise<Plant> {
  const res = await fetch(`/api/plants/${id}`)
  if (!res.ok) throw new Error(`Failed to fetch plant: ${res.status}`)
  return res.json() as Promise<Plant>
}
