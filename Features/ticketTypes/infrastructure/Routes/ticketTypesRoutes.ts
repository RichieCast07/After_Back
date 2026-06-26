import { Router } from "express";
import authMiddleware from "../../../../Core/Middleware/authMiddleware.js";
import requireRole, { Roles } from "../../../../Core/Middleware/roleMiddleware.js";
import type { TicketTypesController } from "../ticketTypesController.js";

export function createTicketTypesRoutes(controller: TicketTypesController): Router {
    const router = Router({ mergeParams: true });

    router.use(authMiddleware);

    // Lectura: cualquier rol autenticado (RP la necesita para vender boletos)
    router.get("/:eventId/ticket-types", (req, res) => controller.getEventTicketTypes(req, res));
    router.get("/:eventId/phases/:phaseId/ticket-types", (req, res) => controller.getPhaseTicketTypePrices(req, res));

    // Escritura: solo admin
    router.use(requireRole(Roles.ADMIN));
    router.post("/:eventId/ticket-types", (req, res) => controller.createEventTicketType(req, res));
    router.put("/:eventId/ticket-types/:ticketTypeId", (req, res) => controller.updateEventTicketType(req, res));
    router.put("/:eventId/phases/:phaseId/ticket-types/:ticketTypeId", (req, res) => controller.updatePhaseTicketTypePrice(req, res));

    return router;
}
