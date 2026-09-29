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
  const recordTaskCompletion = vi.fn((_taskId: number, _source: string, participants: { displayName: string }[]) => ({
    taskLogId: 1,
    participants: participants.map((participant) => participant.displayName),
    duplicate: false,
  }))
  const editMessage = vi.fn().mockResolvedValue(undefined)

  return { update, set, updateWhere, returning, select, from, selectWhere, insert, insertValues, recordTaskCompletion, editMessage }
})

vi.mock('../db/index.js', () => ({
  db: { update: mocks.update, select: mocks.select, insert: mocks.insert },
}))
vi.mock('./task-completions.js', () => ({ recordTaskCompletion: mocks.recordTaskCompletion }))
vi.mock('./api.js', () => ({ editMessage: mocks.editMessage, sendMessage: vi.fn() }))

import { handleInteraction } from './interactions.js'

// Interaction type constants (mirrors the values in interactions.ts)
const PING = 1
const MESSAGE_COMPONENT = 3
const BUTTON = 2
const PONG = 1
const UPDATE_MESSAGE = 7
const CHANNEL_MESSAGE = 4
const EPHEMERAL = 64
const USER_SELECT = 5
const requester = { id: '111222333', username: 'alice', global_name: 'Alice' }

async function startTaskCompletion(taskId = 7, taskName = 'Dishes'): Promise<string> {
  mocks.selectWhere.mockResolvedValueOnce([{ id: taskId, name: taskName, snoozedUntil: null }])
  const response = await handleInteraction({
    type: MESSAGE_COMPONENT,
    channel_id: 'channel-1',
    message: { id: `reminder-${taskId}` },
    data: { custom_id: `complete:task:${taskId}`, component_type: BUTTON },
    member: { user: requester },
  })
  expect(response.type).toBe(CHANNEL_MESSAGE)
  expect(response.data?.flags).toBe(EPHEMERAL)
  const components = response.data?.components as { components: { custom_id: string }[] }[]
  return components[0].components[0].custom_id.split(':').at(-1)!
}

function selectParticipants(taskId: number, token: string, values: string[], users: Record<string, { id: string; username: string; global_name?: string | null }>) {
  return handleInteraction({
    type: MESSAGE_COMPONENT,
    data: {
      custom_id: `participants:task:${taskId}:${token}`,
      component_type: USER_SELECT,
      values,
      resolved: { users },
    },
    member: { user: requester },
  })
}

function confirmCompletion(taskId: number, token: string) {
  return handleInteraction({
    type: MESSAGE_COMPONENT,
    data: { custom_id: `confirm:task:${taskId}:${token}`, component_type: BUTTON },
    member: { user: requester },
  })
}

