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
