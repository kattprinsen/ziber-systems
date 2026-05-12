import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyPlants } from '../../hooks/useMyPlants'
import { PlantSearch } from '../../components/PlantSearch/PlantSearch'
import type { Plant } from '../../api/plants'
import styles from './MyPlantsPage.module.scss'

export const MyPlantsPage = () => {
  const { add } = useMyPlants()
  const navigate = useNavigate()
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
      navigate('/')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Add a plant</h1>

      <section className={styles.section}>
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
    </div>
  )
}
