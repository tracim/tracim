import React, { useCallback, useEffect, useMemo, useState } from "react"
import { createAccount, createCalendarObject, DAVCalendar, DAVNamespaceShort, fetchCalendarObjects, fetchCalendars, propfind, updateCalendarObject } from "tsdav"
import { Calendar, CalendarProps, dateFnsLocalizer, EventPropGetter } from 'react-big-calendar'
import withDragAndDrop, { withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// TRANSLATIONS
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import enUS from 'date-fns/locale/en-US'
import { convertIcsCalendar, convertIcsTimezone, generateIcsCalendar, IcsCalendar, IcsDateObject, IcsEvent } from "ts-ics"
import Popup from "./Popup"
import { CalendarEvent, CalendarObject, isEventAllDay } from "./types"
import EventModal, { ModalMode } from "./EventModal"
import { addMilliseconds } from "date-fns"
import { tzlib_get_ical_block, tzlib_get_timezones } from "timezones-ical-library"

export interface CalendarDavProps {
  serverUrl?: string,
  calendarUrls?: string[],
  headers: Record<string, string>
  fetchOptions?: RequestInit
  onEventDatesChanged?: (start: Date, end: Date) => CalendarEvent
  onViewEvent?: (event: CalendarEvent) => CalendarEvent | null
  onCreateEvent?: (start: Date, end: Date) => CalendarEvent | null
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

  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.View)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent>(null)
  //@ts-ignore
  const timezones: string[] = useMemo(() => tzlib_get_timezones(), [])

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
  
  const fetchEvents = useCallback(() => {
    var promises = davCalendars.map(c => fetchCalendarObjects({ calendar: c, headers, fetchOptions }))
    Promise.all(promises).then(cos => setCalendarsObjects(cos.map((co, i) => co.map(c => ({ ...c, calendarUrl: davCalendars[i].url }))).flat()))
  }, [davCalendars, headers, fetchOptions])

  useEffect(() => fetchEvents(), [fetchEvents])

  const events = useMemo<CalendarEvent[]>(() => {
    let allEvents: CalendarEvent[] = []
    for (const object of davCalendarsObjects) {
      const calendar = davCalendars.find(c => c.url === object.calendarUrl)!
      const icsCalendar = convertIcsCalendar(undefined, object.data)

      for (let i = 0; i < icsCalendar.events.length; i++) {
        const event = icsCalendar.events[i]
        allEvents.push({
          event,
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

  // BUG timezones
  const onChangeDates: NonNullable<withDragAndDropProps<CalendarEvent>['onEventResize']> = ({ event, start, end }) => {
    var startDelta = new Date(start).getTime() - event.event.start.date.getTime()
    event.event.start.date = addMilliseconds(event.event.start.date, startDelta)
    if (event.event.start.local) event.event.start.local.date = addMilliseconds(event.event.start.local.date, startDelta)
    var endDelta = new Date(end).getTime() - event.event.end.date.getTime()
    event.event.end.date = addMilliseconds(event.event.end.date, endDelta)
    if (event.event.end.local) event.event.end.local.date = addMilliseconds(event.event.end.local.date, endDelta)
    updateEvent(event)
  }

  const validateTimezones = (calendar: IcsCalendar) => {
    const wantedTzids = new Set(calendar.events.flatMap(e => [e.start.local?.timezone, e.end.local?.timezone]).flat().filter(s => !!s))

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
    return calendar
  }

  // TODO change event to another calendar
  const updateEvent: (event: CalendarEvent) => void = useCallback(event => {
    const calendarObject = davCalendarsObjects.find(o => o.url === event.objectUrl)
    const icsCalendar = convertIcsCalendar(undefined, calendarObject.data)
    icsCalendar.events[event.index] = { ...event.event }
    validateTimezones(icsCalendar)
    var newCalendarObject = { ...calendarObject, data: generateIcsCalendar(icsCalendar) }
    updateCalendarObject({ calendarObject: newCalendarObject, headers, fetchOptions })
      .then(r => {
        if (!r.ok) throw "something went wrong"
        newCalendarObject.etag = r.headers.get('Etag')!
        setCalendarsObjects(davCalendarsObjects.map(o => o.url === newCalendarObject.url ? newCalendarObject : o))
      })
  }, [davCalendarsObjects, headers, fetchOptions])

  const createEvent = useCallback((calendarUrl: string, event: CalendarEvent) => {
    const calendar = davCalendars.find(c => c.url === calendarUrl)
    const uid = crypto.randomUUID()
    const icsCalendar: IcsCalendar = {
      prodId: '-//algoo.fr//NONSGML Tracim//EN',
      version: '2.0',
      events: [event.event],
    }
    validateTimezones(icsCalendar)
    const data = generateIcsCalendar(icsCalendar)
    createCalendarObject({
      calendar,
      iCalString: data,
      filename: `${uid}.ics`,
      headers,
      fetchOptions
    }).then(r => {
      if (!r.ok) return
      setCalendarsObjects([...davCalendarsObjects, { url: `${calendar.url}/${uid}.ics`, calendarUrl: calendar.url, data, etag: r.headers.get('Etag')! }])
    })
  }, [davCalendarsObjects, headers, fetchOptions])


  const icsDateToDate = (date: IcsDateObject, isEnd?: boolean) => {
    var jsDate = date.type == "DATE-TIME" ? new Date(date.date) : new Date(date.date.toDateString())
    // BUG resize all day events
    // if (isEnd && jsDate.getHours() === 0 && jsDate.getMinutes() === 0) {
    //   jsDate.setMinutes(jsDate.getMinutes() - 1)
    // }
    return jsDate
  }

  const onSelectSlot: NonNullable<CalendarProps<CalendarEvent>['onSelectSlot']> = useCallback(({ start, end }) => {
    setSelectedEvent({
      event: {
        summary: "",
        start: {
          date: start,
          type: "DATE-TIME"
        },
        end: {
          date: end,
          type: "DATE-TIME"
        },
        uid: crypto.randomUUID(),
        stamp: { date: new Date(), type: "DATE-TIME" },
      },
      color: "",
      index: 0,
      objectUrl: ""
    })
    setModalMode(ModalMode.Create)
    setModalOpen(true)
  }, [davCalendars, davCalendarsObjects, headers, fetchOptions])

  const onEventSubmited = (calendarUrl: string, event: IcsEvent) => {
    if (modalMode === ModalMode.Create) {
      createEvent(calendarUrl, { ...selectedEvent, event })
      setModalOpen(false)
    } else if (modalMode === ModalMode.Edit) {
      updateEvent({ ...selectedEvent, event })
      setModalOpen(false)
    }
  }

  const onDoubleClickEvent = (event: CalendarEvent) => {
    console.log(event)
    setSelectedEvent(event)
    setModalMode(ModalMode.Edit)
    setModalOpen(true)
  }
  return (<>
    <button onClick={() => fetchEvents()}>Refresh events</button>
    {selectedEvent && <Popup isOpen={modalOpen} onClosePopup={() => setModalOpen(false)}>
      <EventModal
        calendars={davCalendars}
        timezones={timezones}
        mode={modalMode}
        event={selectedEvent.event}
        onSubmit={onEventSubmited}
        onCancel={() => setModalOpen(false)}
      />
    </Popup>}
    <DnDCalendar
      defaultView='week'
      events={events}
      localizer={localizer}
      onEventDrop={onChangeDates}
      onEventResize={onChangeDates}
      eventPropGetter={getEventStyle}
      onDoubleClickEvent={onDoubleClickEvent}
      // onSelectEvent={onSelectEvent}
      showMultiDayTimes
      showAllEvents
      onSelectSlot={onSelectSlot}
      resizable
      selectable
      style={{ height: '80vh' }}
      // BUG setting CustomEvents breaks the `+ X` popup
      // components={{ event: CustomEvent }}
      dayLayoutAlgorithm={'no-overlap'}

      //@ts-ignore
      titleAccessor={e => <>
        <div>
          <h1>{e.event.summary}</h1>
          {e.event.description && <>{
            e.event.descriptionAltRep?.startsWith("data:text/html,")?
              <div dangerouslySetInnerHTML={{__html: decodeURIComponent(e.event.descriptionAltRep.slice(15))}}></div> :
              e.event.description
          }<br /></>}
        </div>
        {e.event.organizer && e.event.attendees && <div>
          Organizer: {e.event.organizer.name ?? e.event.organizer.email}<br />
          Attendees: {e.event.attendees.map((a, i) => <span key={a.email + i} title={a.partstat}>{a.name ?? a.email}, </span>)}
        </div>}
      </>}
      allDayAccessor={e => isEventAllDay(e.event)}
      startAccessor={e => icsDateToDate(e.event.start)}
      endAccessor={e => icsDateToDate(e.event.end, true)} // BUG extra day with all day and extra time slot if end of day
      tooltipAccessor={e => e.event.description}
    />
  </>)
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