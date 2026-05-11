import { useState } from 'react'
import { useMyPlants } from '../../hooks/useMyPlants'
import { MyPlantCard } from '../../components/MyPlantCard/MyPlantCard'
import { PlantSearch } from '../../components/PlantSearch/PlantSearch'
import type { Plant } from '../../api/plants'
import styles from './MyPlantsPage.module.scss'

export const MyPlantsPage = () => {
  const { myPlants, loading, error, add, water, remove } = useMyPlants()
  const [pendingPlant, setPendingPlant] = useState<Plant | null>(null)
  const [nickname, setNickname] = useState('')
  const [adding, setAdding] = useState(false)

  const handleSelect = (plant: Plant) => {
    setPendingPlant(plant)
    setNickname('')
  }

  const handleConfirmAdd = async () => {
    if (!pendingPlant) return
    setAdding(true)
    try {
      await add(pendingPlant.id, nickname.trim() || undefined)
      setPendingPlant(null)
      setNickname('')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Plants</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Add a plant</h2>
        <PlantSearch onSelect={handleSelect} />

        {pendingPlant && (
          <div className={styles.confirmCard}>
            <p className={styles.confirmText}>
              Adding <strong>{pendingPlant.commonName}</strong>{' '}
              <em>({pendingPlant.latinName})</em> — waters every{' '}
              {pendingPlant.wateringIntervalDays} days.
            </p>
            <div className={styles.confirmField}>
              <label htmlFor="nickname" className={styles.label}>
                Nickname <span className={styles.optional}>(optional)</span>
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={pendingPlant.commonName}
                className={styles.input}
                autoComplete="off"
              />
            </div>
            <div className={styles.confirmActions}>
              <button
                className={styles.button}
                onClick={handleConfirmAdd}
                disabled={adding}
              >
                {adding ? 'Adding…' : 'Add to collection'}
              </button>
              <button
                className={styles.buttonSecondary}
                onClick={() => setPendingPlant(null)}
                disabled={adding}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your collection</h2>
        {loading && <p className={styles.muted}>Loading…</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && myPlants.length === 0 && (
          <p className={styles.muted}>No plants yet — search above to add your first one.</p>
        )}
        {myPlants.length > 0 && (
          <ul className={styles.grid}>
            {myPlants.map((plant) => (
              <li key={plant.id}>
                <MyPlantCard
                  plant={plant}
                  onWater={() => water(plant.id)}
                  onRemove={() => remove(plant.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
