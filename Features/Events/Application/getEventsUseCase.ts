import type { Event } from "../Domain/Data/event.js";
import type { EventRepository } from "../Domain/Repository/eventRepository.js";

// Fecha "hoy" en zona horaria de México, como "YYYY-MM-DD".
function mexicoTodayString(): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Mexico_City",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

// Día del evento tal como se capturó (la app trata fecha_evento como hora de pared en UTC).
function eventDayString(fecha: Date): string {
    return new Date(fecha).toISOString().slice(0, 10);
}

export class GetEventsUseCase {
    private readonly eventRepository: EventRepository;

    constructor(eventRepository: EventRepository) {
        this.eventRepository = eventRepository;
    }

    async execute(options?: { onlyUpcoming?: boolean }): Promise<Event[]> {
        const events = await this.eventRepository.getEvents();

        if (!options?.onlyUpcoming) {
            return events;
        }

        // Un evento se muestra durante todo su día y desaparece al día siguiente (hora MX).
        const today = mexicoTodayString();
        return events.filter((event) => eventDayString(event.fecha_evento) >= today);
    }
}
