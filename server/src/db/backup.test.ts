import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { backupDatabase } from './backup.js'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('backupDatabase', () => {
  it('creates consistent snapshots and retains only the newest backups', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'ziber-backup-'))
    temporaryDirectories.push(directory)
    const sourcePath = join(directory, 'data.db')
    const backupDirectory = join(directory, 'backups')
    mkdirSync(backupDirectory)
    const sqlite = new Database(sourcePath)
    sqlite.exec('CREATE TABLE entries (value TEXT NOT NULL)')
    sqlite.prepare('INSERT INTO entries (value) VALUES (?)').run('first')
    writeFileSync(join(backupDirectory, 'keep-this.txt'), 'unmanaged')

    await backupDatabase(sourcePath, backupDirectory, 2, new Date('2026-01-01T00:00:00.000Z'))
    sqlite.prepare('INSERT INTO entries (value) VALUES (?)').run('second')
    await backupDatabase(sourcePath, backupDirectory, 2, new Date('2026-01-02T00:00:00.000Z'))
    sqlite.prepare('INSERT INTO entries (value) VALUES (?)').run('third')
    await backupDatabase(sourcePath, backupDirectory, 2, new Date('2026-01-03T00:00:00.000Z'))
    sqlite.close()

    const latestBackupPath = join(backupDirectory, 'ziber-2026-01-03T00-00-00-000Z.db')
    const snapshot = new Database(latestBackupPath, { readonly: true })
    const values = snapshot.prepare('SELECT value FROM entries ORDER BY rowid').all() as { value: string }[]
    snapshot.close()

    expect(values).toEqual([{ value: 'first' }, { value: 'second' }, { value: 'third' }])
    expect(readdirSync(backupDirectory).filter((name) => name.endsWith('.db'))).toEqual([
      'ziber-2026-01-02T00-00-00-000Z.db',
      'ziber-2026-01-03T00-00-00-000Z.db',
    ])
    expect(readdirSync(backupDirectory)).toContain('keep-this.txt')
  })

  it('rejects a retention count below one', async () => {
    await expect(backupDatabase('unused.db', 'unused-backups', 0)).rejects.toThrow('retainCount must be a positive integer')
  })
})