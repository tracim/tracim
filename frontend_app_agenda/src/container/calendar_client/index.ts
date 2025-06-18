import { CalendarClient } from "./calendarclient/calendarClient";
import type { CalendarClientOptions, CalendarSource, DomNode, ServerSource } from "./types";

export function createCalendarClient(
  sources: (ServerSource | CalendarSource)[],
  target: DomNode,
  options?: CalendarClientOptions,
): CalendarClient {
  return new CalendarClient(sources, target, options)
}
