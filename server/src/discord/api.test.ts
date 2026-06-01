import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendMessage } from './api.js'

vi.mock('./config.js', () => ({
  discordConfig: {
    botToken: 'test-bot-token',
    channelId: 'test-channel-id',
    publicKey: 'test-public-key',
  },
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeResponse(status: number, body: unknown, ok = status >= 200 && status < 300) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  }
}

describe('sendMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns parsed response on success', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { id: '123456' }))

    const result = await sendMessage('channel-id', { content: 'hello' })

    expect(result).toEqual({ id: '123456' })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('retries once after a 429 and returns the successful result', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse(429, { retry_after: 0, global: false }, false))
      .mockResolvedValueOnce(makeResponse(200, { id: '789' }))

    const result = await sendMessage('channel-id', { content: 'hello' })

    expect(result).toEqual({ id: '789' })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('uses the retry_after value from the 429 response body', async () => {
    vi.useFakeTimers()

    mockFetch
      .mockResolvedValueOnce(makeResponse(429, { retry_after: 1.5, global: false }, false))
      .mockResolvedValueOnce(makeResponse(200, { id: 'ok' }))

    const promise = sendMessage('channel-id', { content: 'hello' })

    // Advance past the 1500ms retry delay
    await vi.advanceTimersByTimeAsync(1500)
    const result = await promise

    expect(result).toEqual({ id: 'ok' })
    vi.useRealTimers()
  })

  it('throws on non-429 error responses', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(500, { message: 'Internal Server Error' }, false))

    await expect(sendMessage('channel-id', { content: 'hello' })).rejects.toThrow('Discord API 500')
  })

  it('sends Authorization header with bot token', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { id: 'abc' }))

    await sendMessage('channel-id', { content: 'hello' })

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }]
    expect(init.headers['Authorization']).toBe('Bot test-bot-token')
  })
})
