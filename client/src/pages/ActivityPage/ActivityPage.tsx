import { useEffect, useState } from 'react'
import { fetchActivity, type ActivityEntry } from '../../api/activity'
import styles from './ActivityPage.module.scss'

type Filter = 'all' | 'task' | 'plant'

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  task: 'Tasks',
  plant: 'Plants',
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(timestamp: string): string {
  const d = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

function entryIcon(type: ActivityEntry['type']): string {
  return type === 'task' ? '✅' : '💧'
}

function entryMeta(entry: ActivityEntry): string {
  const parts: string[] = []
  if (entry.who) parts.push(entry.who)
  if (entry.source === 'discord') parts.push('via Discord')
  else if (entry.source === 'manual') parts.push('manual')
  else if (entry.source === 'web') parts.push('via web')
  return parts.join(' · ')
}

export function ActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    fetchActivity()
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.type === filter)

  // Group by date for dividers
  const grouped: { date: string; items: ActivityEntry[] }[] = []
  for (const entry of filtered) {
    const date = formatDate(entry.timestamp)
    const last = grouped[grouped.length - 1]
    if (last && last.date === date) {
      last.items.push(entry)
    } else {
      grouped.push({ date, items: [entry] })
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Activity</h1>
        <div className={styles.filters}>
          {(['all', 'task', 'plant'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`${styles.filterButton} ${filter === f ? styles.filterButtonActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className={styles.muted}>Loading…</p>}

      {!loading && filtered.length === 0 && (
        <p className={styles.muted}>No activity yet.</p>
      )}

      {!loading && filtered.length > 0 && (
        <div className={styles.feed}>
          {grouped.map((group) => (
            <div key={group.date}>
              <div className={styles.dateDivider}>{group.date}</div>
              {group.items.map((entry) => (
                <div key={entry.id} className={styles.entry}>
                  <span className={styles.icon}>{entryIcon(entry.type)}</span>
                  <div className={styles.entryBody}>
                    <div className={styles.entryName}>{entry.name}</div>
                    <div className={styles.entryMeta}>{entryMeta(entry)}</div>
                  </div>
                  <div className={styles.entryTime}>{formatTime(entry.timestamp)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
