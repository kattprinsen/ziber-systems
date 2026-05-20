import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMyPlants } from '../../hooks/useMyPlants'
import styles from './EditPlantPage.module.scss'

export const EditPlantPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { myPlants, loading, update } = useMyPlants()

  const userPlantId = Number(id)
  const plant = myPlants.find((p) => p.id === userPlantId)

  const [form, setForm] = useState({
    nickname: '',
    commonName: '',
    latinName: '',
    wateringIntervalDays: '',
    light: 'indirect' as 'low' | 'indirect' | 'bright',
    description: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (plant) {
      setForm({
        nickname: plant.nickname ?? '',
        commonName: plant.commonName,
        latinName: plant.latinName,
        wateringIntervalDays: String(plant.wateringIntervalDays),
        light: plant.light,
        description: plant.description,
      })
    }
    // plant?.id is intentional: re-initialise only when navigating to a different
    // plant, not on every background re-fetch — which would wipe in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plant?.id])

  if (loading) return <div className={styles.page}><p>Loading…</p></div>
  if (!plant) return <div className={styles.page}><p>Plant not found.</p></div>

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.commonName.trim()) {
      setError('Name is required.')
      return
    }
    const days = Number(form.wateringIntervalDays)
    if (!Number.isInteger(days) || days < 1) {
      setError('Watering interval must be a whole number of at least 1.')
      return
    }

    setSaving(true)
    try {
      await update(
        plant.id,
        plant.plantId,
        {
          commonName: form.commonName.trim(),
          latinName: form.latinName.trim(),
          wateringIntervalDays: days,
          light: form.light,
          description: form.description.trim(),
        },
        form.nickname.trim() || null,
      )
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Edit plant</h1>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.formRow}>
          <label className={styles.label} htmlFor="nickname">Nickname</label>
          <input
            id="nickname"
            name="nickname"
            className={styles.input}
            type="text"
            value={form.nickname}
            onChange={handleChange}
            placeholder={form.commonName}
          />
        </div>

        <hr className={styles.divider} />

        <div className={styles.formRow}>
          <label className={styles.label} htmlFor="commonName">
            Name <span className={styles.required}>*</span>
          </label>
          <input
            id="commonName"
            name="commonName"
            className={styles.input}
            type="text"
            value={form.commonName}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formRow}>
          <label className={styles.label} htmlFor="latinName">Latin name</label>
          <input
            id="latinName"
            name="latinName"
            className={styles.input}
            type="text"
            value={form.latinName}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formRow}>
          <label className={styles.label} htmlFor="wateringIntervalDays">
            Water every (days) <span className={styles.required}>*</span>
          </label>
          <input
            id="wateringIntervalDays"
            name="wateringIntervalDays"
            className={styles.input}
            type="number"
            min={1}
            step={1}
            value={form.wateringIntervalDays}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formRow}>
          <label className={styles.label} htmlFor="light">Light</label>
          <select
            id="light"
            name="light"
            className={styles.input}
            value={form.light}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="indirect">Indirect</option>
            <option value="bright">Bright</option>
          </select>
        </div>

        <div className={styles.formRow}>
          <label className={styles.label} htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            className={styles.textarea}
            rows={3}
            value={form.description}
            onChange={handleChange}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="submit" className={styles.button} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={() => navigate('/')}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
