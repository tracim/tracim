import { tzlib_get_ical_block } from "timezones-ical-library";
import { convertIcsCalendar, convertIcsTimezone, generateIcsCalendar, type IcsCalendar } from "ts-ics";
import { createAccount, fetchCalendars as davFetchCalendars, fetchCalendarObjects as davFetchCalendarObjects, createCalendarObject as davCreateCalendarObject, updateCalendarObject as davUpdateCalendarObject, deleteCalendarObject as davDeleteCalendarObject, DAVNamespaceShort, propfind, type DAVCalendar } from "tsdav";
import { type CalendarSource, type ServerSource, type Calendar, type CalendarObject, isServerSource } from "../types";

export async function fetchCalendars(source: ServerSource | CalendarSource): Promise<Calendar[]> {
  if (isServerSource(source)) {
    const account = await createAccount({
      account: { serverUrl: source.serverUrl, accountType: "caldav" },
      headers: source.headers,
      fetchOptions: source.fetchOptions
    })
    const calendars = await davFetchCalendars({ account, headers: source.headers, fetchOptions: source.fetchOptions })
    return calendars.map(calendar => ({ ...calendar, headers: source.headers, fetchOptions: source.fetchOptions }))
  } else {
    const calendar = await davFetchCalendar({ url: source.calendarUrl, headers: source.headers, fetchOptions: source.fetchOptions })
    return [{ ...calendar, headers: source.headers, fetchOptions: source.fetchOptions, uid: source.calendarUid }]
  }
}

export async function fetchCalendarObjects(calendar: Calendar, timeRange?: { start: string; end: string; }, expand?: boolean): Promise<CalendarObject[]> {
  const objects = await davFetchCalendarObjects({
    calendar: calendar,
    timeRange, expand,
    headers: calendar.headers,
    fetchOptions: calendar.fetchOptions,
  })
  return objects.map(o => ({ ...o, object: convertIcsCalendar(undefined, o.data), calendarUrl: calendar.url }))
}

export async function createCalendarObjects(calendar: Calendar, object: IcsCalendar): Promise<[Response, string]> {
  validateTimezones(object)
  for (const event of object.events ?? []) event.uid = crypto.randomUUID()
  const uid = object.events?.[0].uid ?? crypto.randomUUID()
  var iCalString = generateIcsCalendar(object)
  const response = await davCreateCalendarObject({ calendar, iCalString, filename: `${uid}.ics`, headers: calendar.headers, fetchOptions: calendar.fetchOptions })
  return [response, iCalString]
}

export async function updateCalendarObject(calendar: Calendar, object: CalendarObject): Promise<[Response, string]> {
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
  // const icsCalendar = generateIcsCalendar(object.data)
  // icsCalendar.events![index.eventIndex] = { ...event, sequence: (event.sequence ?? 0) + 1 }

  validateTimezones(object.object)
  var calendarObject = { ...object, data: generateIcsCalendar(object.object) }
  const response = await davUpdateCalendarObject({ calendarObject: calendarObject, ...calendar })
  return [response, calendarObject.data]
}

export async function deleteCalendarObject(calendar: Calendar, object: CalendarObject): Promise<[Response, string]> {
  validateTimezones(object.object)
  var calendarObject = { ...object, data: generateIcsCalendar(object.object) }
  const response = await davDeleteCalendarObject({ calendarObject, headers: calendar.headers, fetchOptions: calendar.fetchOptions })
  return [response, calendarObject.data]

}

function validateTimezones(object: IcsCalendar) {
  const calendar = object
  const wantedTzids = new Set(calendar.events!.map(e => [e.start.local?.timezone, e.end!.local?.timezone]).flat().filter(s => s !== undefined))
  calendar.timezones ??= []

  // Remove extra timezones
  calendar.timezones = calendar.timezones.filter(tz => wantedTzids.has(tz.id))

  // Add missing timezones
  wantedTzids.forEach(tzid => {
    if (calendar.timezones!.findIndex(t => t.id === tzid) === -1) {
      calendar.timezones!.push(convertIcsTimezone(undefined, tzlib_get_ical_block(tzid)[0]))
    }
  })
}

async function davFetchCalendar(params: { url: string, headers?: Record<string, string>, fetchOptions?: RequestInit }): Promise<DAVCalendar> {
  const props = {
    [`${DAVNamespaceShort.CALDAV}:calendar-description`]: {},
    [`${DAVNamespaceShort.CALDAV}:calendar-timezone`]: {},
    [`${DAVNamespaceShort.DAV}:displayname`]: {},
    [`${DAVNamespaceShort.CALDAV_APPLE}:calendar-color`]: {},
    [`${DAVNamespaceShort.CALENDAR_SERVER}:getctag`]: {},
    [`${DAVNamespaceShort.DAV}:resourcetype`]: {},
    [`${DAVNamespaceShort.CALDAV}:supported-calendar-component-set`]: {},
    [`${DAVNamespaceShort.DAV}:sync-token`]: {},
  }
  const res = await propfind({ ...params, props })
  const calendar = res[0]
  if (calendar.error) {
    // TODO
  }
  const description = calendar.props?.calendarDescription;
  const timezone = calendar.props?.calendarTimezone;

  return {
    description: typeof description === 'string' ? description : '',
    timezone: typeof timezone === 'string' ? timezone : '',
    url: params.url,
    ctag: calendar.props?.getctag,
    calendarColor: calendar.props?.calendarColor,
    displayName: calendar.props?.displayname._cdata ?? calendar.props?.displayname,
    components: Array.isArray(calendar.props?.supportedCalendarComponentSet.comp)
      ? calendar.props?.supportedCalendarComponentSet.comp.map((sc: any) => sc._attributes.name)
      : [calendar.props?.supportedCalendarComponentSet.comp?._attributes.name],
    resourcetype: Object.keys(calendar.props?.resourcetype),
    syncToken: calendar.props?.syncToken,
  }
}
