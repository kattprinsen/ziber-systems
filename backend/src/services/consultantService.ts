import type { Consultant } from "../domain/consultant";
import type { ConsultantRepository } from "../storage/repositories/consultantRepository";

export class ConsultantService {
  constructor(private readonly repo: ConsultantRepository) {}

  listAll(): Promise<Consultant[]> {
    return this.repo.listAll();
  }

  async upsert(consultant: Consultant): Promise<void> {
    await this.repo.save(consultant);
  }

   async listActive(): Promise<Consultant[]> {
    const all = await this.repo.listAll();
    return all.filter((c) => c.status === "active");
  }

  async setStatus(id: string, status: Consultant["status"]): Promise<Consultant | null> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      return null;
    }
    const updated: Consultant = { ...existing, status };
    await this.repo.save(updated);
    return updated;
  }
}
