import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyPlants } from '../../hooks/useMyPlants'
import { PlantSearch } from '../../components/PlantSearch/PlantSearch'
import type { Plant } from '../../api/plants'
import styles from './MyPlantsPage.module.scss'

type View = 'search' | 'custom'

const defaultCustomForm = {
  commonName: '',
  latinName: '',
  wateringIntervalDays: '',
  light: 'indirect' as 'low' | 'indirect' | 'bright',
  description: '',
  nickname: '',
}

export const MyPlantsPage = () => {
  const { add, addCustom } = useMyPlants()
  const navigate = useNavigate()
  const [view, setView] = useState<View>('search')

  // Search flow
  const [pendingPlant, setPendingPlant] = useState<Plant | null>(null)
  const [nickname, setNickname] = useState('')
  const [adding, setAdding] = useState(false)

  // Custom plant flow
  const [customForm, setCustomForm] = useState(defaultCustomForm)
  const [customError, setCustomError] = useState<string | null>(null)

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

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCustomError(null)

    const days = Number(customForm.wateringIntervalDays)
    if (!customForm.commonName.trim()) {
      setCustomError('Name is required.')
      return
    }
    if (!Number.isInteger(days) || days < 1) {
      setCustomError('Watering interval must be a whole number of days (at least 1).')
      return
    }

    setAdding(true)
    try {
      await addCustom(
        {
          commonName: customForm.commonName.trim(),
          latinName: customForm.latinName.trim() || undefined,
          wateringIntervalDays: days,
          light: customForm.light,
          description: customForm.description.trim() || undefined,
        },
        customForm.nickname.trim() || undefined,
      )
      navigate('/')
    } catch (err) {
      setCustomError(err instanceof Error ? err.message : 'Something went wrong.')
      setAdding(false)
    }
  }

  const switchView = (v: View) => {
    setView(v)
    setPendingPlant(null)
    setCustomError(null)
    setCustomForm(defaultCustomForm)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Add a plant</h1>

      <div className={styles.tabs}>
        <button
          className={view === 'search' ? styles.tabActive : styles.tab}
          onClick={() => switchView('search')}
        >
          Search catalogue
        </button>
        <button
          className={view === 'custom' ? styles.tabActive : styles.tab}
          onClick={() => switchView('custom')}
        >
          Create custom
        </button>
      </div>

      {view === 'search' && (
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
      )}

      {view === 'custom' && (
        <section className={styles.section}>
          <form className={styles.customForm} onSubmit={handleCustomSubmit} noValidate>
            <div className={styles.formRow}>
              <label htmlFor="custom-name" className={styles.label}>
                Name <span className={styles.required}>*</span>
              </label>
              <input
                id="custom-name"
                type="text"
                value={customForm.commonName}
                onChange={(e) => setCustomForm((f) => ({ ...f, commonName: e.target.value }))}
                placeholder="e.g. Bird of Paradise"
                className={styles.input}
                autoComplete="off"
              />
            </div>

            <div className={styles.formRow}>
              <label htmlFor="custom-latin" className={styles.label}>
                Latin name <span className={styles.optional}>(optional)</span>
              </label>
              <input
                id="custom-latin"
                type="text"
                value={customForm.latinName}
                onChange={(e) => setCustomForm((f) => ({ ...f, latinName: e.target.value }))}
                placeholder="e.g. Strelitzia reginae"
                className={styles.input}
                autoComplete="off"
              />
            </div>

            <div className={styles.formRow}>
              <label htmlFor="custom-interval" className={styles.label}>
                Water every (days) <span className={styles.required}>*</span>
              </label>
              <input
                id="custom-interval"
                type="number"
                min={1}
                value={customForm.wateringIntervalDays}
                onChange={(e) => setCustomForm((f) => ({ ...f, wateringIntervalDays: e.target.value }))}
                placeholder="7"
                className={styles.input}
              />
            </div>

            <div className={styles.formRow}>
              <label htmlFor="custom-light" className={styles.label}>
                Light requirements
              </label>
              <select
                id="custom-light"
                value={customForm.light}
                onChange={(e) => setCustomForm((f) => ({ ...f, light: e.target.value as typeof f.light }))}
                className={styles.input}
              >
                <option value="low">Low light</option>
                <option value="indirect">Indirect light</option>
                <option value="bright">Bright light</option>
              </select>
            </div>

            <div className={styles.formRow}>
              <label htmlFor="custom-desc" className={styles.label}>
                Description <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                id="custom-desc"
                value={customForm.description}
                onChange={(e) => setCustomForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Any notes about this plant…"
                className={styles.textarea}
                rows={3}
              />
            </div>

            <div className={styles.formRow}>
              <label htmlFor="custom-nickname" className={styles.label}>
                Nickname <span className={styles.optional}>(optional)</span>
              </label>
              <input
                id="custom-nickname"
                type="text"
                value={customForm.nickname}
                onChange={(e) => setCustomForm((f) => ({ ...f, nickname: e.target.value }))}
                placeholder="e.g. Big leafy boi"
                className={styles.input}
                autoComplete="off"
              />
            </div>

            {customError && <p className={styles.error}>{customError}</p>}

            <button type="submit" className={styles.button} disabled={adding}>
              {adding ? 'Adding…' : 'Add to collection'}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
