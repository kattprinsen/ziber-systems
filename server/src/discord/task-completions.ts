import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { log } from '../logger.js'
import { members, taskLogMembers, taskLogs } from '../db/schema.js'

export interface TaskParticipantInput {
  discordId: string
  discordName: string
  displayName: string
}

export interface RecordedTaskCompletion {
  taskLogId: number | null
  participants: string[]
  duplicate: boolean
}

export function recordTaskCompletion(
  taskId: number,
  source: 'discord' | 'web',
  participantInputs: TaskParticipantInput[],
  discordMessageId?: string,
): RecordedTaskCompletion {
  const uniqueParticipants = [...new Map(participantInputs.map((participant) => [participant.discordId, participant])).values()]
  if (uniqueParticipants.length === 0) throw new Error('At least one participant is required')

  const recorded = db.transaction((tx) => {
    const [taskLog] = tx.insert(taskLogs).values({
      taskId,
      completedAt: new Date().toISOString(),
      source,
      discordMessageId: discordMessageId ?? null,
    }).onConflictDoNothing().returning().all()

    if (!taskLog) return { taskLogId: null, participants: [], duplicate: true }

    const participantRows = uniqueParticipants.map((participant) => {
      const existing = tx.select().from(members).where(eq(members.discordId, participant.discordId)).get()
      if (existing) return existing

      const [created] = tx.insert(members).values({
        ...participant,
        createdAt: new Date().toISOString(),
      }).returning().all()
      log.info({ discordId: participant.discordId, displayName: participant.displayName }, 'New member created from task completion')
      return created
    })

    tx.insert(taskLogMembers).values(participantRows.map((member) => ({
      taskLogId: taskLog.id,
      memberId: member.id,
    }))).run()

    return {
      taskLogId: taskLog.id,
      participants: participantRows.map((member) => member.displayName),
      duplicate: false,
    }
  })

  return recorded
}
