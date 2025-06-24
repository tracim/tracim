import type { IcsCalendar, IcsEvent, IcsRecurrenceId } from 'ts-ics'
import type { DAVCalendar } from 'tsdav'

type DomEvent = GlobalEventHandlersEventMap[keyof GlobalEventHandlersEventMap]

export type CustomTranslation = {
  [lng: string]: unknown,
}

// TODO add <TCalendarUid = any>
// TODO add options to support IcsEvent custom props
export type Calendar = DAVCalendar & {
  // ctag?: string
  // description?: string;
  // displayName?: string | Record<string, unknown>;
  // calendarColor?: string
  // url: string
  // fetchOptions?: RequestInit
  headers?: Record<string, string>
  uid?: unknown
}

export type CalendarObject = {
  data: IcsCalendar
  etag?: string
  url: string
  calendarUrl: string
}

export type EventUid = {
  uid: string
  recurrenceId?: IcsRecurrenceId
}

// export const alarmActionTypes = ["DISPLAY"] as const;
// export type IcsAlarmActionTypes = typeof alarmActionTypes;

export const attendeeRoleTypes = ['CHAIR',
  'REQ-PARTICIPANT',
  'OPT-PARTICIPANT',
  'NON-PARTICIPANT',
] as const
export type IcsAttendeeRoleTypes = typeof attendeeRoleTypes

export const availableViews = ['timeGridDay',
  'timeGridWeek',
  'dayGridMonth',
  'listDay',
  'listWeek',
  'listMonth',
  'listYear',
] as const
export type View = typeof availableViews[number]

export type ServerSource = {
  serverUrl: string
  headers?: Record<string, string>
  fetchOptions?: RequestInit
}

export type CalendarSource = {
  calendarUrl: string
  calendarUid?: unknown
  headers?: Record<string, string>
  fetchOptions?: RequestInit
}

export type CalendarEvent = {
  calendarUrl: string
  event: IcsEvent
}

export type SelectCalendarCallback = (calendarUrl: string, selected: boolean) => void
export type SelectCalendarHandlers = {
  onClickSelectCalendars: (
    jsEvent: DomEvent,
    calendars: Calendar[],
    selectedCalendars: Set<string>,
    handleSelect: SelectCalendarCallback
  ) => void,
}

export type EventEditCallback = (event: CalendarEvent) => Promise<Response>
export type EventEditHandlers = {
  onCreateEvent: (jsEvent: DomEvent,
    calendars: Calendar[],
    event: CalendarEvent,
    handleCreate: EventEditCallback
  ) => void,
  onUpdateEvent: (jsEvent: DomEvent,
    calendars: Calendar[],
    event: CalendarEvent,
    handleUpdate: EventEditCallback,
    handleDelete: EventEditCallback
  ) => void,
  onDeleteEvent: (jsEvent: DomEvent,
    calendars: Calendar[],
    event: CalendarEvent,
    handleDelete: EventEditCallback
  ) => void,
}

export type PostEventChangeHandlers = {
  onEventCreated?: (calendarEvent: CalendarEvent, ical: string) => void
  onEventUpdated?: (calendarEvent: CalendarEvent, ical: string) => void
  onEventDeleted?: (calendarEvent: CalendarEvent, ical: string) => void
}

export type CalendarElementOptions = {
  view?: View
  views?: View[],
  locale?: string,
  date?: Date,
  editable?: boolean,
}

export type CalendarOptions =
  CalendarElementOptions
  & (SelectCalendarHandlers | Record<never, never>)
  & (EventEditHandlers | Record<never, never>)
  & PostEventChangeHandlers

export type EventData = {
  event: IcsEvent
  calendarObject: CalendarObject
  calendar: Calendar
}

export type CalendarResponse = {
  response: Response
  ical: string
}
