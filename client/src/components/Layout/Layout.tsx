import { NavLink, Outlet } from 'react-router-dom'
import styles from './Layout.module.scss'

interface LayoutProps {
  onLogout: () => void
}

export const Layout = ({ onLogout }: LayoutProps) => (
  <div className={styles.root}>
    <nav className={styles.nav}>
      <NavLink to="/" end className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}>
        My Plants
      </NavLink>
      <NavLink to="/add-plant" className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}>
        Add a plant
      </NavLink>
      <NavLink to="/rooms" className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}>
        Rooms
      </NavLink>
      <NavLink to="/tasks" className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}>
        Tasks
      </NavLink>
      <NavLink to="/members" className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}>
        Members
      </NavLink>
      <button className={styles.logoutButton} onClick={onLogout} type="button">
        Sign out
      </button>
    </nav>
    <main>
      <Outlet />
    </main>
  </div>
)
