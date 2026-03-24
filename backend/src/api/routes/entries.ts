import { Router } from "express";
import type { EntryService } from "../../services/entryService";
import type { SummaryService } from "../../services/summaryService";

export function createEntriesRouter(
  entryService: EntryService,
  summaryService: SummaryService
) {
  const router = Router();

  router.post("/", async (req, res) => {
    try {
      const { consultantId, month, billableHours, nonBillableHours, notes } =
        req.body ?? {};

      if (typeof consultantId !== "string" || !consultantId.trim()) {
        return res.status(400).json({
          error: "consultantId is required and must be a non-empty string"
        });
      }

      if (typeof month !== "string" || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({
          error: "month is required and must be in format YYYY-MM"
        });
      }

      if (typeof billableHours !== "number" || billableHours < 0) {
        return res
          .status(400)
          .json({ error: "billableHours must be a non-negative number" });
      }

      if (typeof nonBillableHours !== "number" || nonBillableHours < 0) {
        return res
          .status(400)
          .json({ error: "nonBillableHours must be a non-negative number" });
      }

      await entryService.upsert({
        consultantId,
        month,
        billableHours,
        nonBillableHours,
        notes
      });

      return res.status(204).send();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to upsert monthly entry", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/summary/:month", async (req, res) => {
    try {
      const { month } = req.params;

      if (typeof month !== "string" || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({
          error: "month must be in format YYYY-MM"
        });
      }

      const summary = await summaryService.getSummaryForMonth(month);
      return res.json(summary);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to get monthly summary", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
