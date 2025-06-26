import { tzlib_get_ical_block } from 'timezones-ical-library'
import { convertIcsCalendar, convertIcsTimezone, generateIcsCalendar, type IcsCalendar } from 'ts-ics'
import { createAccount, fetchCalendars as davFetchCalendars, fetchCalendarObjects as davFetchCalendarObjects, createCalendarObject as davCreateCalendarObject, updateCalendarObject as davUpdateCalendarObject, deleteCalendarObject as davDeleteCalendarObject, DAVNamespaceShort, propfind, type DAVCalendar, type DAVCalendarObject } from 'tsdav'
import type { CalendarSource, ServerSource, Calendar, CalendarObject, CalendarResponse } from '../types'
import { isServerSource } from './types-helper'

export async function fetchCalendars(source: ServerSource | CalendarSource): Promise<Calendar[]> {
  if (isServerSource(source)) {
    const account = await createAccount({
      account: { serverUrl: source.serverUrl, accountType: 'caldav' },
      headers: source.headers,
      fetchOptions: source.fetchOptions,
    })
    const calendars = await davFetchCalendars({ account, headers: source.headers, fetchOptions: source.fetchOptions })
    return calendars.map(calendar => ({ ...calendar, headers: source.headers, fetchOptions: source.fetchOptions }))
  } else {
    const calendar = await davFetchCalendar({
      url: source.calendarUrl,
      headers: source.headers,
      fetchOptions: source.fetchOptions,
    })
    return [{ ...calendar, headers: source.headers, fetchOptions: source.fetchOptions, uid: source.calendarUid }]
  }
}

export async function fetchCalendarObjects(
  calendar: Calendar,
  timeRange?: { start: string; end: string; },
  expand?: boolean,
): Promise<{ calendarObjects: CalendarObject[], recurringObjects: CalendarObject[] }> {
  const davCalendarObjects = await davFetchCalendarObjects({
    calendar: calendar,
    timeRange, expand, // TODO needs radicale 3.2
    headers: calendar.headers,
    fetchOptions: calendar.fetchOptions,
  })
  const calendarObjects = davCalendarObjects.map(o => ({
    url: o.url,
    etag: o.etag,
    data: convertIcsCalendar(undefined, o.data),
    calendarUrl: calendar.url,
  }))
  const recurringObjectsUrls = new Set(
    calendarObjects
      .filter(c => c.data.events?.find(e => e.recurrenceId))
      .map(c => c.url),
  )
  const davDavRecurringObjects = recurringObjectsUrls.size == 0
    ? []
    : await davFetchCalendarObjects({
      calendar: calendar,
      objectUrls: Array.from(recurringObjectsUrls),
      headers: calendar.headers,
      fetchOptions: calendar.fetchOptions,
    })
  const recurringObjects = davDavRecurringObjects.map(o => ({
    url: o.url,
    etag: o.etag,
    data: convertIcsCalendar(undefined, o.data),
    calendarUrl: calendar.url,
  }))
  return { calendarObjects, recurringObjects }
}

export async function createCalendarObject(
  calendar: Calendar,
  calendarObjectData: IcsCalendar,
): Promise<CalendarResponse> {
  validateTimezones(calendarObjectData)
  for (const event of calendarObjectData.events ?? []) event.uid = crypto.randomUUID()
  const uid = calendarObjectData.events?.[0].uid ?? crypto.randomUUID()
  const iCalString = generateIcsCalendar(calendarObjectData)
  const response = await davCreateCalendarObject({
    calendar,
    iCalString,
    filename: `${uid}.ics`,
    headers: calendar.headers,
    fetchOptions: calendar.fetchOptions,
  })
  return { response, ical: iCalString }
}

export async function updateCalendarObject(
  calendar: Calendar,
  calendarObject: CalendarObject,
): Promise<CalendarResponse> {
  validateTimezones(calendarObject.data)
  const davCalendarObject: DAVCalendarObject = {
    url: calendarObject.url,
    etag: calendarObject.etag,
    data: generateIcsCalendar(calendarObject.data),
  }
  const response = await davUpdateCalendarObject({
    calendarObject: davCalendarObject,
    headers: calendar.headers,
    fetchOptions: calendar.fetchOptions,
  })
  return { response, ical: davCalendarObject.data }
}

export async function deleteCalendarObject(
  calendar: Calendar,
  calendarObject: CalendarObject,
): Promise<CalendarResponse> {
  validateTimezones(calendarObject.data)
  const davCalendarObject: DAVCalendarObject = {
    url: calendarObject.url,
    etag: calendarObject.etag,
    data: generateIcsCalendar(calendarObject.data),
  }
  const response = await davDeleteCalendarObject({
    calendarObject: davCalendarObject,
    headers: calendar.headers,
    fetchOptions: calendar.fetchOptions,
  })
  return { response, ical: davCalendarObject.data }

}

function validateTimezones(calendarObjectData: IcsCalendar) {
  const calendar = calendarObjectData
  const usedTimezones = calendar.events?.flatMap(e => [e.start.local?.timezone, e.end?.local?.timezone])
  const wantedTzIds = new Set(usedTimezones?.filter(s => s !== undefined))
  calendar.timezones ??= []

  // Remove extra timezones
  calendar.timezones = calendar.timezones.filter(tz => wantedTzIds.has(tz.id))

  // Add missing timezones
  wantedTzIds.forEach(tzid => {
    if (calendar.timezones!.findIndex(t => t.id === tzid) === -1) {
      calendar.timezones!.push(convertIcsTimezone(undefined, tzlib_get_ical_block(tzid)[0]))
    }
  })
}

// Inspired from https://github.com/natelindev/tsdav/blob/master/src/calendar.ts, fetchCalendars
async function davFetchCalendar(params: {
  url: string,
  headers?: Record<string, string>,
  fetchOptions?: RequestInit
}): Promise<DAVCalendar> {
  const { url, headers, fetchOptions } = params
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
  const response = await propfind({ url, headers, fetchOptions, props })
  const calendar = response[0]
  if (calendar.error) {
    // TODO
    throw 'Calendar does not exists'
  }
  const description = calendar.props?.calendarDescription
  const timezone = calendar.props?.calendarTimezone
  return {
    description: typeof description === 'string' ? description : '',
    timezone: typeof timezone === 'string' ? timezone : '',
    url: params.url,
    ctag: calendar.props?.getctag,
    calendarColor: calendar.props?.calendarColor,
    displayName: calendar.props?.displayname._cdata ?? calendar.props?.displayname,
    components: Array.isArray(calendar.props?.supportedCalendarComponentSet.comp)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? calendar.props?.supportedCalendarComponentSet.comp.map((sc: any) => sc._attributes.name)
      : [calendar.props?.supportedCalendarComponentSet.comp?._attributes.name],
    resourcetype: Object.keys(calendar.props?.resourcetype),
    syncToken: calendar.props?.syncToken,
  }
}
