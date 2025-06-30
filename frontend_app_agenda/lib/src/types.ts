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

export const attendeeRoleTypes = [
  'CHAIR',
  'REQ-PARTICIPANT',
  'OPT-PARTICIPANT',
  'NON-PARTICIPANT',
] as const
export type IcsAttendeeRoleType = typeof attendeeRoleTypes[number]

export const namedRRules = [
  'FREQ=DAILY',
  'FREQ=WEEKLY',
  'BYDAY=MO,TU,WE,TH,FR;FREQ=DAILY',
  'INTERVAL=2;FREQ=WEEKLY',
  'FREQ=MONTHLY',
  'FREQ=YEARLY',
] as const

export const availableViews = [
  'timeGridDay',
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

export type SelectedCalendar = {
  url: string
  selected: boolean
}

export type SelectCalendarCallback = (calendar: SelectedCalendar) => void
export type SelectCalendarsClickInfo = {
  jsEvent: DomEvent
  calendars: Calendar[]
  selectedCalendars: Set<string>
  handleSelect: SelectCalendarCallback
}
export type SelectCalendarHandlers = {
  onClickSelectCalendars: (info: SelectCalendarsClickInfo) => void,
}

export type CalendarEvent = {
  calendarUrl: string
  event: IcsEvent
}
export type DisplayedCalendarEvent = {
  calendarUrl: string
  event: IcsEvent
  recurringEvent?: IcsEvent
}

export type EventBodyInfo = {
  calendar: Calendar
  event: IcsEvent
  view: View
}
export type BodyHandlers = {
  getEventBody: (info: EventBodyInfo) => Node[]
}

export type EventEditCallback = (event: CalendarEvent) => Promise<Response>
export type EventEditCreateInfo = {
  jsEvent: DomEvent
  event: IcsEvent
  calendars: Calendar[]
  handleCreate: EventEditCallback
}
export type EventEditUpdateInfo = {
  jsEvent: DomEvent
  calendarUrl: string
  event: IcsEvent
  recurringEvent?: IcsEvent
  calendars: Calendar[]
  handleUpdate: EventEditCallback
  handleDelete: EventEditCallback
}
export type EventEditDeleteInfo = {
  jsEvent: DomEvent
  calendarUrl: string
  event: IcsEvent
  recurringEvent?: IcsEvent
  handleDelete: EventEditCallback
}
export type EventEditHandlers = {
  onCreateEvent: (info: EventEditCreateInfo) => void,
  onUpdateEvent: (info: EventEditUpdateInfo) => void,
  onDeleteEvent: (info: EventEditDeleteInfo) => void,
}

export type EventChangeInfo = {
  calendarUrl: string
  event: IcsEvent
  // ? Do we keep this as this is for the entire CalendarOBject and not the event itself
  ical: string
}

export type EventChangeHandlers = {
  onEventCreated?: (info: EventChangeInfo) => void
  onEventUpdated?: (info: EventChangeInfo) => void
  onEventDeleted?: (info: EventChangeInfo) => void
}

export type CalendarElementOptions = {
  view?: View
  views?: View[]
  locale?: string
  date?: Date
  editable?: boolean
}

export type CalendarOptions =
  CalendarElementOptions // may define options or not
  & (SelectCalendarHandlers | Record<never, never>) // must define all handlers or none
  & (EventEditHandlers | Record<never, never>) // must define all handlers or none
  & EventChangeHandlers // may define handlers or not
  & Partial<BodyHandlers> // may define handlers or not, but they will be assigned a default value if they are not

export type CalendarResponse = {
  response: Response
  ical: string
}
