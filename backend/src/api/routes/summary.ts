import { Router } from "express";
import type { SummaryService } from "../../services/summaryService";

export function createSummaryRouter(summaryService: SummaryService) {
  const router = Router();

  router.get("/trend/:endMonth", async (req, res) => {
    try {
      const { endMonth } = req.params;

      if (typeof endMonth !== "string" || !/^\d{4}-\d{2}$/.test(endMonth)) {
        return res.status(400).json({
          error: "endMonth must be in format YYYY-MM"
        });
      }

      const trend = await summaryService.getThreeMonthTrend(endMonth);
      return res.json(trend);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to get three-month trend", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
