import { Router } from "express";
import authMiddleware from "../../../../Core/Middleware/authMiddleware.js";
import type { MetricsController } from "../metricsController.js";

export function createMetricsRoutes(metricsController: MetricsController): Router {
    const router = Router();

    router.use(authMiddleware);

    router.get("/summary", (req, res) => metricsController.getOverallMetrics(req, res));
    router.get("/rps", (req, res) => metricsController.getRpMetrics(req, res));
    router.get("/event/:eventId", (req, res) => metricsController.getEventMetrics(req, res));
    router.get("/event/:eventId/rps", (req, res) => metricsController.getEventRpMetrics(req, res));
    router.get("/event/:eventId/phases", (req, res) => metricsController.getEventPhaseMetrics(req, res));

    router.post("/sync-prices", (req, res) => metricsController.syncTicketPrices(req, res));
    router.post("/sync-prices/:eventoId", (req, res) => metricsController.syncTicketPrices(req, res));

    return router;
}
