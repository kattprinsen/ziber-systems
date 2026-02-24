import { z } from 'zod';

// ============================================================================
// Tidig Time Schemas
// ============================================================================

export const TidigTimeEntrySchema = z
  .object({
    timeRowId: z.number().optional(),
    empId: z.string().min(1, 'empId cannot be empty'),
    date: z.string().min(1, 'date cannot be empty'),
    hours: z.number(),
    customer: z
      .object({
        customerId: z.union([z.number(), z.string()]),
        name: z.string().nullable().optional(),
      })
      .optional()
      .nullable(),
    project: z
      .object({
        projectId: z.union([z.number(), z.string()]),
        name: z.string().nullable().optional(),
      })
      .optional()
      .nullable(),
    article: z
      .object({
        articleId: z.union([z.number(), z.string()]).optional(),
        name: z.string().nullable().optional(),
      })
      .optional()
      .nullable(),
    activity: z.string().nullable().optional(),
    caseNumber: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    isSubmitted: z.boolean().nullable().optional(),
  })
  .passthrough();

export type TidigTimeEntry = z.infer<typeof TidigTimeEntrySchema>;

export const TidigTimeResponseSchema = z.array(TidigTimeEntrySchema);

export type TidigTimeResponse = z.infer<typeof TidigTimeResponseSchema>;

// ============================================================================
// Internal Models
// ============================================================================

export interface TimeEntry {
  empId: string;
  date: string;
  hours: number;
  customerId?: string | null;
  customerName?: string | null;
  projectId?: string | null;
  projectName?: string | null;
}

export interface TimeFilter {
  empId: string;
  fromDate: string;
  toDate: string;
  customerId?: string;
  customerName?: string;
  projectId?: string;
  projectName?: string;
}

export function normalizeTimeEntries(entries: TidigTimeResponse): TimeEntry[] {
  return entries.map((entry) => ({
    empId: entry.empId,
    date: entry.date,
    hours: entry.hours,
    customerId:
      entry.customer && entry.customer.customerId != null
        ? String(entry.customer.customerId)
        : null,
    customerName: entry.customer?.name ?? null,
    projectId:
      entry.project && entry.project.projectId != null
        ? String(entry.project.projectId)
        : null,
    projectName: entry.project?.name ?? null,
  }));
}

export function isValidInterval(fromDate: string, toDate: string): boolean {
  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return false;
  }

  // fromDate must be strictly before toDate
  return from < to;
}
