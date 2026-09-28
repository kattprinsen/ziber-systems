import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const selectResults: unknown[] = []
  const queryBuilder = {
    from: vi.fn(() => queryBuilder),
    innerJoin: vi.fn(() => queryBuilder),
    orderBy: vi.fn(() => queryBuilder),
    groupBy: vi.fn(() => queryBuilder),
    where: vi.fn(() => queryBuilder),
    limit: vi.fn(() => queryBuilder),
    then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(selectResults.shift()).then(resolve, reject),
  }
  const select = vi.fn(() => queryBuilder)
  return { selectResults, queryBuilder, select }
})

vi.mock('../db/index.js', () => ({ db: { select: mocks.select } }))

import exportRoute from './export.js'

describe('export route shared task participants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.selectResults.length = 0
    process.env.EXPORT_API_KEY = 'test-api-key'
  })

  it('returns one task-log event with all participants nested on the event', async () => {
    mocks.selectResults.push(
      [{ id: 5, completedAt: '2026-09-28T10:00:00.000Z', source: 'discord', taskId: 3, taskName: 'Walk' }],
      [
        { taskLogId: 5, memberId: 1, displayName: 'Alice', discordName: 'alice' },
        { taskLogId: 5, memberId: 2, displayName: 'Bob', discordName: 'bob' },
      ],
    )

    const response = await exportRoute.request('/task-logs', { headers: { 'X-Api-Key': 'test-api-key' } })

    expect(await response.json()).toEqual([{
      id: 5,
      completedAt: '2026-09-28T10:00:00.000Z',
      source: 'discord',
      taskId: 3,
      taskName: 'Walk',
      participants: [
        { memberId: 1, displayName: 'Alice', discordName: 'alice' },
        { memberId: 2, displayName: 'Bob', discordName: 'bob' },
      ],
    }])
  })

  it('counts shared participation for each member', async () => {
    mocks.selectResults.push(
      [
        { id: 1, displayName: 'Alice', discordName: 'alice', createdAt: '2026-01-01' },
        { id: 2, displayName: 'Bob', discordName: 'bob', createdAt: '2026-01-01' },
      ],
      [
        { memberId: 1, taskCount: 1, lastActiveAt: '2026-09-28T10:00:00.000Z' },
        { memberId: 2, taskCount: 1, lastActiveAt: '2026-09-28T10:00:00.000Z' },
      ],
    )

    const response = await exportRoute.request('/members', { headers: { 'X-Api-Key': 'test-api-key' } })
    const body = await response.json()

    expect(body.map((member: { displayName: string; taskCount: number }) => [member.displayName, member.taskCount])).toEqual([
      ['Alice', 1],
      ['Bob', 1],
    ])
  })
})
