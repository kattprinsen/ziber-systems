const DEFAULT_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${DEFAULT_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed: ${res.status} ${res.statusText} ${text}`);
  }

  // Handle empty/204 responses gracefully (e.g., POST upserts)
  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export function getHealth() {
  return request<{ status: string; version?: string }>("/api/health");
}

export interface ConsultantDto {
  id: string;
  name: string;
  salaryMonthly: number;
  hourlyRate: number;
  status: string;
  notes?: string;
}

export interface ConsultantSummaryRow {
  consultant: {
    id: string;
    name: string;
    salaryMonthly: number;
    hourlyRate: number;
    status: string;
    notes?: string;
  };
  month: string;
  billableHours: number;
  nonBillableHours: number;
  revenueApprox: number;
  costApprox: number;
  margin: number;
  utilization: number;
}

export interface TeamSummary {
  month: string;
  consultants: ConsultantSummaryRow[];
  totalRevenueApprox: number;
  totalCostApprox: number;
  totalMargin: number;
  averageUtilization: number;
}

export interface UpsertEntryPayload {
  consultantId: string;
  month: string;
  billableHours: number;
  nonBillableHours: number;
  notes?: string;
}

export function upsertEntry(payload: UpsertEntryPayload): Promise<void> {
  return request<void>("/api/entries", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getMonthlySummary(month: string): Promise<TeamSummary> {
  return request<TeamSummary>(`/api/entries/summary/${month}`);
}

export function getConsultants(): Promise<ConsultantDto[]> {
  return request<ConsultantDto[]>("/api/consultants");
}

export interface UpsertConsultantPayload {
  id?: string;
  name: string;
  salaryMonthly: number;
  hourlyRate: number;
  status: "active" | "inactive";
  notes?: string;
}

export function upsertConsultant(
  payload: UpsertConsultantPayload
): Promise<void> {
  return request<void>("/api/consultants", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateConsultantStatus(
  id: string,
  status: "active" | "inactive"
): Promise<ConsultantDto> {
  return request<ConsultantDto>(`/api/consultants/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}
