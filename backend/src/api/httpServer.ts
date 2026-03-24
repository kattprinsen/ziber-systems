import express from "express";
import { json } from "express";
import { createRootRouter } from "./routes";
import { JsonConsultantRepository } from "../storage/adapters/jsonConsultantRepository";
import { JsonMonthlyEntryRepository } from "../storage/adapters/jsonMonthlyEntryRepository";
import { ConsultantService } from "../services/consultantService";
import { EntryService } from "../services/entryService";
import { SummaryService } from "../services/summaryService";

export function createApp() {
  // Composition root: instantiate repositories and services
  const consultantRepo = new JsonConsultantRepository();
  const entryRepo = new JsonMonthlyEntryRepository();

  const consultantService = new ConsultantService(consultantRepo);
  const entryService = new EntryService(entryRepo);
  const summaryService = new SummaryService(consultantRepo, entryRepo);

  const app = express();
  app.use(json());

  // Simple CORS for local Vite dev server
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    return next();
  });

  // For now, only register health/version routes; user-story routes will be added later.
  app.use(
    "/api",
    createRootRouter({ consultantService, entryService, summaryService })
  );

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${port}`);
  });
}
