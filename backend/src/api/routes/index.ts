import { Router } from "express";
import type { ConsultantService } from "../../services/consultantService";
import type { EntryService } from "../../services/entryService";
import type { SummaryService } from "../../services/summaryService";
import { createEntriesRouter } from "./entries";
import { createConsultantsRouter } from "./consultants";

export interface ApiServices {
  consultantService: ConsultantService;
  entryService: EntryService;
  summaryService: SummaryService;
}

export function createRootRouter(services: ApiServices) {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  router.get("/version", (_req, res) => {
    res.json({ version: "0.1.0" });
  });

  router.use(
    "/entries",
    createEntriesRouter(services.entryService, services.summaryService)
  );

  router.use("/consultants", createConsultantsRouter(services.consultantService));

  return router;
}
