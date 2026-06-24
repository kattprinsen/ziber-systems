import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import styles from './App.module.scss'
import { Layout } from './components/Layout/Layout'
import { MyPlantsPage } from './pages/MyPlantsPage/MyPlantsPage'
import { EditPlantPage } from './pages/EditPlantPage/EditPlantPage'
import { RoomsPage } from './pages/RoomsPage/RoomsPage'
import { TasksPage } from './pages/TasksPage/TasksPage'
import { MembersPage } from './pages/MembersPage/MembersPage'
import { ActivityPage } from './pages/ActivityPage/ActivityPage'
import LoginPage from './pages/LoginPage/LoginPage'
import { useMyPlants } from './hooks/useMyPlants'
import { useRooms } from './hooks/useRooms'
import { getDaysUntilWater, getWaterStatus } from './utils/plants'
import { fetchPlantHistory, type WateringEvent } from './api/my-plants'
import { checkAuth, logout } from './api/auth'

function getBadgeLabel(isOverdue: boolean, daysUntil: number): string {
  if (isOverdue) return `+${Math.abs(daysUntil)}d`
  if (daysUntil === 0) return 'today'
  return `${daysUntil}d`
}

function HomePage() {
  const { myPlants, loading, error, water, snooze, remove, setRoom } = useMyPlants()
  const { rooms, create: createRoom } = useRooms()
  const navigate = useNavigate()
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null)
  const [roomFilter, setRoomFilter] = useState<number | null>(null)
  const [showNewRoom, setShowNewRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [history, setHistory] = useState<WateringEvent[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const filteredPlants = useMemo(
    () => (roomFilter === null ? myPlants : myPlants.filter((p) => p.roomId === roomFilter)),
    [myPlants, roomFilter],
  )

  useEffect(() => {
    if (filteredPlants.length === 0) {
      setSelectedPlantId(null)
      return
    }
    const hasSelected = selectedPlantId !== null && filteredPlants.some((p) => p.id === selectedPlantId)
    if (!hasSelected) {
      setSelectedPlantId(filteredPlants[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPlants])

  const selectedPlant = useMemo(
    () => filteredPlants.find((plant) => plant.id === selectedPlantId) ?? null,
    [filteredPlants, selectedPlantId],
  )

  useEffect(() => {
    if (selectedPlantId === null) { setHistory([]); return }
    setHistoryLoading(true)
    fetchPlantHistory(selectedPlantId)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false))
  }, [selectedPlantId, myPlants]) // re-fetch when myPlants changes (i.e. after watering)

  const selectedPlantDaysUntil = selectedPlant
    ? getDaysUntilWater(selectedPlant.lastWateredAt, selectedPlant.addedAt, selectedPlant.wateringIntervalDays, selectedPlant.snoozedUntil)
    : null

  const selectedPlantStatus = selectedPlantDaysUntil !== null ? getWaterStatus(selectedPlantDaysUntil) : ''

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault()
    const name = newRoomName.trim()
    if (!name) return
    await createRoom(name)
    setNewRoomName('')
    setShowNewRoom(false)
  }

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

      {myPlants.length > 0 && (
        <nav aria-label="Filter by room" className={styles.roomFilter}>
          <button
            className={`${styles.roomFilterBtn} ${roomFilter === null ? styles.roomFilterBtnActive : ''}`}
            onClick={() => setRoomFilter(null)}
            type="button"
          >
            All
          </button>
          {rooms.map((room) => (
            <button
              className={`${styles.roomFilterBtn} ${roomFilter === room.id ? styles.roomFilterBtnActive : ''}`}
              key={room.id}
              onClick={() => setRoomFilter(room.id)}
              type="button"
            >
              {room.name}
            </button>
          ))}
          {showNewRoom ? (
            <form className={styles.roomAddForm} onSubmit={handleCreateRoom}>
              <input
                autoFocus
                className={styles.roomAddInput}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name"
                value={newRoomName}
              />
              <button className={styles.roomFilterBtn} type="submit">Add</button>
              <button
                className={styles.roomFilterBtn}
                onClick={() => { setShowNewRoom(false); setNewRoomName('') }}
                type="button"
              >
                ✕
              </button>
            </form>
          ) : (
            <button className={styles.roomFilterBtn} onClick={() => setShowNewRoom(true)} type="button">
              + Room
            </button>
          )}
        </nav>
      )}

      {myPlants.length > 0 && roomFilter !== null && filteredPlants.length === 0 && (
        <p className={styles.muted}>No plants in this room yet.</p>
      )}

      {myPlants.length > 0 && selectedPlant && (
        <div className={styles.collectionLayout}>
          <section aria-label="Plant list" className={styles.listPanel}>
            <ul className={styles.plantList}>
              {filteredPlants.map((plant) => {
                const daysUntil = getDaysUntilWater(plant.lastWateredAt, plant.addedAt, plant.wateringIntervalDays, plant.snoozedUntil)
                const isOverdue = daysUntil < 0

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
                        {getBadgeLabel(isOverdue, daysUntil)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section aria-live="polite" className={styles.detailPanel}>
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
              <div>
                <dt>Room</dt>
                <dd>
                  <select
                    className={styles.roomSelect}
                    onChange={(e) => setRoom(selectedPlant.id, e.target.value ? Number(e.target.value) : null)}
                    value={selectedPlant.roomId ?? ''}
                  >
                    <option value="">No room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </select>
                </dd>
              </div>
            </dl>

            <div className={styles.detailActions}>
              <button className={styles.actionButton} onClick={() => water(selectedPlant.id)} type="button">
                Mark watered
              </button>
              {selectedPlantDaysUntil !== null && selectedPlantDaysUntil <= 0 && (
                <button className={styles.actionButtonSecondary} onClick={() => snooze(selectedPlant.id)} type="button">
                  Snooze 1 day
                </button>
              )}
              <button className={styles.actionButtonSecondary} onClick={() => navigate(`/plants/${selectedPlant.id}`)} type="button">
                Edit
              </button>
              <button className={styles.actionButtonDanger} onClick={() => remove(selectedPlant.id)} type="button">
                Remove
              </button>
            </div>

            <section className={styles.history}>
              <h3 className={styles.historyTitle}>Watering history</h3>
              {historyLoading && <p className={styles.muted}>Loading…</p>}
              {!historyLoading && history.length === 0 && (
                <p className={styles.muted}>No watering events recorded yet.</p>
              )}
              {!historyLoading && history.length > 0 && (
                <ul className={styles.historyList}>
                  {history.map((event) => (
                    <li key={event.id} className={styles.historyItem}>
                      <span>💧 {new Date(event.wateredAt).toLocaleDateString()}</span>
                      <span className={styles.historyMeta}>
                        {event.source === 'discord'
                          ? `discord${event.wateredBy ? `: ${event.wateredBy}` : ''}`
                          : 'manual'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </section>
        </div>
      )}
    </div>
  )
}

function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth().then((ok) => {
      setAuthed(ok)
      if (!ok) navigate('/login', { replace: true })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = () => {
    setAuthed(true)
    navigate('/', { replace: true })
  }

  const handleLogout = async () => {
    await logout()
    setAuthed(false)
    navigate('/login', { replace: true })
  }

  if (authed === null) return null // loading — avoid flash of content

  return (
    <Routes>
      <Route path="/login" element={authed ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />} />
      <Route element={<Layout onLogout={handleLogout} />}>
        <Route path="/" element={authed ? <HomePage /> : <Navigate to="/login" replace />} />
        <Route path="/add-plant" element={authed ? <MyPlantsPage /> : <Navigate to="/login" replace />} />
        <Route path="/plants/:id" element={authed ? <EditPlantPage /> : <Navigate to="/login" replace />} />
        <Route path="/rooms" element={authed ? <RoomsPage /> : <Navigate to="/login" replace />} />
        <Route path="/tasks" element={authed ? <TasksPage /> : <Navigate to="/login" replace />} />
        <Route path="/members" element={authed ? <MembersPage /> : <Navigate to="/login" replace />} />
        <Route path="/activity" element={authed ? <ActivityPage /> : <Navigate to="/login" replace />} />
      </Route>
    </Routes>
  )
}

export default App
