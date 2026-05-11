import { useState, useCallback, useRef } from 'react'
import { searchPlants, type Plant } from '../api/plants'

interface UsePlantsResult {
  results: Plant[]
  searching: boolean
  error: string | null
  search: (query: string) => void
}

export function usePlants(): UsePlantsResult {
  const [results, setResults] = useState<Plant[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((query: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    if (!query.trim()) {
      setResults([])
      return
    }

    debounceTimer.current = setTimeout(() => {
      setSearching(true)
      setError(null)
      searchPlants(query)
        .then(setResults)
        .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Search failed'))
        .finally(() => setSearching(false))
    }, 300)
  }, [])

  return { results, searching, error, search }
}
