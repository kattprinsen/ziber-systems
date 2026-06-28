import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---- hoisted mocks ----

const mocks = vi.hoisted(() => {
  // Single `from` mock used across all queries — tests set up return values per call
  const limit = vi.fn()
  const orderBy = vi.fn(() => ({ limit }))
  const where = vi.fn(() => ({ orderBy }))
  const innerJoin = vi.fn()
  const from = vi.fn()
  const select = vi.fn(() => ({ from }))

  const sendMessage = vi.fn().mockResolvedValue(undefined)

  return { select, from, innerJoin, where, orderBy, limit, sendMessage }
})

vi.mock('../db/index.js', () => ({ db: { select: mocks.select } }))
vi.mock('./api.js', () => ({ sendMessage: mocks.sendMessage }))
vi.mock('./config.js', () => ({
  discordConfig: { botToken: 'tok', plantChannelId: 'plant-ch', taskChannelId: 'task-ch' },
}))

import { sendPlantReminders, sendTaskReminders } from './reminders.js'

// ---- shared constants ----

const NOW = new Date('2026-06-28T08:00:00Z') // Sunday, DOW = 0

// ---- plant reminders ----

describe('sendPlantReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    // plant query chain: db.select({...}).from(userPlants).innerJoin(plants, ...)
    mocks.from.mockReturnValue({ innerJoin: mocks.innerJoin })
    mocks.innerJoin.mockResolvedValue([])
  })

  afterEach(() => vi.useRealTimers())

  it('sends a message for a plant due today', async () => {
    const lastWatered = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    mocks.innerJoin.mockResolvedValueOnce([
      { id: 1, nickname: null, addedAt: '2026-01-01T00:00:00Z', lastWateredAt: lastWatered, commonName: 'Monstera', latinName: 'Monstera deliciosa', wateringIntervalDays: 7 },
    ])

    const p = sendPlantReminders()
    await vi.runAllTimersAsync()
    await p

    expect(mocks.sendMessage).toHaveBeenCalledOnce()
    const [channelId, payload] = mocks.sendMessage.mock.calls[0]
    expect(channelId).toBe('plant-ch')
    expect(payload.content).toContain('Monstera')
    expect(payload.content).toContain('due today')
  })

  it('uses nickname over commonName in the message', async () => {
    const lastWatered = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    mocks.innerJoin.mockResolvedValueOnce([
      { id: 2, nickname: 'Big Green', addedAt: '2026-01-01T00:00:00Z', lastWateredAt: lastWatered, commonName: 'Monstera', latinName: 'Monstera deliciosa', wateringIntervalDays: 7 },
    ])

    const p = sendPlantReminders()
    await vi.runAllTimersAsync()
    await p

    expect(mocks.sendMessage.mock.calls[0][1].content).toContain('Big Green')
    // commonName should not appear as the plant title (latin name in italics is fine)
    expect(mocks.sendMessage.mock.calls[0][1].content).not.toContain('**Monstera**')
  })

  it('marks overdue plants correctly (plural)', async () => {
    const lastWatered = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
    mocks.innerJoin.mockResolvedValueOnce([
      { id: 3, nickname: null, addedAt: '2026-01-01T00:00:00Z', lastWateredAt: lastWatered, commonName: 'Ficus', latinName: 'Ficus benjamina', wateringIntervalDays: 7 },
    ])

    const p = sendPlantReminders()
    await vi.runAllTimersAsync()
    await p

    expect(mocks.sendMessage.mock.calls[0][1].content).toContain('overdue by 3 days')
  })

  it('uses singular "day" when exactly 1 day overdue', async () => {
    const lastWatered = new Date(NOW.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
    mocks.innerJoin.mockResolvedValueOnce([
      { id: 4, nickname: null, addedAt: '2026-01-01T00:00:00Z', lastWateredAt: lastWatered, commonName: 'Cactus', latinName: 'Cactus sp.', wateringIntervalDays: 7 },
    ])

    const p = sendPlantReminders()
    await vi.runAllTimersAsync()
    await p

    expect(mocks.sendMessage.mock.calls[0][1].content).toContain('overdue by 1 day')
    expect(mocks.sendMessage.mock.calls[0][1].content).not.toContain('days')
  })

  it('includes water and snooze buttons with correct custom_ids', async () => {
    const lastWatered = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    mocks.innerJoin.mockResolvedValueOnce([
      { id: 5, nickname: null, addedAt: '2026-01-01T00:00:00Z', lastWateredAt: lastWatered, commonName: 'Aloe', latinName: 'Aloe vera', wateringIntervalDays: 7 },
    ])

    const p = sendPlantReminders()
    await vi.runAllTimersAsync()
    await p

    const buttons = mocks.sendMessage.mock.calls[0][1].components[0].components
    expect(buttons[0].custom_id).toBe('water:plant:5')
    expect(buttons[1].custom_id).toBe('snooze:plant:5')
  })

  it('sends no message when no plants are due', async () => {
    const lastWatered = new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    mocks.innerJoin.mockResolvedValueOnce([
      { id: 6, nickname: null, addedAt: '2026-01-01T00:00:00Z', lastWateredAt: lastWatered, commonName: 'Palm', latinName: 'Areca lutescens', wateringIntervalDays: 7 },
    ])

    await sendPlantReminders()

    expect(mocks.sendMessage).not.toHaveBeenCalled()
  })

  it('sends all plants when forceAll is true regardless of schedule', async () => {
    const lastWatered = new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    mocks.innerJoin.mockResolvedValueOnce([
      { id: 7, nickname: null, addedAt: '2026-01-01T00:00:00Z', lastWateredAt: lastWatered, commonName: 'Palm', latinName: 'Areca lutescens', wateringIntervalDays: 7 },
    ])

    const p = sendPlantReminders(true)
    await vi.runAllTimersAsync()
    await p

    expect(mocks.sendMessage).toHaveBeenCalledOnce()
  })

  it('falls back to addedAt when lastWateredAt is null', async () => {
    const addedAt = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    mocks.innerJoin.mockResolvedValueOnce([
      { id: 8, nickname: null, addedAt, lastWateredAt: null, commonName: 'Ivy', latinName: 'Hedera helix', wateringIntervalDays: 7 },
    ])

    const p = sendPlantReminders()
    await vi.runAllTimersAsync()
    await p

    expect(mocks.sendMessage).toHaveBeenCalledOnce()
  })
})

