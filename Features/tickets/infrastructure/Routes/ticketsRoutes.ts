import { Router } from "express";
import authMiddleware from "../../../../Core/Middleware/authMiddleware.js";
import requireRole, { Roles } from "../../../../Core/Middleware/roleMiddleware.js";
import type { TicketController } from "../ticketController.js";

export function createTicketsRoutes(ticketController: TicketController): Router {
    const router = Router();

    // Público a propósito: link de boleto compartible, sin datos de sesión
    router.get("/public/:token", (req, res) => ticketController.getPublicTicketByToken(req, res));

    router.use(authMiddleware);
    router.post("/", (req, res) => ticketController.sellTicket(req, res));
    router.get("/expired-active", (req, res) => ticketController.getExpiredActiveTickets(req, res));
    router.get("/event/:eventId", (req, res) => ticketController.getTicketsByEventId(req, res));
    router.get("/rp/:rpId", (req, res) => ticketController.getTicketsByRpId(req, res));
    router.get("/:codigo/qr", (req, res) => ticketController.getTicketQr(req, res));
    router.get("/:codigo", (req, res) => ticketController.getTicketByCode(req, res));
    router.patch("/:codigo/use", (req, res) => ticketController.markTicketAsUsed(req, res));

    // Solo admin: borrar boletos
    router.delete("/:codigo", requireRole(Roles.ADMIN), (req, res) => ticketController.deleteTicketByCode(req, res));

    return router;
}
