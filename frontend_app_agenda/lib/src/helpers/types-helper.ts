import type { CalendarOptions, SelectCalendarHandlers, CalendarSource, EventEditHandlers, ServerSource } from '../types'

export function isServerSource(source: ServerSource | CalendarSource): source is ServerSource {
  return (source as ServerSource).serverUrl !== undefined
}

export function hasEventHandlers(options: CalendarOptions): options is EventEditHandlers {
  return (options as EventEditHandlers).onCreateEvent !== undefined
}

export function hasCalendarHandlers(options: CalendarOptions): options is SelectCalendarHandlers {
  return (options as SelectCalendarHandlers).onClickSelectCalendars !== undefined
}
