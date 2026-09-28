import { beforeEach, describe, expect, it, vi } from 'vitest'
import { members, taskLogs } from '../db/schema.js'

const mocks = vi.hoisted(() => {
  const logRows = vi.fn()
  const logReturning = vi.fn(() => ({ all: logRows }))
  const logOnConflict = vi.fn(() => ({ returning: logReturning }))
  const logValues = vi.fn(() => ({ onConflictDoNothing: logOnConflict }))
  const memberRows = vi.fn()
  const memberReturning = vi.fn(() => ({ all: memberRows }))
  const memberValues = vi.fn(() => ({ returning: memberReturning }))
  const memberRun = vi.fn()
  const linkValues = vi.fn(() => ({ run: memberRun }))
  const insert = vi.fn()
  const getMember = vi.fn()
  const where = vi.fn(() => ({ get: getMember }))
  const from = vi.fn(() => ({ where }))
  const select = vi.fn(() => ({ from }))
  const transaction = vi.fn((callback: (tx: unknown) => unknown) => callback({ insert, select }))

  return { insert, logValues, logOnConflict, logRows, memberValues, memberRows, linkValues, memberRun, getMember, from, select, transaction }
})

vi.mock('../db/index.js', () => ({ db: { transaction: mocks.transaction } }))

import { recordTaskCompletion } from './task-completions.js'

const alice = { discordId: 'discord-alice', discordName: 'alice', displayName: 'Alice' }
const bob = { discordId: 'discord-bob', discordName: 'bob', displayName: 'Bob' }

describe('recordTaskCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.insert.mockImplementation((table: unknown) => {
      if (table === taskLogs) return { values: mocks.logValues }
      if (table === members) return { values: mocks.memberValues }
      return { values: mocks.linkValues }
    })
    mocks.logRows.mockReturnValue([{ id: 50 }])
    mocks.getMember.mockReturnValue(undefined)
    mocks.memberRows
      .mockReturnValueOnce([{ id: 10, displayName: 'Alice' }])
      .mockReturnValueOnce([{ id: 11, displayName: 'Bob' }])
  })

  it('records one event and links all unique participants', () => {
    const result = recordTaskCompletion(7, 'discord', [alice, bob, alice], 'discord-message-1')

    expect(result).toEqual({ taskLogId: 50, participants: ['Alice', 'Bob'], duplicate: false })
    expect(mocks.logValues).toHaveBeenCalledWith(expect.objectContaining({
      taskId: 7,
      source: 'discord',
      discordMessageId: 'discord-message-1',
    }))
    expect(mocks.linkValues).toHaveBeenCalledWith([
      { taskLogId: 50, memberId: 10 },
      { taskLogId: 50, memberId: 11 },
    ])
  })

  it('does not create participants or duplicate event links for an already-recorded reminder', () => {
    mocks.logRows.mockReturnValueOnce([])

    const result = recordTaskCompletion(7, 'discord', [alice], 'discord-message-1')

    expect(result).toEqual({ taskLogId: null, participants: [], duplicate: true })
    expect(mocks.select).not.toHaveBeenCalled()
    expect(mocks.memberValues).not.toHaveBeenCalled()
    expect(mocks.linkValues).not.toHaveBeenCalled()
  })

  it('resolves existing members without creating duplicate member rows', () => {
    mocks.getMember.mockReturnValueOnce({ id: 10, displayName: 'Alice (renamed)' })

    const result = recordTaskCompletion(7, 'discord', [alice])

    expect(result.participants).toEqual(['Alice (renamed)'])
    expect(mocks.memberValues).not.toHaveBeenCalled()
    expect(mocks.linkValues).toHaveBeenCalledWith([{ taskLogId: 50, memberId: 10 }])
  })

  it('rejects completion events without participants', () => {
    expect(() => recordTaskCompletion(7, 'discord', [])).toThrow('At least one participant is required')
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
})
