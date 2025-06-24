import { createCalendar as createEventCalendar, DayGrid, TimeGrid, List, Interaction, destroyCalendar as destroyEventCalendar } from '@event-calendar/core'
import type { Calendar as EventCalendar } from '@event-calendar/core'
import '@event-calendar/core/index.css'
import { getEventEnd, type IcsEvent } from 'ts-ics'
import { EventEditPopup } from '../eventeditpopup/eventEditPopup'
import { hasCalendarHandlers, hasEventHandlers } from '../helpers/types-helper'
import type { CalendarOptions, CalendarSource, ServerSource, EventUid, EventEditHandlers, CalendarEvent, PostEventChangeHandlers, SelectCalendarHandlers } from '../types'
import { isEventAllDay, offsetDate } from '../helpers/ics-helper'
import './calendarElement.css'
import { CalendarSelectDropdown } from '../calendarselectdropdown/calendarSelectDropdown'
import { icon, library } from '@fortawesome/fontawesome-svg-core'
import { faRefresh } from '@fortawesome/free-solid-svg-icons'
import { CalendarClient } from '../calendarClient'
import i18n from '../i18n'

library.add(faRefresh)

export class CalendarElement {
  private _client: CalendarClient
  private _selectedCalendars: Set<string>

  private _calendar: EventCalendar | null = null
  private _eventEdit: EventEditPopup | null = null
  private _calendarSelect: CalendarSelectDropdown | null = null

  private _calendarHandlers?: SelectCalendarHandlers
  private _eventHandlers?: EventEditHandlers
  private _postEventHandlers?: PostEventChangeHandlers

  public constructor() {
    this._client = new CalendarClient()
    this._selectedCalendars = new Set()
  }

  // public static create = async (sources: (ServerSource | CalendarSource)[], target: Element | Document | ShadowRoot, options?: CalendarElementOptions) => {
  //   const obj = new CalendarElement()
  //   await obj._create(sources, target, options)
  //   return obj
  // }
  // private _create = async (sources: (ServerSource | CalendarSource)[], target: Element | Document | ShadowRoot, options?: CalendarOptions) => {

  public create = async (
    sources: (ServerSource | CalendarSource)[],
    target: Element | Document | ShadowRoot,
    options?: CalendarOptions,
  ) => {
    if (this._calendar) return
    await this._client.loadCalendars(sources)
    this._selectedCalendars = new Set(this._client.getCalendars().map(c => c.url))

    this._eventHandlers = options && hasEventHandlers(options)
      ? {
        onCreateEvent: options.onCreateEvent,
        onUpdateEvent: options.onUpdateEvent,
        onDeleteEvent: options.onDeleteEvent,
      }
      : this.createDefaultEventElement(target)

    this._calendarHandlers = options && hasCalendarHandlers(options)
      ? {
        onClickSelectCalendars: options.onClickSelectCalendars,
      }
      : this.createDefaultCalendarsElement()

    this._postEventHandlers = {
      onEventCreated: options?.onEventCreated,
      onEventUpdated: options?.onEventUpdated,
      onEventDeleted: options?.onEventDeleted,
    }

    this.createCalendar(target, options)
  }

  public destroy = () => {
    this.destroyCalendar()
    this.destroyDefaultEventElement()
    this.destroyDefaultCalendarElement()
  }

  private createCalendar = (target: Element | Document | ShadowRoot, options?: CalendarOptions) => {
    if (this._calendar) return
    this._calendar = createEventCalendar(
      target,
      [DayGrid, TimeGrid, List, Interaction],
      {
        date: options?.date,
        view: options?.view ?? 'timeGridWeek',
        customButtons: {
          refresh: {
            text: { domNodes: Array.from(icon({ prefix: 'fas', iconName: 'refresh' }).node) },
            click: this.refreshEvents,
          },
          calendars: {
            text: i18n.t('calendar', { count: 0 }),
            click: this.onClickCalendars,
          },
        },
        headerToolbar: {
          start: 'calendars,refresh prev,today,next',
          center: 'title',
          end: (options?.views ?? ['timeGridDay', 'timeGridWeek', 'dayGridMonth', 'listWeek']).join(','),
        },
        buttonText: i18n.getResourceBundle(i18n.language, 'translation'),
        allDayContent: i18n.t('allDay'),
        dayMaxEvents: true,
        nowIndicator: true,

        // @ts-expect-error This member is not present in "@types/event-calendar__core"
        eventResizableFromStart: options?.editable ?? true,
        selectable: options?.editable ?? true,
        editable: options?.editable ?? true,

        eventContent: this.getEventContent,
        eventClick: this.onEventClicked,
        select: this.onSelectTimeRange,
        eventResize: this.onChangeEventDates,
        eventDrop: this.onChangeEventDates,
        eventSources: [{ events: this.fetchAndLoadEvents }],
        eventFilter: this.isEventVisible,
      },
    )
  }

  private destroyCalendar = () => {
    if (this._calendar) destroyEventCalendar(this._calendar)
    this._calendar = null
  }

