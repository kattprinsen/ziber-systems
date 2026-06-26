import { eq, asc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { log } from '../logger.js'
import { tasks, taskLogs, members } from '../db/schema.js'

export interface GatewayMessage {
  author: { id: string; username: string; global_name?: string | null }
  content: string
  channel_id: string
}

async function upsertMember(author: GatewayMessage['author']): Promise<{ id: number; displayName: string }> {
  const existing = await db.select().from(members).where(eq(members.discordId, author.id))
  if (existing.length > 0) return existing[0]

  const displayName = author.global_name ?? author.username
  const [created] = await db
    .insert(members)
    .values({
      discordId: author.id,
      discordName: author.username,
      displayName,
      createdAt: new Date().toISOString(),
    })
    .returning()

  log.info({ discordId: author.id, displayName }, 'New member auto-created from Discord')
  return created
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

  const member = await upsertMember(msg.author)

  const now = new Date().toISOString()
  await db.insert(taskLogs).values({
    taskId: task.id,
    memberId: member.id,
    completedAt: now,
    source: 'discord',
  })

  // Clear snooze on scheduled tasks when manually completed
  if (task.snoozedUntil) {
    await db.update(tasks).set({ snoozedUntil: null }).where(eq(tasks.id, task.id))
  }

  log.info({ taskId: task.id, task: task.name, member: member.displayName }, 'Task logged via Discord command')

  return `✅ **${task.name}** logged for ${member.displayName}!`
}
