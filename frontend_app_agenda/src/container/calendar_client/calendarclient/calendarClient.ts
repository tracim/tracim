import { createCalendar as createEventCalendar, DayGrid, TimeGrid, List, Interaction, destroyCalendar as destroyEventCalendar } from '@event-calendar/core'
import type { Calendar as EventCalendar } from '@event-calendar/core'
import '@event-calendar/core/index.css';
import { getEventEnd, type IcsCalendar } from 'ts-ics';
import { EventEditPopup } from '../eventeditpopup/eventEditPopup';
import { createCalendarObjects, deleteCalendarObject, fetchCalendarObjects, fetchCalendars, updateCalendarObject } from '../helpers/dav-helper';
import { hasCalendarHandlers, hasEventHandlers } from '../types';
import type { CalendarClientOptions, CalendarSource, ServerSource, Calendar, CalendarObject, EventUid, EventHandlers, CalendarEvent, PostEventHandlers, DomNode, CalendarHandlers, EventUidData } from '../types';
import { isEventAllDay, isSameEvent, offsetDate } from '../helpers/ics-helper';
import "./calendarClient.css"
import { CalendarSelectDropdown } from '../calendarselectdropdown/calendarSelectDropdown';

// TODO recurring events
export class CalendarClient {

  private _calendar?: EventCalendar
  private _eventEdit?: EventEditPopup
  private _calendarSelect?: CalendarSelectDropdown

  private _calendars: Calendar[] = []
  private _calendarObjectsPerCalendar: CalendarObject[][] = []
  // private _calendarObjects: CalendarObject[] = []

  private _calendarHandlers?: CalendarHandlers
  private _eventHandlers?: EventHandlers
  private _postEventHandlers?: PostEventHandlers

  public constructor(
    sources: (ServerSource | CalendarSource)[],
    target: DomNode,
    options?: CalendarClientOptions,
  ) {
    this.loadCalendars(sources).then(() => {
      this._eventHandlers = options && hasEventHandlers(options) ? {
        onCreateEvent: options.onCreateEvent,
        onUpdateEvent: options.onUpdateEvent,
        onDeleteEvent: options.onDeleteEvent,
      } : this.createDefaultEventElement(target)

      this._calendarHandlers = options && hasCalendarHandlers(options) ? {
        onSelectCalendars: options.onSelectCalendars,
      } : this.createDefaultCalendarsElement()

      this._postEventHandlers = {
        onEventCreated: options?.onEventCreated,
        onEventUpdated: options?.onEventUpdated,
        onEventDeleted: options?.onEventDeleted,
      }
      this.createCalendar(target, options)
    })
  }

  public destroy = () => {
    this.destroyCalendar()
    this.destroyDefaultPopup()
    this.destroyDefaultVisibilityElement()
  }

  private loadCalendars = async (sources: (ServerSource | CalendarSource)[]) => {
    const calendarsPerSource = await Promise.all(sources.map(source => fetchCalendars(source)))
    this._calendars = calendarsPerSource.flat()
    this._calendarObjectsPerCalendar = this._calendars.map(_ => [])
  }

  private createCalendar = (target: DomNode, options?: CalendarClientOptions) => {
    if (this._calendar) return
    this._calendar = createEventCalendar(
      target,
      [DayGrid, TimeGrid, List, Interaction],
      {
        date: options?.date,
        view: options?.view ?? "timeGridWeek",
        customButtons: {
          refresh: {
            text: "Refresh",
            click: this.refreshEvents
          },
          calendars: {
            text: "Calendars",
            click: this.onClickCalendars,
          }
        },
        headerToolbar: {
          start: 'calendars,refresh prev,today,next',
          center: 'title',
          end: (options?.views ?? ["timeGridDay", "timeGridWeek", "dayGridMonth", "listWeek"]).join(",")
        },
        dayMaxEvents: true,
        nowIndicator: true,

        //@ts-ignore
        eventResizableFromStart: options?.editable ?? true,
        selectable: options?.editable ?? true,
        editable: options?.editable ?? true,

        eventContent: this.getEventContent,
        eventClick: this.onEventClicked,
        select: this.onSelectTimeRange,
        eventResize: this.onChangeEventDates,
        eventDrop: this.onChangeEventDates,
        // eventSources: [{ events: this.fetchAndLoadEvents }],
        eventSources: this._calendars.map((calendar, i) => ({
          events: async ({ startStr: start, endStr: end }: EventCalendar.FetchInfo): Promise<EventCalendar.EventInput[]> => {
            const calendarObjects = await fetchCalendarObjects(calendar, { start, end }, true)
            this._calendarObjectsPerCalendar[i] = calendarObjects
            return calendarObjects.map(o => o.data.events ?? []).flat().map(event => ({
              title: event.summary,
              allDay: isEventAllDay(event),              
              start: event.start.date,
              end: getEventEnd(event),
              backgroundColor: calendar.calendarColor,
              extendedProps: { uid: event.uid, recurrenceId: event.recurrenceId } as EventUid,
            }))
          }
        })),
        eventFilter: this.isEventVisible
      }
    )
  }

