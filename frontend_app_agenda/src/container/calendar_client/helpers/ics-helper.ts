import { addMilliseconds } from "date-fns"
import type { IcsDateObject, IcsEvent } from "ts-ics"
import type { EventUid } from "../types"
import { tzlib_get_timezones } from "timezones-ical-library"

export function isEventAllDay(event: IcsEvent) {
    return event.start.type === "DATE" || event.end?.type === "DATE"
  }

export function offsetDate(date: IcsDateObject, offset: number): IcsDateObject {
    return {
        type: date.type,
        date: addMilliseconds(date.date, offset),
        local: date.local && {
            date: addMilliseconds(date.local.date, offset),
            timezone: date.local.timezone,
            tzoffset: date.local.tzoffset,
        },
    }
}
  
export function isSameEvent(a: EventUid, b: EventUid) {
    return a.uid === b.uid && a.recurrenceId?.value.date === b.recurrenceId?.value.date
}

export function getTimezones(): string[] {
    return tzlib_get_timezones() as string[]
}