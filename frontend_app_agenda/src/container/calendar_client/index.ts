import { CalendarElement } from "./calendarelement/calendarElement";
import type { CalendarOptions, CalendarSource, ServerSource } from "./types";
import "./index.css"

export async function createCalendar(
  sources: (ServerSource | CalendarSource)[],
  target: Element | Document | ShadowRoot,
  options?: CalendarOptions,
) {
  // return CalendarClient.create(sources, target, options)
  const calendar = new CalendarElement()
  await calendar.create(sources, target, options)
  return calendar
}

