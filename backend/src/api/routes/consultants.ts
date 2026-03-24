import { Router } from "express";
import type { ConsultantService } from "../../services/consultantService";

export function createConsultantsRouter(consultantService: ConsultantService) {
  const router = Router();

  router.get("/", async (_req, res) => {
    try {
      const consultants = await consultantService.listAll();
      return res.json(consultants);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to list consultants", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const { id, name, salaryMonthly, hourlyRate, status, notes } =
        req.body ?? {};

      if (typeof name !== "string" || !name.trim()) {
        return res
          .status(400)
          .json({ error: "name is required and must be a non-empty string" });
      }

      const salary = Number(salaryMonthly ?? 0);
      const hourly = Number(hourlyRate ?? 0);
      const normalizedStatus =
        status === "inactive" ? "inactive" : ("active" as const);

      const consultantId =
        typeof id === "string" && id.trim().length > 0
          ? id
          : `c-${Date.now().toString(36)}`;

      await consultantService.upsert({
        id: consultantId,
        name: name.trim(),
        salaryMonthly: Number.isFinite(salary) && salary >= 0 ? salary : 0,
        hourlyRate: Number.isFinite(hourly) && hourly >= 0 ? hourly : 0,
        status: normalizedStatus,
        notes
      });

      return res.status(204).send();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to upsert consultant", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.patch("/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body ?? {};

      if (status !== "active" && status !== "inactive") {
        return res
          .status(400)
          .json({ error: "status must be 'active' or 'inactive'" });
      }

      const updated = await consultantService.setStatus(id, status);
      if (!updated) {
        return res.status(404).json({ error: "Consultant not found" });
      }

      return res.json(updated);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to update consultant status", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
