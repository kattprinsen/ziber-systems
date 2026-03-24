import { promises as fs } from "fs";
import { dirname, join } from "path";
import type { Consultant } from "../../domain/consultant";
import type { ConsultantRepository } from "../repositories/consultantRepository";

const DATA_FILE = join(process.cwd(), "data", "consultants.json");

async function ensureFile(): Promise<void> {
  const dir = dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

async function readAll(): Promise<Consultant[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as Consultant[];
}

async function writeAll(items: Consultant[]): Promise<void> {
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), "utf8");
}

export class JsonConsultantRepository implements ConsultantRepository {
  async listAll(): Promise<Consultant[]> {
    return readAll();
  }

  async findById(id: string): Promise<Consultant | null> {
    const all = await readAll();
    return all.find((c) => c.id === id) ?? null;
  }

  async save(consultant: Consultant): Promise<void> {
    const all = await readAll();
    const index = all.findIndex((c) => c.id === consultant.id);
    if (index >= 0) {
      all[index] = consultant;
    } else {
      all.push(consultant);
    }
    await writeAll(all);
  }
}
