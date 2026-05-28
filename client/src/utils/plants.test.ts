import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getDaysUntilWater, getWaterStatus } from './plants'

// Pin "now" to a fixed point so tests are deterministic
const NOW = new Date('2026-05-28T12:00:00.000Z')

describe('getDaysUntilWater', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns days remaining when watered recently', () => {
    // 3 days ago, interval 7 → 4 days left
    const lastWateredAt = '2026-05-25T12:00:00.000Z'
    expect(getDaysUntilWater(lastWateredAt, '2026-05-01T00:00:00Z', 7)).toBe(4)
  })

  it('returns 1 when due tomorrow', () => {
    // 6 days ago, interval 7 → 1 day left
    const lastWateredAt = '2026-05-22T12:00:00.000Z'
    expect(getDaysUntilWater(lastWateredAt, '2026-05-01T00:00:00Z', 7)).toBe(1)
  })

  it('returns 0 when due exactly now', () => {
    // exactly 7 days ago, interval 7 → 0
    const lastWateredAt = '2026-05-21T12:00:00.000Z'
    expect(getDaysUntilWater(lastWateredAt, '2026-05-01T00:00:00Z', 7)).toBe(0)
  })

  it('returns negative value when overdue', () => {
    // 14 days ago, interval 7 → -7
    const lastWateredAt = '2026-05-14T12:00:00.000Z'
    expect(getDaysUntilWater(lastWateredAt, '2026-05-01T00:00:00Z', 7)).toBe(-7)
  })

  it('falls back to addedAt when lastWateredAt is null', () => {
    // addedAt 3 days ago, interval 7 → 4 days left
    const addedAt = '2026-05-25T12:00:00.000Z'
    expect(getDaysUntilWater(null, addedAt, 7)).toBe(4)
  })

  it('uses lastWateredAt over addedAt when both are provided', () => {
    // addedAt was 10 days ago, but watered 1 day ago with interval 7 → 6 days left
    const addedAt = '2026-05-18T12:00:00.000Z'
    const lastWateredAt = '2026-05-27T12:00:00.000Z'
    expect(getDaysUntilWater(lastWateredAt, addedAt, 7)).toBe(6)
  })

  it('handles longer watering intervals', () => {
    // watered yesterday, interval 30 → 29 days left
    const lastWateredAt = '2026-05-27T12:00:00.000Z'
    expect(getDaysUntilWater(lastWateredAt, '2026-05-01T00:00:00Z', 30)).toBe(29)
  })
})

describe('getWaterStatus', () => {
  it('returns "Water tomorrow" for 1 day', () => {
    expect(getWaterStatus(1)).toBe('Water tomorrow')
  })

  it('returns days message for 2+ days', () => {
    expect(getWaterStatus(2)).toBe('Water in 2 days')
    expect(getWaterStatus(14)).toBe('Water in 14 days')
  })

  it('returns singular overdue for exactly -1', () => {
    expect(getWaterStatus(-1)).toBe('Overdue by 1 day')
  })

  it('returns plural overdue for multiple days', () => {
    expect(getWaterStatus(-5)).toBe('Overdue by 5 days')
    expect(getWaterStatus(-30)).toBe('Overdue by 30 days')
  })

  it('returns overdue for 0 (due moment passed)', () => {
    expect(getWaterStatus(0)).toBe('Overdue by 0 days')
  })
})
