import type { IcsCalendar, IcsEvent, IcsRecurrenceId } from "ts-ics"
import type { DAVCalendar } from "tsdav"


// TODO add <TCalendarUid = any>
export type Calendar = DAVCalendar & {
  // ctag?: string
  // description?: string;
  // displayName?: string | Record<string, unknown>;
  // calendarColor?: string
  // url: string
  // fetchOptions?: RequestInit
  headers?: Record<string, string>
  uid?: any
  hidden?: boolean
}

export type CalendarObject = {
  object: IcsCalendar
  etag?: string
  url: string
  calendarUrl: string
}

export type EventUid = {
  uid: string
  recurrenceId?: IcsRecurrenceId
}

export const alarmActionTypes = ["DISPLAY"] as const;
export type IcsAlarmActionTypes = typeof alarmActionTypes;

export const attendeeRoleTypes = ["CHAIR", "REQ-PARTICIPANT", "OPT-PARTICIPANT", "NON-PARTICIPANT"] as const;
export type IcsAttendeeRoleTypes = typeof attendeeRoleTypes;

export const availableViews = ["timeGridDay", "timeGridWeek", "dayGridMonth", "listDay", "listWeek", "listMonth", "listYear"] as const;
export type View = typeof availableViews[number];

export function isServerSource(source: ServerSource | CalendarSource): source is ServerSource {
  return (source as ServerSource).serverUrl !== undefined;
}

export type ServerSource = {
  serverUrl: string
  headers?: Record<string, string>
  fetchOptions?: RequestInit
}

export type CalendarSource = {
  calendarUrl: string
  calendarUid?: any
  headers?: Record<string, string>
  fetchOptions?: RequestInit
}

export type CalendarEvent = {
  calendarUrl: string
  event: IcsEvent
}

export type DomNode = Element | Document | ShadowRoot

export type CalendarHandler = (calendarUrl: string, selected: boolean) => void
export type CalendarHandlers = {
  onSelectCalendars: (target: DomNode, calendars: Calendar[], handleSelect: CalendarHandler) => void,
}

// ? add clicked node to allow positioning relative to the event
export type EventHandler = (event: CalendarEvent) => Promise<Response>
export type EventHandlers = {
  onCreateEvent: (event: CalendarEvent, handleCreate: EventHandler) => void,
  onUpdateEvent: (event: CalendarEvent, handleUpdate: EventHandler, handleDelete: EventHandler) => void,
  onDeleteEvent: (event: CalendarEvent, handleDelete: EventHandler) => void,
}

export type PostEventHandler = (event: CalendarEvent, ics: string) => void
export type PostEventHandlers = {
  onEventCreated?: PostEventHandler
  onEventUpdated?: PostEventHandler
  onEventDeleted?: PostEventHandler
}
export type CalendarOptions = {
  view?: View
  views?: View[],
  locale?: string,
  date?: Date,
  editable?: boolean,
}

export type CalendarClientOptions = CalendarOptions & (CalendarHandlers | {}) & (EventHandlers | {}) & PostEventHandlers

export function hasEventHandlers(source: CalendarClientOptions): source is EventHandlers {
  return (source as EventHandlers).onCreateEvent !== undefined;
}