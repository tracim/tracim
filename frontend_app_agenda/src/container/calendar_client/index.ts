import { CalendarClient } from "./calendarclient/calendarClient";
import type { CalendarClientOptions, CalendarSource, DomNode, ServerSource } from "./types";

export async function createCalendarClient(
  sources: (ServerSource | CalendarSource)[],
  target: DomNode,
  options?: CalendarClientOptions,
) {
  const calendar = new CalendarClient()
  await calendar.create(sources, target, options)
  return calendar
}

