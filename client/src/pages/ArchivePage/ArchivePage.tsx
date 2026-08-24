import { useState, useEffect, useCallback } from 'react'
import { fetchArchivedPlants, restoreMyPlant, type ArchivedPlant } from '../../api/my-plants'
import styles from './ArchivePage.module.scss'

export const ArchivePage = () => {
  const [archivedPlants, setArchivedPlants] = useState<ArchivedPlant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchArchivedPlants()
      .then(setArchivedPlants)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleRestore = async (id: number) => {
    setRestoringId(id)
    try {
      await restoreMyPlant(id)
      load()
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Archived plants</h1>
      {loading && <p className={styles.muted}>Loading…</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && archivedPlants.length === 0 && (
        <p className={styles.muted}>No archived plants.</p>
      )}
      {archivedPlants.length > 0 && (
        <ul className={styles.list}>
          {archivedPlants.map((plant) => (
            <li key={plant.id} className={styles.item}>
              <div className={styles.info}>
                <span className={styles.name}>{plant.nickname ?? plant.commonName}</span>
                {plant.nickname && <span className={styles.sub}>{plant.commonName}</span>}
                <span className={styles.sub}>
                  Archived {new Date(plant.archivedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                className={styles.restoreButton}
                disabled={restoringId === plant.id}
                onClick={() => handleRestore(plant.id)}
                type="button"
              >
                {restoringId === plant.id ? 'Restoring…' : 'Restore'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
