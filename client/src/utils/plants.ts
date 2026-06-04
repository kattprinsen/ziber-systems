const DAY_MS = 24 * 60 * 60 * 1000

export function getDaysUntilWater(
  lastWateredAt: string | null,
  addedAt: string,
  wateringIntervalDays: number,
  snoozedUntil?: string | null,
): number {
  const base = lastWateredAt ?? addedAt
  const next = new Date(base).getTime() + wateringIntervalDays * DAY_MS
  const daysFromSchedule = Math.ceil((next - Date.now()) / DAY_MS)

  if (snoozedUntil) {
    const daysFromSnooze = Math.ceil((new Date(snoozedUntil).getTime() - Date.now()) / DAY_MS)
    return Math.max(daysFromSchedule, daysFromSnooze)
  }

  return daysFromSchedule
}

export function getWaterStatus(daysUntil: number): string {
  if (daysUntil < 0) {
    const overdue = Math.abs(daysUntil)
    return `Overdue by ${overdue} day${overdue === 1 ? '' : 's'}`
  }
  if (daysUntil === 0) return 'Water today'
  if (daysUntil === 1) return 'Water tomorrow'
  return `Water in ${daysUntil} days`
}
