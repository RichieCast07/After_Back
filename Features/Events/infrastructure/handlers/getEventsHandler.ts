import type { Request, Response } from "express";
import { Roles } from "../../../../Core/Middleware/roleMiddleware.js";
import type { GetEventsUseCase } from "../../Application/getEventsUseCase.js";

export class GetEventsHandler {
    private readonly getEventsUseCase: GetEventsUseCase;

    constructor(getEventsUseCase: GetEventsUseCase) {
        this.getEventsUseCase = getEventsUseCase;
    }

    async handle(req: Request, res: Response): Promise<void> {
        try {
            // Los RP no ven eventos cuyo día ya terminó; admin y manager los ven todos.
            const rolId = (req as { user?: { rol_id?: number } }).user?.rol_id;
            const onlyUpcoming = rolId === Roles.RP;
            const events = await this.getEventsUseCase.execute({ onlyUpcoming });
            res.json(events);
        } catch (error) {
            res.status(500).json({ error: String(error) });
        }
    }
}
