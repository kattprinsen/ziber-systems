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

  return { update, set, updateWhere, returning, select, from, selectWhere }
})

vi.mock('../db/index.js', () => ({
  db: { update: mocks.update, select: mocks.select },
}))

import { handleInteraction } from './interactions'

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

  it('returns ephemeral error when plant is not found in DB', async () => {
    mocks.returning.mockResolvedValueOnce([]) // empty → not found

    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'water_plant:999', component_type: BUTTON },
    })

    expect(result.type).toBe(CHANNEL_MESSAGE)
    expect(result.data?.flags).toBe(EPHEMERAL)
    expect(result.data?.content).toContain('not found')
  })
})
