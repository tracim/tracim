import { IcsEvent, NonStandardValuesGeneric } from "ts-ics"
import { DAVCalendarObject } from "tsdav"

export interface CalendarObject extends DAVCalendarObject {
  calendarUrl: string
}

export type CalendarEvent = {
  objectUrl: string
  index: number
  color: string
  event: IcsEvent<NonStandardValuesGeneric>
}

export function isEventAllDay(event: IcsEvent) {
  return event.start.type === "DATE" || event.end.type === "DATE"
}