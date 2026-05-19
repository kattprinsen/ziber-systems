export interface Plant {
  id: number
  commonName: string
  latinName: string
  wateringIntervalDays: number
  light: 'low' | 'indirect' | 'bright'
  description: string
}

export interface CreatePlantInput {
  commonName: string
  latinName?: string
  wateringIntervalDays: number
  light?: 'low' | 'indirect' | 'bright'
  description?: string
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

export async function createPlant(input: CreatePlantInput): Promise<Plant> {
  const res = await fetch('/api/plants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Failed to create plant: ${res.status}`)
  return res.json() as Promise<Plant>
}
