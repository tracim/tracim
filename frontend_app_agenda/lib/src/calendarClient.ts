import { type IcsCalendar } from 'ts-ics'
import { createCalendarObject, deleteCalendarObject, fetchCalendarObjects, fetchCalendars, updateCalendarObject } from './helpers/dav-helper'
import type { CalendarSource, ServerSource, Calendar, CalendarObject, EventUid, CalendarEvent } from './types'
import { isRRuleSourceEvent, isSameEvent } from './helpers/ics-helper'

export class CalendarClient {

  private _calendars: Calendar[] = []
  private _calendarObjectsPerCalendar: CalendarObject[][] = []
  private _recurringObjectsPerCalendar: CalendarObject[][] = []

  public loadCalendars = async (sources: (ServerSource | CalendarSource)[]) => {
    const calendarsPerSource = await Promise.all(sources.map(source => fetchCalendars(source)))
    this._calendars = calendarsPerSource.flat()
    this._calendarObjectsPerCalendar = this._calendars.map(() => [])
  }

  public fetchAndLoadEvents = async (start: string, end: string): Promise<CalendarEvent[]> => {
    const allObjects = await Promise.all(
      this._calendars.map(calendar => fetchCalendarObjects(calendar, { start, end }, true)),
    )
    this._calendarObjectsPerCalendar = allObjects.map(objs => objs.calendarObjects)
    this._recurringObjectsPerCalendar = allObjects.map(objs => objs.recurringObjects)
    return this._calendarObjectsPerCalendar.flatMap(cos =>
      cos
        .flatMap(co => co.data.events ?? [])
        .map(event => ({ event: event, calendarUrl: cos[0].calendarUrl })))
  }

  public getCalendars = () => this._calendars

  // TODO return another type that includes the "original" event for recurring events
  public getCalendarEvent = (uid: EventUid): CalendarEvent | undefined => {
    for (const calendarObject of this._calendarObjectsPerCalendar.flat()) {
      for (const event of calendarObject.data.events ?? []) {
        if (!isSameEvent(event, uid)) continue
        return { event, calendarUrl: calendarObject.calendarUrl }
      }
    }
    return undefined
  }

  private getCalendarObject = (uid: EventUid): CalendarObject | undefined => {
    const searchList = uid.recurrenceId ? this._recurringObjectsPerCalendar : this._calendarObjectsPerCalendar
    for (const calendarObject of searchList.flat()) {
      for (const event of calendarObject.data.events ?? []) {
        // Since we look are just looking for the CalendarObject and not the event in particular,
        // we just need to check the uid
        if (event.uid === uid.uid) return calendarObject
      }
    }
    return undefined
  }

  public getCalendarByUrl = (url: string): Calendar | undefined => {
    return this._calendars.find(c => c.url === url)
  }

  public createEvent = async ({ calendarUrl, event }: CalendarEvent) => {
    const calendar = this.getCalendarByUrl(calendarUrl)
    if (!calendar) return { response: new Response(null, { status: 404 }), ical: '' }
    const calendarObject: IcsCalendar = {
      // prodId is a FPI (https://en.wikipedia.org/wiki/Formal_Public_Identifier)
      prodId: '-//algoo.fr//NONSGML Algoo Calendar Client v0.1//EN',
      // prodId: '+//IDN algoo.fr//NONSGML Algoo Calendar Client v0.1//EN',
      version: '2.0',
      events: [event],
    }
    const response = await createCalendarObject(calendar, calendarObject)
    return response
  }

  // TODO change an event of calendar
  public updateEvent = async ({ event }: CalendarEvent) => {
    const calendarObject = this.getCalendarObject(event)
    console.log(calendarObject)
    if (!calendarObject) return { response: new Response(null, { status: 404 }), ical: '' }
    const calendar = this.getCalendarByUrl(calendarObject.calendarUrl)!

    // Only a shallow copy as we modify the items directly
    const oldEvents = calendarObject.data.events ? [...calendarObject.data.events] : undefined

    const index = calendarObject.data.events!.findIndex(e => isSameEvent(e, event))

    // Modified an recurring event instance for the 1st time
    if (event.recurrenceId && index === -1) {
      calendarObject.data.events!.push(event)
    } else {
      event.sequence = (event.sequence ?? 0) + 1
      calendarObject.data.events![index] = event
    }
    // if (event.recurrenceRule) {
    //   for (let i = 0; i < icsCalendar.events.length; i++) {
    //     const element = icsCalendar.events[i]
    //     if (i == event.index) continue
    //     else if (element.uid == event.event.uid) {
    //       const recurrenceOffset = element.recurrenceId.value.date.getTime() -
    //  icsCalendar.events[event.index].start.date.getTime()
    //       element.recurrenceId = { value: offsetDate(event.event.start, recurrenceOffset) }
    //     }
    //   }
    // }
    const response = await updateCalendarObject(calendar, calendarObject)
    if (!response.response.ok) calendarObject.data.events = oldEvents
    return response
  }

  public deleteEvent = async ({ event }: CalendarEvent) => {
    const calendarObject = this.getCalendarObject(event)
    if (!calendarObject) return { response: new Response(null, { status: 404 }), ical: '' }
    const calendar = this.getCalendarByUrl(calendarObject.calendarUrl)!

    // Only a shallow copy as we modify the items directly
    const oldEvents = calendarObject.data.events ? [...calendarObject.data.events] : undefined


    // TODO remove all rrule linked events
    // When removing a recurring event instance, add it to exceptionDates
    if (event.recurrenceId) {
      const rruleEvent = calendarObject.data.events!.find(e => isRRuleSourceEvent(event, e))!
      rruleEvent.exceptionDates ??= []
      rruleEvent.exceptionDates?.push(event.recurrenceId.value)
    }

    const index = calendarObject.data.events!.findIndex(e => isSameEvent(e, event))
    console.log(index, event, oldEvents)

    if (index !== -1) {
      event.sequence = (event.sequence ?? 0) + 1
      calendarObject.data.events!.splice(index, 1)
    }
    // if (event.recurrenceRule) {
    //   for (let i = 0; i < icsCalendar.events.length; i++) {
    //     const element = icsCalendar.events[i];
    //     if (i == event.index) continue
    //     else if (element.uid == event.event.uid) {
    //       const recurrenceOffset = element.recurrenceId.value.date.getTim
    // e() - icsCalendar.events[event.index].start.date.getTime()
    //       element.recurrenceId = { value: offsetDate(event.event.start, recurrenceOffset) }
    //     }
    //   }
    // }
    // if (event.index == -1) icsCalendar.events.push(event.event)
    // else

    const action = calendarObject.data.events!.length === 0 ? deleteCalendarObject : updateCalendarObject
    const response = await action(calendar, calendarObject)
    if (!response.response.ok) calendarObject.data.events = oldEvents
    return response
  }
}
