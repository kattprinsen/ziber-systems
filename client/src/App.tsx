import { useEffect, useState } from 'react'

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
    <div>
      <h1>Ziber Systems</h1>
      <h2>Server Health</h2>
      {loading && <p>Checking...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {health && !loading && (
        <ul>
          <li>Status: {health.status}</li>
          <li>Database: {health.db}</li>
          <li>Timestamp: {health.timestamp}</li>
          <li>Total checks recorded: {health.totalChecks}</li>
        </ul>
      )}
      <button onClick={fetchHealth} disabled={loading}>
        {loading ? 'Checking...' : 'Ping again'}
      </button>
    </div>
  )
}

export default App
