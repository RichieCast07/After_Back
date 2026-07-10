import { Router } from "express";
import authMiddleware from "../../../../Core/Middleware/authMiddleware.js";
import requireRole, { Roles } from "../../../../Core/Middleware/roleMiddleware.js";
import type { ClientController } from "../clientController.js";

export function createClientsRoutes(clientController: ClientController): Router {
    const router = Router();

    router.use(authMiddleware);

    router.get("/search", (req, res) => clientController.searchClientByPhone(req, res));
    router.get("/search/:telefono", (req, res) => clientController.searchClientByPhone(req, res));
    router.get("/search-phone", (req, res) => clientController.searchClientByPhone(req, res));
    router.get("/by-phone", (req, res) => clientController.searchClientByPhone(req, res));
    router.post("/", (req, res) => clientController.createClient(req, res));
    router.get("/:id", (req, res) => clientController.getClientById(req, res));

    router.use(requireRole(Roles.ADMIN));
    router.get("/", (req, res) => clientController.getClients(req, res));
    router.get("/export/csv", (req, res) => clientController.downloadClientsCsv(req, res));
    router.patch("/:id", (req, res) => clientController.updateClient(req, res));
    router.delete("/:id", (req, res) => clientController.deleteClient(req, res));

    return router;
}
