import { useState, useEffect, useCallback } from 'react'
import { fetchItem, updateItem, type Item } from '../api/items'

interface UseItemResult {
  item: Item | null
  loading: boolean
  error: string | null
  update: (name: string) => Promise<void>
  saving: boolean
  saveError: string | null
}

export function useItem(id: number): UseItemResult {
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchItem(id)
      .then(setItem)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [id])

  const update = useCallback(
    async (name: string) => {
      setSaving(true)
      setSaveError(null)
      try {
        const updated = await updateItem(id, name)
        setItem(updated)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save')
        throw err
      } finally {
        setSaving(false)
      }
    },
    [id],
  )

  return { item, loading, error, update, saving, saveError }
}
