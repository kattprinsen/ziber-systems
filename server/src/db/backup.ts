import { mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import Database from 'better-sqlite3'
import { log } from '../logger.js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const databasePath = join(repoRoot, 'data', 'data.db')
const backupsDirectory = join(repoRoot, 'data', 'backups')
const backupPattern = /^ziber-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.db$/

export async function backupDatabase(
  sourcePath: string,
  backupDirectory: string,
  retainCount = 7,
  now = new Date(),
): Promise<string> {
  if (!Number.isSafeInteger(retainCount) || retainCount < 1) {
    throw new Error('retainCount must be a positive integer')
  }

  mkdirSync(backupDirectory, { recursive: true })
  const timestamp = now.toISOString().replace(/[:.]/g, '-')
  const backupPath = join(backupDirectory, `ziber-${timestamp}.db`)
  const sqlite = new Database(sourcePath, { readonly: true, fileMustExist: true })

  try {
    await sqlite.backup(backupPath)
  } finally {
    sqlite.close()
  }

  const previousBackups = readdirSync(backupDirectory)
    .filter((name) => backupPattern.test(name))
    .sort()
    .reverse()

  for (const oldBackup of previousBackups.slice(retainCount)) {
    unlinkSync(join(backupDirectory, oldBackup))
  }

  return backupPath
}

async function runBackup(): Promise<void> {
  try {
    const backupPath = await backupDatabase(databasePath, backupsDirectory)
    log.info({ backupPath }, 'Database backup created')
  } catch (err) {
    log.error({ err, databasePath }, 'Database backup failed')
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await runBackup()
}