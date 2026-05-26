import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import styles from './App.module.scss'
import { Layout } from './components/Layout/Layout'
import { MyPlantsPage } from './pages/MyPlantsPage/MyPlantsPage'
import { EditPlantPage } from './pages/EditPlantPage/EditPlantPage'
import { useMyPlants } from './hooks/useMyPlants'
import { getDaysUntilWater, getWaterStatus } from './utils/plants'

function HomePage() {
  const { myPlants, loading, error, water, remove } = useMyPlants()
  const navigate = useNavigate()
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null)

  useEffect(() => {
    if (myPlants.length === 0) {
      setSelectedPlantId(null)
      return
    }

    const hasSelected = selectedPlantId !== null && myPlants.some((plant) => plant.id === selectedPlantId)
    if (!hasSelected) {
      setSelectedPlantId(myPlants[0].id)
    }
  }, [myPlants, selectedPlantId])

  const selectedPlant = useMemo(
    () => myPlants.find((plant) => plant.id === selectedPlantId) ?? null,
    [myPlants, selectedPlantId],
  )

  const selectedPlantDaysUntil = selectedPlant
    ? getDaysUntilWater(selectedPlant.lastWateredAt, selectedPlant.addedAt, selectedPlant.wateringIntervalDays)
    : null

  const selectedPlantStatus = selectedPlantDaysUntil !== null ? getWaterStatus(selectedPlantDaysUntil) : ''

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Plants</h1>
        <Link to="/add-plant" className={styles.addButton}>+ Add a plant</Link>
      </div>

      {loading && <p className={styles.muted}>Loading…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && myPlants.length === 0 && (
        <p className={styles.muted}>
          No plants yet — <Link to="/add-plant" className={styles.link}>add your first one</Link>.
        </p>
      )}

      {myPlants.length > 0 && selectedPlant && (
        <div className={styles.collectionLayout}>
          <section aria-label="Plant list" className={styles.listPanel}>
            <ul className={styles.plantList}>
              {myPlants.map((plant) => {
                const daysUntil = getDaysUntilWater(plant.lastWateredAt, plant.addedAt, plant.wateringIntervalDays)
                const isOverdue = daysUntil <= 0

                return (
                  <li key={plant.id}>
                    <button
                      className={`${styles.listItem} ${selectedPlant.id === plant.id ? styles.listItemActive : ''}`}
                      onClick={() => setSelectedPlantId(plant.id)}
                      type="button"
                    >
                      <span className={styles.listItemMain}>
                        <span className={styles.listItemName}>{plant.nickname ?? plant.commonName}</span>
                        {plant.nickname && <span className={styles.listItemSub}>{plant.commonName}</span>}
                      </span>
                      <span className={`${styles.listItemBadge} ${isOverdue ? styles.listItemBadgeOverdue : ''}`}>
                        {isOverdue ? `+${Math.abs(daysUntil)}d` : `${daysUntil}d`}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className={styles.detailPanel} aria-live="polite">
            <header className={styles.detailHeader}>
              <div>
                <h2 className={styles.detailTitle}>{selectedPlant.nickname ?? selectedPlant.commonName}</h2>
                {selectedPlant.nickname && <p className={styles.detailSub}>{selectedPlant.commonName}</p>}
                <p className={styles.detailSub}><em>{selectedPlant.latinName}</em></p>
              </div>
            </header>

            <p className={styles.detailDescription}>{selectedPlant.description}</p>

            <dl className={styles.detailMeta}>
              <div>
                <dt>Status</dt>
                <dd>{selectedPlantStatus}</dd>
              </div>
              <div>
                <dt>Water every</dt>
                <dd>{selectedPlant.wateringIntervalDays} days</dd>
              </div>
              <div>
                <dt>Last watered</dt>
                <dd>{selectedPlant.lastWateredAt ? new Date(selectedPlant.lastWateredAt).toLocaleDateString() : 'Never'}</dd>
              </div>
            </dl>

            <div className={styles.detailActions}>
              <button className={styles.actionButton} onClick={() => water(selectedPlant.id)} type="button">
                Mark watered
              </button>
              <button className={styles.actionButtonSecondary} onClick={() => navigate(`/plants/${selectedPlant.id}`)} type="button">
                Edit
              </button>
              <button className={styles.actionButtonDanger} onClick={() => remove(selectedPlant.id)} type="button">
                Remove
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/add-plant" element={<MyPlantsPage />} />
        <Route path="/plants/:id" element={<EditPlantPage />} />
      </Route>
    </Routes>
  )
}

export default App
