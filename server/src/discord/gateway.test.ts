import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'events'

// ---- hoisted mocks ----

const mocks = vi.hoisted(() => {
  // Regular function (not arrow) so it can be used as a constructor via `new WebSocket(...)`
  const WS = vi.fn(function WS() {})
  return { WS }
})

vi.mock('ws', () => ({ default: mocks.WS }))
vi.mock('./config.js', () => ({
  discordConfig: { botToken: 'test-token' },
}))

// Create a real EventEmitter instance to serve as the fake WebSocket.
// Wire it up after the hoisted block so EventEmitter is available.
const wsInstance = Object.assign(new EventEmitter(), {
  send: vi.fn(),
  close: vi.fn(),
})
mocks.WS.mockImplementation(function () { return wsInstance })

import { startGateway } from './gateway.js'
import type { GatewayMessage } from './commands.js'

type MessageHandler = (message: GatewayMessage) => Promise<void>

// ---- helpers ----

function send(payload: object) {
  wsInstance.emit('message', JSON.stringify(payload))
}

// ---- tests ----

describe('startGateway', () => {
  let onMessage: MessageHandler

  beforeEach(() => {
    vi.clearAllMocks()
    wsInstance.send.mockReset()
    wsInstance.close.mockReset()
    wsInstance.removeAllListeners()
    mocks.WS.mockImplementation(function () { return wsInstance })
    onMessage = vi.fn().mockResolvedValue(undefined) as unknown as MessageHandler
  })

  afterEach(() => vi.useRealTimers())

  it('creates a WebSocket connection when started', () => {
    startGateway(onMessage)
    expect(mocks.WS).toHaveBeenCalled()
  })

  it('sends IDENTIFY after receiving HELLO', () => {
    vi.useFakeTimers()
    startGateway(onMessage)

    send({ op: 10, d: { heartbeat_interval: 40000 }, s: null, t: null })

    const identifyCall = wsInstance.send.mock.calls.find((c: string[]) =>
      JSON.parse(c[0]).op === 2
    )
    expect(identifyCall).toBeDefined()
    expect(JSON.parse(identifyCall![0]).d.token).toBe('test-token')
  })

  it('starts heartbeat interval after HELLO', () => {
    vi.useFakeTimers()
    startGateway(onMessage)

    send({ op: 10, d: { heartbeat_interval: 40000 }, s: null, t: null })
    const countBefore = wsInstance.send.mock.calls.length

    vi.advanceTimersByTime(40000)

    const heartbeats = wsInstance.send.mock.calls
      .slice(countBefore)
      .filter((c: string[]) => JSON.parse(c[0]).op === 1)
    expect(heartbeats.length).toBe(1)
  })

  it('echoes the latest sequence number in heartbeats', () => {
    vi.useFakeTimers()
    startGateway(onMessage)

    send({ op: 10, d: { heartbeat_interval: 40000 }, s: null, t: null })
    send({ op: 0, d: {}, s: 42, t: 'READY' })

    vi.advanceTimersByTime(40000)

    const heartbeat = JSON.parse(
      wsInstance.send.mock.calls.find((c: string[]) => JSON.parse(c[0]).op === 1)![0]
    )
    expect(heartbeat.d).toBe(42)
  })

  it('calls onMessage for MESSAGE_CREATE from non-bot users', async () => {
    startGateway(onMessage)

    const msg = { content: '!dishes', channel_id: 'ch1', author: { id: '123', username: 'alice' } }
    send({ op: 0, d: msg, s: 1, t: 'MESSAGE_CREATE' })

    await vi.waitFor(() => expect(onMessage).toHaveBeenCalledOnce())
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ content: '!dishes' }))
  })

  it('ignores MESSAGE_CREATE from bots', async () => {
    startGateway(onMessage)

    const msg = { content: '!dishes', channel_id: 'ch1', author: { id: 'bot1', username: 'somebot', bot: true } }
    send({ op: 0, d: msg, s: 1, t: 'MESSAGE_CREATE' })

    await new Promise((r) => setTimeout(r, 0))
    expect(onMessage).not.toHaveBeenCalled()
  })

  it('closes the socket on OP_RECONNECT', () => {
    startGateway(onMessage)
    send({ op: 7, d: null, s: null, t: null })
    expect(wsInstance.close).toHaveBeenCalled()
  })

  it('closes the socket on OP_INVALID_SESSION', () => {
    startGateway(onMessage)
    send({ op: 9, d: false, s: null, t: null })
    expect(wsInstance.close).toHaveBeenCalled()
  })

  it('does not reconnect on auth failure (code 4004)', () => {
    vi.useFakeTimers()
    startGateway(onMessage)

    const callsBefore = mocks.WS.mock.calls.length
    wsInstance.emit('close', 4004)
    vi.advanceTimersByTime(10000)

    expect(mocks.WS.mock.calls.length).toBe(callsBefore)
  })

  it('reconnects after a non-auth close code', () => {
    vi.useFakeTimers()
    startGateway(onMessage)

    const callsBefore = mocks.WS.mock.calls.length
    wsInstance.emit('close', 1006)
    vi.advanceTimersByTime(5000)

    expect(mocks.WS.mock.calls.length).toBeGreaterThan(callsBefore)
  })

  it('silently drops malformed JSON messages', () => {
    startGateway(onMessage)
    expect(() => wsInstance.emit('message', 'not-json')).not.toThrow()
    expect(onMessage).not.toHaveBeenCalled()
  })
})