describe('handleInteraction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.selectWhere.mockResolvedValue([])
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
    mocks.selectWhere
      .mockResolvedValueOnce([{ snoozedUntil: null }])
      .mockResolvedValueOnce([{ commonName: 'Ficus' }])

    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'snooze:plant:3', component_type: BUTTON },
    })

    expect(result.type).toBe(UPDATE_MESSAGE)
    expect(result.data?.content).toContain('😴')
    expect(result.data?.content).toContain('Leafy')
    expect(result.data?.components).toBeDefined()
  })

  it('uses commonName when plant has no nickname (snooze)', async () => {
    mocks.returning.mockResolvedValueOnce([{ id: 4, plantId: 6, nickname: null, snoozedUntil: '2026-06-29T00:00:00Z' }])
    mocks.selectWhere
      .mockResolvedValueOnce([{ snoozedUntil: null }])
      .mockResolvedValueOnce([{ commonName: 'Ficus' }])

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

  it('waits for explicit confirmation before recording a completion', async () => {
    const token = await startTaskCompletion()

    expect(mocks.recordTaskCompletion).not.toHaveBeenCalled()
    expect(token).toBeTruthy()
  })

  it('credits the clicker when no participants are selected', async () => {
    const token = await startTaskCompletion()
    mocks.selectWhere.mockResolvedValueOnce([{ id: 7, name: 'Dishes', snoozedUntil: null }])

    const result = await confirmCompletion(7, token)

    expect(result.type).toBe(UPDATE_MESSAGE)
    expect(result.data?.content).toContain('Dishes')
    expect(result.data?.content).toContain('Alice')
    expect(mocks.recordTaskCompletion).toHaveBeenCalledWith(7, 'discord', [{
      discordId: requester.id,
      discordName: requester.username,
      displayName: requester.global_name,
    }], 'reminder-7')
  })

  it('clears the buttons on the original reminder message after a successful confirmation', async () => {
    const token = await startTaskCompletion()
    mocks.selectWhere.mockResolvedValueOnce([{ id: 7, name: 'Dishes', snoozedUntil: null }])

    await confirmCompletion(7, token)

    expect(mocks.editMessage).toHaveBeenCalledWith('channel-1', 'reminder-7', { components: [] })
  })

  it('does not attempt to edit the original message on a duplicate confirmation', async () => {
    const token = await startTaskCompletion()
    mocks.selectWhere.mockResolvedValue([{ id: 7, name: 'Dishes', snoozedUntil: null }])
    mocks.recordTaskCompletion.mockReturnValueOnce({ taskLogId: 0, participants: [], duplicate: true })

    await confirmCompletion(7, token)

    expect(mocks.editMessage).not.toHaveBeenCalled()
  })

  it('credits only selected participants, not the clicker implicitly', async () => {
    const token = await startTaskCompletion()
    await selectParticipants(7, token, ['222', '333'], {
      '222': { id: '222', username: 'bob', global_name: 'Bob' },
      '333': { id: '333', username: 'carol', global_name: 'Carol' },
    })
    mocks.selectWhere.mockResolvedValueOnce([{ id: 7, name: 'Dishes', snoozedUntil: null }])

    const result = await confirmCompletion(7, token)

    expect(result.data?.content).toContain('Bob, Carol')
    expect(mocks.recordTaskCompletion).toHaveBeenCalledWith(7, 'discord', [
      { discordId: '222', discordName: 'bob', displayName: 'Bob' },
      { discordId: '333', discordName: 'carol', displayName: 'Carol' },
    ], 'reminder-7')
  })

  it('deduplicates selected Discord user IDs', async () => {
    const token = await startTaskCompletion()
    await selectParticipants(7, token, ['222', '222'], {
      '222': { id: '222', username: 'bob', global_name: 'Bob' },
    })
    mocks.selectWhere.mockResolvedValueOnce([{ id: 7, name: 'Dishes', snoozedUntil: null }])

    await confirmCompletion(7, token)

    expect(mocks.recordTaskCompletion).toHaveBeenCalledWith(7, 'discord', [
      { discordId: '222', discordName: 'bob', displayName: 'Bob' },
    ], 'reminder-7')
  })

  it('credits the clicker when explicitly selected with other participants', async () => {
    const token = await startTaskCompletion()
    await selectParticipants(7, token, [requester.id, '222'], {
      [requester.id]: requester,
      '222': { id: '222', username: 'bob', global_name: 'Bob' },
    })
    mocks.selectWhere.mockResolvedValueOnce([{ id: 7, name: 'Dishes', snoozedUntil: null }])

    await confirmCompletion(7, token)

    expect(mocks.recordTaskCompletion).toHaveBeenCalledWith(7, 'discord', [
      { discordId: requester.id, discordName: requester.username, displayName: requester.global_name },
      { discordId: '222', discordName: 'bob', displayName: 'Bob' },
    ], 'reminder-7')
  })

  it('rejects selected IDs that Discord did not resolve', async () => {
    const token = await startTaskCompletion()

    const result = await selectParticipants(7, token, ['unknown-user'], {})

    expect(result.data?.content).toContain('could not resolve')
    expect(mocks.recordTaskCompletion).not.toHaveBeenCalled()
  })

  it('cancels a pending completion without recording an event', async () => {
    const token = await startTaskCompletion()
    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: `cancel:task:7:${token}`, component_type: BUTTON },
      member: { user: requester },
    })

    expect(result.data?.content).toContain('cancelled')
    expect(result.data?.components).toEqual([])
    expect(mocks.recordTaskCompletion).not.toHaveBeenCalled()
  })

  it('does not let another user change or submit the selection', async () => {
    const token = await startTaskCompletion()
    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: `confirm:task:7:${token}`, component_type: BUTTON },
      member: { user: { id: 'other-user', username: 'mallory' } },
    })

    expect(result.data?.content).toContain('expired or was already submitted')
    expect(mocks.recordTaskCompletion).not.toHaveBeenCalled()
  })

  it('does not record duplicate confirmation submissions', async () => {
    const token = await startTaskCompletion()
    mocks.selectWhere.mockResolvedValueOnce([{ id: 7, name: 'Dishes', snoozedUntil: null }])

    await confirmCompletion(7, token)
    const duplicate = await confirmCompletion(7, token)

    expect(duplicate.data?.content).toContain('expired or was already submitted')
    expect(mocks.recordTaskCompletion).toHaveBeenCalledOnce()
  })

  it('returns ephemeral error when no Discord user is available', async () => {
    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'complete:task:9', component_type: BUTTON },
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
    mocks.selectWhere.mockResolvedValueOnce([{ snoozedUntil: null }])

    const result = await handleInteraction({
      type: MESSAGE_COMPONENT,
      data: { custom_id: 'snooze:task:10', component_type: BUTTON },
    })

    expect(result.type).toBe(UPDATE_MESSAGE)
    expect(result.data?.content).toContain('😴')
    expect(result.data?.content).toContain('Laundry')
    expect(result.data?.components).toBeDefined()
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
