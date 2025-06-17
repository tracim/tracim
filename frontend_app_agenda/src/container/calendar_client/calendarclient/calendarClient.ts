import { createCalendar, DayGrid, TimeGrid, List, Interaction, destroyCalendar } from '@event-calendar/core'
import type { Calendar as EventCalendar } from '@event-calendar/core'
import '@event-calendar/core/index.css';
import { getEventEnd, type IcsCalendar, type IcsEvent } from 'ts-ics';
import { EventEditPopup } from '../eventeditpopup/eventEditPopup';
import { createCalendarObjects, deleteCalendarObject, fetchCalendarObjects, fetchCalendars, updateCalendarObject } from '../helpers/dav-helper';
import { hasEventHandlers } from '../types';
import type { CalendarClientOptions, CalendarSource, ServerSource, Calendar, CalendarObject, EventUid, EventHandlers, CalendarEvent, PostEventHandlers, DomNode, CalendarHandlers } from '../types';
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

  private _calendarHandlers?: CalendarHandlers
  private _eventHandlers?: EventHandlers
  private _postEventHandlers?: PostEventHandlers

  public constructor(
    sources: (ServerSource | CalendarSource)[],
    target: DomNode,
    options?: CalendarClientOptions,
  ) {
    this.loadCalendars(sources).then(() => {
      if (options && hasEventHandlers(options)) this._eventHandlers = { ...options }
      else this.createDefaultEventElement(target)
      this.createDefaultVisibilityElement()
      this._postEventHandlers = { ...options }
      this.createCalendar(target, options)
    })
  }

  public destroy = () => {
    this.destroyCalendar()
    this.destroyDefaultPopup()
    this.destroyDefaultVisibilityElement()
  }

  private loadCalendars = async (sources: (ServerSource | CalendarSource)[]) => {
    const calendars = await Promise.all(sources.map(source => fetchCalendars(source)))
    this._calendars = calendars.flat()
    this._calendarObjectsPerCalendar = this._calendars.map(_ => [])
  }

  private createCalendar = (target: DomNode, options?: CalendarClientOptions) => {
    if (this._calendar) return
    this._calendar = createCalendar(
      target,
      [DayGrid, TimeGrid, List, Interaction],
      {
        date: options?.date,
        view: options?.view ?? "timeGridWeek",
        customButtons: {
          refresh: {
            text: "Refresh",
            click: () => this.refreshEvents()
          },
          calendars: {
            text: "Calendars",
            click: this.onClickVisibility,
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
        eventSources: this._calendars.map((calendar, i) => ({
          events: ({ startStr: start, endStr: end }, successCallback, _) => {
            fetchCalendarObjects(calendar, { start, end }, true).then(objects => {
              this._calendarObjectsPerCalendar[i] = objects
              const events: EventCalendar.EventInput[] = objects.map(o => o.object.events ?? []).flat().map(event => ({
                title: event.summary,
                allDay: isEventAllDay(event),
                start: event.start.date,
                end: getEventEnd(event),
                backgroundColor: calendar.calendarColor,
                extendedProps: { uid: event.uid, recurrenceId: event.recurrenceId } as EventUid,
              }))
              successCallback(events)
            })
          }
        })),
        eventFilter: ({ event:e }: EventCalendar.EventFilterInfo) => {
          const [event, object] = this.getEventByUid(e.extendedProps as EventUid)
          if (event === undefined || object === undefined) return false
          const calendar = this.getCalendarByUrl(object.calendarUrl)
          if (calendar === undefined) return false
          return !calendar.hidden
        }
      }
    )
  }

  private destroyCalendar = () => {
    if (!this._calendar) return
    destroyCalendar(this._calendar)
    this._calendar = undefined
  }
  
  private createDefaultEventElement = (target: DomNode) => {
    if (this._eventEdit) return
    this._eventEdit = new EventEditPopup(target, this._calendars)
    this._eventHandlers = {
      onCreateEvent: (event, handleCreate) => {
        this._eventEdit!.onSave = handleCreate
        this._eventEdit!.open(event)
      },
      onUpdateEvent: (event, handleUpdate, handleDelete) => {
        this._eventEdit!.onSave = handleUpdate
        this._eventEdit!.onDelete = handleDelete
        this._eventEdit!.open(event)
      },
      onDeleteEvent: (event, handleDelete) => handleDelete(event)
    }
  }

  private destroyDefaultPopup = () => {
    if (!this._eventEdit) return
    this._eventEdit.destroy()
    this._eventEdit = undefined
  }
  private createDefaultVisibilityElement = () => {
    if (this._calendarSelect) return
    this._calendarSelect = new CalendarSelectDropdown()
    this._calendarHandlers = {
      onSelectCalendars: this._calendarSelect.onSelect
    }
  }
  private destroyDefaultVisibilityElement = () => {
    if (!this._calendarSelect) return
    this._calendarSelect.destroy()
    this._calendarSelect = undefined
  }
  
  private onClickVisibility = (event: MouseEvent) => {
    const button = event.target as Element
    this._calendarHandlers?.onSelectCalendars(button, this._calendars, this.setCalendarVisibility)

    // if (next) button.parentElement?.insertBefore(createElement("div", {}, [createText("hello")]), next)
    // else button.parentElement?.append(createElement("div", {}, [createText("hello")]))
  }

  private getEventContent = ({ event }: EventCalendar.EventContentInfo) => {
    return { html: `${event.title}` }
  }

  private onSelectTimeRange = ({ start, end, allDay }: EventCalendar.SelectInfo) => {
    const type = allDay ? "DATE" : "DATE-TIME"
    this._eventHandlers?.onCreateEvent({
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

  private onChangeEventDates = async ({ event, oldEvent: old, revert }: EventCalendar.EventDropInfo | EventCalendar.EventResizeInfo) => {
    const uid = old.extendedProps as EventUid
    const [oldEvent, object] = this.getEventByUid(uid)
    if (oldEvent === undefined || object === undefined) return

    const newEvent = { ...oldEvent }
    var startDelta = new Date(event.start).getTime() - old.start.getTime()
    newEvent.start = offsetDate(newEvent.start, startDelta)
    if (newEvent.end) {
      var endDelta = new Date(event.end).getTime() - old.end.getTime()
      newEvent.end = offsetDate(newEvent.end, endDelta)
    }
    const res = await this.updateEvent({ calendarUrl: object.calendarUrl, event: newEvent })
    if (!res) revert()
  }

  private onEventClicked = ({ event: e }: EventCalendar.EventClickInfo) => {
    const uid = e.extendedProps as EventUid
    const [event, object] = this.getEventByUid(uid)
    if (event === undefined || object === undefined) return
    this._eventHandlers?.onUpdateEvent({ calendarUrl: object.calendarUrl, event }, this.updateEvent, this.deleteEvent)
  }

  // TODO look into expand and timerange (radicale v3.2)
  private refreshEvents = () => {
    this._calendar?.refetchEvents()
  }

  private getEventByUid = (uid: EventUid): [IcsEvent | undefined, CalendarObject | undefined] => {
    for (const object of this._calendarObjectsPerCalendar.flat()) {
      for (const event of object.object.events ?? []) {
        if (isSameEvent(event, uid)) return [event, object]
      }
    }
    return [undefined, undefined]
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
    const object: IcsCalendar = {
      prodId: '-//algoo.fr//NONSGML Tracim//EN',
      version: "2.0",
      events: [event],
    }
    const [response, ical] = await createCalendarObjects(calendar, object)
    if (response.ok) {
      this._postEventHandlers?.onEventCreated?.({ calendarUrl, event }, ical)
      this.refreshEvents()
    }
    return response
  }

  // TODO change an event of calendar
  private updateEvent = async ({ calendarUrl, event }: CalendarEvent) => {
    const [oldEvent, object] = this.getEventByUid(event)
    if (oldEvent === undefined || object === undefined) return new Response(null, { status: 404 })
    const calendar = this.getCalendarByUrl(object.calendarUrl)
    if (calendar === undefined) return new Response(null, { status: 404 })
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
    object.object.events = object.object.events!.map(e => isSameEvent(e, oldEvent) ? event : e)
    const [response, ical] = await updateCalendarObject(calendar, object)
    if (response.ok) {
      this._postEventHandlers?.onEventUpdated?.({ calendarUrl, event }, ical)
      this.refreshEvents()
    }
    else object.object.events = object.object.events!.map(e => isSameEvent(e, event) ? oldEvent : e)
    return response
  }

  private deleteEvent = async ({ calendarUrl, event }: CalendarEvent) => {
    const [oldEvent, object] = this.getEventByUid(event)
    if (oldEvent === undefined || object === undefined) return new Response(null, { status: 404 })
    const calendar = this.getCalendarByUrl(object.calendarUrl)
    if (calendar === undefined) return new Response(null, { status: 404 })
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
    const [response, ical] = await deleteCalendarObject(calendar, object)
    if (response.ok) {
      this._postEventHandlers?.onEventDeleted?.({ calendarUrl, event }, ical)
      this.refreshEvents()
    }
    return response
  }
}