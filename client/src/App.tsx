import { Routes, Route } from 'react-router-dom'
import { Link } from 'react-router-dom'
import styles from './App.module.scss'
import { Layout } from './components/Layout/Layout'
import { MyPlantCard } from './components/MyPlantCard/MyPlantCard'
import { MyPlantsPage } from './pages/MyPlantsPage/MyPlantsPage'
import { useMyPlants } from './hooks/useMyPlants'

function HomePage() {
  const { myPlants, loading, error, water, remove } = useMyPlants()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Plants</h1>
        <Link to="/my-plants" className={styles.addButton}>+ Add a plant</Link>
      </div>

      {loading && <p className={styles.muted}>Loading…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && myPlants.length === 0 && (
        <p className={styles.muted}>
          No plants yet — <Link to="/my-plants" className={styles.link}>add your first one</Link>.
        </p>
      )}

      {myPlants.length > 0 && (
        <ul className={styles.grid}>
          {myPlants.map((plant) => (
            <li key={plant.id}>
              <MyPlantCard
                plant={plant}
                onWater={() => water(plant.id)}
                onRemove={() => remove(plant.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/my-plants" element={<MyPlantsPage />} />
      </Route>
    </Routes>
  )
}

export default App
