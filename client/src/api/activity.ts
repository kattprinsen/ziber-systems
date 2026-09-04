export interface ActivityEntry {
  id: string
  type: 'task' | 'plant'
  name: string
  who: string | null
  source: string
  timestamp: string
}

export interface ActivityPage {
  entries: ActivityEntry[]
  total: number
  page: number
  pageSize: number
}

export async function fetchActivity(page: number, type: ActivityEntry['type'] | 'all'): Promise<ActivityPage> {
  const params = new URLSearchParams({ page: String(page) })
  if (type !== 'all') params.set('type', type)

  const res = await fetch(`/api/activity?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch activity: ${res.status}`)
  return res.json() as Promise<ActivityPage>
}
