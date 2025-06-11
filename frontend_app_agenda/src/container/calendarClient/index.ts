import { CalendarClient } from "./calendarClient";
import type { CalendarUrls, ServerUrl } from "./types";

export default function createCalendarClient(target: Element | Document | ShadowRoot,
  url: ServerUrl | CalendarUrls,
  headers?: Record<string, string>,
  fetchOptions?: RequestInit
): CalendarClient {
  return new CalendarClient(target, url, headers, fetchOptions)
}