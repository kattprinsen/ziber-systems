// Mirror of Member in server/src/types.ts — keep in sync if schema changes.
export interface Member {
  id: number
  discordId: string
  discordName: string
  displayName: string
  createdAt: string
}

export async function fetchMembers(): Promise<Member[]> {
  const res = await fetch('/api/members')
  if (!res.ok) throw new Error(`Failed to fetch members: ${res.status}`)
  return res.json() as Promise<Member[]>
}

export async function renameMember(id: number, displayName: string): Promise<Member> {
  const res = await fetch(`/api/members/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName }),
  })
  if (!res.ok) throw new Error(`Failed to rename member: ${res.status}`)
  return res.json() as Promise<Member>
}
