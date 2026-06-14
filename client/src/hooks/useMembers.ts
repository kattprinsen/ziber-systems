import { useState, useEffect, useCallback } from 'react'
import { fetchMembers, renameMember, type Member } from '../api/members'

interface UseMembersResult {
  members: Member[]
  loading: boolean
  rename: (id: number, displayName: string) => Promise<void>
  reload: () => void
}

export function useMembers(): UseMembersResult {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetchMembers()
      .then(setMembers)
      .catch((err: unknown) => console.error('[members]', err))
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

  return { members, loading, rename, reload: load }
}
