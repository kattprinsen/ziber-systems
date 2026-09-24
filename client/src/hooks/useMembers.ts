import { useState, useEffect, useCallback } from 'react'
import { fetchMembers, renameMember, type Member } from '../api/members'

interface UseMembersResult {
  members: Member[]
  loading: boolean
  error: string | null
  rename: (id: number, displayName: string) => Promise<void>
  reload: () => void
}

export function useMembers(): UseMembersResult {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchMembers()
      .then(setMembers)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load members'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const rename = useCallback(
    async (id: number, displayName: string) => {
      await renameMember(id, displayName)
      load()
    },
    [load],
  )

  return { members, loading, error, rename, reload: load }
}