  // private fetchAndLoadEvents = async ({ startStr: start, endStr: end }: EventCalendar.FetchInfo) => {
  //   const objectsPerCalendar = await Promise.all(this._calendars.map(calendar => fetchCalendarObjects(calendar, { start, end }, true)))
  //   this._calendarObjects = objectsPerCalendar.flat()
  //   console.log(this._calendarObjects)
  //   return this._calendarObjects.map(co => (co.object.events ?? []).map(event => ({
  //     title: event.summary,
  //     allDay: isEventAllDay(event),
  //     start: event.start.date,
  //     end: getEventEnd(event),
  //     backgroundColor: this.getCalendarByUrl(co.calendarUrl)!.calendarColor,
  //     extendedProps: { uid: event.uid, recurrenceId: event.recurrenceId } as EventUid,
  //   } as EventCalendar.EventInput)))
  // }

  private isEventVisible = ({ event: e }: EventCalendar.EventFilterInfo) => {
    const uidData = this.getEventUidData(e.extendedProps as EventUid)
    if (uidData === undefined) return false
    return !uidData.calendar.hidden
  }

  private destroyCalendar = () => {
    if (!this._calendar) return
    destroyEventCalendar(this._calendar)
    this._calendar = undefined
  }

  private createDefaultEventElement = (target: DomNode): EventHandlers => {
    // TODO find an other to send calendars the the popup that makes it accessible to any popup
    this._eventEdit ??= new EventEditPopup(target, this._calendars)
    return {
      onCreateEvent: this._eventEdit.onCreate,
      onUpdateEvent: this._eventEdit.onUpdate,
      onDeleteEvent: this._eventEdit.onDelete,
    }
  }

  private destroyDefaultPopup = () => {
    this._eventEdit?.destroy()
    this._eventEdit = undefined
  }

  private createDefaultCalendarsElement = (): CalendarHandlers => {
    this._calendarSelect ??= new CalendarSelectDropdown()
    return {
      onSelectCalendars: this._calendarSelect.onSelect
    }
  }

  private destroyDefaultVisibilityElement = () => {
    this._calendarSelect?.destroy()
    this._calendarSelect = undefined
  }

  private onClickCalendars = (event: MouseEvent) => {
    const button = event.target as Element
    this._calendarHandlers!.onSelectCalendars(button, this._calendars, this.setCalendarVisibility)
  }

  private getEventContent = ({ event }: EventCalendar.EventContentInfo) => {
    return { html: `${event.title}` }
  }

  private onSelectTimeRange = ({ start, end, allDay }: EventCalendar.SelectInfo) => {
    const type = allDay ? "DATE" : "DATE-TIME"
    this._eventHandlers!.onCreateEvent({
      calendarUrl: "", event: {
        summary: "",
        start: {
          date: start,
          type: type
        },
        end: {
          date: end,
          type: type
        },
        uid: "",
        stamp: { date: new Date() },
      }
    }, this.createEvent
    )
  }

  private onChangeEventDates = async ({ event, oldEvent, revert }: EventCalendar.EventDropInfo | EventCalendar.EventResizeInfo) => {
    const uid = oldEvent.extendedProps as EventUid
    const uidData = this.getEventUidData(uid)
    if (uidData === undefined) return

    const newEvent = { ...uidData.event }
    var startDelta = new Date(event.start).getTime() - oldEvent.start.getTime()
    newEvent.start = offsetDate(newEvent.start, startDelta)
    if (newEvent.end) {
      var endDelta = new Date(event.end).getTime() - oldEvent.end.getTime()
      newEvent.end = offsetDate(newEvent.end, endDelta)
    }
    const response = await this.updateEvent({ calendarUrl: uidData.calendar.url, event: newEvent })
    if (!response.ok) revert()
  }

