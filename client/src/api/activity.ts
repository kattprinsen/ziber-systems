export interface ActivityEntry {
  id: string
  type: 'task' | 'plant'
  name: string
  who: string | null
  source: string
  timestamp: string
}

export async function fetchActivity(): Promise<ActivityEntry[]> {
  const res = await fetch('/api/activity')
  if (!res.ok) throw new Error(`Failed to fetch activity: ${res.status}`)
  return res.json() as Promise<ActivityEntry[]>
}
