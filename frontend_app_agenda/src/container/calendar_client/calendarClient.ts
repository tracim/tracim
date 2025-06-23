import { type IcsCalendar } from 'ts-ics';
import { createCalendarObject, deleteCalendarObject, fetchCalendarObjects, fetchCalendars, updateCalendarObject } from './helpers/dav-helper';
import type { CalendarSource, ServerSource, Calendar, CalendarObject, EventUid, CalendarEvent, EventData } from './types';
import { isSameEvent } from './helpers/ics-helper';

// TODO recurring events
export class CalendarClient {

  private _calendars: Calendar[] = []
  private _calendarObjectsPerCalendar: CalendarObject[][] = []

  public loadCalendars = async (sources: (ServerSource | CalendarSource)[]) => {
    const calendarsPerSource = await Promise.all(sources.map(source => fetchCalendars(source)))
    this._calendars = calendarsPerSource.flat()
    this._calendarObjectsPerCalendar = this._calendars.map(_ => [])
  }

  public destroy = () => {

  }

  // TODO needs radicale 3.2
  public fetchAndLoadEvents = async (start: string, end: string): Promise<CalendarObject[][]> => {
    this._calendarObjectsPerCalendar = await Promise.all(this._calendars.map(calendar => fetchCalendarObjects(calendar, { start, end }, true)))
    return this._calendarObjectsPerCalendar
  }

  // TODO turn into a getter
  public getCalendars = () => this._calendars
  public getCalendarObjects = () => this._calendarObjectsPerCalendar

  public getEventDataByUid = (uid: EventUid): EventData | undefined => {
    for (const calendarObject of this._calendarObjectsPerCalendar.flat()) {
      for (const event of calendarObject.data.events ?? []) {
        if (!isSameEvent(event, uid)) continue
        const calendar = this.getCalendarByUrl(calendarObject.calendarUrl)
        if (!calendar) return undefined // TODO should not happen
        return { event, calendarObject, calendar }
      }
    }
    return undefined
  }

  public getCalendarByUrl = (url: string): Calendar | undefined => {
    return this._calendars.find(c => c.url === url)
  }

  public createEvent = async ({ calendarUrl, event }: CalendarEvent) => {
    const calendar = this.getCalendarByUrl(calendarUrl)
    if (!calendar) return { response: new Response(null, { status: 404 }), ical: ""}
    const calendarObject: IcsCalendar = {
      // prodId is a FPI (https://en.wikipedia.org/wiki/Formal_Public_Identifier)
      prodId: '-//algoo.fr//NONSGML Algoo Calendar Client v0.1//EN',
      // prodId: '+//IDN algoo.fr//NONSGML Algoo Calendar Client v0.1//EN',
      version: "2.0",
      events: [event],
    }
    const response = await createCalendarObject(calendar, calendarObject)
    return response
  }

  // TODO change an event of calendar
  public updateEvent = async ({ event }: CalendarEvent) => {
    const uidData = this.getEventDataByUid(event)
    if (!uidData) return { response: new Response(null, { status: 404 }), ical: ""}
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
    const response = await updateCalendarObject(calendar, calendarObject)
    if (!response.response.ok)  calendarObject.data.events = oldEvents
    return response
  }

  public deleteEvent = async ({ event }: CalendarEvent) => {
    const uidData = this.getEventDataByUid(event)
    if (!uidData) return { response: new Response(null, { status: 404 }), ical: ""}
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
    const response = await deleteCalendarObject(uidData.calendar, uidData.calendarObject)
    return response
  }
}