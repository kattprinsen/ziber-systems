// Mirror of Room in server/src/types.ts — keep in sync if the schema changes.
export interface Room {
  id: number
  name: string
}

export async function fetchRooms(): Promise<Room[]> {
  const res = await fetch('/api/rooms')
  if (!res.ok) throw new Error(`Failed to fetch rooms: ${res.status}`)
  return res.json() as Promise<Room[]>
}

export async function createRoom(name: string): Promise<Room> {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`Failed to create room: ${res.status}`)
  return res.json() as Promise<Room>
}

export async function renameRoom(id: number, name: string): Promise<Room> {
  const res = await fetch(`/api/rooms/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`Failed to rename room: ${res.status}`)
  return res.json() as Promise<Room>
}

export async function deleteRoom(id: number): Promise<void> {
  const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete room: ${res.status}`)
}
