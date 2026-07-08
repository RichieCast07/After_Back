import type { Request, Response } from "express";
import type { MetricsService } from "../../Application/metricsService.js";

export class SyncTicketPricesHandler {
    private readonly metricsService: MetricsService;

    constructor(metricsService: MetricsService) {
        this.metricsService = metricsService;
    }

    async handle(req: Request, res: Response): Promise<void> {
        try {
            const eventoId = req.params.eventoId ? Number(req.params.eventoId) : undefined;
            const result = await this.metricsService.syncAllTicketPrices(eventoId);
            res.json({ success: true, updated: result.updated });
        } catch (err: any) {
            res.status(500).json({ message: err?.message ?? "Error syncing ticket prices" });
        }
    }
}
