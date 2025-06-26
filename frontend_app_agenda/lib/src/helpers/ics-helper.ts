import { generateIcsRecurrenceRule, type IcsDateObject, type IcsEvent, type IcsRecurrenceRule } from 'ts-ics'
import type { EventUid } from '../types'

export function isEventAllDay(event: IcsEvent) {
  return event.start.type === 'DATE' || event.end?.type === 'DATE'
}

export function offsetDate(date: IcsDateObject, offset: number): IcsDateObject {
  return {
    type: date.type,
    date: new Date(date.date.getTime() + offset),
    local: date.local && {
      date: new Date(date.local.date.getTime() + offset),
      timezone: date.local.timezone,
      tzoffset: date.local.tzoffset,
    },
  }
}

export function isSameEvent(a: EventUid, b: EventUid) {
  return a.uid === b.uid && a.recurrenceId?.value.date.getTime() === b.recurrenceId?.value.date.getTime()
}

export function isRRuleSourceEvent(eventInstance: EventUid, event: EventUid) {
  return eventInstance.uid === event.uid && event.recurrenceId === undefined
}

export function getRRuleString(recurrenceRule?: IcsRecurrenceRule) {
  if (!recurrenceRule) return ''
  return generateIcsRecurrenceRule(recurrenceRule).trim().slice(6)
}
