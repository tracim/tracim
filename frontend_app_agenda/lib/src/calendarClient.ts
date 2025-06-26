import { type IcsCalendar, type IcsEvent } from 'ts-ics'
import { createCalendarObject, deleteCalendarObject, fetchCalendarObjects, fetchCalendars, updateCalendarObject } from './helpers/dav-helper'
import type { CalendarSource, ServerSource, Calendar, CalendarObject, EventUid, CalendarEvent, DisplayedCalendarEvent } from './types'
import { isRRuleSourceEvent, isSameEvent, offsetDate } from './helpers/ics-helper'

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

  public getCalendarEvent = (uid: EventUid): DisplayedCalendarEvent | undefined => {
    for (const calendarObject of this._calendarObjectsPerCalendar.flat()) {
      for (const event of calendarObject.data.events ?? []) {
        if (!isSameEvent(event, uid)) continue
        const recurringEvent = event.recurrenceId
          ? this.getCalendarObject(event)!.data.events!.find(e => isRRuleSourceEvent(event, e))
          : undefined
        return { calendarUrl: calendarObject.calendarUrl, event, recurringEvent }
      }
    }
    return undefined
  }

  private getCalendarObject = (uid: IcsEvent): CalendarObject | undefined => {
    for (const calendarObject of this._calendarObjectsPerCalendar.flat()) {
      for (const event of calendarObject.data.events ?? []) {
        // Since we look are just looking for the CalendarObject and not the event in particular,
        // we just need to check the uid
        if (event.uid !== uid.uid) continue
        if (event.recurrenceId) {
          for (const recurringObject of this._recurringObjectsPerCalendar.flat()) {
            for (const event of recurringObject.data.events ?? []) {
              if (event.uid === uid.uid) return recurringObject
            }
          }
          return undefined
        }
        return calendarObject
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
    if (!calendarObject) return { response: new Response(null, { status: 404 }), ical: '' }
    const calendar = this.getCalendarByUrl(calendarObject.calendarUrl)!

    // Only a shallow copy as we modify the items directly
    const oldEvents = calendarObject.data.events ? [...calendarObject.data.events] : []

    const index = calendarObject.data.events!.findIndex(e => isSameEvent(e, event))

    // Modified an recurring event instance for the 1st time
    if (event.recurrenceId && index === -1) {
      calendarObject.data.events!.push(event)
    } else {
      event.sequence = (event.sequence ?? 0) + 1
      calendarObject.data.events![index] = event
    }

    if (event.recurrenceRule) {
      // Sync recurrenceIds
      calendarObject.data.events = calendarObject.data.events!.map(element => {
        if (element === event || !isRRuleSourceEvent(element, event)) return element
        const recurrenceOffset = element.recurrenceId!.value.date.getTime() - oldEvents[index].start.date.getTime()
        return {
          ...element,
          recurrenceId: { value: offsetDate(event.start, recurrenceOffset) },
        }
      })
      // Sync exceptionDates
      event.exceptionDates = event.exceptionDates?.map(value => {
        const recurrenceOffset = value.date.getTime() - oldEvents[index].start.date.getTime()
        return offsetDate(event.start, recurrenceOffset)
      })
    }
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

    // When removing a recurring event instance, add it to exceptionDates
    if (event.recurrenceId) {
      const rruleEvent = calendarObject.data.events!.find(e => isRRuleSourceEvent(event, e))!
      rruleEvent.exceptionDates ??= []
      rruleEvent.exceptionDates?.push(event.recurrenceId.value)
    }

    const index = calendarObject.data.events!.findIndex(e => isSameEvent(e, event))

    if (index !== -1) {
      event.sequence = (event.sequence ?? 0) + 1
      calendarObject.data.events!.splice(index, 1)
    }
    if (event.recurrenceRule) {
      calendarObject.data.events = calendarObject.data.events!.filter(e => !isRRuleSourceEvent(e, event))
    }

    const action = calendarObject.data.events!.length === 0 ? deleteCalendarObject : updateCalendarObject
    const response = await action(calendar, calendarObject)
    if (!response.response.ok) calendarObject.data.events = oldEvents
    return response
  }
}
