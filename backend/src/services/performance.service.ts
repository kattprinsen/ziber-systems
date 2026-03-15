import fsExtra from 'fs-extra';
import { join, dirname } from 'path';

const { readJson, outputJson, pathExists } = fsExtra;
import { fileURLToPath } from 'url';
import type { PerformanceConfig, MonthlySnapshot } from '../types/performance.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_PATH = join(__dirname, '../data/performance-config.json');
const SNAPSHOTS_DIR = join(__dirname, '../data/snapshots');

// ============================================================================
// Performance Config
// ============================================================================

export async function readConfig(): Promise<PerformanceConfig> {
  const exists = await pathExists(CONFIG_PATH);
  if (!exists) {
    return { target: null, updatedAt: null };
  }
  try {
    const data = await readJson(CONFIG_PATH);
    return data as PerformanceConfig;
  } catch {
    return { target: null, updatedAt: null };
  }
}

export async function writeConfig(config: PerformanceConfig): Promise<void> {
  await outputJson(CONFIG_PATH, config, { spaces: 2 });
}

// ============================================================================
// Monthly Snapshots
// ============================================================================

function snapshotPath(year: number, month: number): string {
  const mm = String(month).padStart(2, '0');
  return join(SNAPSHOTS_DIR, `${year}-${mm}.json`);
}

export async function readSnapshot(
  year: number,
  month: number
): Promise<MonthlySnapshot | null> {
  const filePath = snapshotPath(year, month);
  const exists = await pathExists(filePath);
  if (!exists) {
    return null;
  }
  try {
    const data = await readJson(filePath);
    return data as MonthlySnapshot;
  } catch {
    return null;
  }
}

export async function writeSnapshot(snapshot: MonthlySnapshot): Promise<void> {
  const filePath = snapshotPath(snapshot.year, snapshot.month);
  await outputJson(filePath, snapshot, { spaces: 2 });
}

/**
 * Returns an array of available snapshot keys in 'YYYY-MM' format,
 * sorted descending (most recent first).
 */
export async function listSnapshots(): Promise<string[]> {
  const { readdir } = await import('fs/promises');
  const dirExists = await pathExists(SNAPSHOTS_DIR);
  if (!dirExists) {
    return [];
  }
  try {
    const files = await readdir(SNAPSHOTS_DIR);
    return files
      .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
      .map((f) => f.replace('.json', ''))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}
