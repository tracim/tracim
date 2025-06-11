import { createCalendar as createEventCalendar, DayGrid, TimeGrid, List, Interaction } from '@event-calendar/core'
import type { Calendar } from '@event-calendar/core'
import '@event-calendar/core/index.css';
import { convertIcsCalendar, generateIcsCalendar, getDurationFromInterval, getEventEnd } from 'ts-ics';
import type { IcsCalendar, IcsEvent } from 'ts-ics';
import { createAccount, createCalendarObject, fetchCalendarObjects, fetchCalendars, updateCalendarObject, type DAVCalendar, type DAVCalendarObject } from 'tsdav';
import { EventEditPopup } from './eventEditPopup';
import { createElement, createText, fetchCalendar, isEventAllDay, offsetDate, validateTimezones } from './utils';
import type { CalendarUrls, EventIndex, ServerUrl } from './types';
import { tzlib_get_timezones } from 'timezones-ical-library';

export class CalendarClient {

  private _calendar: Calendar
  private _eventPopup: EventEditPopup
  private _headers: { headers?: Record<string, string>, fetchOptions?: RequestInit }

  private _davCalendars: DAVCalendar[] = []
  // TODO store converted data
  private _davObjects: DAVCalendarObject[][] = []

  private _timezones: string[]

  constructor(
    target: Element | Document | ShadowRoot,
    url: ServerUrl | CalendarUrls,
    headers?: Record<string, string>,
    fetchOptions?: RequestInit
  ) {
    this._headers = { headers, fetchOptions }
    this._timezones = tzlib_get_timezones() as string[]

    this._eventPopup = new EventEditPopup(target, this._timezones)
    this._eventPopup.onSave = this.updateEvent
    target.appendChild(createElement("button", { type: "button", onclick: this.loadEvents }, [createText("Refresh")]))
    //@ts-ignore
    const calendarNode = target.appendChild(createElement("div", { style: { display: "flex" } }))
    this._calendar = createEventCalendar(
      calendarNode,
      [DayGrid, TimeGrid, List, Interaction],
      {
        view: "timeGridWeek",
        headerToolbar: {
          start: 'prev,today,next',
          center: 'title',
          end: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        dayMaxEvents: true,
        nowIndicator: true,
        selectable: true,
        editable: true,
        //@ts-ignore
        eventResizableFromStart: true,
        eventContent: this.eventContent,
        eventClick: this.eventClick,
        select: this.selectDates,
        eventResize: this.updateEventDates,
        eventDrop: this.updateEventDates,
      }
    )


    this.loadCalendars(url).then(this.loadEvents)
  }

  eventContent = ({ event }: Calendar.EventContentInfo) => {
    return { html: `${event.title}` }
  }

  selectDates = ({ start, end, allDay }: Calendar.SelectInfo) => {
    const type = allDay ? "DATE" : "DATE-TIME"
    this._eventPopup.open({
      summary: "",
      start: {
        date: start,
        type: type
      },
      end: {
        date: end,
        type: type
      },
      uid: crypto.randomUUID(),
      stamp: { date: new Date() },
    }, { calendarIndex: -1, objectIndex: -1, eventIndex: -1 })
  }

  updateEventDates = async ({ event, oldEvent, revert }: Calendar.EventDropInfo | Calendar.EventResizeInfo) => {
    const index: EventIndex = oldEvent.extendedProps as EventIndex
    var eventData = convertIcsCalendar(undefined, this._davObjects[index.calendarIndex][index.objectIndex].data).events?.[index.eventIndex]
    if (!eventData) return // TODO handle
    var startDelta = new Date(event.start).getTime() - oldEvent.start.getTime()
    eventData.start = offsetDate(eventData.start, startDelta)
    var endDelta = new Date(event.end).getTime() - oldEvent.end.getTime()
    if (eventData.end) eventData.end = offsetDate(eventData.end, endDelta)
    const res = await this.updateEvent(eventData, index)
    if (!res) revert()
  }

  // TODO change an event of calendar
  updateEvent = async (event: IcsEvent, index: EventIndex) => {
    if (index.objectIndex < 0) return await this.createEvent(index.calendarIndex, event)
    const calendarObject = this._davObjects[index.calendarIndex][index.objectIndex]
    const icsCalendar = convertIcsCalendar(undefined, calendarObject.data)
    // if (event.recurrenceRule) {
    //   for (let i = 0; i < icsCalendar.events.length; i++) {
    //     const element = icsCalendar.events[i];
    //     if (i == event.index) continue
    //     else if (element.uid == event.event.uid) {
    //       const reccurenceOffset = element.recurrenceId.value.date.getTime() - icsCalendar.events[event.index].start.date.getTime()
    //       element.recurrenceId = { value: offsetDate(event.event.start, reccurenceOffset) }
    //     }
    //   }
    // }
    // if (event.index == -1) icsCalendar.events.push(event.event)
    // else
    icsCalendar.events[index.eventIndex] = { ...event, sequence: (event.sequence ?? 0) + 1 }

    validateTimezones(icsCalendar)
    var newCalendarObject = { ...calendarObject, data: generateIcsCalendar(icsCalendar) }
    const res = await updateCalendarObject({ calendarObject: newCalendarObject, ...this._headers })
    if (!res.ok) return false
    this.loadEvents()
    return true
  }

  createEvent = async (calendarIndex: number, event: IcsEvent) => {
    const calendar = this._davCalendars[calendarIndex]
    const uid = crypto.randomUUID()
    const icsCalendar: IcsCalendar = {
      prodId: '-//algoo.fr//NONSGML Tracim//EN',
      version: '2.0',
      events: [event],
    }
    validateTimezones(icsCalendar)
    const data = generateIcsCalendar(icsCalendar)
    const res = await createCalendarObject({
      calendar,
      iCalString: data,
      filename: `${uid}.ics`,
      ...this._headers
    })
    if (!res.ok) return false
    this.loadEvents()
    return true
  }

  eventClick = ({ event }: Calendar.EventClickInfo) => {
    const index = event.extendedProps as EventIndex
    const calendarObject = this._davObjects[index.calendarIndex][index.objectIndex]
    const icsCalendar = convertIcsCalendar(undefined, calendarObject.data)
    this._eventPopup.open(icsCalendar.events[index.eventIndex], index)
  }

  loadCalendars = async (url: ServerUrl | CalendarUrls) => {
    if (typeof url === 'string') {
      const account = await createAccount({
        account: { serverUrl: url, accountType: "caldav" },
        ...this._headers
      })
      this._davCalendars = await fetchCalendars({ account, ...this._headers })
    }
    else {
      this._davCalendars = await Promise.all(url.map(url => fetchCalendar({ url, ...this._headers })))
    }
    this._eventPopup.setCalendars(this._davCalendars)
  }

  // TODO look at refetch events
  // TODO look into expand and timerange (radicale v3.2)
  loadEvents = async () => {
    getDurationFromInterval
    this._davObjects = await Promise.all(this._davCalendars.map(c => fetchCalendarObjects({ calendar: c, ...this._headers })))
    const events: Calendar.EventInput[] = this._davObjects.map((objects, calendarIndex) => objects.map((object, objectIndex) => {
      const icsCalendar = convertIcsCalendar(undefined, object.data)
      return icsCalendar.events?.map((event, eventIndex) => ({
        title: event.summary,
        allDay: isEventAllDay(event),
        start: event.start.date,
        end: getEventEnd(event),
        backgroundColor: this._davCalendars[calendarIndex].calendarColor,
        extendedProps: { calendarIndex, objectIndex, eventIndex },
      } as Calendar.EventInput)) ?? []
    }).flat()).flat()
    this._calendar.setOption("events", events)
  }


}