import type { MyPlant } from '../../api/my-plants'
import { getDaysUntilWater } from '../../utils/plants'
import styles from './MyPlantCard.module.scss'

interface MyPlantCardProps {
  plant: MyPlant
  onWater: () => void
  onRemove: () => void
  onEdit: () => void
}

const lightLabel: Record<MyPlant['light'], string> = {
  low: 'Low light',
  indirect: 'Indirect light',
  bright: 'Bright light',
}

export const MyPlantCard = ({ plant, onWater, onRemove, onEdit }: MyPlantCardProps) => {
  const daysUntil = getDaysUntilWater(plant.lastWateredAt, plant.addedAt, plant.wateringIntervalDays)
  const isOverdue = daysUntil <= 0
  const isDueSoon = daysUntil === 1

  let badgeClass = ''
  if (isOverdue) badgeClass = styles.badgeOverdue
  else if (isDueSoon) badgeClass = styles.badgeSoon

  let waterLabel = `Water in ${daysUntil}d`
  if (isOverdue) waterLabel = `Overdue by ${Math.abs(daysUntil)}d`
  else if (daysUntil === 0) waterLabel = 'Water today'

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
        <span className={`${styles.badge} ${badgeClass}`}>
          {waterLabel}
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
