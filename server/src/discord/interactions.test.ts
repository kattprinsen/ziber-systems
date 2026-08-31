import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the DB module before importing the handler — avoids loading better-sqlite3
const mocks = vi.hoisted(() => {
  const returning = vi.fn()
  const updateWhere = vi.fn(() => ({ returning }))
  const set = vi.fn(() => ({ where: updateWhere }))
  const update = vi.fn(() => ({ set }))

  const selectWhere = vi.fn()
  const from = vi.fn(() => ({ where: selectWhere }))
  const select = vi.fn(() => ({ from }))

  const insertValues = vi.fn().mockResolvedValue([])
  const insert = vi.fn(() => ({ values: insertValues }))

  return { update, set, updateWhere, returning, select, from, selectWhere, insert, insertValues }
})

vi.mock('../db/index.js', () => ({
  db: { update: mocks.update, select: mocks.select, insert: mocks.insert },
}))

import { handleInteraction } from './interactions.js'

// Interaction type constants (mirrors the values in interactions.ts)
const PING = 1
const MESSAGE_COMPONENT = 3
const BUTTON = 2
const PONG = 1
const UPDATE_MESSAGE = 7
const CHANNEL_MESSAGE = 4
const EPHEMERAL = 64

describe('handleInteraction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('responds to PING with PONG', async () => {
    const result = await handleInteraction({ type: PING })
    expect(result).toEqual({ type: PONG })
  })

  it('returns PONG for unknown interaction types', async () => {
    const result = await handleInteraction({ type: 99 })
    expect(result).toEqual({ type: PONG })
  })

  it('marks a plant as watered and returns UPDATE_MESSAGE', async () => {
    mocks.returning.mockResolvedValueOnce([
      { id: 1, plantId: 5, nickname: null, lastWateredAt: '2026-05-28T12:00:00Z' },
    ])
    mocks.selectWhere.mockResolvedValueOnce([{ commonName: 'Monstera' }])

    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'water_plant:1', component_type: BUTTON },
    })

    expect(result.type).toBe(UPDATE_MESSAGE)
    expect(result.data?.content).toContain('Monstera')
    expect(result.data?.content).toContain('✅')
    expect(result.data?.components).toEqual([]) // buttons removed after watering
  })

  it('uses nickname over commonName in the response', async () => {
    mocks.returning.mockResolvedValueOnce([
      { id: 2, plantId: 5, nickname: 'Big Green', lastWateredAt: '2026-05-28T12:00:00Z' },
    ])
    mocks.selectWhere.mockResolvedValueOnce([{ commonName: 'Monstera' }])

    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'water_plant:2', component_type: BUTTON },
    })

    expect(result.data?.content).toContain('Big Green')
    expect(result.data?.content).not.toContain('Monstera')
  })

  it('returns ephemeral error when plant ID is not a number', async () => {
    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'water_plant:abc', component_type: BUTTON },
    })

    expect(result.type).toBe(CHANNEL_MESSAGE)
    expect(result.data?.flags).toBe(EPHEMERAL)
    expect(result.data?.content).toContain('Invalid')
  })

  it('returns UPDATE_MESSAGE when plant is not found in DB', async () => {
    mocks.returning.mockResolvedValueOnce([]) // empty → not found

    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'water_plant:999', component_type: BUTTON },
    })

    expect(result.type).toBe(UPDATE_MESSAGE)
    expect(result.data?.components).toEqual([])
    expect(result.data?.content).toContain('removed')
  })

  // --- snooze:plant ---

  it('snoozes a plant for 1 day and returns UPDATE_MESSAGE', async () => {
    mocks.returning.mockResolvedValueOnce([{ id: 3, plantId: 5, nickname: 'Leafy', snoozedUntil: '2026-06-29T00:00:00Z' }])
    mocks.selectWhere.mockResolvedValueOnce([{ commonName: 'Ficus' }])

    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'snooze:plant:3', component_type: BUTTON },
    })

    expect(result.type).toBe(UPDATE_MESSAGE)
    expect(result.data?.content).toContain('😴')
    expect(result.data?.content).toContain('Leafy')
    expect(result.data?.components).toEqual([])
  })

  it('uses commonName when plant has no nickname (snooze)', async () => {
    mocks.returning.mockResolvedValueOnce([{ id: 4, plantId: 6, nickname: null, snoozedUntil: '2026-06-29T00:00:00Z' }])
    mocks.selectWhere.mockResolvedValueOnce([{ commonName: 'Ficus' }])

    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'snooze:plant:4', component_type: BUTTON },
    })

    expect(result.data?.content).toContain('Ficus')
  })

  it('returns ephemeral error when plant ID is not a number (snooze)', async () => {
    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'snooze:plant:abc', component_type: BUTTON },
    })

    expect(result.type).toBe(CHANNEL_MESSAGE)
    expect(result.data?.flags).toBe(EPHEMERAL)
    expect(result.data?.content).toContain('Invalid')
  })

  it('returns UPDATE_MESSAGE when plant is not found (snooze)', async () => {
    mocks.returning.mockResolvedValueOnce([])

    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'snooze:plant:999', component_type: BUTTON },
    })

    expect(result.type).toBe(UPDATE_MESSAGE)
    expect(result.data?.components).toEqual([])
    expect(result.data?.content).toContain('removed')
  })

  // --- complete:task ---

  it('completes a task for an existing member and returns UPDATE_MESSAGE', async () => {
    mocks.selectWhere
      .mockResolvedValueOnce([{ id: 7, name: 'Dishes', snoozedUntil: null }]) // task lookup
      .mockResolvedValueOnce([{ id: 2, displayName: 'Alice' }])               // member lookup by discordId

    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'complete:task:7', component_type: BUTTON },
      member: { user: { id: '111222333', username: 'alice' } },
    })

    expect(result.type).toBe(UPDATE_MESSAGE)
    expect(result.data?.content).toContain('✅')
    expect(result.data?.content).toContain('Dishes')
    expect(result.data?.content).toContain('Alice')
    expect(result.data?.components).toEqual([])
  })

  it('auto-creates a member when completing a task for first-time user', async () => {
    mocks.selectWhere
      .mockResolvedValueOnce([{ id: 8, name: 'Vacuum', snoozedUntil: null }]) // task lookup
      .mockResolvedValueOnce([])                                                // member not found by discordId

    // insert returning for member creation
    const insertReturning = vi.fn().mockResolvedValueOnce([{ id: 99, displayName: 'bob' }])
    mocks.insertValues.mockReturnValueOnce({ returning: insertReturning })

    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'complete:task:8', component_type: BUTTON },
      member: { user: { id: '444555666', username: 'bob' } },
    })

    expect(result.type).toBe(UPDATE_MESSAGE)
    expect(result.data?.content).toContain('bob')
  })

  it('returns ephemeral error when no username is provided for task complete', async () => {
    mocks.selectWhere.mockResolvedValueOnce([{ id: 9, name: 'Trash', snoozedUntil: null }])

    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'complete:task:9', component_type: BUTTON },
      // no member/user field → discordUserId is null
    })

    expect(result.type).toBe(CHANNEL_MESSAGE)
    expect(result.data?.flags).toBe(EPHEMERAL)
    expect(result.data?.content).toContain('identify user')
  })

  it('returns UPDATE_MESSAGE when task is not found (complete)', async () => {
    mocks.selectWhere.mockResolvedValueOnce([]) // task not found

    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'complete:task:999', component_type: BUTTON },
      member: { user: { id: '111222333', username: 'alice' } },
    })

    expect(result.type).toBe(UPDATE_MESSAGE)
    expect(result.data?.components).toEqual([])
    expect(result.data?.content).toContain('removed')
  })

  it('returns ephemeral error when task ID is not a number (complete)', async () => {
    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'complete:task:abc', component_type: BUTTON },
      member: { user: { id: '111222333', username: 'alice' } },
    })

    expect(result.type).toBe(CHANNEL_MESSAGE)
    expect(result.data?.flags).toBe(EPHEMERAL)
    expect(result.data?.content).toContain('Invalid')
  })

  // --- snooze:task ---

  it('snoozes a task for 1 day and returns UPDATE_MESSAGE', async () => {
    mocks.returning.mockResolvedValueOnce([{ id: 10, name: 'Laundry', snoozedUntil: '2026-06-29T00:00:00Z' }])

    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'snooze:task:10', component_type: BUTTON },
    })

    expect(result.type).toBe(UPDATE_MESSAGE)
    expect(result.data?.content).toContain('😴')
    expect(result.data?.content).toContain('Laundry')
    expect(result.data?.components).toEqual([])
  })

  it('returns ephemeral error when task is not found (snooze)', async () => {
    mocks.returning.mockResolvedValueOnce([]) // empty array → destructures to undefined

    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'snooze:task:999', component_type: BUTTON },
    })

    expect(result.type).toBe(CHANNEL_MESSAGE)
    expect(result.data?.flags).toBe(EPHEMERAL)
    expect(result.data?.content).toContain('not found')
  })

  it('returns ephemeral error when task ID is not a number (snooze)', async () => {
    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'snooze:task:abc', component_type: BUTTON },
    })

    expect(result.type).toBe(CHANNEL_MESSAGE)
    expect(result.data?.flags).toBe(EPHEMERAL)
    expect(result.data?.content).toContain('Invalid')
  })

  // --- custom_id format ---

  it('returns PONG for an unrecognised custom_id format', async () => {
    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'totally_unknown', component_type: BUTTON },
    })

    expect(result).toEqual({ type: PONG })
  })

  it('returns PONG for a recognised format but no registered handler', async () => {
    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'unknown:domain:42', component_type: BUTTON },
    })

    expect(result).toEqual({ type: PONG })
  })
})
