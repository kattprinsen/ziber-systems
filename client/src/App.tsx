import { Routes, Route } from 'react-router-dom'
import styles from './App.module.scss'
import { Layout } from './components/Layout/Layout'
import { MyPlantsPage } from './pages/MyPlantsPage/MyPlantsPage'

function HomePage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Ziber Systems</h1>
      <p className={styles.subtitle}>Track your household plants and never miss a watering.</p>
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