// ---- task reminders ----

describe('sendTaskReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    mocks.from.mockResolvedValue([])   // default: no tasks
    mocks.limit.mockResolvedValue([])  // default: no task logs
  })

  afterEach(() => vi.useRealTimers())

  const baseTask = {
    id: 1,
    name: 'Dishes',
    command: 'dishes',
    description: null,
    intervalDays: 2,
    dayOfWeek: null,
    snoozedUntil: null,
    createdAt: '2026-01-01T00:00:00Z',
  }

  it('sends a message for an interval-based task due today', async () => {
    const completedAt = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    // First from() call resolves to the tasks list
    mocks.from.mockResolvedValueOnce([baseTask])
    // Second from() returns the where→orderBy→limit chain for task logs
    mocks.from.mockReturnValueOnce({ where: mocks.where })
    mocks.limit.mockResolvedValueOnce([{ completedAt }])

    const p = sendTaskReminders()
    await vi.runAllTimersAsync()
    await p

    expect(mocks.sendMessage).toHaveBeenCalledOnce()
    const [channelId, payload] = mocks.sendMessage.mock.calls[0]
    expect(channelId).toBe('task-ch')
    expect(payload.content).toContain('Dishes')
    expect(payload.content).toContain('due today')
  })

  it('sends no message when task is not yet due', async () => {
    const completedAt = new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    mocks.from.mockResolvedValueOnce([baseTask])
    mocks.from.mockReturnValueOnce({ where: mocks.where })
    mocks.limit.mockResolvedValueOnce([{ completedAt }])

    await sendTaskReminders()

    expect(mocks.sendMessage).not.toHaveBeenCalled()
  })

  it('uses createdAt as base when there are no task logs', async () => {
    const task = { ...baseTask, createdAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    mocks.from.mockResolvedValueOnce([task])
    mocks.from.mockReturnValueOnce({ where: mocks.where })
    mocks.limit.mockResolvedValueOnce([]) // no logs

    const p = sendTaskReminders()
    await vi.runAllTimersAsync()
    await p

    expect(mocks.sendMessage).toHaveBeenCalledOnce()
  })

  it('skips a snoozed task', async () => {
    const snoozedTask = { ...baseTask, snoozedUntil: new Date(NOW.getTime() + 24 * 60 * 60 * 1000).toISOString() }
    mocks.from.mockResolvedValueOnce([snoozedTask])

    await sendTaskReminders()

    expect(mocks.sendMessage).not.toHaveBeenCalled()
  })

  it('sends a snoozed task when forceAll is true', async () => {
    const snoozedTask = {
      ...baseTask,
      createdAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      snoozedUntil: new Date(NOW.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    }
    mocks.from.mockResolvedValueOnce([snoozedTask])
    mocks.from.mockReturnValueOnce({ where: mocks.where })
    mocks.limit.mockResolvedValueOnce([])

    const p = sendTaskReminders(true)
    await vi.runAllTimersAsync()
    await p

    expect(mocks.sendMessage).toHaveBeenCalledOnce()
  })

  it('skips on-demand tasks (no intervalDays and no dayOfWeek)', async () => {
    const onDemandTask = { ...baseTask, intervalDays: null, dayOfWeek: null }
    mocks.from.mockResolvedValueOnce([onDemandTask])

    await sendTaskReminders()

    expect(mocks.sendMessage).not.toHaveBeenCalled()
  })

  it('sends day-of-week task when today matches', async () => {
    const dowTask = { ...baseTask, intervalDays: null, dayOfWeek: 0 } // Sunday = 0
    mocks.from.mockResolvedValueOnce([dowTask])

    const p = sendTaskReminders()
    await vi.runAllTimersAsync()
    await p

    expect(mocks.sendMessage).toHaveBeenCalledOnce()
    expect(mocks.sendMessage.mock.calls[0][1].content).toContain('scheduled for today')
  })

  it('does not send day-of-week task when today does not match', async () => {
    const dowTask = { ...baseTask, intervalDays: null, dayOfWeek: 1 } // Monday
    mocks.from.mockResolvedValueOnce([dowTask])

    await sendTaskReminders()

    expect(mocks.sendMessage).not.toHaveBeenCalled()
  })

  it('includes complete and snooze buttons with correct custom_ids', async () => {
    const completedAt = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    mocks.from.mockResolvedValueOnce([baseTask])
    mocks.from.mockReturnValueOnce({ where: mocks.where })
    mocks.limit.mockResolvedValueOnce([{ completedAt }])

    const p = sendTaskReminders()
    await vi.runAllTimersAsync()
    await p

    const buttons = mocks.sendMessage.mock.calls[0][1].components[0].components
    expect(buttons[0].custom_id).toBe('complete:task:1')
    expect(buttons[1].custom_id).toBe('snooze:task:1')
  })

  it('includes description in message when present', async () => {
    const task = { ...baseTask, description: 'All the plates', createdAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    mocks.from.mockResolvedValueOnce([task])
    mocks.from.mockReturnValueOnce({ where: mocks.where })
    mocks.limit.mockResolvedValueOnce([])

    const p = sendTaskReminders()
    await vi.runAllTimersAsync()
    await p

    expect(mocks.sendMessage.mock.calls[0][1].content).toContain('All the plates')
  })

  it('omits description prefix when description is null', async () => {
    const task = { ...baseTask, createdAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    mocks.from.mockResolvedValueOnce([task])
    mocks.from.mockReturnValueOnce({ where: mocks.where })
    mocks.limit.mockResolvedValueOnce([])

    const p = sendTaskReminders()
    await vi.runAllTimersAsync()
    await p

    // No description·separator should appear before the status text
    expect(mocks.sendMessage.mock.calls[0][1].content).not.toMatch(/\*.*\* · /)
  })
})
