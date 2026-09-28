import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const returning = vi.fn()
  const updateWhere = vi.fn(() => ({ returning }))
  const set = vi.fn(() => ({ where: updateWhere }))
  const update = vi.fn(() => ({ set }))

  const orderBy = vi.fn()
  const selectWhere = vi.fn()
  const from = vi.fn(() => ({ where: selectWhere, orderBy }))
  const select = vi.fn(() => ({ from }))

  const insertReturning = vi.fn().mockResolvedValue([])
  const insertValues = vi.fn(() => ({ returning: insertReturning }))
  const insert = vi.fn(() => ({ values: insertValues }))
  const recordTaskCompletion = vi.fn((_taskId: number, _source: string, participants: { displayName: string }[]) => ({
    participants: participants.map((participant) => participant.displayName),
  }))

  return { update, set, updateWhere, returning, select, from, selectWhere, orderBy, insert, insertValues, insertReturning, recordTaskCompletion }
})

vi.mock('../db/index.js', () => ({
  db: { update: mocks.update, select: mocks.select, insert: mocks.insert },
}))
vi.mock('./task-completions.js', () => ({ recordTaskCompletion: mocks.recordTaskCompletion }))

import { handleCommand } from './commands.js'

const PREFIX = '!'

const author = { id: 'discord-123', username: 'testuser', global_name: 'Test User' }

describe('handleCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when message does not start with prefix', async () => {
    const result = await handleCommand(PREFIX, { author, content: 'dishes', channel_id: 'ch1' })
    expect(result).toBeNull()
  })

  it('returns null for a bare prefix with no command word', async () => {
    const result = await handleCommand(PREFIX, { author, content: '!', channel_id: 'ch1' })
    expect(result).toBeNull()
  })

  it('logs the task and returns success message for an existing member', async () => {
    mocks.selectWhere.mockResolvedValueOnce([{ id: 1, name: 'Dishes', command: 'dishes', snoozedUntil: null }])

    const result = await handleCommand(PREFIX, { author, content: '!dishes', channel_id: 'ch1' })

    expect(result).toContain('✅')
    expect(result).toContain('Dishes')
    expect(result).toContain('Test User')
    expect(mocks.recordTaskCompletion).toHaveBeenCalledWith(1, 'discord', [{
      discordId: author.id,
      discordName: author.username,
      displayName: author.global_name,
    }])
  })

  it('uses username as the display name when global_name is null', async () => {
    mocks.selectWhere.mockResolvedValueOnce([{ id: 2, name: 'Vacuum', command: 'vacuum', snoozedUntil: null }])
    const authorWithoutGlobalName = { id: 'discord-456', username: 'rawuser', global_name: null }
    const result = await handleCommand(PREFIX, { author: authorWithoutGlobalName, content: '!vacuum', channel_id: 'ch1' })

    expect(result).toContain('rawuser')
  })

  it('returns unknown-command reply listing available commands when task is not found', async () => {
    mocks.selectWhere.mockResolvedValueOnce([]) // task not found
    mocks.orderBy.mockResolvedValueOnce([
      { command: 'dishes', name: 'Dishes' },
      { command: 'vacuum', name: 'Vacuum' },
    ])

    const result = await handleCommand(PREFIX, { author, content: '!unknown', channel_id: 'ch1' })

    expect(result).toContain('❓')
    expect(result).toContain('!dishes')
    expect(result).toContain('!vacuum')
  })

  it('returns a no-tasks message when unknown command is used and no tasks exist', async () => {
    mocks.selectWhere.mockResolvedValueOnce([]) // task not found
    mocks.orderBy.mockResolvedValueOnce([])     // no tasks at all

    const result = await handleCommand(PREFIX, { author, content: '!whatever', channel_id: 'ch1' })

    expect(result).toContain('No tasks have been set up yet')
  })

  it('clears snoozedUntil when completing a snoozed task', async () => {
    mocks.selectWhere.mockResolvedValueOnce([{ id: 4, name: 'Laundry', command: 'laundry', snoozedUntil: '2026-06-29T00:00:00Z' }])

    await handleCommand(PREFIX, { author, content: '!laundry', channel_id: 'ch1' })

    expect(mocks.update).toHaveBeenCalled()
    expect(mocks.set).toHaveBeenCalledWith({ snoozedUntil: null })
  })

  it('does not call update when task has no snooze', async () => {
    mocks.selectWhere.mockResolvedValueOnce([{ id: 5, name: 'Dishes', command: 'dishes', snoozedUntil: null }])

    await handleCommand(PREFIX, { author, content: '!dishes', channel_id: 'ch1' })

    expect(mocks.update).not.toHaveBeenCalled()
  })
})
