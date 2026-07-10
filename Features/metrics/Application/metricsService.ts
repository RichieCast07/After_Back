import db from "../../../Core/db.js";
import type { EventMetrics, EventRpMetrics, OverallMetrics, PhaseMetrics, RpMetrics } from "../Domain/Data/metrics.js";

export class MetricsService {
    async getOverallMetrics(): Promise<OverallMetrics> {
        const connection = await db.pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT 
                    COUNT(*) as total_boletos_vendidos,
                    SUM(precio) as total_ingresos,
                    SUM(comision_rp) as total_comisiones_rp,
                    SUM(CASE WHEN estado = 'ACTIVO' THEN 1 ELSE 0 END) as boletos_activos,
                    SUM(CASE WHEN estado = 'USADO' THEN 1 ELSE 0 END) as boletos_usados
                 FROM boletos`
            );
            const result = rows as any[];
            return {
                total_boletos_vendidos: result[0]?.total_boletos_vendidos || 0,
                total_ingresos: result[0]?.total_ingresos || 0,
                total_comisiones_rp: result[0]?.total_comisiones_rp || 0,
                boletos_activos: result[0]?.boletos_activos || 0,
                boletos_usados: result[0]?.boletos_usados || 0
            };
        } finally {
            connection.release();
        }
    }

    async getRpMetrics(): Promise<RpMetrics[]> {
        const connection = await db.pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT 
                    u.id as rp_id,
                    u.username,
                    COUNT(b.id) as boletos_vendidos,
                    SUM(b.precio) as ingresos_totales,
                    SUM(b.comision_rp) as comisiones_totales
                 FROM usuarios u
                 LEFT JOIN boletos b ON u.id = b.rp_id
                 WHERE u.rol_id = 2
                 GROUP BY u.id, u.username
                 ORDER BY boletos_vendidos DESC
                 LIMIT 10`
            );
            return rows as RpMetrics[];
        } finally {
            connection.release();
        }
    }

    async getEventMetrics(eventId: number): Promise<EventMetrics> {
        const connection = await db.pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT 
                    e.id as evento_id,
                    e.nombre,
                    COUNT(b.id) as boletos_vendidos,
                    COALESCE(SUM(b.precio), 0) as ingresos_totales,
                    COALESCE(SUM(b.comision_rp), 0) as comisiones_rp,
                    COALESCE(SUM(CASE WHEN b.estado = 'ACTIVO' THEN 1 ELSE 0 END), 0) as boletos_activos,
                    COALESCE(SUM(CASE WHEN b.estado = 'USADO' THEN 1 ELSE 0 END), 0) as boletos_usados
                 FROM eventos e
                 LEFT JOIN boletos b ON e.id = b.evento_id
                 WHERE e.id = ?
                 GROUP BY e.id, e.nombre`,
                [eventId]
            );
            const result = rows as any[];
            if (result.length === 0) throw new Error("Event not found");
            return result[0] as EventMetrics;
        } finally {
            connection.release();
        }
    }

    async getEventPhaseMetrics(eventId: number): Promise<PhaseMetrics[]> {
        const connection = await db.pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT 
                    f.id as fase_id,
                    f.nombre,
                    f.precio,
                    COUNT(b.id) as boletos_vendidos,
                    SUM(b.precio) as ingresos_totales
                 FROM fases f
                 LEFT JOIN boletos b ON f.id = b.fase_id
                 WHERE f.evento_id = ?
                 GROUP BY f.id, f.nombre, f.precio
                 ORDER BY f.fecha_inicio ASC`,
                [eventId]
            );
            return rows as PhaseMetrics[];
        } finally {
            connection.release();
        }
    }

    async syncAllTicketPrices(eventoId?: number): Promise<{ updated: number }> {
        const connection = await db.pool.getConnection();
        try {
            const ptpJoin = eventoId ? "INNER JOIN fases ff ON ff.id = ptp.fase_id" : "";
            const ptpWhere = eventoId ? "WHERE ff.evento_id = ?" : "";
            const ptpParams = eventoId ? [eventoId] : [];
            await connection.query(
                `UPDATE phase_ticket_type_prices ptp
                 ${ptpJoin}
                 SET ptp.precio = (SELECT f2.precio FROM fases f2 WHERE f2.id = ptp.fase_id)
                 ${ptpWhere}`,
                ptpParams
            );

            const innerFilter = eventoId ? "WHERE b2.evento_id = ?" : "";
            const outerFilter = eventoId ? "WHERE b.evento_id = ?" : "";
            const params = eventoId ? [eventoId, eventoId] : [];
            const [result] = await connection.query(`
                UPDATE boletos b
                INNER JOIN (
                    SELECT b2.id AS ticket_id,
                           COALESCE(
                               CASE WHEN b2.fecha_venta IS NOT NULL THEN (
                                   SELECT f.id
                                   FROM fases f
                                   WHERE f.evento_id = b2.evento_id
                                     AND b2.fecha_venta >= f.fecha_inicio
                                     AND b2.fecha_venta <= f.fecha_fin
                                   ORDER BY f.fecha_inicio DESC, f.id DESC
                                   LIMIT 1
                               ) END,
                               b2.fase_id
                           ) AS correct_fase_id
                    FROM boletos b2
                    ${innerFilter}
                ) AS fase_lookup
                    ON fase_lookup.ticket_id = b.id AND fase_lookup.correct_fase_id IS NOT NULL
                INNER JOIN fases f ON f.id = fase_lookup.correct_fase_id
                INNER JOIN usuarios u ON u.id = b.rp_id
                LEFT JOIN phase_ticket_type_prices ptp
                    ON ptp.fase_id = f.id
                    AND ptp.ticket_type_id = (
                        SELECT tt.id FROM ticket_types tt
                        WHERE tt.evento_id = b.evento_id
                          AND tt.nombre = b.tipo_boleto
                          AND tt.activo = 1
                        LIMIT 1
                    )
                SET
                    b.fase_id = f.id,
                    b.precio = COALESCE(ptp.precio, f.precio),
                    b.comision_rp = ROUND(COALESCE(ptp.precio, f.precio) * (u.comision_porcentaje / 100), 2)
                ${outerFilter}
            `, params);
            return { updated: (result as any).affectedRows ?? 0 };
        } finally {
            connection.release();
        }
    }

    async getEventRpMetrics(eventId: number): Promise<EventRpMetrics[]> {
        const connection = await db.pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT 
                    u.id as rp_id,
                    u.username,
                    COUNT(b.id) as boletos_vendidos,
                    COALESCE(SUM(b.precio), 0) as ingresos_totales,
                    COALESCE(SUM(b.comision_rp), 0) as comisiones_totales
                 FROM usuarios u
                 LEFT JOIN boletos b ON u.id = b.rp_id AND b.evento_id = ?
                 WHERE u.rol_id = 2
                 GROUP BY u.id, u.username
                 ORDER BY boletos_vendidos DESC, ingresos_totales DESC`,
                [eventId]
            );
            return rows as EventRpMetrics[];
        } finally {
            connection.release();
        }
    }
}
