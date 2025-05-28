import React, { useCallback, useEffect, useMemo, useState } from "react"
import { createAccount, DAVCalendar, DAVCalendarObject, DAVNamespaceShort, fetchCalendarObjects, fetchCalendars, propfind, updateCalendarObject } from "tsdav"
import { Calendar, CalendarProps, dateFnsLocalizer, Event, EventPropGetter } from 'react-big-calendar'
import withDragAndDrop, { withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// TRANSLATIONS
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import enUS from 'date-fns/locale/en-US'
import { convertIcsCalendar, generateIcsCalendar, IcsDateObject, IcsDuration, IcsEventBase, NonStandardValuesGeneric } from "ts-ics"

export interface CalendarDavProps {
  serverUrl?: string,
  calendarUrls?: string[],
  headers: Record<string, string>
  fetchOptions?: RequestInit
  onEventDrop: (start: Date, end: Date) => Event
}

export interface CalendarObject extends DAVCalendarObject {
  calendarUrl: string
}

export interface CalendarEvent extends IcsEventBase<NonStandardValuesGeneric> {

  // TODO handle other case
  end: IcsDateObject;
  duration?: never;

  objectUrl: string
  index: number
  color: string
}

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar)

export const fetchCalendar = async (url: string, headers?: Record<string, string>, fetchOptions?: RequestInit): Promise<DAVCalendar> => {
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
  const res = await propfind({ url, props, headers, fetchOptions })
  const calendar = res[0]
  if (calendar.error) {
    // TODO
  }
  const description = calendar.props?.calendarDescription;
  const timezone = calendar.props?.calendarTimezone;

  return {
    description: typeof description === 'string' ? description : '',
    timezone: typeof timezone === 'string' ? timezone : '',
    url: url,
    ctag: calendar.props?.getctag,
    calendarColor: calendar.props?.calendarColor,
    displayName: calendar.props?.displayname._cdata ?? calendar.props?.displayname,
    components: Array.isArray(calendar.props?.supportedCalendarComponentSet.comp)
      ? calendar.props?.supportedCalendarComponentSet.comp.map((sc: any) => sc._attributes.name)
      : [calendar.props?.supportedCalendarComponentSet.comp?._attributes.name],
    resourcetype: Object.keys(calendar.props?.resourcetype),
    syncToken: calendar.props?.syncToken,
    projectedProps: Object.fromEntries(Object.entries(calendar.props ?? {}).filter(([key]) => props?.[key])),
  }
}

export default function CalendarDav({ serverUrl, calendarUrls, headers, fetchOptions }: CalendarDavProps) {
  const [davCalendars, setCalendars] = useState<DAVCalendar[]>([])
  const [davCalendarsObjects, setCalendarsObjects] = useState<CalendarObject[]>([])

  useEffect(() => {
    if (!!calendarUrls) {
      Promise.all(calendarUrls.map(url => fetchCalendar(url, headers, fetchOptions)))
        .then(cs => setCalendars(cs))
    }
    else if (!!serverUrl) {
      createAccount({
        account: { serverUrl, accountType: "caldav" },
        headers,
        fetchOptions,
      }).then(account => fetchCalendars({ account, headers, fetchOptions }))
        .then(cs => setCalendars(cs))
    } else {
      throw "At least `serverUrl` or `calendarUrls` must be set"
    }

  }, [serverUrl, calendarUrls, headers, fetchOptions])

  useEffect(() => {
    var promises = davCalendars.map(c => fetchCalendarObjects({ calendar: c, headers, fetchOptions }))
    Promise.all(promises).then(cos => setCalendarsObjects(cos.map((co, i) => co.map(c => ({ ...c, calendarUrl: davCalendars[i].url }))).flat()))
  }, [davCalendars, headers, fetchOptions])

  const events = useMemo<CalendarEvent[]>(() => {
    let allEvents: CalendarEvent[] = []
    for (const object of davCalendarsObjects) {
      const calendar = davCalendars.find(c => c.url === object.calendarUrl)!
      const icsCalendar = convertIcsCalendar(undefined, object.data)

      for (let i = 0; i < icsCalendar.events.length; i++) {
        const event = icsCalendar.events[i]
        console.log(event)
        allEvents.push({
          ...event,
          end: event.end,
          color: calendar.calendarColor,
          index: i,
          objectUrl: object.url,
        })
      }
    }
    return allEvents
  }, [davCalendars, davCalendarsObjects])


  const getEventStyle: EventPropGetter<CalendarEvent> = (event, start, end, isSelected) => {
    var style = {
      backgroundColor: event.color,
      borderRadius: '5px',
      opacity: 0.75,
      border: `1px solid ${event.color}`,
      display: 'block',
    }
    return { style: style }
  }

  const onChangeDates: NonNullable<withDragAndDropProps<CalendarEvent>['onEventResize']> = ({ event, start, end }) => {
    console.log(start, end)
    event.start = { date: new Date(start), type: event.start.type }
    event.end = { date: new Date(end), type: event.end.type }
    updateEvent(event)
  }

  const updateEvent: (event: CalendarEvent) => void = useCallback(event => {
    const calendarObject = davCalendarsObjects.find(o => o.url === event.objectUrl)
    const icsCalendar = convertIcsCalendar(undefined, calendarObject.data)
    icsCalendar.events[event.index] = { ...event }
    var newCalendarObject = { ...calendarObject, data: generateIcsCalendar(icsCalendar) }

    updateCalendarObject({ calendarObject: newCalendarObject, headers, fetchOptions })
      .then(r => {
        if (!r.ok) throw "something went wrong"
        newCalendarObject.etag = r.headers.get('Etag')!
        setCalendarsObjects(davCalendarsObjects.map(o => o.url === newCalendarObject.url ? newCalendarObject : o))
      })
  }, [davCalendarsObjects, headers, fetchOptions])

  return (<DnDCalendar
    defaultView='week'
    events={events}
    localizer={localizer}
    onEventDrop={onChangeDates}
    onEventResize={onChangeDates}
    eventPropGetter={getEventStyle}
    // onDoubleClickEvent={onDoubleClickEvent}
    // onSelectEvent={onSelectEvent}
    showMultiDayTimes
    showAllEvents
    // onSelectSlot={onCreateEvent}
    resizable
    selectable
    style={{ height: '80vh' }}
    // BUG setting CustomEvents breaks the `+ X` popup
    // components={{ event: CustomEvent }}
    dayLayoutAlgorithm={'no-overlap'}

    titleAccessor={e => e.summary}
    allDayAccessor={e => e.start.type === "DATE"}
    startAccessor={e => e.start.date}
    endAccessor={e => e.end.date} // BUG extra day with all day and extra time slot if end of day
    tooltipAccessor={e => e.description}
  />)
}

const locales = {
  'en-US': enUS,
}
// The types here are `object`. Strongly consider making them better as removing `locales` caused a fatal error
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})