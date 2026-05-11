import { useState } from 'react'
import { usePlants } from '../../hooks/usePlants'
import type { Plant } from '../../api/plants'
import styles from './PlantSearch.module.scss'

interface PlantSearchProps {
  onSelect: (plant: Plant) => void
}

const lightLabel: Record<Plant['light'], string> = {
  low: 'Low light',
  indirect: 'Indirect light',
  bright: 'Bright light',
}

export const PlantSearch = ({ onSelect }: PlantSearchProps) => {
  const [query, setQuery] = useState('')
  const { results, searching, error, search } = usePlants()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    search(e.target.value)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.field}>
        <label htmlFor="plant-search" className={styles.label}>Search plants</label>
        <input
          id="plant-search"
          type="search"
          value={query}
          onChange={handleChange}
          placeholder="e.g. Monstera, Pothos…"
          autoComplete="off"
          className={styles.input}
        />
      </div>

      {searching && <p className={styles.muted}>Searching…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((plant) => (
            <li key={plant.id}>
              <button
                type="button"
                className={styles.result}
                onClick={() => { onSelect(plant); setQuery(''); search('') }}
              >
                <span className={styles.commonName}>{plant.commonName}</span>
                <span className={styles.latinName}>{plant.latinName}</span>
                <span className={styles.meta}>
                  <span className={styles.badge}>
                    💧 Every {plant.wateringIntervalDays}d
                  </span>
                  <span className={styles.badge}>{lightLabel[plant.light]}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!searching && query.trim() && results.length === 0 && (
        <p className={styles.muted}>No plants found for "{query}".</p>
      )}
    </div>
  )
}
