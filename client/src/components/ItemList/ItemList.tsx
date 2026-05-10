import { Link } from 'react-router-dom'
import type { Item } from '../../api/items'
import styles from './ItemList.module.scss'

interface ItemListProps {
  items: Item[]
  loading: boolean
  error: string | null
}

export const ItemList = ({ items, loading, error }: ItemListProps) => {
  if (loading) return <p className={styles.muted}>Loading...</p>
  if (error) return <p className={styles.error}>{error}</p>
  if (items.length === 0) return <p className={styles.muted}>No items yet.</p>

  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id}>
          <Link to={`/item/${item.id}`} className={styles.item}>
            <span className={styles.name}>{item.name}</span>
            <span className={styles.date}>{new Date(item.createdAt).toLocaleString()}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
