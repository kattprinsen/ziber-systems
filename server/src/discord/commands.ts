import { eq, asc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { log } from '../logger.js'
import { tasks } from '../db/schema.js'
import { recordTaskCompletion } from './task-completions.js'

export interface GatewayMessage {
  author: { id: string; username: string; global_name?: string | null }
  content: string
  channel_id: string
}

// Returns a reply string if the message was a recognised command, null otherwise.
export async function handleCommand(prefix: string, msg: GatewayMessage): Promise<string | null> {
  if (!msg.content.startsWith(prefix)) return null

  const [cmd] = msg.content.slice(prefix.length).trim().toLowerCase().split(/\s+/)
  if (!cmd) return null

  const [task] = await db.select().from(tasks).where(eq(tasks.command, cmd))
  if (!task) {
    const all = await db.select({ command: tasks.command, name: tasks.name }).from(tasks).orderBy(asc(tasks.name))
    if (all.length === 0) return `❓ Unknown command \`${prefix}${cmd}\`. No tasks have been set up yet.`
    const list = all.map((t) => `• \`${prefix}${t.command}\` — ${t.name}`).join('\n')
    return `❓ Unknown command \`${prefix}${cmd}\`. Available commands:\n${list}`
  }

  const [participant] = recordTaskCompletion(task.id, 'discord', [{
    discordId: msg.author.id,
    discordName: msg.author.username,
    displayName: msg.author.global_name ?? msg.author.username,
  }]).participants

  // Clear snooze on scheduled tasks when manually completed
  if (task.snoozedUntil) {
    await db.update(tasks).set({ snoozedUntil: null }).where(eq(tasks.id, task.id))
  }

  log.info({ taskId: task.id, task: task.name, member: participant }, 'Task logged via Discord command')

  return `✅ **${task.name}** logged for ${participant}!`
}
