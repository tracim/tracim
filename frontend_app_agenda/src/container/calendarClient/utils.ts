import { addMilliseconds } from "date-fns";
import { tzlib_get_ical_block } from "timezones-ical-library";
import { convertIcsTimezone, type IcsCalendar, type IcsDateObject, type IcsEvent } from "ts-ics";
import { DAVNamespaceShort, propfind, type DAVCalendar } from "tsdav";

export function offsetDate(date: IcsDateObject, offset: number): IcsDateObject {
  return {
    type: date.type,
    date: addMilliseconds(date.date, offset),
    local: date.local && {
      date: addMilliseconds(date.local.date, offset),
      timezone: date.local.timezone,
      tzoffset: date.local.tzoffset,
    },
  }
}

export function isEventAllDay(event: IcsEvent) {
  return event.start.type === "DATE" || event.end?.type === "DATE"
}

export const fetchCalendar = async (params: { url: string, headers?: Record<string, string>, fetchOptions?: RequestInit }): Promise<DAVCalendar> => {
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

export function createText(text: string): Text {
  return document.createTextNode(text)
}
export function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, props?: Partial<HTMLElementTagNameMap[K]>, children?: Node[]): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName)
  for (const [key, value] of Object.entries(props ?? {})) {
    if (key == "list") element.setAttribute(key, value)
    else element[key] = value
  }
  for (const child of children ?? []) element.appendChild(child)
  return element
}

export function validateTimezones(calendar: IcsCalendar) {
  const wantedTzids = new Set(calendar.events.map(e => [e.start.local?.timezone, e.end.local?.timezone]).flat().filter(s => !!s))

  if (calendar.timezones == undefined) {
    if (wantedTzids.size === 0) return calendar
    calendar.timezones = []
  }
  // Remove extra timezones
  calendar.timezones = calendar.timezones.filter(tz => wantedTzids.has(tz.id))

  // Add missing timezones
  wantedTzids.forEach(tzid => {
    if (calendar.timezones.findIndex(t => t.id === tzid) === -1) {
      //@ts-ignore
      calendar.timezones.push(convertIcsTimezone(undefined, tzlib_get_ical_block(tzid)[0]))
    }
  })
}
