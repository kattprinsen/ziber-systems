import { useEffect, useState } from 'react'
import styles from './App.module.scss'
import { ItemForm } from './components/ItemForm/ItemForm'
import { ItemList } from './components/ItemList/ItemList'
import { useItems } from './hooks/useItems'

interface HealthStatus {
  status: string
  db: string
  timestamp: string
  totalChecks: number
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { items, loading: itemsLoading, error: itemsError, create } = useItems()

  const fetchHealth = () => {
    setLoading(true)
    setError(null)
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`)
        return res.json() as Promise<HealthStatus>
      })
      .then((data) => {
        setHealth(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not reach server')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Ziber Systems</h1>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Server Health</h2>
        {loading && <p className={styles.muted}>Checking...</p>}
        {error && <p className={styles.error}>Error: {error}</p>}
        {health && !loading && (
          <ul className={styles.statusList}>
            <li>Status: <span>{health.status}</span></li>
            <li>Database: <span>{health.db}</span></li>
            <li>Timestamp: <span>{health.timestamp}</span></li>
            <li>Total checks recorded: <span>{health.totalChecks}</span></li>
          </ul>
        )}
        <button className={styles.button} onClick={fetchHealth} disabled={loading}>
          {loading ? 'Checking...' : 'Ping again'}
        </button>
      </div>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Items</h2>
        <ItemForm onCreate={create} />
        <div className={styles.listWrapper}>
          <ItemList items={items} loading={itemsLoading} error={itemsError} />
        </div>
      </div>
    </div>
  )
}

export default App
