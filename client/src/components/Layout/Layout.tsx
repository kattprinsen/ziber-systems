import { NavLink, Outlet } from 'react-router-dom'
import styles from './Layout.module.scss'

export const Layout = () => (
  <div className={styles.root}>
    <nav className={styles.nav}>
      <NavLink to="/" end className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}>
        Home
      </NavLink>
      <NavLink to="/my-plants" className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}>
        My Plants
      </NavLink>
    </nav>
    <main>
      <Outlet />
    </main>
  </div>
)
