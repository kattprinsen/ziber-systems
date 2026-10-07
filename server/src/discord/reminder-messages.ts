import { and, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { reminderMessages } from '../db/schema.js'

export type ReminderDomain = 'plant' | 'task'

export interface TrackedReminder {
  channelId: string
  messageId: string
}

export async function getReminderMessage(domain: ReminderDomain, itemId: number): Promise<TrackedReminder | undefined> {
  const [row] = await db
    .select({ channelId: reminderMessages.channelId, messageId: reminderMessages.messageId })
    .from(reminderMessages)
    .where(and(eq(reminderMessages.domain, domain), eq(reminderMessages.itemId, itemId)))
  return row
}

export async function saveReminderMessage(domain: ReminderDomain, itemId: number, channelId: string, messageId: string): Promise<void> {
  await db
    .insert(reminderMessages)
    .values({ domain, itemId, channelId, messageId })
    .onConflictDoUpdate({
      target: [reminderMessages.domain, reminderMessages.itemId],
      set: { channelId, messageId },
    })
}
