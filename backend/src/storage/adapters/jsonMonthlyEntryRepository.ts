import { promises as fs } from "fs";
import { dirname, join } from "path";
import type { MonthlyEntry } from "../../domain/monthlyEntry";
import type { MonthlyEntryRepository } from "../repositories/monthlyEntryRepository";

const DATA_DIR = join(process.cwd(), "data", "entries");

function fileForMonth(month: string): string {
  return join(DATA_DIR, `${month}.json`);
}

async function ensureFile(path: string): Promise<void> {
  const dir = dirname(path);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(path);
  } catch {
    await fs.writeFile(path, "[]", "utf8");
  }
}

async function readAllForMonth(month: string): Promise<MonthlyEntry[]> {
  const file = fileForMonth(month);
  await ensureFile(file);
  const raw = await fs.readFile(file, "utf8");
  try {
    return JSON.parse(raw) as MonthlyEntry[];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to parse monthly entries file", file, err);
    return [];
  }
}

async function writeAllForMonth(month: string, items: MonthlyEntry[]): Promise<void> {
  const file = fileForMonth(month);
  await ensureFile(file);
  await fs.writeFile(file, JSON.stringify(items, null, 2), "utf8");
}

export class JsonMonthlyEntryRepository implements MonthlyEntryRepository {
  async listByMonth(month: string): Promise<MonthlyEntry[]> {
    return readAllForMonth(month);
  }

  async listByConsultant(consultantId: string): Promise<MonthlyEntry[]> {
    // naive implementation: scan all months
    await fs.mkdir(DATA_DIR, { recursive: true });
    const files = await fs.readdir(DATA_DIR);
    const result: MonthlyEntry[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const fullPath = join(DATA_DIR, file);
      const raw = await fs.readFile(fullPath, "utf8");
      try {
        const entries = JSON.parse(raw) as MonthlyEntry[];
        result.push(...entries.filter((e) => e.consultantId === consultantId));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to parse entries file", fullPath, err);
      }
    }
    return result;
  }

  async upsert(entry: MonthlyEntry): Promise<void> {
    const items = await readAllForMonth(entry.month);
    const index = items.findIndex(
      (e) => e.consultantId === entry.consultantId && e.month === entry.month
    );
    if (index >= 0) {
      items[index] = entry;
    } else {
      items.push(entry);
    }
    await writeAllForMonth(entry.month, items);
  }
}
