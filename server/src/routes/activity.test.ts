import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const selectResults: unknown[] = []
  const queryBuilder = {
    from: vi.fn(() => queryBuilder),
    innerJoin: vi.fn(() => queryBuilder),
    then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(selectResults.shift()).then(resolve, reject),
  }
  const select = vi.fn(() => queryBuilder)
  const all = vi.fn()
  return { selectResults, queryBuilder, select, all }
})

vi.mock('../db/index.js', () => ({ db: { select: mocks.select, all: mocks.all } }))

import activityRoute from './activity.js'

describe('activity route shared task participants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.selectResults.length = 0
    mocks.selectResults.push([{ total: 1 }])
    mocks.all.mockResolvedValue([
      { id: 'task-5', type: 'task', name: 'Walk', who: 'Alice, Bob', source: 'discord', timestamp: '2026-09-28T10:00:00.000Z' },
    ])
  })

  it('returns a shared completion once with all credited members', async () => {
    const response = await activityRoute.request('/?type=task')
    const body = await response.json()

    expect(body.total).toBe(1)
    expect(body.entries).toEqual([
      { id: 'task-5', type: 'task', name: 'Walk', who: 'Alice, Bob', source: 'discord', timestamp: '2026-09-28T10:00:00.000Z' },
    ])
  })
})
