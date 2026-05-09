import { useState, useEffect, useCallback } from 'react'
import { fetchItems, createItem, type Item } from '../api/items'

interface UseItemsResult {
  items: Item[]
  loading: boolean
  error: string | null
  create: (name: string) => Promise<void>
}

export function useItems(): UseItemsResult {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchItems()
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    async (name: string) => {
      await createItem(name)
      load()
    },
    [load],
  )

  return { items, loading, error, create }
}
