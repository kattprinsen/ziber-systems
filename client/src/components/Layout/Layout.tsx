import { NavLink, Outlet } from 'react-router-dom'
import styles from './Layout.module.scss'

export const Layout = () => (
  <div className={styles.root}>
    <nav className={styles.nav}>
      <NavLink to="/" end className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}>
        My Plants
      </NavLink>
      <NavLink to="/add-plant" className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}>
        Add a plant
      </NavLink>
    </nav>
    <main>
      <Outlet />
    </main>
  </div>
)
