import { useEffect, useState } from 'react'
import styles from './App.module.scss'

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
    </div>
  )
}

export default App
