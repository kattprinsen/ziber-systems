import { discordConfig } from './config.js'

const BASE = 'https://discord.com/api/v10'

async function discordFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${discordConfig.botToken}`,
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Discord API ${res.status}: ${text}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export async function sendMessage(channelId: string, payload: object): Promise<{ id: string }> {
  return discordFetch(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<{ id: string }>
}
