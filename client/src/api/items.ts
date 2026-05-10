export interface Item {
  id: number
  name: string
  createdAt: string
}

export async function fetchItems(): Promise<Item[]> {
  const res = await fetch('/api/items')
  if (!res.ok) throw new Error(`Failed to fetch items: ${res.status}`)
  return res.json() as Promise<Item[]>
}

export async function createItem(name: string): Promise<Item> {
  const res = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`Failed to create item: ${res.status}`)
  return res.json() as Promise<Item>
}

export async function fetchItem(id: number): Promise<Item> {
  const res = await fetch(`/api/items/${id}`)
  if (!res.ok) throw new Error(`Failed to fetch item: ${res.status}`)
  return res.json() as Promise<Item>
}

export async function updateItem(id: number, name: string): Promise<Item> {
  const res = await fetch(`/api/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`Failed to update item: ${res.status}`)
  return res.json() as Promise<Item>
}