  private onEventClicked = ({ event: e }: EventCalendar.EventClickInfo) => {
    const uid = e.extendedProps as EventUid
    const uidData = this.getEventUidData(uid)
    if (uidData === undefined) return
    this._eventHandlers!.onUpdateEvent({ calendarUrl: uidData.calendar.url, event: uidData.event }, this.updateEvent, this.deleteEvent)
  }

  // TODO look into expand and timerange (radicale v3.2)
  private refreshEvents = () => {
    this._calendar!.refetchEvents()
  }

  private getEventUidData = (uid: EventUid): EventUidData | undefined => {
    for (const calendarObject of this._calendarObjectsPerCalendar.flat()) {
      for (const event of calendarObject.data.events ?? []) {
        if (!isSameEvent(event, uid)) continue
        const calendar = this.getCalendarByUrl(calendarObject.calendarUrl)
        if (calendar === undefined) return undefined // TODO should not happen
        return { event, calendarObject, calendar }
      }
    }
    return undefined
  }

  private getCalendarByUrl = (url: string): Calendar | undefined => {
    return this._calendars.find(c => c.url === url)
  }

  private setCalendarVisibility = (calendarUrl: string, visible: boolean) => {
    const calendar = this.getCalendarByUrl(calendarUrl)
    if (!calendar) return
    calendar.hidden = !visible
    this.refreshEvents()
  }

  private createEvent = async ({ calendarUrl, event }: CalendarEvent) => {
    const calendar = this.getCalendarByUrl(calendarUrl)
    if (calendar === undefined) return new Response(null, { status: 404 })
    const calendarObject: IcsCalendar = {
      prodId: '-//algoo.fr//NONSGML Tracim//EN',
      version: "2.0",
      events: [event],
    }
    const { response, ical } = await createCalendarObjects(calendar, calendarObject)
    if (response.ok) {
      this._postEventHandlers!.onEventCreated?.({ calendarUrl, event }, ical)
      this.refreshEvents()
    }
    return response
  }

  // TODO change an event of calendar
  private updateEvent = async ({ calendarUrl, event }: CalendarEvent) => {
    const uidData = this.getEventUidData(event)
    if (uidData === undefined) return new Response(null, { status: 404 })
    const { event: oldEvent, calendarObject, calendar } = uidData
    // if (event.recurrenceRule) {
    //   for (let i = 0; i < icsCalendar.events.length; i++) {
    //     const element = icsCalendar.events[i];
    //     if (i == event.index) continue
    //     else if (element.uid == event.event.uid) {
    //       const recurrenceOffset = element.recurrenceId.value.date.getTime() - icsCalendar.events[event.index].start.date.getTime()
    //       element.recurrenceId = { value: offsetDate(event.event.start, recurrenceOffset) }
    //     }
    //   }
    // }
    // if (event.index == -1) icsCalendar.events.push(event.event)
    // else
    event.sequence = (event.sequence ?? 0) + 1
    const oldEvents = calendarObject.data.events
    calendarObject.data.events = calendarObject.data.events!.map(e => isSameEvent(e, oldEvent) ? event : e)
    const { response, ical } = await updateCalendarObject(calendar, calendarObject)
    if (response.ok) {
      this._postEventHandlers!.onEventUpdated?.({ calendarUrl, event }, ical)
      this.refreshEvents()
    }
    else calendarObject.data.events = oldEvents
    return response
  }

  private deleteEvent = async ({ calendarUrl, event }: CalendarEvent) => {
    const uidData = this.getEventUidData(event)
    if (uidData === undefined) return new Response(null, { status: 404 })
    // if (event.recurrenceRule) {
    //   for (let i = 0; i < icsCalendar.events.length; i++) {
    //     const element = icsCalendar.events[i];
    //     if (i == event.index) continue
    //     else if (element.uid == event.event.uid) {
    //       const recurrenceOffset = element.recurrenceId.value.date.getTime() - icsCalendar.events[event.index].start.date.getTime()
    //       element.recurrenceId = { value: offsetDate(event.event.start, recurrenceOffset) }
    //     }
    //   }
    // }
    // if (event.index == -1) icsCalendar.events.push(event.event)
    // else
    const { response, ical } = await deleteCalendarObject(uidData.calendar, uidData.calendarObject)
    if (response.ok) {
      this._postEventHandlers!.onEventDeleted?.({ calendarUrl, event }, ical)
      this.refreshEvents()
    }
    return response
  }
}