import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useItem } from '../../hooks/useItem'
import styles from './ItemDetailPage.module.scss'

export const ItemDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const numericId = Number(id)
  const { item, loading, error, update, saving, saveError } = useItem(numericId)

  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (item) setName(item.name)
  }, [item])

  if (isNaN(numericId)) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>Invalid item id.</p>
        <Link to="/" className={styles.back}>← Back</Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await update(name.trim())
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // error surfaced via saveError
    }
  }

  const isDirty = item ? name !== item.name : false

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>← Back</Link>

      {loading && <p className={styles.muted}>Loading...</p>}
      {error && (
        <>
          <p className={styles.error}>{error}</p>
          <button className={styles.buttonSecondary} onClick={() => navigate('/')}>
            Go home
          </button>
        </>
      )}

      {item && !loading && (
        <div className={styles.card}>
          <h1 className={styles.title}>Item #{item.id}</h1>
          <p className={styles.meta}>
            Created: <span>{new Date(item.createdAt).toLocaleString()}</span>
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="edit-name" className={styles.label}>Name</label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setSaved(false) }}
                disabled={saving}
                className={styles.input}
                autoComplete="off"
              />
            </div>

            {saveError && <p className={styles.error}>{saveError}</p>}
            {saved && <p className={styles.success}>Saved!</p>}

            <div className={styles.actions}>
              <button
                type="submit"
                disabled={saving || !isDirty || !name.trim()}
                className={styles.button}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
