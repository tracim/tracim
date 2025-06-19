import type { CalendarClientOptions, CalendarHandlers, CalendarSource, EventHandlers, ServerSource } from "../types";

export function isServerSource(source: ServerSource | CalendarSource): source is ServerSource {
    return (source as ServerSource).serverUrl !== undefined;
}

export function hasEventHandlers(options: CalendarClientOptions): options is EventHandlers {
    return (options as EventHandlers).onCreateEvent !== undefined;
}

export function hasCalendarHandlers(options: CalendarClientOptions): options is CalendarHandlers {
    return (options as CalendarHandlers).onSelectCalendars !== undefined;
  }