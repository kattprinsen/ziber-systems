import type { Consultant } from "../../domain/consultant";

export interface ConsultantRepository {
  listAll(): Promise<Consultant[]>;
  findById(id: string): Promise<Consultant | null>;
  save(consultant: Consultant): Promise<void>;
}
