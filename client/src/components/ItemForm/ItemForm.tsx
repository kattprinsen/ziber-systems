import { useState } from 'react'
import styles from './ItemForm.module.scss'

interface ItemFormProps {
  onCreate: (name: string) => Promise<void>
}

export const ItemForm = ({ onCreate }: ItemFormProps) => {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      await onCreate(name.trim())
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="item-name" className={styles.label}>
          Name
        </label>
        <input
          id="item-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name"
          disabled={submitting}
          className={styles.input}
          autoComplete="off"
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" disabled={submitting || !name.trim()} className={styles.button}>
        {submitting ? 'Adding...' : 'Add'}
      </button>
    </form>
  )
}