  private createDefaultEventElement = (target: Node): EventEditHandlers => {
    this._eventEdit ??= new EventEditPopup(target)
    return {
      onCreateEvent: this._eventEdit.onCreate,
      onUpdateEvent: this._eventEdit.onUpdate,
      onDeleteEvent: this._eventEdit.onDelete,
    }
  }

  private destroyDefaultEventElement = () => {
    this._eventEdit?.destroy()
    this._eventEdit = null
  }

  private createDefaultCalendarsElement = (): SelectCalendarHandlers => {
    this._calendarSelect ??= new CalendarSelectDropdown()
    return {
      onClickSelectCalendars: this._calendarSelect.onSelect,
    }
  }

  private destroyDefaultCalendarElement = () => {
    this._calendarSelect?.destroy()
    this._calendarSelect = null
  }

  private fetchAndLoadEvents = async (info: EventCalendar.FetchInfo): Promise<EventCalendar.EventInput[]> => {
    const calendarObjects = await this._client.fetchAndLoadEvents(info.startStr, info.endStr)
    const calendars = this._client.getCalendars()
    return calendarObjects.flatMap((cos, index) => cos.flatMap(co => co.data.events ?? []).map(event => ({
      title: event.summary,
      allDay: isEventAllDay(event),
      start: event.start.date,
      end: getEventEnd(event),
      backgroundColor: calendars[index].calendarColor,
      extendedProps: { uid: event.uid, recurrenceId: event.recurrenceId } as EventUid,
    })))
  }

  private isEventVisible = (info: EventCalendar.EventFilterInfo) => {
    const eventData = this._client.getEventDataByUid(info.event.extendedProps as EventUid)
    if (!eventData) return false
    return this._selectedCalendars.has(eventData.calendar.url)
  }

  private onClickCalendars = (event: MouseEvent) => {
    this._calendarHandlers!.onClickSelectCalendars(
      event,
      this._client.getCalendars(), this._selectedCalendars,
      this.setCalendarVisibility,
    )
  }

  private getEventContent = (info: EventCalendar.EventContentInfo) => {
    return { html: `${info.event.title}` }
  }

  private onSelectTimeRange = (info: EventCalendar.SelectInfo) => {
    const type = info.allDay ? 'DATE' : 'DATE-TIME'
    const newEvent: IcsEvent = {
      summary: '',
      start: {
        date: info.start,
        type: type,
      },
      end: {
        date: info.end,
        type: type,
      },
      uid: '',
      stamp: { date: new Date() },
    }
    this._eventHandlers!.onCreateEvent(
      info.jsEvent,
      this._client.getCalendars(), { calendarUrl: '', event: newEvent },
      this.handleCreateEvent,
    )
  }

  private onChangeEventDates = async (info: EventCalendar.EventDropInfo | EventCalendar.EventResizeInfo) => {
    const uid = info.oldEvent.extendedProps as EventUid
    const eventData = this._client.getEventDataByUid(uid)
    if (!eventData) return

    const newEvent = { ...eventData.event }
    const startDelta = info.event.start.getTime() - info.oldEvent.start.getTime()
    newEvent.start = offsetDate(newEvent.start, startDelta)
    if (newEvent.end) {
      const endDelta = info.event.end.getTime() - info.oldEvent.end.getTime()
      newEvent.end = offsetDate(newEvent.end, endDelta)
    }
    const response = await this.handleUpdateEvent({ calendarUrl: eventData.calendar.url, event: newEvent })
    if (!response.ok) info.revert()
  }

  private onEventClicked = (info: EventCalendar.EventClickInfo) => {
    const uid = info.event.extendedProps as EventUid
    const eventData = this._client.getEventDataByUid(uid)
    if (!eventData) return
    this._eventHandlers!.onUpdateEvent(
      info.jsEvent,
      this._client.getCalendars(), { calendarUrl: eventData.calendar.url, event: eventData.event },
      this.handleUpdateEvent, this.handleDeleteEvent,
    )
  }

  private refreshEvents = () => {
    this._calendar!.refetchEvents()
  }

  private setCalendarVisibility = (calendarUrl: string, visible: boolean) => {
    const calendar = this._client.getCalendarByUrl(calendarUrl)
    if (!calendar) return
    if (visible) this._selectedCalendars.add(calendarUrl)
    else this._selectedCalendars.delete(calendarUrl)
    this.refreshEvents()
  }

  private handleCreateEvent = async (calendarEvent: CalendarEvent) => {
    const { response, ical } = await this._client.createEvent(calendarEvent)
    if (response.ok) {
      this._postEventHandlers!.onEventCreated?.(calendarEvent, ical)
      this.refreshEvents()
    }
    return response
  }

  private handleUpdateEvent = async (calendarEvent: CalendarEvent) => {
    const { response, ical } = await this._client.updateEvent(calendarEvent)
    if (response.ok) {
      this._postEventHandlers!.onEventUpdated?.(calendarEvent, ical)
      this.refreshEvents()
    }
    return response
  }

  private handleDeleteEvent = async (calendarEvent: CalendarEvent) => {
    const { response, ical } = await this._client.deleteEvent(calendarEvent)
    if (response.ok) {
      this._postEventHandlers!.onEventDeleted?.(calendarEvent, ical)
      this.refreshEvents()
    }
    return response
  }
}
