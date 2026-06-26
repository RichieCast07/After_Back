import { Router } from "express";
import authMiddleware from "../../../../Core/Middleware/authMiddleware.js";
import requireRole, { Roles } from "../../../../Core/Middleware/roleMiddleware.js";
import type { EventController } from "../eventController.js";

export function createEventsRoutes(eventController: EventController): Router {
    const router = Router();

    router.use(authMiddleware);

    router.get("/", (req, res) => eventController.getEvents(req, res));
    router.get("/:id", (req, res) => eventController.getEventById(req, res));

    router.use(requireRole(Roles.ADMIN));
    router.post("/", (req, res) => eventController.createEvent(req, res));
    router.delete("/:id", (req, res) => eventController.deleteEvent(req, res));
    router.put("/:id", (req, res) => eventController.updateEvent(req, res));
    router.patch("/:id/toggle", (req, res) => eventController.toggleEventStatus(req, res));

    return router;
}
