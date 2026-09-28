import { readFileSync } from 'node:fs'
import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'

const migrationFiles = [
  new URL('../../drizzle/0005_sweet_bill_hollister.sql', import.meta.url),
  new URL('../../drizzle/0006_confused_layla_miller.sql', import.meta.url),
  new URL('../../drizzle/0007_common_silhouette.sql', import.meta.url),
]

describe('task completion migrations', () => {
  it('backfills legacy participants and preserves one event per completion', () => {
    const sqlite = new Database(':memory:')
    sqlite.pragma('foreign_keys = ON')
    sqlite.exec(`
      CREATE TABLE tasks (id INTEGER PRIMARY KEY);
      CREATE TABLE members (id INTEGER PRIMARY KEY, discord_id TEXT NOT NULL, discord_name TEXT NOT NULL, display_name TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE task_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL REFERENCES tasks(id),
        member_id INTEGER NOT NULL REFERENCES members(id),
        completed_at TEXT NOT NULL,
        source TEXT NOT NULL
      );
      INSERT INTO tasks (id) VALUES (1);
      INSERT INTO members (id, discord_id, discord_name, display_name, created_at) VALUES (10, 'alice-id', 'alice', 'Alice', '2026-01-01');
      INSERT INTO task_logs (id, task_id, member_id, completed_at, source) VALUES (100, 1, 10, '2026-01-02T10:00:00Z', 'discord');
    `)

    try {
      for (const file of migrationFiles) {
        const migration = readFileSync(file, 'utf8')
        const statements = migration.split('--> statement-breakpoint').map((statement) => statement.trim()).filter(Boolean)
        sqlite.transaction(() => statements.forEach((statement) => sqlite.exec(statement)))()
      }

      const participant = sqlite.prepare('SELECT task_log_id, member_id FROM task_log_members').get() as { task_log_id: number; member_id: number }
      const columns = sqlite.prepare('PRAGMA table_info(task_logs)').all() as { name: string }[]
      const eventCount = sqlite.prepare('SELECT count(*) AS total FROM task_logs').get() as { total: number }
      const participantCount = sqlite.prepare('SELECT count(*) AS total FROM task_log_members').get() as { total: number }

      expect(participant).toEqual({ task_log_id: 100, member_id: 10 })
      expect(columns.map((column) => column.name)).not.toContain('member_id')
      expect(columns.map((column) => column.name)).toContain('discord_message_id')
      expect(eventCount.total).toBe(1)
      expect(participantCount.total).toBe(1)
      expect(sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([])
      expect(() => sqlite.prepare('INSERT INTO task_log_members (task_log_id, member_id) VALUES (100, 10)').run()).toThrow()
      sqlite.prepare("INSERT INTO members (id, discord_id, discord_name, display_name, created_at) VALUES (11, 'bob-id', 'bob', 'Bob', '2026-01-01')").run()
      sqlite.prepare('INSERT INTO task_logs (id, task_id, completed_at, source, discord_message_id) VALUES (101, 1, ?, ?, ?)').run('2026-01-03', 'discord', 'reminder-1')
      sqlite.prepare('INSERT INTO task_log_members (task_log_id, member_id) VALUES (101, 10), (101, 11)').run()

      const completionCount = sqlite.prepare('SELECT count(*) AS total FROM task_logs').get() as { total: number }
      const participantStats = sqlite.prepare(`
        SELECT task_log_members.member_id AS memberId, count(task_log_members.task_log_id) AS taskCount
        FROM task_log_members
        INNER JOIN task_logs ON task_log_members.task_log_id = task_logs.id
        GROUP BY task_log_members.member_id
        ORDER BY memberId
      `).all() as { memberId: number; taskCount: number }[]
      const sharedNames = sqlite.prepare(`
        SELECT group_concat(members.display_name, ', ') AS participants
        FROM task_logs
        INNER JOIN task_log_members ON task_log_members.task_log_id = task_logs.id
        INNER JOIN members ON task_log_members.member_id = members.id
        WHERE task_logs.id = 101
      `).get() as { participants: string }

      expect(completionCount.total).toBe(2)
      expect(participantStats).toEqual([{ memberId: 10, taskCount: 2 }, { memberId: 11, taskCount: 1 }])
      expect(sharedNames.participants).toBe('Alice, Bob')
      expect(() => sqlite.prepare('INSERT INTO task_logs (task_id, completed_at, source, discord_message_id) VALUES (1, ?, ?, ?)').run('2026-01-04', 'discord', 'reminder-1')).toThrow()
    } finally {
      sqlite.close()
    }
  })
})
