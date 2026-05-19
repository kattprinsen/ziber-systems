import type { MyPlant } from '../../api/my-plants'
import styles from './MyPlantCard.module.scss'

interface MyPlantCardProps {
  plant: MyPlant
  onWater: () => void
  onRemove: () => void
  onEdit: () => void
}

function getDaysUntilWater(plant: MyPlant): number {
  const base = plant.lastWateredAt ?? plant.addedAt
  const next = new Date(base).getTime() + plant.wateringIntervalDays * 24 * 60 * 60 * 1000
  return Math.ceil((next - Date.now()) / (24 * 60 * 60 * 1000))
}

const lightLabel: Record<MyPlant['light'], string> = {
  low: 'Low light',
  indirect: 'Indirect light',
  bright: 'Bright light',
}

export const MyPlantCard = ({ plant, onWater, onRemove, onEdit }: MyPlantCardProps) => {
  const daysUntil = getDaysUntilWater(plant)
  const isOverdue = daysUntil <= 0
  const isDueSoon = daysUntil === 1

  return (
    <div className={`${styles.card} ${isOverdue ? styles.overdue : ''}`}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.name}>{plant.nickname ?? plant.commonName}</h3>
          {plant.nickname && <p className={styles.latin}>{plant.commonName}</p>}
          <p className={styles.latin}><em>{plant.latinName}</em></p>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.iconButton}
            onClick={onEdit}
            aria-label="Edit plant"
            title="Edit plant"
          >
            ✎
          </button>
          <button
            className={styles.removeButton}
            onClick={onRemove}
            aria-label="Remove plant"
            title="Remove from collection"
          >
            ×
          </button>
        </div>
      </div>

      <p className={styles.description}>{plant.description}</p>

      <div className={styles.meta}>
        <span className={styles.badge}>{lightLabel[plant.light]}</span>
        <span className={`${styles.badge} ${isOverdue ? styles.badgeOverdue : isDueSoon ? styles.badgeSoon : ''}`}>
          {isOverdue
            ? `Overdue by ${Math.abs(daysUntil)}d`
            : daysUntil === 0
            ? 'Water today'
            : `Water in ${daysUntil}d`}
        </span>
      </div>

      <div className={styles.footer}>
        <span className={styles.lastWatered}>
          {plant.lastWateredAt
            ? `Last watered ${new Date(plant.lastWateredAt).toLocaleDateString()}`
            : 'Never watered'}
        </span>
        <button className={styles.waterButton} onClick={onWater}>
          💧 Mark watered
        </button>
      </div>
    </div>
  )
}
