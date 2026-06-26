import type { Application } from "express";
import { Router } from "express";
import authMiddleware from "../../../Core/Middleware/authMiddleware.js";
import requireRole, { Roles } from "../../../Core/Middleware/roleMiddleware.js";
import type { PhaseController } from "./phaseController.js";

export function registerPhasesRoutes(app: Application, phaseController: PhaseController): void {
    const phaseRouter = Router({ mergeParams: true });

    phaseRouter.use(authMiddleware);

    // Lectura: cualquier rol autenticado (RP la necesita para vender boletos)
    phaseRouter.get("/:eventId/phases", (req, res) => phaseController.getPhasesByEventId(req, res));

    // Escritura: solo admin
    phaseRouter.use(requireRole(Roles.ADMIN));
    phaseRouter.post("/:eventId/phases", (req, res) => phaseController.createPhase(req, res));
    phaseRouter.put("/:eventId/phases/:phaseId", (req, res) => phaseController.updatePhase(req, res));
    phaseRouter.patch("/:eventId/phases/:phaseId/toggle", (req, res) => phaseController.togglePhaseStatus(req, res));

    app.use("/events", phaseRouter);
}
